// @ts-nocheck
/**
 * Browser QA runner for todo-v11 phases 0-2.
 *
 * Uses Chrome DevTools Protocol directly, so it works without Playwright.
 * Usage:
 *   npm run dev
 *   npx tsx scripts/qa-browser-v11.ts
 */

import { spawn, type ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const BASE = process.env.QA_BASE_URL ?? process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const USERNAME = process.env.SMOKE_BOOTSTRAP_USER ?? 'artificialxflow';
const PASSWORD = process.env.SMOKE_BOOTSTRAP_PASS ?? 'Ronak#123Ronak';
const CDP_PORT = Number(process.env.QA_CDP_PORT ?? 9222 + Math.floor(Math.random() * 1000));
const CHROME_PATH =
  process.env.CHROME_PATH ??
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => existsSync(p));

type Result = {
  phase: string;
  name: string;
  status: 'pass' | 'fail' | 'blocked';
  detail?: string;
};

const results: Result[] = [];
const consoleIssues: string[] = [];
let chromeProcess: ChildProcess | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function record(phase: string, name: string, status: Result['status'], detail?: string) {
  results.push({ phase, name, status, detail });
  const mark = status === 'pass' ? '✓' : status === 'blocked' ? '⚠' : '✗';
  const line = `  ${mark} [${phase}] ${name}${detail ? ` — ${detail}` : ''}`;
  if (status === 'pass') console.log(line);
  else console.error(line);
}

async function waitForHttp(url: string, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // keep polling
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function launchChrome() {
  if (!CHROME_PATH) throw new Error('Chrome/Edge executable not found');
  const userDataDir = join(tmpdir(), `nexa-v11-cdp-${Date.now()}`);
  chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
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
  eventResolvers = new Map<string, Array<(payload: unknown) => void>>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const entry = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
        else entry.resolve(msg.result);
        return;
      }
      if (msg.method) {
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
        if (msg.method === 'Log.entryAdded') {
          const entry = msg.params?.entry;
          if (entry?.level === 'error' || entry?.level === 'warning') {
            consoleIssues.push(`${entry.level}: ${entry.text}`);
          }
        }
        const resolvers = this.eventResolvers.get(msg.method) ?? [];
        this.eventResolvers.set(msg.method, []);
        for (const resolve of resolvers) resolve(msg.params);
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

  send(method: string, params: Record<string, unknown> = {}, timeoutMs = 60000) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject });
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

  waitEvent(method: string, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), timeoutMs);
      const list = this.eventResolvers.get(method) ?? [];
      list.push((payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
      this.eventResolvers.set(method, list);
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? 'Evaluation failed');
    }
    return result.result?.value as T;
  }

  async goto(path: string) {
    const url = path.startsWith('http') ? path : `${BASE}${path}`;
    await this.evaluate(`window.location.assign(${JSON.stringify(url)})`);
    await this.waitFor(
      () => (document.readyState === 'complete' || document.readyState === 'interactive') && location.href !== 'about:blank',
      60000
    );
    await sleep(800);
  }

  async reload() {
    await this.send('Page.reload', {});
    await sleep(800);
  }

  async waitFor(predicate: () => boolean, timeoutMs = 15000) {
    const source = `(${predicate.toString()})()`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        if (await this.evaluate<boolean>(source)) return;
      } catch {
        // keep polling
      }
      await sleep(250);
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
  await cdp.send('Log.enable');
  await cdp.send('Network.enable');
  return cdp;
}

async function pageHealth(cdp: CdpClient) {
  return cdp.evaluate<{
    href: string;
    title: string;
    overlay: boolean;
    brokenImages: string[];
    bodyText: string;
  }>(`(() => {
    const brokenImages = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean);
    const text = document.body?.innerText || '';
    const overlay = Boolean(
      document.querySelector('[data-nextjs-dialog-overlay]') ||
      /Unhandled Runtime Error|Hydration failed|Application error/i.test(text)
    );
    return {
      href: location.href,
      title: document.title,
      overlay,
      brokenImages,
      bodyText: text.slice(0, 1000),
    };
  })()`);
}

async function assertPageOk(cdp: CdpClient, phase: string, name: string) {
  const health = await pageHealth(cdp);
  if (health.overlay) throw new Error(`Next/runtime overlay detected at ${health.href}`);
  if (health.brokenImages.length) {
    throw new Error(`Broken images: ${health.brokenImages.slice(0, 3).join(', ')}`);
  }
  record(phase, name, 'pass', health.href);
}

async function login(cdp: CdpClient, username = USERNAME, password = PASSWORD) {
  await cdp.goto('/login');
  await cdp.evaluate(`(() => {
    const [u, p] = [...document.querySelectorAll('input')];
    function setValue(input, value) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      input.focus();
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    setValue(u, ${JSON.stringify(username)});
    setValue(p, ${JSON.stringify(password)});
    document.querySelector('button[type="submit"]').click();
  })()`);
  await cdp.waitFor(() => location.pathname === '/businesses' || location.pathname === '/change-password', 20000);
}

async function clickText(cdp: CdpClient, text: string) {
  return cdp.evaluate<boolean>(`(() => {
    const wanted = ${JSON.stringify(text)};
    const elements = [...document.querySelectorAll('button,a,[role="button"]')];
    const isVisible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const el = elements.find((node) => isVisible(node) && (node.innerText || node.getAttribute('aria-label') || '').includes(wanted));
    if (!el) return false;
    el.click();
    return true;
  })()`);
}

async function waitForText(cdp: CdpClient, text: string, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await cdp.evaluate<boolean>(
      `document.body.innerText.includes(${JSON.stringify(text)})`
    );
    if (found) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function ensureBusinessContext(cdp: CdpClient) {
  const result = await cdp.evaluate<{ ok: boolean; id?: string; error?: string; reason?: string }>(`(async () => {
    try {
      const businessRes = await fetch('/api/businesses', { credentials: 'include' });
      const businessJson = await businessRes.json();
      if (!businessRes.ok || !businessJson.ok) {
        return { ok: false, error: businessJson.error?.message || 'businesses fetch failed' };
      }
      const businesses = (businessJson.data?.businesses || []).filter((b) => !b.isArchived);
      if (businesses.length === 0) return { ok: false, error: 'no active businesses' };

      for (const business of businesses) {
        try {
          const workspaceRes = await fetch('/api/meizito/' + business.id + '/workspace', { credentials: 'include' });
          const workspaceJson = await workspaceRes.json();
          const boards = workspaceJson.data?.boards || [];
          if (workspaceRes.ok && workspaceJson.ok && boards.length > 0) {
            return { ok: true, id: business.id, reason: 'has workspace boards' };
          }
        } catch {
          // Try the next business.
        }
      }

      return { ok: true, id: businesses[0].id, reason: 'fallback first business' };
    } catch (err) {
      return { ok: false, error: String(err?.message ?? err) };
    }
  })()`);
  if (!result.ok || !result.id) throw new Error(`Business context unavailable: ${result.error ?? 'no business id'}`);
  await cdp.evaluate(`localStorage.setItem('nexa-active-business-id', ${JSON.stringify(result.id)})`);
  return result.id;
}

async function gotoBusinessRoute(cdp: CdpClient, path: string) {
  await ensureBusinessContext(cdp);
  await cdp.goto(path);
  if (await cdp.evaluate<boolean>("location.pathname === '/businesses'")) {
    await ensureBusinessContext(cdp);
    await cdp.goto(path);
  }
  await cdp.waitFor(() => !document.body.innerText.includes('بارگذاری کسب‌وکار'), 30000).catch(() => undefined);
}

async function runCheck(phase: string, name: string, fn: () => Promise<void>) {
  try {
    await fn();
    if (!results.some((r) => r.phase === phase && r.name === name)) record(phase, name, 'pass');
  } catch (err) {
    record(phase, name, 'fail', err instanceof Error ? err.message : String(err));
  }
}

async function run() {
  console.log(`[qa-browser-v11] base=${BASE}`);
  console.log(`[qa-browser-v11] browser=${CHROME_PATH ?? 'not found'}`);

  launchChrome();
  await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`, 30000);
  const cdp = await newPage();

  await runCheck('Setup', 'External Chrome opens production login', async () => {
    await cdp.goto('/login');
    await assertPageOk(cdp, 'Setup', '/login opens');
  });

  await runCheck('Setup', 'Initial login with provided credential', async () => {
    await login(cdp);
    const href = await cdp.evaluate<string>('location.href');
    if (!href.includes('/businesses') && !href.includes('/change-password')) throw new Error(`Unexpected href ${href}`);
  });

  await runCheck('Setup', 'Enter first existing business', async () => {
    await ensureBusinessContext(cdp);
    await cdp.goto('/dashboard/dashboard');
    await cdp.waitFor(() => location.pathname.startsWith('/dashboard'), 30000);
  });

  const routes = [
    { phase: 'Dashboard', name: 'Dashboard menu opens', path: '/dashboard/dashboard', expected: ['داشبورد'] },
    { phase: 'Workspace', name: 'Workspace menu opens', path: '/dashboard/tasks', expected: ['میز کار', 'میزهای کار', 'وظیفه'] },
    { phase: 'Calendar', name: 'Calendar menu opens', path: '/dashboard/tasks?tab=calendar', expected: ['تقویم'] },
    { phase: 'Chat', name: 'Chat menu opens', path: '/dashboard/chats', expected: ['گفتگو', 'پیام'] },
    { phase: 'Requests', name: 'Requests menu opens', path: '/dashboard/work-requests', expected: ['درخواست'] },
    { phase: 'Letters', name: 'Letters menu opens', path: '/dashboard/tasks?tab=letters', expected: ['نامه'] },
    { phase: 'Phone', name: 'Phone directory menu opens', path: '/dashboard/tasks?tab=phone', expected: ['دفتر تلفن', 'تلفن'] },
  ];

  for (const route of routes) {
    await runCheck(route.phase, route.name, async () => {
      await gotoBusinessRoute(cdp, route.path);
      await assertPageOk(cdp, route.phase, route.path);
      const body = await cdp.evaluate<string>('document.body.innerText');
      if (!route.expected.some((text) => body.includes(text))) {
        throw new Error(
          `Expected text not found. Expected one of: ${route.expected.join(', ')}. Body: ${body
            .replace(/\s+/g, ' ')
            .slice(0, 500)}`
        );
      }
    });
  }

  await runCheck('Workspace', 'Kanban/tab horizontal scroll sanity', async () => {
    await gotoBusinessRoute(cdp, '/dashboard/tasks?tab=boards');
    const scrollInfo = await cdp.evaluate<{ hasHorizontal: boolean; candidates: number }>(`(() => {
      const els = [...document.querySelectorAll('*')];
      const candidates = els.filter((el) => el.scrollWidth > el.clientWidth + 8);
      return {
        hasHorizontal: candidates.some((el) => getComputedStyle(el).overflowX !== 'hidden'),
        candidates: candidates.length,
      };
    })()`);
    if (!scrollInfo.hasHorizontal) {
      throw new Error(`No usable horizontal scroll container found (candidates=${scrollInfo.candidates})`);
    }
  });

  const qaTaskTitle = `QA_V11_Task_${Date.now()}`;
  await runCheck('Workspace Full QA', 'Create task through new task modal and persist after refresh', async () => {
    await gotoBusinessRoute(cdp, '/dashboard/tasks?tab=boards');
    const alreadyOnBoards = await cdp.evaluate<boolean>("document.body.innerText.includes('وظیفه جدید')");
    if (!alreadyOnBoards) {
      const clickedBoardsTab = await clickText(cdp, 'میزهای کار');
      if (!clickedBoardsTab) throw new Error('Boards tab button not found');
      await cdp.waitFor(() => document.body.innerText.includes('وظیفه جدید'), 20000);
    }
    const opened = await cdp.evaluate<boolean>(`(() => {
      const elements = [...document.querySelectorAll('button,a,[role="button"]')];
      const isVisible = (node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const el = elements.find((node) => {
        const text = (node.innerText || node.getAttribute('aria-label') || '').replace(/\\s+/g, ' ');
        return isVisible(node) && text.includes('وظیفه') && text.includes('جدید');
      });
      if (!el) return false;
      el.click();
      return true;
    })()`);
    if (!opened) {
      const diagnostic = await cdp.evaluate<string>(`(() => {
        const buttons = [...document.querySelectorAll('button,a,[role="button"]')]
          .map((el) => (el.innerText || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim())
          .filter(Boolean)
          .slice(0, 40)
          .join(' | ');
        return 'href=' + location.href + ' buttons=' + buttons + ' body=' + document.body.innerText.replace(/\\s+/g, ' ').slice(0, 500);
      })()`);
      throw new Error(`New task button not found. ${diagnostic}`);
    }
    await cdp.waitFor(() => document.body.innerText.includes('ایجاد وظیفه جدید'), 10000);
    const filled = await cdp.evaluate<boolean>(`(() => {
      const modal = [...document.querySelectorAll('.fixed')].find((el) => el.innerText.includes('ایجاد وظیفه جدید'));
      if (!modal) return false;
      const input = modal.querySelector('input');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      input.focus();
      setter.call(input, ${JSON.stringify(qaTaskTitle)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!filled) throw new Error('Task title input not found');
    const submitted = await cdp.evaluate<boolean>(`(() => {
      const modal = [...document.querySelectorAll('.fixed')].find((el) => el.innerText.includes('ایجاد وظیفه جدید'));
      const button = modal && [...modal.querySelectorAll('button')].find((b) => b.innerText.includes('ثبت'));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    if (!submitted) throw new Error('Task submit button not found');
    {
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        const done = await cdp.evaluate<boolean>(`(() => {
          const text = document.body.innerText;
          return text.includes(${JSON.stringify(qaTaskTitle)}) ||
            text.includes('ناموفق') ||
            text.includes('خطا') ||
            text.includes('وارد کنید');
        })()`);
        if (done) break;
        await sleep(250);
      }
    }
    const bodyAfterSubmit = await cdp.evaluate<string>('document.body.innerText');
    if (!bodyAfterSubmit.includes(qaTaskTitle)) {
      throw new Error(`Task did not appear after submit. Body: ${bodyAfterSubmit.replace(/\\s+/g, ' ').slice(0, 500)}`);
    }
    await cdp.reload();
    {
      const deadline = Date.now() + 30000;
      let persisted = false;
      while (Date.now() < deadline) {
        persisted = await cdp.evaluate<boolean>(
          `document.body.innerText.includes(${JSON.stringify(qaTaskTitle)})`
        );
        if (persisted) break;
        await sleep(250);
      }
      if (!persisted) throw new Error('Task did not persist after refresh');
    }
  });

  const qaRequestTitle = `QA_V11_Request_${Date.now()}`;
  await runCheck('Requests Full QA', 'Create request through UI and persist after refresh', async () => {
    await gotoBusinessRoute(cdp, '/dashboard/work-requests');
    await clickText(cdp, 'درخواست جدید');
    await cdp.waitFor(() => document.body.innerText.includes('ثبت و ارسال برای تایید'), 15000);
    const filled = await cdp.evaluate<boolean>(`(() => {
      const input = [...document.querySelectorAll('input')].find((el) => (el.placeholder || '').includes('موضوع'));
      const textarea = [...document.querySelectorAll('textarea')].find((el) => (el.placeholder || '').includes('توضیحات'));
      if (!input || !textarea) return false;
      const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      const textareaSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      inputSetter.call(input, ${JSON.stringify(qaRequestTitle)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      textareaSetter.call(textarea, 'QA_V11 request body');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!filled) throw new Error('Request form fields not found');
    const submitted = await clickText(cdp, 'ثبت و ارسال برای تایید');
    if (!submitted) throw new Error('Request submit button not found');
    await waitForText(cdp, qaRequestTitle);
    await cdp.reload();
    await waitForText(cdp, qaRequestTitle);
  });

  const qaLetterTitle = `QA_V11_Letter_${Date.now()}`;
  await runCheck('Letters Full QA', 'Create letter through UI and persist after refresh', async () => {
    await gotoBusinessRoute(cdp, '/dashboard/tasks?tab=letters');
    await cdp.waitFor(() => document.body.innerText.includes('نامه جدید'), 15000);
    const filled = await cdp.evaluate<boolean>(`(() => {
      const form = document.querySelector('#meizito-letter-form');
      if (!form) return false;
      const setInput = (input, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const setTextarea = (textarea, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, value);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const subject = [...form.querySelectorAll('input')].find((el) => (el.placeholder || '').includes('موضوع'));
      const to = [...form.querySelectorAll('input')].find((el) => (el.placeholder || '').includes('گیرندگان'));
      const body = [...form.querySelectorAll('textarea')].find((el) => (el.placeholder || '').includes('متن نامه'));
      const labels = [...form.querySelectorAll('input')].find((el) => (el.placeholder || '').includes('برچسب'));
      if (!subject || !to || !body) return false;
      setInput(subject, ${JSON.stringify(qaLetterTitle)});
      setInput(to, 'QA_V11 Recipient');
      setTextarea(body, 'QA_V11 letter body');
      if (labels) setInput(labels, 'QA_V11');
      return true;
    })()`);
    if (!filled) throw new Error('Letter form fields not found');
    const submitted = await clickText(cdp, 'ارسال به خروجی');
    if (!submitted) throw new Error('Letter submit button not found');
    await waitForText(cdp, qaLetterTitle);
    await cdp.reload();
    await waitForText(cdp, qaLetterTitle);
  });

  const qaEventTitle = `QA_V11_Event_${Date.now()}`;
  await runCheck('Calendar Full QA', 'Create calendar event through UI and persist after refresh', async () => {
    await gotoBusinessRoute(cdp, '/dashboard/tasks?tab=calendar');
    const opened = await clickText(cdp, 'رویداد جدید');
    if (!opened) throw new Error('New event button not found');
    await cdp.waitFor(() => document.body.innerText.includes('رویداد جدید'), 15000);
    const today = new Date().toISOString().slice(0, 10);
    const filled = await cdp.evaluate<boolean>(`(() => {
      const modal = [...document.querySelectorAll('.fixed')].find((el) => el.innerText.includes('رویداد جدید'));
      if (!modal) return false;
      const setInput = (input, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const setTextarea = (textarea, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, value);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const title = modal.querySelector('input[placeholder="عنوان"]');
      const date = modal.querySelector('input[type="date"]');
      const time = modal.querySelector('input[type="time"]');
      const notes = modal.querySelector('textarea');
      if (!title || !date) return false;
      setInput(title, ${JSON.stringify(qaEventTitle)});
      setInput(date, ${JSON.stringify(today)});
      if (time) setInput(time, '10:30');
      if (notes) setTextarea(notes, 'QA_V11 event notes');
      return true;
    })()`);
    if (!filled) throw new Error('Event form fields not found');
    const submitted = await clickText(cdp, 'ذخیره');
    if (!submitted) throw new Error('Event save button not found');
    await waitForText(cdp, qaEventTitle);
    await cdp.reload();
    await waitForText(cdp, qaEventTitle);
  });

  const qaMessageBody = `QA_V11_Message_${Date.now()}`;
  await runCheck('Chat Full QA', 'Send chat message through UI and persist after refresh', async () => {
    await gotoBusinessRoute(cdp, '/dashboard/chats');
    await cdp.waitFor(() => document.body.innerText.includes('گفتگو') || document.body.innerText.includes('پیام'), 15000);
    const hasComposer = await cdp.evaluate<boolean>("Boolean(document.querySelector('textarea[placeholder*=\"پیام خود\"]'))");
    if (!hasComposer) {
      const firstThreadClicked = await cdp.evaluate<boolean>(`(() => {
        const buttons = [...document.querySelectorAll('button')];
        const thread = buttons.find((b) => b.innerText && !b.innerText.includes('گفتگوی جدید') && b.innerText.length > 2);
        if (!thread) return false;
        thread.click();
        return true;
      })()`);
      if (!firstThreadClicked) throw new Error('No chat thread available and no composer visible');
    }
    await cdp.waitFor(() => Boolean(document.querySelector('textarea[placeholder*="پیام خود"]')), 15000);
    const filled = await cdp.evaluate<boolean>(`(() => {
      const textarea = document.querySelector('textarea[placeholder*="پیام خود"]');
      if (!textarea) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(textarea, ${JSON.stringify(qaMessageBody)});
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!filled) throw new Error('Chat composer not found');
    const sent = await cdp.evaluate<boolean>(`(() => {
      const textarea = document.querySelector('textarea[placeholder*="پیام خود"]');
      const row = textarea?.closest('div');
      const button = row && [...row.querySelectorAll('button')].pop();
      if (!button) return false;
      button.click();
      return true;
    })()`);
    if (!sent) throw new Error('Chat send button not found');
    await waitForText(cdp, qaMessageBody);
    await cdp.reload();
    await waitForText(cdp, qaMessageBody);
  });

  await runCheck('Responsive', 'Mobile viewport quick menu sweep', async () => {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await cdp.goto('/dashboard/tasks');
    await assertPageOk(cdp, 'Responsive', 'mobile /dashboard/tasks');
    await cdp.send('Emulation.clearDeviceMetricsOverride');
  });

  cdp.close();
  if (chromeProcess) chromeProcess.kill();

  const artifactDir = join(process.cwd(), 'qa-artifacts');
  mkdirSync(artifactDir, { recursive: true });
  const artifact = {
    date: new Date().toISOString(),
    baseUrl: BASE,
    tool: 'CDP direct',
    browser: CHROME_PATH,
    results,
    consoleIssues: [...new Set(consoleIssues)].slice(0, 50),
  };
  writeFileSync(join(artifactDir, 'v11-browser-quick-menus.json'), JSON.stringify(artifact, null, 2), 'utf8');

  const failed = results.filter((r) => r.status === 'fail');
  const blocked = results.filter((r) => r.status === 'blocked');
  console.log(`\n[qa-browser-v11] ${results.length - failed.length - blocked.length}/${results.length} passed`);
  if (consoleIssues.length) {
    console.log(`[qa-browser-v11] console issues captured: ${consoleIssues.length}`);
  }
  if (failed.length > 0) process.exit(1);
}

run().catch((err) => {
  console.error('[qa-browser-v11] fatal', err);
  if (chromeProcess) chromeProcess.kill();
  process.exit(1);
});
