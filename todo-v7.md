# NexaApp — TODO v7 (احراز هویت · PostgreSQL · Prisma · مدیریت کاربر)

**تاریخ:** ۱۴۰۵/۰۳/۱۹  
**پایه انجام‌شده:** [`todo-v6.md`](todo-v6.md) (فرانت Meizito/ERP mock) · Nextcloud API routes  
**مرجع خواسته:** گفتگوی v7 — login با username/password، بدون SMS/ایمیل، bootstrap ادمین، دعوت لینکی، RBAC سلسله‌مراتبی

> **قانون طلایی v7:** هر فاز **اول لوکال** (`dev` + `build` + تست دستی/API) → باگ‌گیری → سپس `git push` → Coolify از GitHub deploy می‌گیرد. **بدون تست لوکال، push ممنوع.**

---

## قرارداد اسکوپ v7

| داخل v7 | خارج از v7 |
|---------|------------|
| Prisma + PostgreSQL (User, Role, Session, Invite) | OTP / SMS.ir / ایمیل / magic link خارجی |
| Next.js API Routes (`app/api/auth/*`, `app/api/admin/*`) | سرویس auth جدا (Keycloak, Auth0, …) |
| Session با HttpOnly cookie | JWT در localStorage |
| Seed کاربر bootstrap + نقش‌های سیستم | ثبت‌نام عمومی (self-signup بدون دعوت) |
| پنل مدیریت کاربر داخل اپ | forgot-password خودکار با ایمیل |
| لینک دعوت یک‌بارمصرف (share متنی) | ارسال خودکار SMS/Email برای دعوت |
| Logger ساخت‌یافته (`[auth]`, `[db]`, `[admin]`, `[invite]`) | Sentry/observability (اختیاری بعداً) |
| Middleware محافظت route | SSO سازمانی |

### تصمیم‌های کلیدی

| موضوع | تصمیم |
|-------|--------|
| **ورود bootstrap** | username: `artificialxflow` · password: `Ronak#123Ronak` — فقط در **`prisma/seed.ts`** (hash bcrypt)، **نه** env و **نه** bypass در runtime auth |
| **DATABASE_URL** | internal (روی Coolify/Runflare) · **DIRECT_URL** public (migrate/seed از لوکال) |
| **لینک دعوت** | `{NEXT_PUBLIC_APP_URL}/invite/{token}` — token فقط hash در DB |
| **ریست پسورد** | فقط ادمین/مدیر مجاز از پنل — کاربر به ادمین اطلاع می‌دهد |
| **سلسله‌مراتب نقش** | `super_admin` → `admin` → نقش‌های عملیاتی (`sales`, `finance`, …) — مدیر نتواند نقش بالاتر از خودش بسازد |
| **Meizito mock users** | فاز ۷+: map تدریجی به User واقعی — فاز ۱–۶ mock ERP دست نخورده |

---

## متغیرهای محیط (`.env.example` / Coolify)

| متغیر | الزامی | توضیح |
|-------|--------|--------|
| `DATABASE_URL` | ✅ | Postgres داخل شبکه deploy |
| `DIRECT_URL` | ✅ | Postgres public — migrate/seed لوکال |
| `AUTH_SESSION_SECRET` | ✅ | امضای session (طولانی، random) |
| `AUTH_SESSION_COOKIE` | ⬜ | پیش‌فرض: `nexa_session` |
| `AUTH_SESSION_TTL_DAYS` | ⬜ | پیش‌فرض: `14` |
| `NEXT_PUBLIC_APP_URL` | ✅ | پایه URL دعوت (مثلاً sslip.io یا دامنه نهایی) |
| `LOG_LEVEL` | ⬜ | `debug` لوکال · `info` production |
| ~~SMS_IR_*~~ / ~~OTP_*~~ | ❌ | v7 استفاده نمی‌کند — از `.env.example` حذف یا comment |

> **امنیت:** `.env.production` با secret واقعی **commit نشود**. فقط `.env.example` + env در Coolify.

---

## Prisma — مدل‌های پیشنهادی

```
SystemRole     id, slug (unique), nameFa, level, permissions (Json), isSystem
User           id, username (unique), passwordHash, displayName, status, systemRoleId,
               createdById, mustChangePassword, lastLoginAt, createdAt, updatedAt
Session        id, userId, tokenHash (unique), expiresAt, ip, userAgent, createdAt
InviteToken    id, tokenHash (unique), systemRoleId, createdById, expiresAt,
               usedAt, usedByUserId, note (optional)
```

**Enum:** `UserStatus` = `active` | `disabled`

---

## ساختار فایل‌های جدید (پیش‌بینی)

```
prisma/
  schema.prisma
  seed.ts
  migrations/

src/lib/
  db/prisma.ts
  logger.ts
  auth/
    config.ts          # zod env
    password.ts        # bcrypt hash/verify
    session.ts         # create/destroy/get session + Set-Cookie
    rbac.ts            # hasPermission, canManageRole, isSuperAdmin
    api.ts             # jsonOk, jsonError, handleRouteError
    users.ts           # findByUsername, requireUser
    invites.ts         # create/validate/consume invite

app/api/auth/
  login/route.ts
  logout/route.ts
  me/route.ts

app/api/admin/users/
  route.ts             # GET list, POST create
  [id]/route.ts        # PATCH update, disable
  [id]/reset-password/route.ts

app/api/admin/invites/
  route.ts             # GET list, POST create
  [id]/revoke/route.ts

app/api/invite/
  [token]/route.ts     # GET validate · POST accept (username+password)

app/login/page.tsx
app/invite/[token]/page.tsx

middleware.ts

src/context/AuthContext.tsx
src/views/admin/UsersAdminSection.tsx   # یا زیر Settings
```

---

## استراتژی لاگ

| prefix | محل | چه چیزی |
|--------|-----|---------|
| `[auth]` | login/logout/me | username (نه password)، userId، نتیجه |
| `[session]` | session.ts | create/destroy/expired (نه token خام) |
| `[db]` | prisma errors | operation، کد خطا |
| `[admin]` | user CRUD | actorId، targetId، action |
| `[invite]` | invite flow | inviteId، role، used/expired/revoked |
| `[middleware]` | middleware | path، unauthenticated redirect |

**هرگز لاگ نشود:** password، token session، token invite خام، `DATABASE_URL`

---

## جریان کار Git / Coolify

```
[لوکال] npm run dev → تست → npm run build → prisma migrate dev (در صورت نیاز)
    ↓
git add . → git commit → git push origin main
    ↓
[Coolify] auto deploy از GitHub
    ↓
Release command: npx prisma migrate deploy && npx prisma db seed
    ↓
تست production: /login با artificialxflow
```

---

## وضعیت اجرا v7

| فاز | عنوان | وضعیت |
|-----|--------|--------|
| ۰ | آماده‌سازی · env · logger · Prisma setup | ✅ |
| ۱ | Schema · migrate · seed bootstrap | ✅ |
| ۲ | Auth core · password · session · config | ✅ |
| ۳ | API login/logout/me | ✅ |
| ۴ | Login UI · middleware · AuthContext | ✅ |
| ۵ | Admin — CRUD کاربر · ریست پسورد · RBAC | ✅ |
| ۶ | Invite link — API + UI `/invite/[token]` | ✅ |
| ۷ | یکپارچه‌سازی Header/Sidebar/Landing | ✅ |
| ۸ | QA لوکال · build · regression | ✅ |
| ۹ | push · Coolify · migrate/seed production · پذیرش | ⬜ |

---

# فاز ۰ — آماده‌سازی

**هدف:** وابستگی‌ها، env، logger، prisma generate — baseline build سبز.

### ۰.۱ وابستگی‌ها و اسکریپت‌ها

- [ ] نصب: `prisma`, `@prisma/client`, `zod`, `bcryptjs`, `@types/bcryptjs`
- [ ] `package.json` scripts: `postinstall`, `db:migrate`, `db:deploy`, `db:seed`, `db:studio`
- [ ] `prisma.seed` → `tsx prisma/seed.ts` (devDependency: `tsx`)
- [ ] Tailwind/TypeScript در `dependencies` اگر build production-only است (در صورت نیاز Coolify)

### ۰.۲ env

- [ ] بروزرسانی `.env.example` (DATABASE_URL, DIRECT_URL, AUTH_*, NEXT_PUBLIC_APP_URL, LOG_LEVEL)
- [ ] حذف/comment متغیرهای SMS/OTP از `.env.example`
- [ ] `.env.local` لوکال: `DATABASE_URL` = `DIRECT_URL` برای seed از ماشین dev
- [ ] تأیید `.gitignore` شامل `.env`, `.env.local`, `.env.production`

### ۰.۳ Logger

- [ ] `src/lib/logger.ts` — سطوح debug/info/warn/error + prefix + mask username

### ۰.۴ Baseline

- [ ] `npm install` لوکال
- [ ] `npm run build` — قبل از auth باید سبز باشد

**✅ Definition of Done فاز ۰:** build سبز · `.env.example` کامل · logger آماده

---

# فاز ۱ — Prisma Schema · Migration · Seed

**هدف:** DB ساخته شود · نقش‌ها + کاربر bootstrap وجود داشته باشد.

### ۱.۱ Schema

- [ ] `prisma/schema.prisma` — مدل‌های بالا + relations + indexes
- [ ] `src/lib/db/prisma.ts` — singleton client

### ۱.۲ Migration

- [ ] `npx prisma migrate dev --name init_auth` لوکال
- [ ] فایل migration در `prisma/migrations/` commit شود

### ۱.۳ Seed

- [ ] نقش‌های سیستم: `super_admin`, `admin`, `sales`, `finance_manager`, `production_manager`, `designer`
- [ ] `permissions` JSON برای هر نقش (حداقل scaffold)
- [ ] کاربر bootstrap:
  - username: `artificialxflow`
  - password: `Ronak#123Ronak` → **bcrypt hash در seed**
  - displayName: «مدیر کل»
  - role: `super_admin`
  - status: `active`
- [ ] `npx prisma db seed` لوکال — بدون خطا
- [ ] `npx prisma studio` — User + SystemRole قابل مشاهده

**✅ DoD فاز ۱:** migrate + seed لوکال OK · bootstrap user در DB

---

# فاز ۲ — Auth Core (کتابخانه داخلی)

**هدف:** password، session، rbac، config — بدون UI.

### ۲.۱ Config

- [ ] `src/lib/auth/config.ts` — zod parse env (AUTH_SESSION_SECRET الزامی)

### ۲.۲ Password

- [ ] `src/lib/auth/password.ts` — `hashPassword`, `verifyPassword` (bcrypt, cost 12)

### ۲.۳ Session

- [ ] `src/lib/auth/session.ts`
  - [ ] generate token تصادفی → hash در DB
  - [ ] `createSession(userId, req)` → Set-Cookie HttpOnly, SameSite, Path=/
  - [ ] `getSessionFromRequest` → user + role
  - [ ] `destroySession`
  - [ ] `Secure` cookie فقط وقتی HTTPS یا `NODE_ENV=production` + flag مناسب

### ۲.۴ RBAC

- [ ] `src/lib/auth/rbac.ts`
  - [ ] `isSuperAdmin`, `hasPermission(permission)`
  - [ ] `canAssignRole(actorRole, targetRole)` — سطح نقش
  - [ ] `serializeAuthUser` برای frontend

### ۲.۵ Users helper

- [ ] `src/lib/auth/users.ts` — `findUserByUsername`, `requireActiveUser`

### ۲.۶ API helpers

- [ ] `src/lib/auth/api.ts` — `jsonOk`, `jsonError`, `handleAuthRouteError`

**✅ DoD فاز ۲:** unit smoke (node script یا API بعدی) — hash/verify password درست

---

# فاز ۳ — API Routes (Auth)

**هدف:** login/logout/me با session واقعی.

### ۳.۱ POST `/api/auth/login`

- [ ] body: `{ username, password }` — zod validate
- [ ] پیدا کردن user · verify password · check status active
- [ ] update `lastLoginAt`
- [ ] create session + Set-Cookie
- [ ] log `[auth] login success/fail` (بدون password)
- [ ] خطاها: `INVALID_CREDENTIALS`, `USER_DISABLED`

### ۳.۲ POST `/api/auth/logout`

- [ ] destroy session + clear cookie

### ۳.۳ GET `/api/auth/me`

- [ ] session → user + systemRole + permissions
- [ ] 401 اگر بدون session

### ۳.۴ تست لوکال API

- [ ] `curl`/fetch: login با `artificialxflow` / `Ronak#123Ronak` → cookie
- [ ] `/api/auth/me` با cookie → 200 + user
- [ ] logout → me = 401

**✅ DoD فاز ۳:** login bootstrap لوکال 100% کار کند

---

# فاز ۴ — Frontend Auth · Middleware

**هدف:** UI ورود + محافظت route + context.

### ۴.۱ Login page

- [ ] `app/login/page.tsx` — فرم username + password، خطای فارسی، loading
- [ ] redirect بعد login: `/businesses` یا `?next=` query

### ۴.۲ AuthContext

- [ ] `src/context/AuthContext.tsx` — user, loading, refresh(), logout()
- [ ] wrap در `app/providers.tsx`

### ۴.۳ Middleware

- [ ] `middleware.ts` — protect `/dashboard/:path*`, `/businesses/:path*`
- [ ] allow: `/`, `/login`, `/invite/:path*`, `/api/auth/login`, static
- [ ] unauthenticated → redirect `/login?next=...`
- [ ] log `[middleware]` در debug

### ۴.۴ Landing

- [ ] `LandingPage` — «ورود به پنل» → `/login` (نه مستقیم `/businesses`)

### ۴.۵ تست لوکال UI

- [ ] `/dashboard` بدون login → redirect login
- [ ] login → دسترسی dashboard
- [ ] refresh صفحه → session حفظ شود
- [ ] logout از Sidebar

**✅ DoD فاز ۴:** جریان login/logout/middleware لوکال کامل

---

# فاز ۵ — Admin: مدیریت کاربران

**هدف:** super_admin/admin بتواند کاربر بسازد، نقش بدهد، پسورد ریست کند.

### ۵.۱ API Admin Users

- [ ] `GET /api/admin/users` — لیست (فیلتر status) — فقط با permission `users:read`
- [ ] `POST /api/admin/users` — `{ username, password, displayName, systemRoleId, mustChangePassword? }`
  - [ ] RBAC: `canAssignRole`
  - [ ] username unique
- [ ] `PATCH /api/admin/users/[id]` — displayName, role, status (disable)
- [ ] `POST /api/admin/users/[id]/reset-password` — `{ newPassword }` — فقط admin مجاز

### ۵.۲ UI Admin

- [ ] بخش «مدیریت کاربران» (Settings یا `/dashboard/settings?tab=users`)
- [ ] جدول کاربران · دکمه «کاربر جدید» · modal/create form
- [ ] تغییر نقش · غیرفعال‌سازی · «ریست پسورد»
- [ ] فقط برای نقش‌های با permission مناسب نمایش داده شود

### ۵.۳ تست لوکال

- [ ] login super_admin → ساخت user جدید با نقش `sales`
- [ ] login user جدید → دسترسی according to role
- [ ] admin نتواند `super_admin` بسازد (مگر super_admin)
- [ ] disable user → login fail

**✅ DoD فاز ۵:** CRUD کاربر + reset password لوکال

---

# فاز ۶ — Invite Link (دعوت یک‌بارمصرف)

**هدف:** لینک share متنی · کاربر username/password خودش را می‌گذارد.

### ۶.۱ API Invites

- [ ] `src/lib/auth/invites.ts` — create (random token, store hash), validate, consume
- [ ] `POST /api/admin/invites` — `{ systemRoleId, expiresInDays?, note? }` → `{ url, expiresAt }`
- [ ] `GET /api/admin/invites` — لیست (pending/used/expired)
- [ ] `POST /api/admin/invites/[id]/revoke`
- [ ] `GET /api/invite/[token]` — public · اعتبار لینک + role preview
- [ ] `POST /api/invite/[token]` — `{ username, password, displayName }` → create user + invalidate invite

### ۶.۲ UI Invite

- [ ] Admin: «ساخت لینک دعوت» · copy URL · نمایش expiry
- [ ] `app/invite/[token]/page.tsx` — فرم ثبت‌نام · خطاهای فارسی (expired/used/invalid)

### ۶.۳ تست لوکال

- [ ] ساخت invite → URL با `NEXT_PUBLIC_APP_URL`
- [ ] باز کردن در incognito → ثبت‌نام → login
- [ ] استفاده مجدد از لینک → خطا
- [ ] invite منقضی → خطا

**✅ DoD فاز ۶:** invite end-to-end لوکال

---

# فاز ۷ — یکپارچه‌سازی UI

**هدف:** جایگزینی mock user · polish.

- [ ] `Header.tsx` — displayName + systemRole.nameFa از AuthContext
- [ ] `Sidebar.tsx` — خروج → `logout()`
- [ ] `BusinessListPage.tsx` — سلام با نام واقعی
- [ ] حذف/جایگزینی `NEXA_DEMO_USER_NAME` hardcode در auth-related views
- [ ] `BusinessGate` — در صورت نیاز check auth

**✅ DoD فاز ۷:** هیچ نام mock ثابت در header نماند

---

# فاز ۸ — QA لوکال (قبل از push)

**هدف:** هیچ push بدون این چک‌لیست.

### ۸.۱ Build & Lint

- [ ] `npm run build` — سبز
- [ ] `npm run lint` — بدون error جدید (یا documented)

### ۸.۲ سناریوهای پذیرش

- [ ] login `artificialxflow` / `Ronak#123Ronak` → OK
- [ ] login اشتباه → پیام خطا · بدون leak
- [ ] session expire (کوتاه کردن TTL تست) → redirect login
- [ ] super_admin: create user · reset password · create invite
- [ ] `/dashboard` protected · `/login` public
- [ ] regression Meizito/ERP: صفحات اصلی باز می‌شوند بعد login

### ۸.۳ Log review

- [ ] login/logout/admin actions در console/log قابل trace
- [ ] password/token در log نیست

**✅ DoD فاز ۸:** همه ✅ بالا · آماده commit

---

# فاز ۹ — Deploy · Coolify · Production

**هدف:** push → Coolify → DB sync → login production.

### ۹.۱ Git

- [ ] `git add .`
- [ ] `git commit -m "feat(auth): username/password, prisma, admin users, invite links"`
- [ ] `git push -u origin main`
- [ ] تأیید: `.env.production` commit **نشده**

### ۹.۲ Coolify

- [ ] env vars در Coolify: DATABASE_URL (internal), AUTH_SESSION_SECRET, NEXT_PUBLIC_APP_URL, …
- [ ] Release/Post-deploy: `npx prisma migrate deploy && npx prisma db seed`
- [ ] build موفق · container running

### ۹.۳ Production smoke

- [ ] `https?://{domain}/login` باز می‌شود
- [ ] login bootstrap production
- [ ] `/api/auth/me` → user
- [ ] ساخت یک user test از پنل admin
- [ ] (اختیاری) ALLOW bootstrap password change reminder

### ۹.۴ Rollback plan

- [ ] backup DB قبل migrate اول production
- [ ] document: اگر seed دوباره زده شد → idempotent upsert در seed

**✅ DoD v7 (کل پروژه):** login production · admin panel · invite · push-to-deploy pipeline

---

## برآورد زمان

| فاز | تخمین |
|-----|--------|
| ۰ | 0.5 روز |
| ۱ | 0.5–1 روز |
| ۲ | 0.5 روز |
| ۳ | 0.5 روز |
| ۴ | 1 روز |
| ۵ | 1–1.5 روز |
| ۶ | 1 روز |
| ۷ | 0.5 روز |
| ۸ | 0.5 روز |
| ۹ | 0.5 روز |
| **جمع** | **~۶–۷ روز** |

---

## بک‌لاگ (بعد از v7)

- [ ] `mustChangePassword` — اجبار تغییر پسورد اولین ورود (UI)
- [ ] audit log جدول جدا (`AdminAuditLog`)
- [ ] map `MeizitoContext.mockUsers` → `User.id`
- [ ] HTTPS + دامنه نهایی · `Secure` cookie
- [ ] rate limit روی `/api/auth/login`
- [ ] Sentry برای خطاهای production
- [ ] حذف کامل vars SMS/OTP از Coolify env

---

## یادداشت Coolify / لاگ

Cursor به‌صورت خودکار log Coolify نمی‌گیرد. بعد deploy:
1. log runtime Coolify را در صورت خطا paste کنید
2. یا Sentry MCP برای خطاهای production

---

**آخرین بروز:** ۱۴۰۵/۰۳/۱۹ · **وضعیت کلی v7:** فاز ۰–۸ ✅ · فاز ۹ (push/Coolify) ⬜
