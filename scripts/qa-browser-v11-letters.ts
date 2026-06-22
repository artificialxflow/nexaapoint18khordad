// @ts-nocheck
import { spawn, type ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const BASE = process.env.QA_BASE_URL ?? 'http://localhost:3000';
const USERNAME = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const PASSWORD = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const CDP_PORT = Number(process.env.QA_CDP_PORT ?? 10222 + Math.floor(Math.random() * 1000));
const CHROME_PATH =
  process.env.CHROME_PATH ??
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => existsSync(p));

type Result = { name: string; status: 'pass' | 'fail'; detail?: string };
const results: Result[] = [];
const consoleIssues: string[] = [];
let chromeProcess: ChildProcess | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function record(name: string, status: Result['status'], detail?: string) {
  results.push({ name, status, detail });
  const line = `  ${status === 'pass' ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`;
  if (status === 'pass') console.log(line);
  else console.error(line);
}

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    record(name, 'pass');
  } catch (err) {
    record(name, 'fail', err instanceof Error ? err.message : String(err));
  }
}

async function waitForHttp(url: string, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function launchChrome() {
  if (!CHROME_PATH) throw new Error('Chrome/Edge executable not found');
  chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${join(tmpdir(), `nexa-v11-letters-${Date.now()}`)}`,
      '--remote-allow-origins=*',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=Translate',
      '--window-size=1440,900',
      ...(process.env.QA_HEADFUL === '1' ? [] : ['--headless=new']),
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
}

class CdpClient {
  ws: WebSocket;
  nextId = 1;
  pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const item = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) item.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
        else item.resolve(msg.result);
        return;
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params?.type;
        if (type === 'error' || type === 'warning') {
          const text = (msg.params?.args ?? [])
            .map((a: { value?: unknown; description?: string }) => String(a.value ?? a.description ?? ''))
            .join(' ');
          consoleIssues.push(`${type}: ${text}`);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleIssues.push(`exception: ${msg.params?.exceptionDetails?.text ?? 'Runtime exception'}`);
      }
    });
  }

  waitOpen(timeoutMs = 10000) {
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP websocket open timeout')), timeoutMs);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      this.ws.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('CDP websocket error'));
      });
    });
  }

  send(method: string, params: Record<string, unknown> = {}, timeoutMs = 90000) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Evaluation failed');
    return result.result?.value as T;
  }

  async goto(path: string) {
    const url = path.startsWith('http') ? path : `${BASE}${path}`;
    await this.evaluate(`window.location.assign(${JSON.stringify(url)})`);
    await this.waitFor(
      () =>
        (document.readyState === 'complete' || document.readyState === 'interactive') &&
        location.href !== 'about:blank',
      90000
    );
    await sleep(1000);
  }

  async reload() {
    await this.send('Page.reload', {});
    await sleep(1200);
  }

  async waitFor(predicate: () => boolean, timeoutMs = 60000) {
    const source = `(${predicate.toString()})()`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        if (await this.evaluate<boolean>(source)) return;
      } catch {}
      await sleep(300);
    }
    throw new Error(`Timed out waiting for ${predicate.toString()}`);
  }

  close() {
    this.ws.close();
  }
}

async function newPage() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
  if (!res.ok) throw new Error(`Failed to create CDP page: ${res.status}`);
  const page = await res.json();
  const cdp = new CdpClient(page.webSocketDebuggerUrl);
  await cdp.waitOpen();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  return cdp;
}

async function waitForText(cdp: CdpClient, text: string, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate<boolean>(`document.body.innerText.includes(${JSON.stringify(text)})`)) return;
    await sleep(300);
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function waitForApiLetterSubject(cdp: CdpClient, subject: string, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate<boolean>(`(async () => {
      const businessId = localStorage.getItem('nexa-active-business-id');
      if (!businessId) return false;
      const res = await fetch(${JSON.stringify(`${BASE}/api/meizito/`)} + businessId + '/letters', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      return !!json.data?.letters?.some((letter) => letter.subject === ${JSON.stringify(subject)});
    })()`);
    if (found) return;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for API letter subject: ${subject}`);
}

async function waitForApiLetterBox(cdp: CdpClient, subject: string, box: string, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate<boolean>(`(async () => {
      const businessId = localStorage.getItem('nexa-active-business-id');
      if (!businessId) return false;
      const res = await fetch(${JSON.stringify(`${BASE}/api/meizito/`)} + businessId + '/letters?box=' + ${JSON.stringify(box)}, { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      return !!json.data?.letters?.some((letter) => letter.subject === ${JSON.stringify(subject)} && letter.box === ${JSON.stringify(box)});
    })()`);
    if (found) return;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for API letter box: ${subject} -> ${box}`);
}

async function clickText(cdp: CdpClient, text: string) {
  return cdp.evaluate<boolean>(`(() => {
    const wanted = ${JSON.stringify(text)};
    const isVisible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const el = [...document.querySelectorAll('button,a,[role="button"]')]
      .find((node) => isVisible(node) && (node.innerText || node.getAttribute('aria-label') || '').includes(wanted));
    if (!el) return false;
    el.click();
    return true;
  })()`);
}

async function clickTopFilter(cdp: CdpClient, text: string) {
  return cdp.evaluate<boolean>(`(() => {
    const isVisible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const button = [...document.querySelectorAll('button')]
      .find((node) => isVisible(node) && !node.closest('.nexa-card') && (node.innerText || '').trim() === ${JSON.stringify(text)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
}

async function pageDiagnostic(cdp: CdpClient) {
  return cdp.evaluate<string>(`(() => {
    const buttons = [...document.querySelectorAll('button,a,[role="button"]')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
      .map((el) => (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 80)
      .join(' | ');
    return 'href=' + location.href + ' buttons=' + buttons + ' body=' + document.body.innerText.replace(/\\s+/g, ' ').slice(0, 900);
  })()`);
}

async function login(cdp: CdpClient) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const setCookie = res.headers.get('set-cookie') ?? '';
  if (!res.ok || !setCookie) throw new Error(`API login failed: status=${res.status}`);
  const [cookiePair] = setCookie.split(';');
  const [name, ...valueParts] = cookiePair.split('=');
  const value = valueParts.join('=');
  if (!name || !value) throw new Error('Session cookie not returned by login');
  await cdp.send('Network.setCookie', {
    name,
    value,
    url: BASE,
    path: '/',
    httpOnly: true,
  });
  await cdp.goto('/');
}

async function ensureBusinessContext(cdp: CdpClient) {
  const result = await cdp.evaluate<{ ok: boolean; id?: string; error?: string }>(`(async () => {
    try {
      const businessRes = await fetch(${JSON.stringify(`${BASE}/api/businesses`)}, { credentials: 'include' });
      const businessJson = await businessRes.json();
      const businesses = (businessJson.data?.businesses || []).filter((b) => !b.isArchived);
      if (!businesses.length) return { ok: false, error: 'no active businesses' };
      for (const business of businesses) {
        try {
          const lettersRes = await fetch(${JSON.stringify(`${BASE}/api/meizito/`)} + business.id + '/letters', { credentials: 'include' });
          const lettersJson = await lettersRes.json();
          if (lettersRes.ok && lettersJson.ok) return { ok: true, id: business.id };
        } catch {}
      }
      return { ok: true, id: businesses[0].id };
    } catch (err) {
      return { ok: false, error: String(err?.message ?? err) };
    }
  })()`);
  if (!result.ok || !result.id) throw new Error(`Business context unavailable: ${result.error ?? 'no id'}`);
  await cdp.evaluate(`localStorage.setItem('nexa-active-business-id', ${JSON.stringify(result.id)}); localStorage.setItem('nexa-meizito-last-tab', 'letters');`);
  return result.id;
}

async function gotoLetters(cdp: CdpClient) {
  await ensureBusinessContext(cdp);
  await cdp.goto('/dashboard/tasks?tab=letters');
  await cdp.waitFor(() => !document.body.innerText.includes('بارگذاری کسب‌وکار'), 90000).catch(() => undefined);
  await cdp.waitFor(() => document.body.innerText.includes('نامه جدید'), 90000);
}

async function setInputByPlaceholder(cdp: CdpClient, placeholderPart: string, value: string, rootSelector = '') {
  const ok = await cdp.evaluate<boolean>(`(() => {
    const root = ${rootSelector ? `document.querySelector(${JSON.stringify(rootSelector)})` : 'document'};
    if (!root) return false;
    const input = [...root.querySelectorAll('input,textarea')]
      .find((el) => (el.placeholder || '').includes(${JSON.stringify(placeholderPart)}));
    if (!input) return false;
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`Field not found: ${placeholderPart}`);
}

async function selectByIndex(cdp: CdpClient, selector: string, index: number) {
  const ok = await cdp.evaluate<boolean>(`(() => {
    const select = document.querySelector(${JSON.stringify(selector)});
    if (!select || !select.options || !select.options[${index}]) return false;
    select.value = select.options[${index}].value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`Select option not found: ${selector}[${index}]`);
}

async function createLetter(cdp: CdpClient, input: { subject: string; body: string; label: string; useTemplate?: string }) {
  if (input.useTemplate) {
    const clicked = await clickText(cdp, input.useTemplate);
    if (!clicked) throw new Error(`Template not found: ${input.useTemplate}`);
  }
  await setInputByPlaceholder(cdp, 'موضوع', input.subject, '#meizito-letter-form');
  await setInputByPlaceholder(cdp, 'گیرندگان', 'QA_V11 Recipient', '#meizito-letter-form');
  await selectByIndex(cdp, '#meizito-letter-form select', 1);
  await setInputByPlaceholder(cdp, 'ارجاع به', 'QA_V11 Referral', '#meizito-letter-form');
  await setInputByPlaceholder(cdp, 'ارجاع از', 'QA_V11 Tester', '#meizito-letter-form');
  await setInputByPlaceholder(cdp, 'متن نامه', input.body, '#meizito-letter-form');
  await setInputByPlaceholder(cdp, 'برچسب', input.label, '#meizito-letter-form');
  const sent = await clickText(cdp, 'ارسال به خروجی');
  if (!sent) throw new Error('Send to outbox button not found');
  await waitForText(cdp, input.subject, 90000);
}

async function showOutboxLetter(cdp: CdpClient, subject: string) {
  await clickTopFilter(cdp, 'خروجی');
  await clickTopFilter(cdp, 'همه');
  await setInputByPlaceholder(cdp, 'جستجو', '');
  await setInputByPlaceholder(cdp, 'جستجو', subject);
  await waitForLetterCard(cdp, subject, 90000);
}

async function clickLetterAction(cdp: CdpClient, subject: string, actionText: string) {
  return cdp.evaluate<boolean>(`(() => {
    const isVisible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const card = [...document.querySelectorAll('.nexa-card')]
      .find((node) =>
        node.id !== 'meizito-letter-form' &&
        String(node.className || '').includes('items-start') &&
        isVisible(node) &&
        (node.innerText || '').includes(${JSON.stringify(subject)})
      );
    if (!card) return false;
    const buttons = [...card.querySelectorAll('button')]
      .filter((node) => isVisible(node) && (node.innerText || '').trim() === ${JSON.stringify(actionText)});
    const button = buttons[buttons.length - 1];
    if (!button) return false;
    button.click();
    return true;
  })()`);
}

async function waitForLetterCard(cdp: CdpClient, subject: string, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate<boolean>(`(() => {
      const isVisible = (node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      return [...document.querySelectorAll('.nexa-card')]
        .some((node) =>
          node.id !== 'meizito-letter-form' &&
          String(node.className || '').includes('items-start') &&
          isVisible(node) &&
          (node.innerText || '').includes(${JSON.stringify(subject)})
        );
    })()`);
    if (found) return;
    await sleep(500);
  }
  throw new Error(`Timed out waiting for letter card: ${subject}`);
}

async function waitForInputValue(cdp: CdpClient, placeholderPart: string, expectedValue: string) {
  await cdp.waitFor(
    new Function(
      `return [...document.querySelectorAll('input,textarea')]
        .some((el) => (el.placeholder || '').includes(${JSON.stringify(placeholderPart)}) && (el.value || '').includes(${JSON.stringify(expectedValue)}));`
    ) as () => boolean,
    90000
  );
}

async function selectReplyToSubject(cdp: CdpClient, subject: string) {
  const ok = await cdp.evaluate<boolean>(`(() => {
    const select = [...document.querySelectorAll('#meizito-letter-form select')]
      .find((node) => [...node.options].some((option) => option.textContent.includes(${JSON.stringify(subject)})));
    if (!select) return false;
    const option = [...select.options].find((node) => node.textContent.includes(${JSON.stringify(subject)}));
    if (!option) return false;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error(`Reply select option not found for ${subject}`);
}

async function run() {
  console.log(`[qa-browser-v11-letters] base=${BASE}`);
  console.log(`[qa-browser-v11-letters] browser=${CHROME_PATH ?? 'not found'}`);
  launchChrome();
  await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
  const cdp = await newPage();

  const stamp = Date.now();
  const baseSubject = `QA_V11_Letter_Base_${stamp}`;
  const replySubject = `Re: ${baseSubject}`;
  const referSubject = `QA_V11_Letter_Refer_${stamp}`;
  const archiveSubject = `QA_V11_Letter_Archive_${stamp}`;
  const label = `QA_V11_LABEL_${stamp}`;

  await check('login and open letters tab', async () => {
    await login(cdp);
    await gotoLetters(cdp);
    await waitForText(cdp, 'نامه جدید');
  });

  await check('letters API is reachable in browser session', async () => {
    const api = await cdp.evaluate<{ ok: boolean; status: number; businessId?: string; body: string }>(`(async () => {
      const businessesRes = await fetch(${JSON.stringify(`${BASE}/api/businesses`)}, { credentials: 'include' });
      const businessesJson = await businessesRes.json().catch(() => ({}));
      const businessId = localStorage.getItem('nexa-active-business-id') ||
        businessesJson.data?.businesses?.find((b) => !b.isArchived)?.id ||
        businessesJson.data?.businesses?.[0]?.id;
      if (!businessId) return { ok: false, status: businessesRes.status, body: JSON.stringify(businessesJson).slice(0, 300) };
      const lettersRes = await fetch(${JSON.stringify(`${BASE}/api/meizito/`)} + businessId + '/letters', { credentials: 'include' });
      const body = await lettersRes.text();
      return { ok: lettersRes.ok, status: lettersRes.status, businessId, body: body.slice(0, 300) };
    })()`);
    if (!api.ok) {
      throw new Error(`letters API unreachable status=${api.status} business=${api.businessId} body=${api.body}`);
    }
  });

  await check('create base letter using template and persist in outbox', async () => {
    await createLetter(cdp, {
      subject: baseSubject,
      body: `QA_V11 base body ${stamp}`,
      label,
      useTemplate: 'درخواست جلسه',
    });
    await clickText(cdp, 'خروجی');
    await waitForText(cdp, baseSubject);
    await cdp.reload();
    await waitForText(cdp, baseSubject);
  });

  await check('search by QA_V11 subject/body', async () => {
    await setInputByPlaceholder(cdp, 'جستجو', baseSubject);
    await waitForText(cdp, baseSubject);
  });

  await check('label filter works for QA_V11 label', async () => {
    await setInputByPlaceholder(cdp, 'جستجو', '');
    const clicked = await clickText(cdp, label);
    if (!clicked) throw new Error(`Label filter not visible: ${label}. ${await pageDiagnostic(cdp)}`);
    await waitForText(cdp, baseSubject);
    await clickText(cdp, label);
  });

  await check('category filter keeps created letter visible', async () => {
    await selectByIndex(cdp, 'select', 1);
    await waitForText(cdp, baseSubject);
    await selectByIndex(cdp, 'select', 0);
  });

  await check('reply creates thread and persists', async () => {
    await showOutboxLetter(cdp, baseSubject);
    const replyClicked = await clickLetterAction(cdp, baseSubject, 'پاسخ');
    if (!replyClicked) throw new Error(`Reply button not found. ${await pageDiagnostic(cdp)}`);
    await selectReplyToSubject(cdp, baseSubject);
    await waitForInputValue(cdp, 'موضوع', replySubject);
    await setInputByPlaceholder(cdp, 'متن نامه', `QA_V11 reply body ${stamp}`, '#meizito-letter-form');
    const sent = await clickText(cdp, 'ارسال به خروجی');
    if (!sent) throw new Error('Send reply button not found');
    await waitForApiLetterSubject(cdp, replySubject);
    await cdp.reload();
    await clickTopFilter(cdp, 'خروجی');
    await clickTopFilter(cdp, 'همه');
    await waitForText(cdp, replySubject);
    await waitForText(cdp, 'زنجیره');
    await cdp.reload();
    await clickTopFilter(cdp, 'خروجی');
    await clickTopFilter(cdp, 'همه');
    await waitForText(cdp, replySubject);
  });

  await check('refer action pre-fills and sends a referred letter', async () => {
    await showOutboxLetter(cdp, baseSubject);
    const clicked = await clickLetterAction(cdp, baseSubject, 'ارجاع');
    if (!clicked) throw new Error(`Refer button not found. ${await pageDiagnostic(cdp)}`);
    await setInputByPlaceholder(cdp, 'موضوع', referSubject, '#meizito-letter-form');
    await setInputByPlaceholder(cdp, 'متن نامه', `QA_V11 referred body ${stamp}`, '#meizito-letter-form');
    const sent = await clickText(cdp, 'ارسال به خروجی');
    if (!sent) throw new Error('Send referred letter button not found');
    await waitForText(cdp, referSubject);
  });

  await check('close and reopen QA letter', async () => {
    await showOutboxLetter(cdp, baseSubject);
    const close = await clickLetterAction(cdp, baseSubject, 'پایان مکاتبه');
    if (!close) throw new Error(`Close letter button not found. ${await pageDiagnostic(cdp)}`);
    await clickTopFilter(cdp, 'آرشیو');
    await clickTopFilter(cdp, 'پایان‌یافته');
    await waitForText(cdp, 'بسته');
    const reopen = await clickText(cdp, 'بازگشایی');
    if (!reopen) throw new Error(`Reopen letter button not found. ${await pageDiagnostic(cdp)}`);
    await clickTopFilter(cdp, 'باز');
    await waitForText(cdp, baseSubject);
  });

  await check('archive keeps QA letter in archive box', async () => {
    await createLetter(cdp, {
      subject: archiveSubject,
      body: `QA_V11 archive body ${stamp}`,
      label,
    });
    await showOutboxLetter(cdp, archiveSubject);
    const archive = await clickLetterAction(cdp, archiveSubject, 'آرشیو');
    if (!archive) throw new Error(`Archive button not found. ${await pageDiagnostic(cdp)}`);
    await waitForApiLetterBox(cdp, archiveSubject, 'archive');
    await clickTopFilter(cdp, 'آرشیو');
    await clickTopFilter(cdp, 'همه');
    await waitForText(cdp, archiveSubject);
    await cdp.reload();
    await clickTopFilter(cdp, 'آرشیو');
    await clickTopFilter(cdp, 'همه');
    await waitForText(cdp, archiveSubject);
  });

  await check('mobile letters form remains usable', async () => {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await gotoLetters(cdp);
    await waitForText(cdp, 'نامه جدید');
    await waitForText(cdp, 'ارسال به خروجی');
    await cdp.send('Emulation.clearDeviceMetricsOverride');
  });

  cdp.close();
  if (chromeProcess) chromeProcess.kill();

  const artifactDir = join(process.cwd(), 'qa-artifacts');
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(
    join(artifactDir, 'v11-browser-letters.json'),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        baseUrl: BASE,
        testData: { baseSubject, replySubject, referSubject, label },
        results,
        consoleIssues: [...new Set(consoleIssues)].slice(0, 50),
      },
      null,
      2
    ),
    'utf8'
  );

  const failed = results.filter((r) => r.status === 'fail');
  console.log(`\n[qa-browser-v11-letters] ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

run().catch((err) => {
  console.error('[qa-browser-v11-letters] fatal', err);
  if (chromeProcess) chromeProcess.kill();
  process.exit(1);
});
