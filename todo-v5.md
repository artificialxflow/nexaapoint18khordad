# NexaApp — TODO v5 (گفتگو در منو + inbox + گزارش/بازدید میز کار)

**تاریخ:** ۱۴۰۵/۰۳/۰۲ (به‌روز: ۱۴۰۵/۰۳/۰۳)  
**مرجع:** بازخورد کارفرما · [`todo-v4.md`](todo-v4.md) · [`todo-v3.md`](todo-v3.md) · [`updates/10/New Text Document.txt`](updates/10/New%20Text%20Document.txt) · mock CRM (`src/views/CRM.tsx`)

## قرارداد اسکوپ

| داخل v5 | خارج از v5 |
|---------|------------|
| UI، TypeScript، Context، `localStorage` | SMS، OTP، auth واقعی، API، DB |
| منوی اصلی + `/dashboard/chats` | WebSocket / realtime |
| inbox یکپارچه + پین | push واقعی |
| بازدید حضوری (چند مرحله —见 فاز ۳ و ۵–۷) | سرور مرکزی برای «تیپ‌ها» |
| **فهرست‌های انتخابی در تنظیمات** (تیپ) — مصرف در فرم‌ها | i18n |
| زبان UI: **فقط فارسی** | |

**تفکیم مفاهیم**

| نام در UI | محل |
|-----------|-----|
| **داشبورد** | `/dashboard/dashboard` |
| **میز کار** | `/dashboard/tasks` — گفتگو **نیست** داخل تب‌ها |
| **گفتگوها** | `/dashboard/chats` — زیر میز کار در **منو** |
| **نامه‌های میز کار** | تب «نامه‌ها» (مکاتبه تیمی — جدا از `internal-comms`) |
| **گزارش میز کار** | تب «گزارش» — گزارش روز \| بازدید \| آمار |
| **تیپ / فهرست انتخابی** | تنظیمات — برای چیپ‌ها و dropdownهای تکرارشونده |

**کلید storage**

| کلید | محتوا |
|------|--------|
| `nexa-meizito-v2` | میز کار + بازدید + چت |
| `nexa-settings-v1` (موجود) | + فهرست انتخابی (پیشنهاد: `picklists` در همان payload) |
| `nexa-active-business-id` | tenant (v4) |

---

## وضعیت اجرا

| بلوک | وضعیت |
|------|--------|
| **فاز ۰–۴** (هسته v5: گفتگو، inbox، بازدید نسخه ۱) | ✅ انجام‌شده |
| **فاز ۵–۸** (تکمیل گزارش/بازدید + تنظیمات تیپ) | ❌ پیش‌رو |

---

## وضعیت قبل از v5 (مرجع تاریخی)

| قابلیت | قبل از v5 |
|--------|-----------|
| گفتگو در تب میز کار | ✅ |
| گفتگو در منوی اصلی | ❌ |
| inbox واحد + پین | ❌ |
| بازدید شوروم پایه | v4 |

---

## وضعیت پس از هسته v5 (فاز ۰–۴) — انجام‌شده

| قابلیت | وضعیت |
|--------|--------|
| گفتگوها در منو + `/dashboard/chats` | ✅ |
| میز کار بدون تب/زیرتب گفتگو | ✅ |
| inbox «همه» + پین + مودال direct/group/channel | ✅ |
| بازدید نسخه ۱: موبایل، دیزاینر، چیپ ثابت، زمان، CSV | ✅ |
| چند میز کار (سوئیچر + میز جدید) | ✅ (`BoardsPanel`) |
| یادداشت با چک‌لیست per note | ✅ (`NotesPanel`) |
| نامه / پروژه میز کار | ✅ v3 |

---

## فاصله با خواسته جدید کارفرما (فاز ۵–۸)

| خواسته | الان | هدف فاز |
|--------|------|---------|
| جنسیت مراجع (آقا/خانم) | ❌ | ۶ |
| نام + نام‌خانوادگی + عنوان (آقای …) | فقط `customerName` یک‌تکه | ۶ |
| همراهان: تعداد آقا/خانم (بازه سنی) | `visitorCount` + متن `companions` | ۶ |
| تاریخ بازدید دستی + پیش‌فرض امروز | `date` از فیلتر صفحه، نه در فرم | ۶ |
| موضوعات مهم از **تنظیمات** نه hardcode | `MEIZITO_VISIT_PRIORITY_TAG_*` ثابت | ۵ → ۶ |
| تیپ‌ها در Settings (مثل ایده CRM) | ❌ | ۵ |
| گزارش/جدول/CSV با فیلدهای جدید | جزئی | ۷ |
| CRM ↔ همان storage بازدید | mock جدا | ۷ (اختیاری) |
| قالب چک‌لیست یادداشت از تنظیمات | چک‌لیست دستی per note | ۸ (اختیاری) |
| آمار همه میز کارها یکجا | فقط `activeBoardId` | ۸ (اختیاری) |

**تصمیم پیشنهادی همراهان:** شمارش **تعداد آقا / تعداد خانم** (`maleCompanionCount`, `femaleCompanionCount`) + مهمان اصلی با جنسیت — ساده و برای بازه سنی کافی است (بدون لیست ردیف‌به‌ردیف در MVP).

---

# بخش الف — هسته v5 (✅ انجام‌شده)

## فاز ۰ — انواع داده و Context (گفتگو + بازدید نسخه ۱)

**فایل‌ها:** [`src/types/meizito.ts`](src/types/meizito.ts) · [`src/context/MeizitoContext.tsx`](src/context/MeizitoContext.tsx)

### ۰.۱ `MeizitoChatThread`

- [x] `pinned`, `toggleThreadPin`, مرتب‌سازی لیست
- [x] `normalizeThread` + seed

### ۰.۲ inbox

- [x] `MEIZITO_CHAT_LIST_TABS` — همه | شخصی | گروه | کانال

### ۰.۳ `MeizitoFieldVisit` (نسخه ۱)

- [x] موبایل، دیزاینر، `priorityTags` ثابت، normalize، seed

### ۰.۴ تب‌های میز کار

- [x] حذف `chat` از نوار میز کار؛ redirect به `/dashboard/chats`

---

## فاز ۱ — منوی اصلی و routing گفتگو

**فایل‌ها:** [`Sidebar.tsx`](src/components/Sidebar.tsx) · [`view-map.tsx`](src/dashboard/view-map.tsx) · [`ChatsPage.tsx`](src/views/ChatsPage.tsx)

- [x] `ViewType: chats` — ترتیب: داشبورد → میز کار → گفتگوها
- [x] bottom nav موبایل
- [x] جداسازی کامل از `MeizitoWorkspace` / `DashboardPanel`
- [x] redirectهای legacy

---

## فاز ۲ — inbox یکپارچه + پین + ساخت گفتگو

**فایل‌ها:** [`MeizitoChatEmbed.tsx`](src/views/meizito/components/MeizitoChatEmbed.tsx) · [`NewChatModals.tsx`](src/views/meizito/components/NewChatModals.tsx)

- [x] تب همه + فیلتر + جستجو
- [x] پین
- [x] مودال گفتگو / گروه / کانال

---

## فاز ۳ — بازدید حضوری (نسخه ۱ — پایه شوروم)

**فایل‌ها:** [`FieldVisitModal.tsx`](src/views/meizito/components/FieldVisitModal.tsx) · [`DashboardPanel.tsx`](src/views/meizito/panels/DashboardPanel.tsx) · [`ReportsPanel.tsx`](src/views/meizito/panels/ReportsPanel.tsx)

- [x] موبایل، دیزاینر، چیپ‌های ثابت مهم، زمان ورود/خروج
- [x] نمایش داشبورد + جدول/CSV
- [x] migrate `priorityTags`

> **توسعه:** ساختار مهمان و تنظیمات تیپ در **فاز ۵–۷** زیر.

---

## فاز ۴ — QA هسته v5

- [x] `npm run build`
- [x] regression v3/v4
- [x] [`updates/10/00-README.md`](updates/10/00-README.md) — خط v5

---

# بخش ب — تکمیل گزارش و بازدید (✅ انجام شد)

## فاز ۵ — تنظیمات «تیپ / فهرست انتخابی»

**هدف:** هرجا کاربر چند گزینه انتخاب می‌کند (بازدید، بعداً فرم‌های دیگر)، گزینه‌ها از **تنظیمات** بیاید — الهام بخش تیپ در CRM/طراحی کارفرما.

**فایل‌های هدف:** [`src/types/settings.ts`](src/types/settings.ts) · [`src/context/SettingsContext.tsx`](src/context/SettingsContext.tsx) · `src/views/settings/PicklistsSection.tsx` (جدید) · [`Settings.tsx`](src/views/Settings.tsx)

### ۵.۱ مدل

- [x] `SettingsPicklistKind`: حداقل `visit-priorities` (بعداً: `visit-acquaintance`, …)
- [x] `SettingsPicklistItem`: `id`, `label`, `active`, `order`
- [x] `SettingsPicklist`: `kind`, `items[]`
- [x] persist در `nexa-settings-v1` (یا کلید `nexa-settings-picklists-v1`)
- [x] seed: همان برچسب‌های فعلی (تخفیف، قیمت، زمان تحویل، گارانتی، …)

### ۵.۲ UI تنظیمات

- [x] تب جدید در Settings: **فهرست‌های انتخابی** (یا زیر «سیستم»)
- [x] ویرایش لیست «موضوعات مهم بازدید»: افزودن / حذف / غیرفعال / مرتب (ساده: بالا-پایین)
- [x] توضیح: «در فرم بازدید و گزارش میز کار استفاده می‌شود»
- [ ] (اختیاری) per `activeBusiness` — فیلتر بر اساس کسب‌وکار فعال

### ۵.۳ API Context

- [x] `getPicklist(kind)`, `upsertPicklistItem`, `removePicklistItem`
- [x] helper: `getVisitPriorityOptions()` → `{ id, label }[]`

### ۵.۴ QA

- [x] تغییر در Settings → refresh فرم بازدید (همان session)

---

## فاز ۶ — بازدید حضوری (ساختار مهمان + جنسیت + تاریخ)

**هدف:** مثل شوروم واقعی — آقای امیرحسین رضایی، ۲ آقا + ۲ خانم همراه، تاریخ قابل ویرایش.

**فایل‌ها:** [`meizito.ts`](src/types/meizito.ts) · [`MeizitoContext.tsx`](src/context/MeizitoContext.tsx) · [`FieldVisitModal.tsx`](src/views/meizito/components/FieldVisitModal.tsx)

### ۶.۱ انواع

- [x] `MeizitoVisitGender`: `male` | `female` | `unknown`
- [x] `MEIZITO_VISIT_GENDER_LABELS` / `MEIZITO_VISIT_TITLE_OPTIONS` (آقای، خانم، …)
- [x] گسترش `MeizitoFieldVisit`:
  - [x] `visitDate` (همان `date` — قابل override در فرم)
  - [x] `visitorGender`, `visitorTitle?`, `visitorFirstName`, `visitorLastName`
  - [x] `maleCompanionCount`, `femaleCompanionCount` (عدد ≥ ۰)
  - [x] `visitorCount` محاسبه‌شده یا sync: `1 + male + female` (یا جدا نگه‌داری + نمایش جمع)
  - [x] نگه‌داشت `customerName` برای نمایش/legacy: `title + firstName + lastName`
  - [x] `personId`, `customerMobile` (موجود)

### ۶.۲ normalize + migrate

- [x] `normalizeFieldVisit`: پارس `customerName` قدیمی (خانم/آقای …) → gender/title در صورت امکان
- [x] `companions` قدیمی → در notes یا نادیده
- [x] seed نمونه با فیلدهای جدید

### ۶.۳ فرم `FieldVisitModal`

- [x] بخش **تاریخ بازدید:** `input type="date"` — پیش‌فرض `dateKey` ورودی مودال
- [x] بخش **مراجع اصلی:**
  - [x] انتخاب جنسیت (آقا / خانم)
  - [x] عنوان (آقای / خانم / …)
  - [x] نام، نام‌خانوادگی
  - [x] موبایل
  - [x] `PersonCombobox` → پر کردن از [`Person`](src/types/person.ts): `title`, `firstName`, `lastName`, `phones`
- [x] بخش **همراهان:** دو فیلد عددی «تعداد آقا» / «تعداد خانم» + راهنمای بازه سنی
- [x] موضوعات مهم: چیپ‌ها از **Settings picklist** (فاز ۵)
- [x] حفظ: زمان، دیزاینر، علاقه، احتمال خرید، یادداشت

### ۶.۴ Context

- [x] `addFieldVisit` / `updateFieldVisit` با فیلدهای جدید
- [ ] (اختیاری) `updateFieldVisit` برای ویرایش از گزارش

---

## فاز ۷ — گزارش میز کار + داشبورد + CRM

**فایل‌ها:** [`ReportsPanel.tsx`](src/views/meizito/panels/ReportsPanel.tsx) · [`DashboardPanel.tsx`](src/views/meizito/panels/DashboardPanel.tsx) · (اختیاری) [`CRM.tsx`](src/views/CRM.tsx)

### ۷.۱ تب گزارش → بازدید حضوری

- [x] جدول: جنسیت، نام کامل، موبایل، تاریخ، ساعت، آقا/خانم همراه، موضوعات، دیزاینر، …
- [x] export CSV ستون‌های جدید
- [x] (اختیاری) فیلتر تاریخ در همان تب (موجود — فقط اطمینان از `visitDate`)

### ۷.۲ تب گزارش → گزارش روز

- [x] (اختیاری) بازبینی UI اگر کارفرما بازخورد جدا داد — فعلاً بدون تغییر اجباری

### ۷.۳ تب گزارش → آمار میز کار

- [x] بدون تغییر اجباری در این موج

### ۷.۴ داشبورد میز کار

- [x] ویجت/لیست بازدید امروز: نام ساخت‌یافته، جنسیت، `۲آقا+۲خانم`، تیک‌های مهم

### ۷.۵ CRM (اختیاری — اولویت پایین)

- [x] لینک «ثبت در میز کار» از mock بازدید CRM → `/dashboard/tasks?tab=reports&section=visits` یا باز کردن `FieldVisitModal`
- [ ] (اختیاری) خواندن/نوشتن همان `fieldVisits` در storage — یا لینک ساده بدون unify

---

## فاز ۸ — اختیاری (بعد از ۵–۷)

### ۸.۱ یادداشت‌ها

- [ ] قالب چک‌لیست از picklist Settings هنگام «یادداشت جدید»
- [ ] (موجود: چک‌لیست per note در [`NotesPanel.tsx`](src/views/meizito/panels/NotesPanel.tsx))

### ۸.۲ چند میز کار

- [ ] ویجت «بازدیدهای همه میزها» یا سوئیچر تجمیعی در گزارش
- [ ] (موجود: چند board + [`BoardsPanel`](src/views/meizito/panels/BoardsPanel.tsx))

### ۸.۳ نامه‌ها

- [ ] (اختیاری) قالب نامه از Settings — `templateId` موجود؛ UI مدیریت قالب جدا

---

## فاز ۹ — QA و تحویل تکمیل v5

- [x] `npm run build` بدون خطا
- [x] Settings → تغییر تیک «قیمت» → فرم بازدید reflects
- [x] ثبت بازدید: آقای + نام + فامیل + ۲ آقا ۱ خانم + تاریخ دیروز
- [x] گزارش → CSV درست
- [x] regression: گفتگوها، میز کار، v4 کسب‌وکار
- [x] به‌روز `updates/10/00-README.md` — خط «v5.1 بازدید ساختاریافته»

---

## معیار اتمام

### هسته v5 (✅)

- [x] گفتگو فقط از منوی اصلی
- [x] inbox همه + پین + مودال‌ها
- [x] بازدید نسخه ۱ (موبایل، دیزاینر، چیپ ثابت)

### تکمیل v5 — فاز ۵–۹ (✅)

- [x] موضوعات مهم بازدید از **تنظیمات** قابل ویرایش است
- [x] بازدید: **جنسیت** + **نام/نام‌خانوادگی/عنوان** + **تعداد آقا/خانم** + **تاریخ در فرم**
- [x] گزارش و CSV با ستون‌های جدید
- [x] v3/v4 بدون regression

---

## برآورد حجم (فرانت)

| فاز | موضوع | وضعیت | روز تقریبی |
|-----|--------|--------|------------|
| ۰–۴ | هسته v5 | ✅ | ۴–۵ (انجام‌شده) |
| ۵ | تنظیمات تیپ / picklist | ✅ | ۱ |
| ۶ | مدل + فرم بازدید ساختاریافته | ✅ | ۱.۵–۲ |
| ۷ | گزارش + داشبورد + CRM لینک | ✅ | ۰.۵–۱ |
| ۸ | اختیاری | — | ۰.۵–۱ |
| ۹ | QA | ✅ | ۰.۵ |

**جمع باقی‌مانده:** حدود **۳.۵–۵ روز** فرانت.

---

## ترتیب پیشنهادی اجرا

```
[✅ ۰→۱→۲→۳→۴]  سپس  ۵ → ۶ → ۷ → ۹  (و ۸ در صورت وقت)
```

| مرحله | خروجی قابل تست |
|--------|----------------|
| بعد از ۵ | تنظیمات → لیست «موضوعات مهم بازدید» |
| بعد از ۶ | فرم بازدید کامل شوروم |
| بعد از ۷ | جدول/CSV/داشبورد |
| بعد از ۹ | تحویل |

**چرا ۵ قبل از ۶:** فرم بازدید مستقیماً از Settings بخواند؛ hardcode حذف شود.

---

## وابستگی‌ها

| منبع | ارتباط |
|------|--------|
| v4 کسب‌وکار | picklist اختیاری per business |
| v3 گزارش روز / نامه | بدون حذف |
| `Person` در Catalog | پر کردن نام/موبایل در فاز ۶ |
| CRM mock | فاز ۷ اختیاری — UI مرجع جنسیت |

---

## یادداشت برای Agent

- فقط فرانت.
- `internal-comms` ≠ گفتگو · تب «نامه‌ها» ≠ چت.
- **تیپ** = فهرست گزینه‌های قابل تنظیم در Settings، نه قالب چاپ (`FormBuilder`).
- مهمان اصلی ≠ لیست نامحدود همراه در MVP — **شمارش آقا/خانم** کافی است مگر کارفرما لیست ردیفی بخواهد.
- میز کارهای متعدد **از قبل** هست؛ تجمیع گزارش همه بوردها فقط فاز ۸.
