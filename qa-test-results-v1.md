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

## Scope

This run follows the updated lightweight `todo-v11.md` scope:

- Login only as setup.
- No deep login/session/logout test.
- No business create/delete test.
- No "create new workspace board" test.
- Focus on the quick access menus shown in the sidebar image.
- External browser only; no Cursor browser/preview.
- No local `npm run dev`; production URL was used.

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
