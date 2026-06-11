# NexaApp — TODO v9 (کسب‌وکار · tenant · PostgreSQL · بدون mock)

**تاریخ:** ۱۴۰۵/۰۳/۱۹  
**پایه انجام‌شده:** [`todo-v8.md`](todo-v8.md) — auth، session، User/Role در PostgreSQL، admin users، Nextcloud env  
**هدف v9:** ماژول **راه‌اندازی و مدیریت کسب‌وکار** — UI موجود (`/businesses`) + Settings (پروفایل، سال مالی، پروژه) — **داده واقعی DB** — حذف localStorage/mock

> **قانون طلایی v9:** هر فاز → لوکال (`dev` + smoke + تست دستی UI) → `build` → push → `migrate deploy` روی Coolify.  
> **قانون UI:** بدون `window.prompt` / `window.confirm` / `alert` — از `ConfirmDialog` و modalهای admin (v8) استفاده شود.  
> **MVP v9:** پایان **فاز ۳** = لیست + ساخت + ورود + حذف + DB.

---

## وضعیت فعلی (قبل از v9)

| بخش | فایل | مشکل |
|-----|------|------|
| لیست کسب‌وکار | `BusinessListPage.tsx` | localStorage · seed «شرکت دمو» · `alert`/`confirm` |
| راه‌اندازی | `BusinessSetupPage.tsx` | فقط نام → `addBusiness()` local |
| Context | `BusinessContext.tsx` | `seedBusinesses()` · `biz-demo` · بدون API |
| Gate | `BusinessGate.tsx` | `activeBusinessId` فقط localStorage |
| پروفایل / سال مالی | `BusinessFiscalSection.tsx` | `SettingsContext` localStorage |
| پروژه‌ها | `ProjectsSection.tsx` | seed «پروژه A/B» · `businessId: 'biz-demo'` |
| Prisma | `schema.prisma` | **مدل Business ندارد** |
| Auth | User در DB | **به Business وصل نیست** (membership) |

---

## قرارداد اسکوپ v9

| داخل v9 | خارج از v9 |
|---------|------------|
| مدل `Business` + `BusinessMember` در PostgreSQL | billing / پرداخت واقعی |
| API CRUD کسب‌وکار per-user | دعوت member به business (invite flow) |
| Wiring `/businesses` و `/businesses/new` | tenant isolation در **همه** ماژول‌های ERP |
| پروفایل حقوقی + سال مالی در DB | Nextcloud folder per business (`/Nexa/{bizId}/`) |
| پروژه‌های حسابداری در DB | super_admin دیدن همه tenants |
| حذف mock/localStorage business | multi-org enterprise SSO |

---

## Prisma — مدل‌های پیشنهادی

```
Business
  id, name, plan (trial|active), expiresAt?, creditLabel?, defaultLocale,
  status (active|archived), createdAt, updatedAt, createdById → User

BusinessMember
  id, businessId, userId, role (owner|admin|member)
  @@unique([businessId, userId])

BusinessProfile          ← فاز ۴ (1:1 با Business)
  businessId (PK), legalName, tradeName, nationalId, economicCode, regNo,
  phone, fax, address, postalCode, city, website, email

FiscalYear               ← فاز ۴
  id, businessId, label, startDate, endDate, isActive, createdAt

AccountingProject        ← فاز ۵
  id, businessId, name, isDefault, active, createdAt, updatedAt
```

**تغییرات User:**
- relation `memberships BusinessMember[]`
- relation `businessesCreated Business[]` (optional `createdById`)

**Seed:**
- [x] **بدون** business فیک در seed — فقط ساختار
- [x] کاربر bootstrap (`artificialxflow`) بدون business اجباری — user خودش می‌سازد

---

## ساختار فایل‌های هدف

```
prisma/
  schema.prisma                    ← Business, BusinessMember, …
  migrations/…_business_v9/

src/lib/business/
  access.ts                        ← requireBusinessMember, canManageBusiness
  defaults.ts                      ← trial expiry, creditLabel

app/api/businesses/
  route.ts                         ← GET list, POST create
  [id]/route.ts                    ← GET, PATCH, DELETE (archive)
  [id]/profile/route.ts            ← فاز ۴
  [id]/fiscal-years/route.ts       ← فاز ۴
  [id]/projects/route.ts           ← فاز ۵
  [id]/projects/[projectId]/route.ts

src/context/BusinessContext.tsx    ← refactor: API fetch، نه localStorage list
src/views/businesses/
  BusinessListPage.tsx             ← ConfirmDialog، API
  BusinessSetupPage.tsx            ← POST create

src/views/settings/
  BusinessFiscalSection.tsx        ← فاز ۴: API
  ProjectsSection.tsx              ← فاز ۵: API

scripts/business-smoke.ts          ← فاز ۷
```

**localStorage مجاز (فقط client preference):**
- `nexa-active-business-id` — id کسب‌وکار فعال (UUID از DB)

**حذف / deprecate:**
- [x] `NEXA_BUSINESSES_STORAGE_KEY` (`nexa-businesses-v1`)
- [x] `seedBusinesses()` و id ثابت `biz-demo`
- [x] `NEXA_DEMO_USER_NAME` (اگر unused)

---

## API — چک‌لیست backend

| Route | فاز | کار |
|-------|-----|-----|
| `GET /api/businesses` | ۲ | لیست businesses کاربر جاری (via membership) |
| `POST /api/businesses` | ۲ | ساخت — creator = owner |
| `GET /api/businesses/[id]` | ۲ | جزئیات + role کاربر |
| `PATCH /api/businesses/[id]` | ۲ | name/plan (owner/admin) |
| `DELETE /api/businesses/[id]` | ۲ | soft archive (owner) |
| `GET/PATCH .../[id]/profile` | ۴ | BusinessProfile |
| `GET/POST/PATCH .../[id]/fiscal-years` | ۴ | FiscalYear |
| `GET/POST/PATCH/DELETE .../[id]/projects` | ۵ | AccountingProject |

**RBAC business-level:**
- `owner` — CRUD business، archive، profile، projects
- `admin` — ویرایش profile/projects (نه archive business)
- `member` — read + enter dashboard

**SystemRole (global):** `super_admin` — optional bypass فاز ۶+ (بک‌لاگ)

---

## وضعیت اجرا v9

| فاز | عنوان | وضعیت |
|-----|--------|--------|
| ۰ | پاکسازی mock · قرارداد | ✅ |
| ۱ | Prisma Business + Member | ✅ |
| ۲ | API CRUD + RBAC | ✅ |
| ۳ | UI wiring لیست + راه‌اندازی | ✅ |
| ۴ | پروفایل + سال مالی | ✅ |
| ۵ | پروژه‌های حسابداری | ✅ |
| ۶ | Tenant isolation حداقلی | ✅ |
| ۷ | QA · smoke · build · deploy | 🟡 migrate ✅ · smoke/build ✅ · redeploy Coolify دستی |

---

# فاز ۰ — پاکسازی mock و آماده‌سازی

**هدف:** یک منبع حقیقت؛ UI بدون داده فیک hardcoded.

### ۰.۱ BusinessContext
- [x] حذف `seedBusinesses()` و `biz-demo`
- [x] state اولیه `businesses: []` تا API wired شود (یا loading)
- [x] نگه‌داشتن `activeBusinessId` در localStorage (فقط UUID)

### ۰.۲ UI
- [x] `BusinessListPage` — حذف `alert('کسب‌وکار دمو…')` و `window.confirm`
- [x] جایگزین حذف با `ConfirmDialog` (از v8)
- [x] empty state وقتی لیست خالی — بدون seed خودکار

### ۰.۳ SettingsContext (آماده فاز ۴–۵)
- [x] مستند: seed `p1`/`p2` و `biz-demo` — حذف در فاز ۵
- [x] grep پروژه: `biz-demo` · `NEXA_BUSINESSES_STORAGE_KEY`

### ۰.۴ Baseline
- [x] `npm run test:auth` سبز قبل از refactor
- [x] `npm run build` سبز

**✅ DoD:** grep بدون `biz-demo` در BusinessContext · بدون alert/confirm در BusinessListPage

---

# فاز ۱ — Prisma + migration

**هدف:** schema tenant در PostgreSQL.

### ۱.۱ Enumها
- [x] `BusinessPlan` — trial, active
- [x] `BusinessMemberRole` — owner, admin, member
- [x] `BusinessStatus` — active, archived

### ۱.۲ Models
- [x] `Business` — فیلدها طبق بالا · `createdById` → User
- [x] `BusinessMember` — unique `(businessId, userId)`
- [x] indexes: `BusinessMember.userId` · `Business.status`

### ۱.۳ Migration
- [x] `prisma migrate dev` (local) · `migrate deploy` (production)
- [x] seed بدون business فیک

**✅ DoD:** `prisma studio` — جداول Business/BusinessMember · auth smoke سبز

---

# فاز ۲ — API کسب‌وکار

**هدف:** CRUD با session + membership.

### ۲.۱ Lib
- [x] `src/lib/business/access.ts` — `getSessionUser`, `requireBusinessMember`, `assertOwner`
- [x] zod schemas: create/update business

### ۲.۲ Routes
- [x] `GET /api/businesses` — join membership · map به `NexaBusiness` shape
- [x] `POST /api/businesses` — create Business + BusinessMember(owner)
- [x] `GET /api/businesses/[id]` — 403 اگر member نیست
- [x] `PATCH /api/businesses/[id]` — name, plan, expiresAt, creditLabel
- [x] `DELETE /api/businesses/[id]` — `status: archived` (soft)

### ۲.۳ امنیت
- [x] 401 بدون session
- [x] 403 non-member / non-owner برای delete
- [x] owner نتواند تنها owner را حذف کند بدون archive business
- [x] (اختیاری) `writeAuditLog` برای create/archive

**✅ DoD:** curl/Postman — create → list → patch → archive

---

# فاز ۳ — Wiring UI (MVP)

**هدف:** `/businesses` و `/businesses/new` از DB.

### ۳.۱ BusinessContext refactor
- [x] `refreshBusinesses()` — `GET /api/businesses`
- [x] `addBusiness` → `POST` سپس refresh
- [x] `removeBusiness` → `DELETE` سپس refresh
- [x] `updateBusiness` → `PATCH` (اختیاری فاز ۳)
- [x] loading / error state

### ۳.۲ BusinessListPage
- [x] fetch on mount (via context)
- [x] ورود → `setActiveBusinessId(id)` → `/dashboard/dashboard`
- [x] حذف → `ConfirmDialog` → API
- [x] نام کاربر از `useAuth().user.displayName`

### ۳.۳ BusinessSetupPage
- [x] submit → POST → set active → redirect
- [x] validation نام خالی
- [x] loading روی دکمه «بعدی»

### ۳.۴ Header / BusinessGate
- [x] Header switcher — لیست از API
- [x] `BusinessGate` — اگر active id دیگر در لیست نیست → redirect `/businesses`
- [x] middleware `/businesses` — protected (session) — بررسی موجود

**✅ DoD:** login → لیست خالی → ساخت کسب‌وکار → reload → ماندگار · ورود dashboard · حذف با modal

---

# فاز ۴ — پروفایل کسب‌وکار + سال مالی

**هدف:** Settings → «کسب‌وکار و سال مالی» از DB.

### ۴.۱ Prisma
- [x] `BusinessProfile` (1:1)
- [x] `FiscalYear` — `isActive` · یک active per business

### ۴.۲ API
- [x] `GET/PATCH /api/businesses/[id]/profile`
- [x] `GET /api/businesses/[id]/fiscal-years`
- [x] `POST` — fiscal year جدید
- [x] `PATCH` — set active fiscal year

### ۴.۳ UI
- [x] `BusinessFiscalSection` — fetch/save از API (scoped به `activeBusiness`)
- [x] حذف `business`/`fiscalYear` mock از `SettingsContext` (یا read-only fallback حذف)

**✅ DoD:** ذخیره نام حقوقی + سال مالی → reload → از DB

---

# فاز ۵ — پروژه‌های حسابداری

**هدف:** Settings → «پروژه‌ها» per business.

### ۵.۱ Prisma
- [x] `AccountingProject` — `businessId`, name, isDefault, active

### ۵.۲ API
- [x] `GET/POST /api/businesses/[id]/projects`
- [x] `PATCH/DELETE .../projects/[projectId]`
- [x] rule: فقط یک `isDefault: true` per business

### ۵.۳ UI
- [x] `ProjectsSection` — CRUD از API
- [x] حذف seed `p1`, `p2` از SettingsContext

**✅ DoD:** CRUD پروژه · فیلتر per active business · بدون mock

---

# فاز ۶ — Tenant isolation (حداقلی)

**هدف:** جلوگیری از دسترسی cross-tenant.

- [x] `BusinessGate` — verify membership server-side (optional GET business before dashboard)
- [x] APIهای business — همیشه چک membership
- [x] مستند: ماژول‌های ERP هنوز global mock — tenant در v10+
- [ ] (اختیاری) header `X-Business-Id` برای APIهای آینده
- [ ] Settings picklists — `businessId` scope (بک‌لاگ جزئی)

**✅ DoD:** user A فقط businesses خودش · id جعل‌شده → 403

---

# فاز ۷ — QA · Deploy

### ۷.۱ Automated
- [x] `scripts/business-smoke.ts` — login → create → list → enter → archive
- [x] `npm run test:business` در package.json
- [ ] `npm run test:auth` + test:business — سبز
- [x] `npm run build` — سبز

### ۷.۲ Manual acceptance
- [ ] super_admin/owner: CRUD business
- [ ] member (وقتی اضافه شد): فقط enter · نه delete
- [ ] mobile · RTL · empty states
- [x] migrate deploy production
- [x] پاکسازی localStorage قدیمی (`nexa-businesses-v1`) — یک‌بار در browser یا migration script

### ۷.۳ Production
- [ ] push · Coolify redeploy · `migrate deploy`
- [ ] smoke: login → ساخت اولین business واقعی

**✅ DoD v9:** business mock صفر · CRUD DB · MVP فاز ۳+ در production

---

## برآورد زمان

| فاز | تخمین |
|-----|--------|
| ۰ | 0.5 روز |
| ۱ | 0.5–1 روز |
| ۲ | 1–1.5 روز |
| ۳ | 1–1.5 روز |
| ۴ | 1.5–2 روز |
| ۵ | 1 روز |
| ۶ | 0.5–1 روز |
| ۷ | 0.5–1 روز |
| **MVP (۰–۳)** | **~۳–۴ روز** |
| **جمع کامل** | **~۷–۹ روز** |

---

## بک‌لاگ (بعد از v9)

- [ ] دعوت user به Business (invite + accept)
- [ ] billing / اشتراک / انقضای واقعی
- [ ] tenant isolation در CRM، فروش، انبار، Meizito
- [ ] Nextcloud path per business: `/Nexa/{businessId}/`
- [ ] super_admin: لیست همه tenants
- [ ] انتقال `SettingsContext` picklists به DB per business

---

## یادداشت اجرا

- **Multi-task لازم نیست** — یک Agent sequential فاز ۰→۷
- **اول فاز ۰–۳** = بیشترین ارزش (راه‌اندازی کسب‌وکار end-to-end)
- **فاز ۴–۵** = تکمیل Settings طبق طراحی ماژول کسب‌وکار
- از modal/ConfirmDialog **v8** reuse کنید — دوباره invent نکنید
- `activeBusinessId` در localStorage OK است — **لیست businesses** باید از API باشد

**آخرین بروز:** ۱۴۰۵/۰۳/۱۹ · **وضعیت:** فاز ۰–۶ ✅ · فاز ۷ 🟡 (automated OK · redeploy دستی)

> **پس از pull:** `npx prisma migrate deploy` (بعد از فاز ۱) · `npm run test:auth` · `npm run test:business` (بعد از فاز ۷)
