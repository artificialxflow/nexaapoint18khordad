# NexaApp — TODO v4 (کسب‌وکار چندگانه + تکمیل فرانت میز کار)

**تاریخ:** ۱۴۰۵/۰۳/۰۱  
**مرجع:** حسابفا (لیست کسب‌وکار + راه‌اندازی جدید) · بازخورد موبایل · [`todo-v3.md`](todo-v3.md)  
**پایه:** [`todo-v2.md`](todo-v2.md) · [`updates/07 گزارش سازی/01 تعیین لیست کسب و کار یا راه اندازی کحسب و کار جدید در اول پروژه.jpg`](updates/07%20گزارش%20سازی/01%20تعین%20لیست%20کسب%20وکار%20یا%20راه%20اندازی%20کحسب%20وکار%20جدید%20در%20اول%20پروژه.jpg)

## قرارداد اسکوپ

| داخل v4 | خارج از v4 |
|---------|------------|
| UI، TypeScript، Context، `localStorage` | SMS، OTP، auth واقعی، API، DB |
| چند **کسب‌وکار** (tenant) با انتخاب قبل/هنگام ورود | جداسازی کامل داده همه ماژول‌ها per business (فاز E اختیاری) |
| گفتگو زیر میز کار (موبایل بدون تب تکراری) | WebSocket / realtime |
| بازدید حضوری غنی (شوروم / CRM) | |
| زبان UI: **فقط فارسی** | انتخاب زبان کسب‌وکار (ثابت فارسی) |

**تفکیم مفاهیم**

| نام در UI | نقش | فایل/مدل فعلی |
|-----------|-----|----------------|
| **کسب‌وکار** | مرز کل اپ — مثل حسابفا | ❌ ندارد → `NexaBusiness` جدید |
| **پروژه (تنظیمات)** | زیرمجموعه حسابداری داخل یک کسب‌وکار | `SettingsProject` در [`SettingsContext`](src/context/SettingsContext.tsx) |
| **پروژه (میز کار)** | تیم / کانبان Meizito | `MeizitoProject` — جدا بماند |

**کلید storage پیشنهادی:** `nexa-businesses-v1` · `nexa-active-business-id`

---

## وضعیت فعلی (قبل از v4)

| قابلیت | وضعیت |
|--------|--------|
| میز کار در سایدبار (`/dashboard/tasks`) | ✅ |
| گفتگو زیرتب داشبورد + تب جدا «گفتگو» | ⚠️ روی موبایل تکراری |
| گزارش روز + فیدبک mock | ✅ v3 |
| بازدید حضوری ساده (مشتری، مدت، نتیجه، یادداشت) | ✅ v3 — غنی نیست |
| چند کسب‌وکار + صفحه انتخاب/ساخت | ❌ |
| `SettingsProject` در تنظیمات | ✅ — بدون `businessId` |

---

## فاز ۰ — انواع داده و Context کسب‌وکار

**فایل‌های هدف:** [`src/types/business.ts`](src/types/business.ts) (جدید) · [`src/context/BusinessContext.tsx`](src/context/BusinessContext.tsx) (جدید)

### ۰.۱ مدل `NexaBusiness`

- [x] `id`, `name` (نام کسب‌وکار)
- [x] `role`: `owner` | `member` | `admin` (نمایش: مالک، عضو، …)
- [x] `plan`: `trial` | `active` (نمایش: آزمایشی، فعال) — mock
- [x] `expiresAt?` (ISO یا شمسی نمایشی)
- [x] `creditLabel?` (مثلاً «نامحدود») — mock
- [x] `createdAt`, `isArchived?`
- [x] ثابت‌های برچسب فارسی (`NEXA_BUSINESS_*_LABELS`)

### ۰.۲ Context

- [x] `businesses`, `activeBusinessId`, `activeBusiness`
- [x] `setActiveBusinessId(id)`
- [x] `addBusiness`, `updateBusiness`, `removeBusiness` (با تأیید حذف)
- [x] `getDefaultBusiness()` — اولین یا آخرین انتخاب‌شده
- [x] persist در `localStorage`
- [x] seed: حداقل ۱ کسب‌وکار دمو («شرکت دمو»)

### ۰.۳ ادغام در layout

- [x] `BusinessProvider` در [`app/layout.tsx`](app/layout.tsx) یا [`DashboardShell`](src/layouts/DashboardShell.tsx) (بالای Catalog/Settings)

### ۰.۴ (اختیاری) `businessId` روی Settings

- [x] فیلد `businessId` روی `SettingsProject` برای فاز بعد
- [x] فیلتر لیست پروژه‌های تنظیمات بر اساس کسب‌وکار فعال

---

## فاز ۱ — صفحات UI کسب‌وکار (الهام حسابفا)

**مسیرها:** `app/businesses/page.tsx` · `app/businesses/new/page.tsx`  
**ویوها:** `src/views/businesses/BusinessListPage.tsx` · `src/views/businesses/BusinessSetupPage.tsx` (پیشنهادی)

### ۱.۱ لیست کسب‌وکارها (`/businesses`)

- [x] هدر: «سلام، {نام کاربر}» + «لیست کسب‌وکارهای شما»
- [x] دکمه accent: «راه‌اندازی کسب‌وکار جدید» → `/businesses/new`
- [x] کارت افقی هر کسب‌وکار (`nexa-card`):
  - [x] راست: آیکن/placeholder + نام
  - [x] وسط: چیپ‌ها — سطح دسترسی، اشتراک، تاریخ انقضا، اعتبار (mock)
  - [x] چپ: دکمه **ورود** (primary) → set active + `/dashboard/dashboard`
  - [x] حذف با تأیید (اختیاری: غیرفعال برای دمو)
- [x] حالت خالی: CTA راه‌اندازی اولین کسب‌وکار
- [x] RTL + responsive موبایل/دسکتاپ

### ۱.۲ راه‌اندازی جدید (`/businesses/new`)

- [x] عنوان: «راه‌اندازی کسب‌وکار جدید»
- [x] فیلد: **نام کسب‌وکار** (required)
- [x] زبان: **فارسی ثابت** — متن توضیحی بدون dropdown (مطابق خواسته)
- [x] دکمه‌ها: «بعدی» (ثبت + ورود) · «انصراف» → لیست
- [ ] (اختیاری) بلوک راهنما + placeholder ویدئو آموزشی — بدون embed اجباری

### ۱.۳ لندینگ

- [x] [`LandingPage`](src/views/LandingPage.tsx): دکمه «ورود به پنل» → `/businesses` به‌جای مستقیم `/dashboard`

---

## فاز ۲ — گیت ورود و سوئیچر

### ۲.۱ گیت مسیر

- [x] اگر `activeBusinessId` نبود → redirect به `/businesses`
- [x] guard در [`DashboardShell`](src/layouts/DashboardShell.tsx) یا `app/dashboard/layout.tsx` (client)
- [x] استثنا: `/businesses`, `/businesses/new`, `/`, `/shop`, `/blog`, `/mobile`

### ۲.۲ Header

- [x] نمایش نام کسب‌وکار فعال + dropdown تعویض
- [x] لینک «مدیریت کسب‌وکارها» → `/businesses`
- [x] فایل: [`src/components/Header.tsx`](src/components/Header.tsx)

### ۲.۳ تنظیمات

- [x] در تب پروژه‌ها: توضیح «پروژه‌های حسابداری داخل کسب‌وکار: {نام}»
- [ ] تب کسب‌وکار و سال مالی: پیش‌فرض per `activeBusiness` (فاز بعدی migrate از `BusinessProfile` تکی)

---

## فاز ۳ — گفتگو زیر میز کار (موبایل + وضوح منو)

**هدف:** گفتگو **زیر** میز کار؛ میز کار در **منوی اصلی** سایدبار؛ بدون حس «دو جا برای چت».

**فایل:** [`MeizitoWorkspace.tsx`](src/views/meizito/MeizitoWorkspace.tsx) · [`DashboardPanel.tsx`](src/views/meizito/panels/DashboardPanel.tsx) · [`meizito.ts`](src/types/meizito.ts)

### ۳.۱ موبایل

- [x] حذف تب `chat` از نوار افقی میز کار (فقط `md:hidden` نوار موبایل)
- [x] گفتگو **فقط** از داشبورد → زیرتب «گفتگو»
- [x] CTA در خلاصه: «برو به گفتگو» → `setDashTab('chat')` (نه `onGoTab('chat')`)

### ۳.۲ دسکتاپ (تصمیم — یکی را تیک بزنید)

- [x] **گزینه A:** نگه‌داشتن تب «گفتگو» در نوار + embed داشبورد (وضع فعلی)
- [ ] **گزینه B:** حذف تب گفتگو از نوار؛ فقط embed داشبورد + redirect `?tab=chat` → dashboard

### ۳.۳ polish چت (در صورت نیاز)

- [x] بررسی فاصله حباب و جداکننده روز در موبایل
- [x] حالت خالی thread واضح‌تر
- [x] [`Chat.tsx`](src/views/Chat.tsx): redirect به `?tab=dashboard` + باز کردن زیرتب گفتگو (اگر B)

**برآورد فاز:** کوچک (۰.۵–۱ روز)

---

## فاز ۴ — بازدید حضوری غنی (شوروم)

**مرجع:** توضیح کارفرما (+ اسکرین در صورت ارسال مجدد)

**فایل‌ها:** [`src/types/meizito.ts`](src/types/meizito.ts) · [`MeizitoContext.tsx`](src/context/MeizitoContext.tsx) · [`FieldVisitModal.tsx`](src/views/meizito/components/FieldVisitModal.tsx) · [`DashboardPanel.tsx`](src/views/meizito/panels/DashboardPanel.tsx) · [`ReportsPanel.tsx`](src/views/meizito/panels/ReportsPanel.tsx)

### ۴.۱ گسترش مدل `MeizitoFieldVisit`

- [x] `timeFrom` / `timeTo` (ساعت ورود و خروج)
- [x] `visitorCount` یا `companions` (تعداد مهمان / نام‌ها)
- [x] `visitedBy` (بازدیدکننده از تیم — یکپارچه با `designerName`)
- [x] `likedItems` — چه چیزهایی خوششان آمده
- [x] `customerPriorities` — برایشان مهم است
- [x] `purchaseProbability`: `low` | `medium` | `high` | `unknown` (+ برچسب فارسی)
- [x] `interests` (tags یا متن آزاد)
- [x] `notes` (موجود)
- [x] `personId` / `customerName` (موجود)
- [x] normalize در load + seed نمونه

### ۴.۲ فرم ثبت

- [x] بخش‌بندی: **زمان** · **افراد** · **علاقه و نیاز** · **احتمال خرید** · **یادداشت**
- [x] `PersonCombobox` برای مشتری
- [x] select/slider احتمال خرید
- [x] چیپ‌های علاقه (اختیاری)
- [x] موبایل: مودال scroll یا صفحه تمام‌عرض

### ۴.۳ نمایش

- [x] داشبورد: کارت/لیست با ساعت، احتمال، علاقه خلاصه
- [x] تب گزارش → بخش بازدید: جدول یا کارت گسترده
- [x] (اختیاری) ویجت «بازدیدهای امروز» با تعداد نفر
- [x] export CSV با ستون‌های جدید

### ۴.۴ CRM (اختیاری، اولویت پایین)

- [ ] لینک از [`CRM.tsx`](src/views/CRM.tsx) تب بازدید → میز کار
- [ ] هم‌خوان‌سازی mock با همان storage (یا لینک ساده)

**برآورد فاز:** متوسط (۲–۳ روز)

---

## فاز ۵ — یکپارچگی و QA

- [x] `npm run build` بدون خطا
- [x] جریان: لندینگ → لیست کسب‌وکار → ورود → میز کار → ثبت بازدید → گفتگو از داشبورد
- [x] موبایل ۳۲۰–۴۳۰px: لیست کسب‌وکار، فرم جدید، داشبورد بدون تب چت در نوار
- [x] RTL همه صفحات جدید
- [x] تعویض کسب‌وکار از Header
- [x] refresh → persistence
- [x] regression v3: گزارش روز، نامه، آمار میز کار
- [x] به‌روز [`updates/10/00-README.md`](updates/10/00-README.md) — یک خط فاز v4

---

## معیار اتمام v4

- [x] کاربر می‌تواند چند کسب‌وکار تعریف کند و با «ورود» یکی را فعال کند
- [x] بدون کسب‌وکار فعال به داشبورد نمی‌رود
- [x] روی موبایل گفتگو فقط از داخل داشبورد میز کار در دسترس است
- [x] بازدید حضوری فیلدهای شوروم (زمان، چند نفر، علاقه، احتمال خرید، …) ثبت و مشاهده می‌شود
- [x] قابلیت‌های v3 بدون regression

---

## برآورد حجم کار (فرانت)

| فاز | موضوع | برآورد نسبی | روز تقریبی |
|-----|--------|-------------|------------|
| ۰ | Types + BusinessContext | پایه | ۰.۵ |
| ۱ | صفحات لیست + راه‌اندازی | بزرگ | ۱.۵–۲ |
| ۲ | گیت + Header سوئیچر | متوسط | ۰.۵–۱ |
| ۳ | گفتگو زیر میز کار (موبایل) | کوچک | ۰.۵–۱ |
| ۴ | بازدید حضوری غنی | متوسط | ۲–۳ |
| ۵ | QA | کوچک | ۰.۵ |

**جمع:** حدود **۶–۸ روز** فرانت متوالی.

---

## ترتیب پیشنهادی اجرا

### مسیر اصلی (منطقی محصول)

```
فاز ۰ → فاز ۱ → فاز ۲ → فاز ۳ → فاز ۴ → فاز ۵
```

| مرحله | خروجی قابل تست |
|--------|----------------|
| بعد از ۰+۱+۲ | انتخاب/ساخت کسب‌وکار و ورود به داشبورد |
| بعد از ۳ | گفتگو فقط از داشبورد روی موبایل |
| بعد از ۴ | فرم بازدید شوروم کامل |
| بعد از ۵ | تحویل v4 |

### مسیر جایگزین (اول موبایل + بازدید)

```
فاز ۳ → فاز ۴ → فاز ۰ → فاز ۱ → فاز ۲ → فاز ۵
```

---

## وابستگی با todo-v3

| v3 (انجام‌شده) | v4 |
|----------------|-----|
| گزارش روز، فیدبک، نامه، داشبورد | بدون حذف؛ اختیاری `businessId` بعداً |
| `MeizitoFieldVisit` ساده | فاز ۴ گسترش می‌دهد |
| تب گفتگو + embed داشبورد | فاز ۳ موبایل را یکپارچه می‌کند |
| نوار تب دسکتاپ همه تب‌ها | بدون تغییر در v4 (مگر فاز ۳ موبایل) |

---

## یادداشت برای Agent

- از [`todo-v2.md`](todo-v2.md) بخش ۹ (بک‌اند) استفاده نکنید.
- نام UI برای tenant: **کسب‌وکار** (نه پروژه).
- زبان: **فارسی ثابت** — بدون i18n در این فاز.
- Meizito «پروژه» ≠ کسب‌وکار tenant.
