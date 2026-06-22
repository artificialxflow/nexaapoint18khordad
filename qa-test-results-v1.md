# NexaApp QA Test Results v1

Date: 2026-06-21  
Tester: Cursor Agent  
Environment: Production/Coolify URL, external Google Chrome  
Base URL: `http://nexaapoint18khordad.91.107.177.182.sslip.io`  
Browser: `C:\Program Files\Google\Chrome\Application\chrome.exe`  
Tool: CDP direct fallback with external Chrome (`scripts/qa-browser-v11.ts`)  
Login user: `artificialxflow`  
Password handling: provided credential used for login; password is not repeated in this report.

---

## Stage 1 Local Run — Calendar / Chat / Phone / Dashboard

Date: 2026-06-21  
Environment: Local Next.js dev server, `http://localhost:3000` (heap `--max-old-space-size=4096`)  
Browser: external Google Chrome  
Tool: CDP direct fallback with phase filter (`scripts/qa-browser-v11.ts`)  
Calendar status: now executed (auto-advance continued past Calendar per user instruction).

### API smoke (run first)

- Calendar: `13/13 passed`
- Chat: `8/8 passed`
- Phone: `7/7 passed`
- Dashboard: `6/6 passed`

### Browser harness (external Chrome)

- Calendar Full QA: **pass** — event `QA_V11_Event_*` created from UI and persisted after refresh.
- Chat Full QA: **pass** — message `QA_V11_Message_*` sent and confirmed via chat snapshot API + persisted after refresh.
- Phone Full QA: **pass** — directory search shrinks list for non-matching query, managers filter toggles without overlay.
- Dashboard Full QA: **pass** — dashboard content (`داشبورد`) + chart svg render with no runtime overlay.
- Phone/Dashboard route + menu checks: **pass**.

Aggregate browser results across the stage runs: Calendar+Chat `12/12` (after fix), Chat re-run `7/7`, Phone+Dashboard `12/12`.

### Bug found and fixed during this stage

- **Chat message send via harness failed** (`Chat message not visible after send`).
  - Root cause (harness): the chat composer (`textarea[placeholder="پیام خود را بنویسید..."]`) is always rendered even when no thread is active, and `sendText()` in `src/views/meizito/components/MeizitoChatEmbed.tsx` no-ops unless `activeThreadId` is set. The harness also set the textarea value via the native value setter, which did not update React's controlled state, so the send button (only shown when `body.trim()` is truthy) never appeared.
  - Fix (in `scripts/qa-browser-v11.ts`, Chat Full QA block):
    1. Explicitly activate the first thread by clicking its list row (the `button` with an `<h4>` title) before sending; create a thread first if none exist.
    2. Type the message with real CDP input (`Input.insertText`) after focusing the textarea, so React's `onChange`/`body` state updates and the send button renders.
    3. Click the actual send button (last button next to the textarea), with a synthetic Enter `keydown` as fallback.
    4. Verify persistence by polling the chat snapshot API (`GET /api/meizito/{businessId}/chat`, new helper `waitForChatApiMessage`) instead of relying on the date-filtered message view, then reconfirm after reload.
  - This is a test-harness robustness fix; the product send path (API + `refreshChat`) was already correct, as proven by the Chat API smoke passing `8/8`.

### Harness additions

- Added `Phone Full QA` (search/filter behavior) and `Dashboard Full QA` (KPI/chart render) checks to `scripts/qa-browser-v11.ts`.

---

## Stage 2 Local Run — Products / کالاها

Date: 2026-06-21  
Environment: Local Next.js dev server, `http://localhost:3000`  
Prisma migration: `20260621180000_products_v12` (CatalogPriceList, CatalogCategory, CatalogProduct)

### Backend added

- Prisma models: `CatalogPriceList`, `CatalogCategory`, `CatalogProduct`
- Server layer: `src/lib/products/{access,client,schemas,serialize,server}.ts`
- API routes under `app/api/products/[businessId]/`:
  - `catalog` (GET snapshot)
  - `products` (GET list/search, POST create)
  - `products/[productId]` (PATCH, DELETE)
  - `categories`, `price-lists`, `prices` (PATCH bulk)
- Frontend wiring: `CatalogContext` loads/mutates products via API when `activeBusinessId` is set
- Smoke script: `scripts/products-smoke.ts` (`npm run test:products`)

### Test results

- API smoke: **11/11 passed** (login, business, empty catalog, price list, category, product CRUD, price patch, DB persistence)
- Browser QA: **5/5 passed** (create `QA_V12_Product_*` + code from UI, confirmed via catalog API + reload)

### Bug found and fixed during browser QA

- Product form requires both **name** and **code** (`saveDraft` validation in `Products.tsx`); harness initially filled only name, so API POST never fired. Fixed by filling the code field identified via the `کد/شناسه` label.

### Console / network notes

- `401 Unauthorized` during bootstrap/auth — non-blocking.
- Recharts width/height `-1` warning on dashboard — non-blocking visual risk (tracked as QA-V11-001).

---

## Latest Focused Local Run — Workspace / Requests

Date: 2026-06-21  
Environment: Local Next.js dev server, `http://localhost:3000`  
Browser: external Google Chrome  
Tool: CDP direct fallback with phase filter (`scripts/qa-browser-v11.ts`)  
Phase filter: `Workspace,Workspace Full QA,Requests,Requests Full QA`  
Calendar status: intentionally skipped/stopped before Calendar per execution rule.

Result: **11/11 passed**

Checks passed:

- Setup: `/login` opened, credential login succeeded, existing business entered.
- Workspace route opened and expected workspace content rendered.
- Workspace horizontal scroll sanity passed.
- Workspace fake task `QA_V11_Task_*` was created from the new task modal and persisted after refresh.
- Requests route opened and expected request content rendered.
- Requests fake item `QA_V11_Request_*` was created from the UI and persisted after refresh.

Console/network notes from artifact:

- `401 Unauthorized` was captured during bootstrap/auth flow and was non-blocking after authenticated state.
- Recharts width/height warning was captured as a non-blocking visual risk.

Evidence:

- JSON artifact: `qa-artifacts/v11-browser-quick-menus.json`
- Command shape: `QA_BASE_URL=http://localhost:3000`, `QA_HEADFUL=1`, `QA_SKIP_CALENDAR=1`, `QA_ONLY_PHASES=Workspace,Workspace Full QA,Requests,Requests Full QA`
- Backend/API smoke already passed before this run: Workspace `18/18`, Requests `12/12`, Letters `13/13`.

---

## Scope

This run follows the updated lightweight `todo-v11.md` scope:

- Login only as setup.
- No deep login/session/logout test.
- No business create/delete test.
- No "create new workspace board" test.
- Focus on the quick access menus shown in the sidebar image.
- External browser only; no Cursor browser/preview.
- Earlier menu sanity used production URL; latest focused Workspace/Requests run used local `http://localhost:3000`.

---

## Summary

| Menu / Area | Pass | Fail | Blocked | Notes |
|-------------|------|------|---------|-------|
| Setup / external browser / login | 4 | 0 | 0 | Login succeeded with provided user |
| Dashboard | 2 | 0 | 0 | Route and content sanity passed |
| Workspace / Tasks | 3 | 0 | 0 | Route, content, horizontal scroll sanity passed |
| Calendar | 2 | 0 | 0 | Route and content sanity passed |
| Chat | 2 | 0 | 0 | Route and content sanity passed |
| Requests | 2 | 0 | 0 | Retested after waiting for BusinessGate load |
| Letters | 2 | 0 | 0 | Route and content sanity passed |
| Phone directory | 2 | 0 | 0 | Route and content sanity passed |
| Mobile responsive sweep | 2 | 0 | 0 | Mobile `/dashboard/tasks` passed |
| **Total** | **21** | **0** | **0** | **21/21 passed** |

---

## Test Runs

### Setup

- [x] External Chrome opened production `/login`
- [x] Initial login with provided credential
- [x] Entered first existing business
- [x] Browser/CDP connection worked against production URL

### Dashboard — `/dashboard/dashboard`

- [x] Route opened
- [x] No Next.js runtime overlay detected
- [x] No broken image detected
- [x] Expected dashboard content found

### Workspace — `/dashboard/tasks`

- [x] Route opened
- [x] Expected workspace content found
- [x] Horizontal scroll sanity passed
- [x] Mobile quick sweep passed

### Calendar — `/dashboard/tasks?tab=calendar`

- [x] Route opened
- [x] Expected calendar content found
- [x] No runtime overlay detected

### Chat — `/dashboard/chats`

- [x] Route opened
- [x] Expected chat content found
- [x] No runtime overlay detected

### Requests — `/dashboard/work-requests`

- [x] Route opened
- [x] Expected request content found
- [x] Retest note: first run checked too early while page still showed `بارگذاری کسب‌وکار…`; runner was updated to wait for BusinessGate load, then passed.

### Letters — `/dashboard/tasks?tab=letters`

- [x] Route opened
- [x] Expected letters content found
- [x] No runtime overlay detected

### Phone Directory — `/dashboard/tasks?tab=phone`

- [x] Route opened
- [x] Expected phone directory content found
- [x] No runtime overlay detected

### Responsive / Mobile

- [x] Mobile viewport applied for `/dashboard/tasks`
- [x] No runtime overlay detected

---

## Console / Network Notes

Non-blocking issues captured:

1. `401 Unauthorized` resource in console  
   - Context: expected/auth-related request during login/bootstrap checks can emit 401 before authenticated state is established.
   - Severity: Trivial / non-blocking for this run.

2. Recharts warning: chart width/height reported as `-1`  
   - Context: dashboard/chart container warning.
   - Severity: Minor visual risk. It did not block route rendering in this run.
   - Suggested follow-up: if visually reproducible, ensure chart container has stable `min-w-0` / height before `ResponsiveContainer` renders.

---

## Bugs

| ID | Severity | Menu | Status | Summary | Evidence |
|----|----------|------|--------|---------|----------|
| QA-V11-001 | Minor | Dashboard | Open / monitor | Recharts warning about chart width/height `-1`; no visible blocker in automated check | `qa-artifacts/v11-browser-quick-menus.json` |

---

## Evidence

- JSON artifact: `qa-artifacts/v11-browser-quick-menus.json`
- Tool: `scripts/qa-browser-v11.ts`
- Final automated result: `21/21 passed`

---

## Retest

- Requests initially failed because the check ran while the page still displayed `بارگذاری کسب‌وکار…`.
- Runner was updated to wait for BusinessGate load.
- Retest passed: Requests `2/2`.

---

## Remaining Risks

- This run is a lightweight menu sanity QA, not full CRUD E2E.
- Deep session/logout/role matrix tests are intentionally out of scope per latest user instruction.
- Create/delete business and create new workspace board are intentionally out of scope.
- Production deploy status/commit was not verified in this browser run.
# NexaApp QA Test Results v1

Date: 2026-06-21  
Tester: Cursor Agent  
Environment: Windows 10, local workspace `nexaapoint18khordad`  
Base URL: TBD  
Browser: TBD  
Tool: TBD (Browser Harness preferred; CDP fallback allowed)  
DB migration status: TBD  
Build status: TBD

---

## Summary

| Area | Pass | Fail | Blocked | Notes |
|------|------|------|---------|-------|
| Phase 0 — Setup | 0 | 0 | 0 | In progress |
| Phase 1 — Auth / Session | 0 | 0 | 0 | Not started |
| Phase 2 — Business Flow | 0 | 0 | 0 | Not started |
| Phase 3 — Dashboard ERP | 0 | 0 | 0 | Not started |
| Phase 4 — Phone Directory | 0 | 0 | 0 | Not started |
| Phase 5 — Workspace / Boards / Scroll | 0 | 0 | 0 | Not started |
| Phase 6 — Requests | 0 | 0 | 0 | Not started |
| Phase 7 — Letters | 0 | 0 | 0 | Not started |
| Phase 8 — Calendar | 0 | 0 | 0 | Not started |
| Phase 9 — Chat | 0 | 0 | 0 | Not started |
| Phase 10 — Cross-Module Sync | 0 | 0 | 0 | Not started |
| Phase 11 — Responsive / Visual QA | 0 | 0 | 0 | Not started |
| Phase 12 — Negative / Security | 0 | 0 | 0 | Not started |
| Phase 13 — Automated Smoke + Build | 0 | 0 | 0 | Not started |

---

## Environment Checks

- [ ] Project structure inspected
- [ ] Routes and test scripts identified
- [ ] `npx prisma migrate status`
- [ ] Dev server started
- [ ] Browser Harness evaluated
- [ ] Browser/CDP connection established
- [ ] `/` opens without runtime error

---

## Test Runs

### Phase 0 — Setup ابزار QA

- Status: In progress
- Evidence:
  - `todo-v11.md` exists and defines Browser QA phases.
  - `package.json` contains API smoke scripts for Auth, Business, Meizito, and Dashboard.

### Phase 1 — Auth · Session · Route Protection

- Status: Not started

### Phase 2 — Business Flow

- Status: Not started

### Phase 3 — Dashboard ERP

- Status: Not started

### Phase 4 — Phone Directory

- Status: Not started

### Phase 5 — Workspace / Boards / Scroll

- Status: Not started

### Phase 6 — Requests

- Status: Not started

### Phase 7 — Letters

- Status: Not started

### Phase 8 — Calendar

- Status: Not started

### Phase 9 — Chat

- Status: Not started

### Phase 10 — Cross-Module Sync

- Status: Not started

### Phase 11 — Responsive / Visual QA

- Status: Not started

### Phase 12 — Negative / Security Tests

- Status: Not started

### Phase 13 — Automated Smoke + Build

- Status: Not started

---

## Bugs

| ID | Severity | Area | Status | Summary | Evidence |
|----|----------|------|--------|---------|----------|

---

## Evidence

- Screenshots: TBD
- Console: TBD
- Network: TBD
- Notes: TBD

---

## Retest

No retests yet.

---

## Remaining Risks

- Browser Harness setup on Windows not yet verified.
- Browser E2E suites not yet executed.
- Production deploy readiness not yet verified in this run.
