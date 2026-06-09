# NexaApp — TODO v8 (کاربران و دسترسی · کامل · بدون mock)

**تاریخ:** ۱۴۰۵/۰۳/۱۹  
**پایه انجام‌شده:** [`todo-v7.md`](todo-v7.md) — auth، session، User/Role/Invite در PostgreSQL، API admin، `provision`  
**هدف v8:** یک تب **«کاربران و دسترسی»** — UI اصلی طراحی‌شده (`AccessControlSection`) + داده واقعی DB — **بدون mock، بدون تب دوم، بدون `window.prompt`**

> **قانون طلایی v8:** هر فاز → لوکال (`dev` + `test:auth` + تست دستی UI) → `build` → سپس push → `migrate deploy` روی Coolify.  
> **قانون UI:** هیچ `window.prompt` / `window.confirm` / `alert` — فقط modal/sheet حرفه‌ای با motion، validation، loading state.

---

## وضعیت فعلی (قبل از v8)

| بخش | فایل | مشکل |
|-----|------|------|
| UI اصلی (شیک) | `AccessControlSection.tsx` | mock: `initialUsers`, `initialRoles`, `availablePermissions` |
| UI موازی (ساده) | `UsersAdminSection.tsx` + تب «مدیریت کاربران (DB)» | duplicate · «لینk» غلط · `window.prompt` ریست رمز |
| سطح / محدودیت / بانک | `SettingsContext` localStorage | global mock، نه per-user |
| Backend auth | `app/api/admin/*`, `provision` | ✅ آماده — wiring UI ناقص |
| نقش‌ها | `SystemRole.permissions` JSON | seed پایه — catalog ERP گسترده نشده |

---

## قرارداد اسکوپ v8

| داخل v8 | خارج از v8 |
|---------|------------|
| ادغام UI در `AccessControlSection` | SSO / Keycloak |
| حذف mock کاربران/نقش‌ها | OTP / SMS |
| Modalهای admin حرفه‌ای | ایمیل خودکار reset |
| Permissions catalog + ویرایش نقش | نقش custom ساخت توسط کاربر (فاز بعدی) |
| محدودیت per-user در DB | rate limit / Sentry (بک‌لاگ) |
| دسترسی بانک per-user (از لیست واقعی) | map کامل Meizito mock users |
| `mustChangePassword` UI | |

---

## استاندارد Modal (اجباری در v8)

- [ ] `src/components/admin/AdminModal.tsx` — backdrop، close، title، footer actions
- [ ] `ConfirmDialog.tsx` — تأیید غیرفعال‌سازی / revoke / حذف
- [ ] `ResetPasswordModal.tsx` — رمز + تأیید + show/hide + validation
- [ ] `UserFormModal.tsx` — wizard افزودن کاربر (provision)
- [ ] `CredentialsRevealModal.tsx` — نمایش یک‌بار username/password + کپی
- [ ] `InviteLinkModal.tsx` — URL + expiry + کپی
- [ ] `EditUserModal.tsx` — displayName + نقش + mustChangePassword
- [ ] `RolePermissionsModal.tsx` — checkbox grid دسترسی‌ها
- [ ] Toast inline → `AdminToast` مشترک

**ممنوع:** `window.prompt`, `window.confirm`, `alert`

---

## Prisma — مدل‌های جدید (پیشنهادی)

```
PermissionCatalog   id, key (unique), labelFa, module, sortOrder, isSystem
UserRestriction     id, userId, ownSalesOnly, ownPurchaseOnly, timeWindowEnabled,
                    allowedFrom?, allowedTo?, updatedAt
UserBankAccess      id, userId, bankAccountId, allowed, updatedAt
AdminAuditLog       id, actorId, action, targetType, targetId, meta (Json), createdAt
```

**تغییرات موجود:**
- `User` — بدون تغییر اساسی (فیلدها کافی)
- `SystemRole.permissions` — گسترش seed با کلیدهای ERP
- `InviteToken` — ✅ از v7 (displayName, credentialMode, …)

**Seed:**
- [ ] `PermissionCatalog` — فروش، مالی، انبار، سیستم، گزارشات
- [ ] map `availablePermissions` mock → کلیدهای واقعی
- [ ] بانک‌ها: از جدول حساب/بانک ERP یا `BankAccount` seed (اگر ماژول مالی mock است → seed minimal در DB)

---

## ساختار فایل‌های هدف

```
src/components/admin/
  AdminModal.tsx
  ConfirmDialog.tsx
  ResetPasswordModal.tsx
  UserFormModal.tsx
  CredentialsRevealModal.tsx
  InviteLinkModal.tsx
  EditUserModal.tsx
  RolePermissionsModal.tsx
  AdminToast.tsx

src/views/settings/
  AccessControlSection.tsx          ← refactor: فقط DB + modals
  access/
    UsersTab.tsx
    RolesTab.tsx
    AccessLevelTab.tsx
    RestrictionsTab.tsx
    BankAccessTab.tsx

src/lib/auth/
  permissions-catalog.ts            ← ثابت + sync با seed

app/api/admin/
  roles/route.ts                    ← GET list
  roles/[id]/route.ts               ← PATCH permissions
  users/[id]/restrictions/route.ts
  users/[id]/bank-access/route.ts
  audit/route.ts                    ← GET (اختیاری فاز ۹)

scripts/auth-smoke.ts               ← گسترش
```

**حذف پس از ادغام:**
- [ ] `src/views/admin/UsersAdminSection.tsx`
- [ ] تب `users` از `Settings.tsx`
- [ ] mock arrays در `AccessControlSection`

---

## API — چک‌لیست backend

| Route | وضعیت v7 | v8 |
|-------|----------|-----|
| `GET/POST /api/admin/users` | ✅ | wiring UI |
| `PATCH /api/admin/users/[id]` | ✅ | modal ویرایش |
| `POST .../reset-password` | ✅ | modal |
| `POST /api/admin/users/provision` | ✅ | wizard modal |
| `GET/POST /api/admin/invites` | ✅ | لیست + revoke UI |
| `POST .../invites/[id]/revoke` | ✅ | confirm modal |
| `GET /api/admin/roles` | ✅ | ✅ |
| `PATCH /api/admin/roles/[id]` | ✅ | ✅ |
| `GET/PATCH .../users/[id]/restrictions` | ✅ | ✅ |
| `GET/PATCH .../users/[id]/bank-access` | ✅ | ✅ |
| `GET /api/admin/audit` | ✅ | ✅ |

---

## وضعیت اجرا v8

| فاز | عنوان | وضعیت |
|-----|--------|--------|
| ۰ | پاکسازی · ادغام منو · typo لینک | ✅ |
| ۱ | کامپوننت‌های modal مشترک | ✅ |
| ۲ | زیرتب کاربران — DB + جدول + actions | ✅ |
| ۳ | wizard افزودن کاربر (provision) | ✅ |
| ۴ | زیرتب نقش‌ها + API roles | ✅ |
| ۵ | دعوت‌ها — لیست · revoke · modal لینک | ✅ |
| ۶ | زیرتب سطح دسترسی (per-user preset) | ✅ |
| ۷ | زیرتب محدودیت‌ها (DB) | ✅ |
| ۸ | زیرتب دسترسی بانک (DB) | ✅ |
| ۹ | mustChangePassword + audit log | ✅ |
| ۱۰ | حذف mock از SettingsContext | ✅ |
| ۱۱ | QA · smoke · build · deploy | 🟡 (build+smoke ✅ · Coolify token + redeploy) |

---

# فاز ۰ — پاکسازی و ادغام منو

**هدف:** یک منو، یک منبع حقیقت.

### ۰.۱ حذف duplicate
- [ ] حذف تب «مدیریت کاربران (DB)» از `Settings.tsx`
- [ ] redirect `?tab=users` → `?tab=access`
- [ ] حذف import/usage `UsersAdminSection`
- [ ] انتقال logic مفید `UsersAdminSection` → ماژول‌های `access/*`

### ۰.۲ اصلاح متن
- [ ] «لینk» → «لینک» (همه فایل‌ها — grep `لینk`)

### ۰.۳ Baseline
- [ ] `npm run test:auth` سبز قبل refactor

**✅ DoD:** فقط «کاربران و دسترسی» در تنظیمات · smoke سبز

---

# فاز ۱ — Modal infrastructure

**هدف:** زیرساخت UI حرفه‌ای.

- [ ] `AdminModal` — props: open, onClose, title, children, footer
- [ ] focus trap + Esc بستن
- [ ] `ConfirmDialog` — variant danger/warning
- [ ] `AdminToast` — success/error · auto-dismiss 5s
- [ ] تست دستی: باز/بسته هر modal

**✅ DoD:** هیچ prompt/alert در کد admin نماند (grep خالی)

---

# فاز ۲ — زیرتب «کاربران و نقش‌ها» → لیست کاربران (DB)

**هدف:** جدول `AccessControlSection` با API واقعی.

### ۲.۱ Data layer
- [ ] `UsersTab.tsx` — `GET /api/admin/users` · loading/refresh بدون unmount کل صفحه
- [ ] map: `displayName`, `username`, `systemRole.nameFa`, `lastLoginAt`, `status`
- [ ] جستجو client-side روی name/username
- [ ] فیلتر active/disabled/all

### ۲.۲ Actions menu (⋯)
- [ ] ویرایش → `EditUserModal`
- [ ] ریست رمز → `ResetPasswordModal` → `POST reset-password`
- [ ] تغییر وضعیت → `ConfirmDialog` → `PATCH status`
- [ ] (اختیاری) مشاهده دعوت‌های مرتبط

### ۲.۳ RBAC UI
- [ ] دکمه «افزودن کاربر» فقط با `users:write`
- [ ] actions روی user بالاتر از actor مخفی

**✅ DoD:** لیست = DB · mock users حذف · lastLogin واقعی

---

# فاز ۳ — Modal افزودن کاربر (wizard)

**هدف:** جایگزین فرم ساده + `provision` API.

### ۳.۱ مراحل wizard
1. [ ] نام نمایشی
2. [ ] نقش (از `assignableRoles`)
3. [ ] نحوه credential: دستی | خودکار | خود کاربر (فقط invite)
4. [ ] تحویل: فوری | لینک دعوت
5. [ ] فیلدهای username/password (اگر دستی)

### ۳.۲ نتیجه
- [ ] direct → `CredentialsRevealModal` (اگر auto) + refresh لیست
- [ ] invite → `InviteLinkModal` + refresh دعوت‌ها

### ۳.۳ API
- [ ] `POST /api/admin/users/provision` — همه ترکیب‌ها
- [ ] validation فارسی در modal

**✅ DoD:** end-to-end ساخت user + invite از modal اصلی

---

# فاز ۴ — زیرتب «تعریف نقش‌ها»

**هدف:** نقش‌های `SystemRole` — نه mock.

### ۴.۱ Backend
- [ ] `GET /api/admin/roles` — roles + userCount + permissions
- [ ] `PATCH /api/admin/roles/[id]` — فقط permissions (super_admin)
- [ ] `isSystem` roles: slug/nameFa ثابت

### ۴.۲ Permission catalog
- [ ] `permissions-catalog.ts` + seed `PermissionCatalog`
- [ ] گروه‌بندی: فروش · مالی · انبار · سیستم · گزارشات
- [ ] map seed roles (`sales`, `finance_manager`, …) به catalog

### ۴.۳ UI
- [ ] کارت نقش‌ها از API
- [ ] `RolePermissionsModal` — checkbox grid
- [ ] حذف `initialRoles`, `availablePermissions`, `handleAddRole` mock
- [ ] «نقش جدید» → فاز بعدی یا disabled با tooltip «به‌زودی»

**✅ DoD:** ویرایش permissions نقش `sales` → login user با همان نقش → رفتار جدید

---

# فاز ۵ — مدیریت دعوت‌ها

**هدف:** دعوت‌ها visible و قابل مدیریت.

- [ ] بخش «دعوت‌های اخیر» داخل `UsersTab` یا تب جدا
- [ ] ستون‌ها: نام · نقش · mode · status · expiry
- [ ] revoke → `ConfirmDialog` → `POST .../revoke`
- [ ] کپی لینک مجدد — فقط برای pending (token raw ذخیره نمی‌شود → revoke + ساخت جدید)

**✅ DoD:** invite lifecycle کامل در UI

---

# فاز ۶ — زیرتب «سطح دسترسی»

**هدف:** preset per-user در DB (نه localStorage global).

### ۶.۱ مدل
- [ ] فیلد `User.accessLevelPreset` enum یا link به `UserRestriction`
- [ ] migration

### ۶.۲ UI
- [ ] انتخاب کاربر (dropdown/search)
- [ ] ۴ preset: full · sales-only · finance-only · custom
- [ ] custom → لینک به ویرایش permissions نقش یا overrides

### ۶.۳ Backend
- [ ] `PATCH /api/admin/users/[id]` گسترش یا route جدا
- [ ] preset → set permissions template روی user (یا نقش موقت)

### ۶.۴ حذف mock
- [ ] `accessLevelPreset` از `SettingsContext` (فقط این فیلد — بقیه settings دست نخورَد)

**✅ DoD:** تغییر preset برای user X → session بعدی رفتار متفاوت

---

# فاز ۷ — زیرتب «محدودیت‌ها»

**هدف:** محدودیت per-user (ماژول ۱۰).

### ۷.۱ DB + API
- [ ] `UserRestriction` model + migration
- [ ] `GET/PATCH /api/admin/users/[id]/restrictions`

### ۷.۲ UI
- [ ] انتخاب کاربر
- [ ] toggle: فقط فاکتور فروش خود · فقط خرید خود · بازه زمانی
- [ ] time window: from/to time pickers

### ۷.۳ Enforcement (حداقل)
- [ ] helper `getUserRestrictions(userId)` برای ماژول فروش (hook — حتی stub log)

**✅ DoD:** restriction در DB ذخیره · reload حفظ شود

---

# فاز ۸ — زیرتب «دسترسی بانک»

**هدف:** دسترسی per-user به حساب/بانک (ماژول ۱۱).

### ۸.۱ منبع بانک‌ها
- [ ] تعریف `BankAccount` در Prisma (یا sync از settings مالی)
- [ ] seed بانک‌های نمونه **در DB** (نه `seedBankAccess` localStorage)

### ۸.۲ DB + API
- [ ] `UserBankAccess` model
- [ ] `GET/PATCH /api/admin/users/[id]/bank-access`

### ۸.۳ UI
- [ ] انتخاب کاربر + جدول بانک/صندوق + toggle مجاز/ممنوع

### ۸.۴ حذف mock
- [ ] `bankAccessExamples` از `SettingsContext`

**✅ DoD:** toggle بانک برای user → DB · بدون localStorage

---

# فاز ۹ — mustChangePassword + Audit

### ۹.۱ اولین ورود
- [ ] صفحه `/change-password` یا modal اجباری پس از login
- [ ] check `user.mustChangePassword` در `AuthContext` / middleware
- [ ] `PATCH` own password endpoint یا reuse reset flow

### ۹.۲ Audit log
- [ ] `AdminAuditLog` model
- [ ] log: create user · reset password · role change · invite · revoke
- [ ] UI: تب «تاریخچه» (فقط super_admin) — اختیاری

**✅ DoD:** user با mustChangePassword → redirect change password

---

# فاز ۱۰ — حذف کامل mock access

- [ ] grep `initialUsers` · `initialRoles` · `availablePermissions` — صفر
- [ ] `AccessControlSection` فقط compose زیرتب‌ها
- [ ] `Settings.tsx` — section `users` حذف
- [ ] `/dashboard/users` legacy → `settings?tab=access`

**✅ DoD:** zero mock in access module

---

# فاز ۱۱ — QA · Deploy

### ۱۱.۱ Automated
- [x] گسترش `scripts/auth-smoke.ts`: provision · invite · role read
- [x] `npm run test:auth` — 100% pass (9/9 · ۱۴۰۵/۰۳/۱۹)
- [x] `npm run build` — سبز (layout split + حذف NODE_ENV از .env.local)
- [x] `nixpacks.toml` — devDeps در build · migrate در start
- [x] `npm run logs:coolify` / `logs:coolify:watch` — fetch لاگ Coolify

### ۱۱.۲ Manual acceptance
- [ ] super_admin: CRUD user · role permissions · invite · restrictions · bank
- [ ] admin: نتواند super_admin بسازد
- [ ] sales user: تب access مخفی یا read-only
- [ ] همه modalها: mobile · RTL · keyboard

### ۱۱.۳ Production
- [x] push (دستی توسط شما)
- [x] `migrate deploy` + `db seed` روی DB (از لوکال · ۱۴۰۵/۰۳/۱۹)
- [ ] Coolify redeploy + smoke login + یک user test

**✅ DoD v8:** یک منو · DB-only · modal حرفه‌ای · mock access صفر

---

## برآورد زمان

| فاز | تخمین |
|-----|--------|
| ۰ | 0.5 روز |
| ۱ | 0.5–1 روز |
| ۲ | 1 روز |
| ۳ | 1 روز |
| ۴ | 1.5–2 روز |
| ۵ | 0.5 روز |
| ۶ | 1 روز |
| ۷ | 1–1.5 روز |
| ۸ | 1–1.5 روز |
| ۹ | 1 روز |
| ۱۰ | 0.5 روز |
| ۱۱ | 0.5–1 روز |
| **جمع** | **~۹–۱۱ روز** |

---

## بک‌لاگ (بعد از v8)

- [ ] ساخت نقش custom (CRUD SystemRole)
- [ ] map Meizito mock → `User.id`
- [ ] enforcement محدودیت در همه ماژول‌های ERP
- [ ] rate limit login · Sentry
- [ ] HTTPS + Secure cookie

---

## یادداشت اجرا

- **Multi-task لازم نیست** — یک Agent sequential فاز ۰→۱۱
- **اول فاز ۰–۳** = بیشترین ارزش UX (ادغام + modal + users)
- **فاز ۶–۸** = تکمیل «همه زیرتب‌ها» طبق طراحی ماژول ۰۸

**آخرین بروز:** ۱۴۰۵/۰۳/۱۹ · **وضعیت:** فاز ۰–۱۰ ✅ · فاز ۱۱ 🟡 (migrate+seed+smoke ✅ · Coolify redeploy دستی)

> **پس از pull:** `npx prisma migrate deploy && npx prisma db seed` سپس `npm run test:auth`
