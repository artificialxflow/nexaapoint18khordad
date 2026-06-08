# NexaApp — TODO v7 (احراز هویت · OTP/SMS · PostgreSQL · Prisma · نقش‌ها)

**تاریخ:** ۱۴۰۵/۰۳/۱۸  
**وضعیت:** ✅ فاز ۰–۵ · 🔶 فاز ۶ (deploy/production)  
**پایه انجام‌شده:** [`todo-v6.md`](todo-v6.md) (ارتباطات یکپارچه — فرانت ✅)  
**env:** [`.env.example`](.env.example) · Postgres (`DATABASE_URL` داخلی + `DIRECT_URL` عمومی) · sms.ir  
> **بروز ۱۴۰۵/۰۳/۱۸:** پیاده‌سازی فاز ۰–۵ انجام شد. **لوکال:** `DATABASE_URL` باید برابر `DIRECT_URL` (public) باشد — hostname internal از PC در دسترس نیست.


## قرارداد اسکوپ — v7

| داخل v7 | خارج از v7 |
|---------|------------|
| Prisma + PostgreSQL (User, Role, Session, OtpChallenge) | tenant کسب‌وکار در DB (هنوز localStorage) |
| OTP via sms.ir (`/v1/send/verify`) | WebSocket / push |
| API Routes: send · verify · logout · me | CRUD کامل AccessControl از UI |
| صفحه `/login` + `middleware.ts` | sync Meizito mock users با DB |
| Session cookie `httpOnly` | permission روی هر view ERP |
| seed نقش‌های سیستم + super admin bootstrap | auto-register هر شماره جدید |
| logger ساختاریافته (`[auth]` `[otp]` `[sms]` `[db]`) | Redis (OTP در Postgres کافی است) |
| یکپارچه‌سازی: Header · Sidebar logout · `/businesses` | i18n |

### تصمیم کلیدی — ثبت‌نام

| حالت | رفتار v7 |
|------|----------|
| `09126723365` + OTP `000000` (bootstrap) | ✅ login — نقش **مدیر کل** |
| OTP عادی + کاربر موجود در DB | ✅ login |
| OTP عادی + کاربر **وجود ندارد** | ❌ خطا — «دسترسی ندارید» (بدون auto-register) |
| سایر شماره‌ها با `000000` | ❌ رد |

> bootstrap فقط با `ALLOW_BOOTSTRAP_OTP=true` فعال است؛ در production واقعی غیرفعال شود.

### تفکیم «نقش» در پروژه (حفظ شود)

| لایه | مدل فعلی | v7 |
|------|----------|-----|
| **سیستم (RBAC)** | mock در `AccessControlSection` | ✅ `SystemRole` در DB |
| **tenant** | `NexaBusinessRole` در localStorage | ⏸️ v8 |
| **میز کار** | `MeizitoMockUserRole` | ⏸️ v8 — سوئیچ mock باقی بماند |

---

## env — متغیرهای مورد استفاده v7

| متغیر | نقش |
|--------|-----|
| `DATABASE_URL` | Postgres **internal** — runtime Prisma |
| `DIRECT_URL` | Postgres **public** — `prisma migrate` |
| `SMS_IR_API_KEY` | هدر `X-API-KEY` (فقط سرور) |
| `SMS_IR_TEMPLATE_ID` | قالب OTP (مثلاً `789138`) |
| `SMS_IR_SANDBOX` | `true` = تست بدون SMS واقعی |
| `SMS_IR_TEMPLATE_PARAM` | نام پارامتر قالب (معمولاً `Code`) |
| `OTP_TTL_SECONDS` | انقضای challenge |
| `OTP_RESEND_SECONDS` | فاصله ارسال مجدد |
| `OTP_MAX_ATTEMPTS` | سقف verify |
| `OTP_SIGNING_SECRET` | hash OTP + امضای session |
| `AUTH_SESSION_COOKIE` | نام cookie (پیش‌فرض: `nexa_session`) |
| `AUTH_SESSION_TTL_DAYS` | عمر session |
| `BOOTSTRAP_MOBILE` | `09126723365` |
| `BOOTSTRAP_OTP` | `000000` |
| `ALLOW_BOOTSTRAP_OTP` | فعال‌سازی bypass |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` |
| `NEXT_PUBLIC_APP_URL` | redirect + cookie secure |

---

## Prisma — مدل داده (پیش‌نویس)

**فایل:** [`prisma/schema.prisma`](prisma/schema.prisma)

| Model | فیلدهای کلیدی |
|-------|----------------|
| `SystemRole` | `key`, `nameFa`, `permissions` (Json), `isSystem` |
| `User` | `mobile`, `mobileE164` (unique), `systemRoleId`, `status`, `isBootstrap`, `lastLoginAt` |
| `OtpChallenge` | `mobileE164`, `codeHash`, `expiresAt`, `resendAfter`, `attempts`, `consumedAt` |
| `Session` | `userId`, `tokenHash`, `expiresAt`, `ip`, `userAgent` |

**Seed:**

- نقش‌ها: `super_admin`, `sales`, `production_manager`, `designer`, `finance_manager` (برچسب فارسی از UI فعلی)
- کاربر bootstrap: `09126723365` → `super_admin`, `displayName`: مدیر کل, `isBootstrap: true`

---

## ساختار فایل‌های جدید

```text
prisma/
  schema.prisma
  seed.ts
  migrations/
src/lib/
  db/prisma.ts
  logger.ts
  auth/config.ts
  auth/mobile.ts
  auth/otp.ts
  auth/session.ts
  sms/smsIrClient.ts
app/
  login/page.tsx
  api/auth/otp/send/route.ts
  api/auth/otp/verify/route.ts
  api/auth/logout/route.ts
  api/auth/me/route.ts
middleware.ts
src/context/AuthContext.tsx
```

---

## وضعیت پایه (قبل از v7)

| قابلیت | وضعیت |
|--------|--------|
| env (DB, SMS, OTP) | ✅ |
| Prisma / migration | ✅ |
| API auth | ✅ |
| `/login` | ✅ |
| `middleware` | ✅ |
| Session واقعی | ✅ |
| ورود فعلی | OTP + session + انتخاب کسب‌وکار |
| `AccessControlSection` | mock UI |
| Nextcloud API | ✅ (بدون تغییر v7) |

---

## وضعیت اجرا v7

| بلوک | وضعیت |
|------|--------|
| فاز ۰ — آماده‌سازی Prisma + logger + env | ✅ |
| فاز ۱ — schema · migrate · seed | ✅ |
| فاز ۲ — OTP + sms.ir | ✅ |
| فاز ۳ — API Routes + session | ✅ |
| فاز ۴ — UI login + middleware | ✅ |
| فاز ۵ — نقش‌ها + یکپارچه‌سازی UI | ✅ |
| فاز ۶ — QA · deploy · acceptance | 🔶 |

---

# فاز ۰ — آماده‌سازی

**هدف:** وابستگی‌ها، singleton DB، logger، validate env — بدون UI.

**برآورد:** ۰.۵ روز

### ۰.۱ وابستگی‌ها

- [x] `npm install prisma @prisma/client --save`
- [x] `npm install zod --save` (validate env)
- [x] `npx prisma init`

### ۰.۲ اسکریپت‌های package.json

- [x] `"postinstall": "prisma generate"`
- [x] `"db:migrate": "prisma migrate dev"`
- [x] `"db:deploy": "prisma migrate deploy"`
- [x] `"db:seed": "prisma db seed"`
- [x] `"db:studio": "prisma studio"`

### ۰.۳ prisma seed config

- [x] در `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }` یا `ts-node`
- [x] devDependency: `tsx` (در صورت نیاز)

### ۰.۴ فایل‌های هسته

- [x] [`src/lib/db/prisma.ts`](src/lib/db/prisma.ts) — singleton (جلوگیری از hot-reload duplicate)
- [x] [`src/lib/logger.ts`](src/lib/logger.ts) — `debug|info|warn|error` + prefix + mask mobile
- [x] [`src/lib/auth/config.ts`](src/lib/auth/config.ts) — Zod parse env؛ throw واضح اگر DB/SMS ناقص

### ۰.۵ به‌روزرسانی `.env.example`

- [x] `SMS_IR_TEMPLATE_PARAM=Code`
- [x] `AUTH_SESSION_COOKIE`, `AUTH_SESSION_TTL_DAYS`
- [x] `BOOTSTRAP_MOBILE`, `BOOTSTRAP_OTP`, `ALLOW_BOOTSTRAP_OTP`
- [x] `LOG_LEVEL=debug`

### ۰.۶ QA فاز ۰

- [x] `npx prisma generate` بدون خطا
- [x] logger در dev: `[auth] config loaded` (بدون چاپ secret)

---

# فاز ۱ — دیتابیس · migration · seed

**هدف:** جداول ساخته شوند؛ super admin در DB باشد.

**برآورد:** ۰.۵ روز  
**اتصال:** `DIRECT_URL` (public) برای migrate · `DATABASE_URL` (internal) برای runtime

### ۱.۱ schema.prisma

- [x] `datasource db`: `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`
- [x] enum `UserStatus`: `active` | `inactive`
- [x] model `SystemRole` (طبق جدول بالا)
- [x] model `User` با `@@unique` روی `mobile` و `mobileE164`
- [x] model `OtpChallenge` با index روی `mobileE164`, `expiresAt`
- [x] model `Session` با `onDelete: Cascade` روی User

### ۱.۲ migration

- [x] `npx prisma migrate dev --name init_auth`
- [x] commit فایل‌های `prisma/migrations/` (آماده commit)

### ۱.۳ seed.ts

- [x] upsert نقش `super_admin` — «مدیر کل سیستم» — permissions: `["all"]`
- [x] upsert نقش‌های mock: `sales`, `production_manager`, `designer`, `finance_manager`
- [x] upsert user bootstrap:
  - mobile: `9126723365` / e164: `989126723365`
  - `displayName`: «مدیر کل»
  - `systemRole`: super_admin
  - `isBootstrap: true`
- [x] log: `[db] seed: roles=5 users=1`

### ۱.۴ QA فاز ۱

- [x] `npx prisma db seed` موفق (با `DATABASE_URL` = public در لوکال)
- [ ] `npx prisma studio` — user bootstrap visible (دستی)
- [x] اتصال با `DATABASE_URL` internal از محیط deploy (Railway)

---

# فاز ۲ — سرویس OTP + sms.ir

**هدف:** send/verify از سرور؛ bootstrap bypass؛ لاگ کافی.

**برآورد:** ۱ روز

### ۲.۱ نرمال‌سازی موبایل

- [x] [`src/lib/auth/mobile.ts`](src/lib/auth/mobile.ts)
- [x] `normalizeMobile(input)` → `{ mobile: '912...', mobileE164: '98912...' }`
- [x] reject: طول نامعتبر، غیر ایرانی

### ۲.۲ کلاینت sms.ir

- [x] [`src/lib/sms/smsIrClient.ts`](src/lib/sms/smsIrClient.ts)
- [x] `POST https://api.sms.ir/v1/send/verify`
- [x] headers: `X-API-KEY`, `Accept: application/json`
- [x] body: `mobile`, `templateId`, `parameters[{ name, value }]`
- [x] `SMS_IR_SANDBOX=true` → log `[sms] sandbox skip` (بدون HTTP) یا endpoint sandbox طبق doc
- [x] log: status HTTP، `response.status/message` — **بدون** API key و code

### ۲.۳ سرویس OTP

- [x] [`src/lib/auth/otp.ts`](src/lib/auth/otp.ts)
- [x] `createChallenge(mobileE164, ip?, ua?)` — کد ۶ رقمی · hash با secret · ذخیره DB
- [x] `verifyChallenge(mobileE164, code)` — attempts++ · compare hash · mark consumed
- [x] rate: `resendAfter` از `OTP_RESEND_SECONDS`
- [x] expire: `OTP_TTL_SECONDS`
- [x] max: `OTP_MAX_ATTEMPTS`
- [x] `isBootstrapLogin(mobile, code)` — فقط اگر `ALLOW_BOOTSTRAP_OTP` + match env
- [x] bootstrap: **بدون** ذخیره OTP در DB · مستقیم verify OK

### ۲.۴ QA فاز ۲

- [x] unit/manual: hash/verify cycle
- [x] bootstrap `09126723365` + `000000` → true
- [x] شماره دیگر + `000000` → false
- [x] log mask: `0912***3365`

---

# فاز ۳ — API Routes + Session

**هدف:** REST auth کامل؛ cookie session.

**برآورد:** ۱ روز

### ۳.۱ Session

- [x] [`src/lib/auth/session.ts`](src/lib/auth/session.ts)
- [x] `createSession(userId, ip?, ua?)` → token random → hash در DB → Set-Cookie
- [x] `getSessionFromRequest(req)` → User + Role
- [x] `destroySession(token)`
- [x] cookie: `httpOnly`, `sameSite=lax`, `secure` if production, `path=/`
- [x] TTL: `AUTH_SESSION_TTL_DAYS`

### ۳.۲ API — send

- [x] `POST /api/auth/otp/send` — body: `{ mobile }`
- [x] کاربر باید در DB باشد (bootstrap mobile همیشه OK)
- [x] اگر bootstrap-only test: send برای bootstrap بدون SMS واقعی log
- [x] پاسخ: `{ ok, resendAfterSeconds }` یا خطای فارسی

### ۳.۳ API — verify

- [x] `POST /api/auth/otp/verify` — body: `{ mobile, code }`
- [x] bootstrap path → user lookup/create از seed
- [x] normal path → otp verify + user lookup
- [x] user inactive → 403
- [x] update `lastLoginAt`
- [x] Set-Cookie + `{ ok, user: { id, displayName, role } }`

### ۳.۴ API — logout & me

- [x] `POST /api/auth/logout` — clear cookie + delete session
- [x] `GET /api/auth/me` — user + systemRole + permissions (401 if no session)

### ۳.۵ کدهای خطا (یکدست)

- [x] `AUTH_USER_NOT_FOUND`
- [x] `OTP_EXPIRED` · `OTP_INVALID` · `OTP_MAX_ATTEMPTS`
- [x] `OTP_RESEND_TOO_SOON`
- [x] `AUTH_UNAUTHORIZED`

### ۳.۶ QA فاز ۳

- [x] Postman/curl: send → verify → me → logout
- [x] cookie بعد logout invalid
- [x] `[auth]` log در هر endpoint

---

# فاز ۴ — UI Login + Middleware

**هدف:** جریان کاربر در مرورگر؛ محافظت مسیرها.

**برآورد:** ۱ روز

### ۴.۱ صفحه login

- [x] [`app/login/page.tsx`](app/login/page.tsx) — RTL · فارسی · Vazirmatn
- [x] مرحله ۱: input موبایل + «ارسال کد»
- [x] مرحله ۲: input OTP ۶ رقمی + «ورود»
- [x] countdown resend از `OTP_RESEND_SECONDS`
- [x] نمایش خطاهای API
- [x] redirect پس از موفقیت: `searchParams.next` یا `/businesses`

### ۴.۲ AuthContext

- [x] [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx)
- [x] `user`, `role`, `loading`, `refresh()`, `logout()`
- [x] wrap در [`app/providers.tsx`](app/providers.tsx)

### ۴.۳ middleware

- [x] [`middleware.ts`](middleware.ts)
- [x] محافظت: `/dashboard/:path*`, `/businesses/:path*`
- [x] آزاد: `/`, `/login`, `/shop`, `/blog`, `/mobile`, `/api/auth/:path*`
- [x] بدون cookie → redirect `/login?next=...`
- [x] log `[middleware] unauthenticated → login`

### ۴.۴ تغییر مسیر ورود

- [x] [`LandingPage`](src/views/LandingPage.tsx): «ورود به پنل» → `/login`
- [x] ترتیب gate: **auth** سپس **BusinessGate** (tenant)

### ۴.۵ QA فاز ۴

- [x] `/dashboard` بدون login → `/login`
- [x] login موفق → `/businesses` → dashboard
- [x] `next` param کار کند

---

# فاز ۵ — نقش‌ها + یکپarچه‌سازی UI

**هدف:** RBAC در Header/Sidebar؛ خروج واقعی؛ نام کاربر از DB.

**برآورد:** ۱ روز

### ۵.۱ Header

- [x] [`Header.tsx`](src/components/Header.tsx): نام + نقش فارسی از `AuthContext`
- [x] hide/mock user name قدیمی

### ۵.۲ BusinessListPage

- [x] [`BusinessListPage.tsx`](src/views/businesses/BusinessListPage.tsx): «سلام، {displayName}» از session — نه `NEXA_DEMO_USER_NAME`

### ۵.۳ Sidebar logout

- [x] [`Sidebar.tsx`](src/components/Sidebar.tsx): دکمه «خروج» → `logout()` → `/login`
- [x] onClick فعلی (فعلاً بدون handler)

### ۵.۴ Helpers نقش

- [x] `src/lib/auth/rbac.ts`: `hasPermission(user, 'sales_view')`, `isSuperAdmin(user)`
- [x] super_admin → همه permissions

### ۵.۵ (اختیاری v7) Settings AccessControl

- [ ] read-only نمایش نقش فعلی در تب دسترسی
- [ ] CRUD کاربر/نقش از DB → **v8**

### ۵.۶ QA فاز ۵

- [x] super admin: نقش «مدیر کل سیستم» در UI
- [x] logout + back button → redirect login

---

# فاز ۶ — QA · Deploy · Acceptance

**هدف:** production-ready برای auth لایه اول.

**برآورد:** ۰.۵ روز

### ۶.۱ Build & migrate deploy

- [x] `npm run build` سبز (تست شد — dev باید stop شود برای generate همزمان)
- [ ] Railway/Nixpacks: release command `npx prisma migrate deploy`
- [x] runtime: `DATABASE_URL` internal (production) · لوکال = public
- [ ] `NEXT_PUBLIC_APP_URL` = دامنه واقعی production

### ۶.۲ امنیت

- [x] `.env` در `.gitignore` (verify)
- [ ] `ALLOW_BOOTSTRAP_OTP=false` در production (یا حذف bootstrap)
- [ ] rotate secrets اگر لو رفته
- [ ] `SMS_IR_SANDBOX=false` وقتی SMS واقعی لازم است

### ۶.۳ Acceptance tests

- [x] `09126723365` + `000000` → login → `/businesses` → `/dashboard/dashboard`
- [x] `/dashboard/*` بدون cookie → `/login`
- [x] logout → session حذف
- [x] `GET /api/auth/me` → role `super_admin`
- [x] شماره ناشناس → `AUTH_USER_NOT_FOUND`
- [ ] OTP اشتباه ۵ بار → `OTP_MAX_ATTEMPTS`
- [ ] resend زودتر از ۶۰s → `OTP_RESEND_TOO_SOON`
- [x] logها: prefix درست · بدون leak secret/OTP

### ۶.۴ Regression v6

- [x] میز کار · گفتگو · نامه · درخواست — بدون شکست (mock data)
- [x] Nextcloud upload/list — بدون تغییر

---

## استرategی لاگ

| Prefix | رویداد |
|--------|--------|
| `[auth]` | login/logout/me · session create/destroy |
| `[otp]` | challenge created/consumed/expired · attempt (no plaintext code) |
| `[sms]` | HTTP status · sms.ir `status/message` |
| `[db]` | Prisma errors · seed · migrate |
| `[middleware]` | redirect unauthenticated |

**هرگز log نشود:** OTP plaintext · API key · cookie کامل · DB password

**Mask موبایل:** `0912***3365`

---

## بک‌لاگ v8+ (خارج از v7)

- [ ] `Business` / `BusinessMember` در DB
- [ ] CRUD کاربر و نقش از `AccessControlSection`
- [ ] permission gate روی viewهای داشبورد
- [ ] sync `MeizitoContext` با `User.id` واقعی
- [ ] Redis برای OTP (scale)
- [ ] refresh token / remember device
- [ ] audit log ورود

---

## برآورد زمان کل

| فاز | روز |
|-----|-----|
| ۰ | ۰.۵ |
| ۱ | ۰.۵ |
| ۲ | ۱ |
| ۳ | ۱ |
| ۴ | ۱ |
| ۵ | ۱ |
| ۶ | ۰.۵ |
| **جمع** | **~۵.۵ روز** |

---

## Definition of Done (v7)

1. PostgreSQL وصل · migration اعمال · seed super admin
2. login با `09126723365` + `000000` (bootstrap)
3. login با OTP عادی برای user موجود در DB
4. session cookie + middleware + logout
5. نقش سیستم از DB در UI
6. logger کافی برای debug
7. `npm run build` + deploy با `prisma migrate deploy`
