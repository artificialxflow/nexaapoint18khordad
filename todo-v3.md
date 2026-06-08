# NexaApp — TODO v3 (میز کار — فرانت فقط)

**تاریخ:** ۱۴۰۵/۰۲/۳۰  
**وضعیت پیاده‌سازی:** ✅ انجام شد (فرانت — `nexa-meizito-v2`)  
**مرجع:** خواسته کارفرما (گفتگو زیر داشبورد، گزارش روز + فیدبک، نامه دسته‌بندی + باز/بسته، بازدید حضوری در داشبورد)  
**پایه:** [`todo-v2.md`](todo-v2.md) · میز کار پیاده‌شده در [`updates/09 میزیتو شبیه ترلو/todo.md`](updates/09%20میزیتو%20شبیه%20ترلو/todo.md) و [`updates/10/00-README.md`](updates/10/00-README.md)

## قرارداد اسکوپ

| داخل v3 | خارج از v3 |
|---------|------------|
| UI، TypeScript، `MeizitoContext`، `localStorage` | SMS، OTP، auth، API کاربر، DB |
| mock چند کاربر + سوئیچ نقش | WebSocket / `socket.io` (realtime) |
| یادآوری گزارش روز **فقط in-app** (بنر/badge) | ارسال واقعی SMS/ایمیل |
| اتصال فرم‌ها به `CatalogContext` (اشخاص) | migration سرور |

**مسیر اصلی:** [`/dashboard/tasks`](app/dashboard/[view]/page.tsx) — `ViewType: tasks`  
**فایل‌های هسته:** [`src/types/meizito.ts`](src/types/meizito.ts) · [`src/context/MeizitoContext.tsx`](src/context/MeizitoContext.tsx) · [`src/views/meizito/MeizitoWorkspace.tsx`](src/views/meizito/MeizitoWorkspace.tsx)

## وضعیت فعلی (برآورد قبل از v3)

| قابلیت | وضعیت |
|--------|--------|
| داشبورد: کار امروز/دیروز/معوق/پیگیری | ✅ |
| گفتگو تب جدا + bubble چپ/راست | ✅ (جدا از داشبورد) |
| گزارش تب: آمار کانبان + CSV | ✅ (بدون گزارش روز انسانی) |
| نامه: inbox/outbox/archive + labels آزاد | ✅ (بدون category + open/closed) |
| تقویم چندگانه | ✅ |
| گزارش روز / بازدید در میز کار | ✅ (v3) |
| سوئیچ کاربر mock تیم | ✅ (v3) |

**کلید storage فعلی:** `nexa-meizito-v1` — در v3 نسخه‌دهی یا migrate برای فیلدهای جدید لازم است.

---

## فاز ۰ — انواع داده (TypeScript)

**فایل:** [`src/types/meizito.ts`](src/types/meizito.ts)

### ۰.۱ گزارش روزانه

- [x] `MeizitoDailyReportStatus`: `draft` | `submitted`
- [x] `MeizitoDailyReport`: `id`, `authorId`, `authorName`, `date` (ISO), `title`, `body`, `status`, `managerFeedback?`, `feedbackAt?`, `createdAt`, `updatedAt`
- [x] ثابت‌های برچسب فارسی وضعیت برای UI

### ۰.۲ بازدید حضوری

- [x] `MeizitoVisitResult`: `positive` | `neutral` | `negative`
- [x] `MeizitoFieldVisit`: `id`, `date`, `time?`, `customerName`, `personId?`, `designerName`, `durationMinutes`, `result`, `notes?`, `authorId`, `authorName`, `createdAt`

### ۰.۳ نامه — گسترش مدل

- [x] `MeizitoLetterCategory`: `financial` | `administrative` | `hr` | `operations` | `other`
- [x] `MeizitoLetterStatus`: `open` | `closed`
- [x] افزودن به `MeizitoLetter`: `category`, `status` (پیش‌فرض `open`)
- [x] `MEIZITO_LETTER_CATEGORY_LABELS` برای UI فارسی

### ۰.۴ کاربران mock تیم

- [x] `MeizitoMockUser`: `id`, `name`, `role`: `member` | `manager`
- [x] `MEIZITO_MOCK_USERS` (حداقل ۴ نفر: ۱ مدیر + ۳ عضو)
- [x] کلید `nexa-meizito-current-user-id` در localStorage

### ۰.۵ پارامتر URL (اختیاری)

- [x] `MeizitoReportsSection`: `daily` | `analytics` | `visits`
- [x] پشتیبانی `?tab=reports&section=daily` در workspace

---

## فاز ۱ — MeizitoContext و persistence

**فایل:** [`src/context/MeizitoContext.tsx`](src/context/MeizitoContext.tsx)

### ۱.۱ Storage

- [x] افزودن به `Stored`: `dailyReports`, `fieldVisits`, `currentUserId`
- [x] bump نسخه storage به `nexa-meizito-v2` **یا** merge امن فیلدهای جدید روی v1
- [x] seed نمونه: ۲ گزارش روز (یکی با فیدبک)، ۳ بازدید، نامه‌ها با `category`/`status`

### ۱.۲ کاربر جاری

- [x] `currentUserId` / `setCurrentUserId`
- [x] `currentUserName` و `isCurrentUserManager` از mock users (جایگزین ثابت `MEIZITO_CURRENT_USER_NAME` در runtime)
- [x] export `MEIZITO_CURRENT_USER_NAME` برای سازگاری عقب‌رو (deprecated)

### ۱.۳ API گزارش روز

- [x] `addDailyReport`, `updateDailyReport`, `submitDailyReport(id)`
- [x] `addFeedbackToReport(id, feedback)` — فقط اگر `isCurrentUserManager`
- [x] `getDailyReportsForDate(date)`, `getMyDailyReportForDate(date)`
- [x] `getTeamMembersWithoutReportForDate(date)` — برای بنر یادآوری

### ۱.۴ API بازدید

- [x] `addFieldVisit`, `updateFieldVisit`, `deleteFieldVisit` (اختیاری)
- [x] `getFieldVisitsForDate(date)`, `getTodayFieldVisits()`

### ۱.۵ API نامه

- [x] `closeLetter(id)`, `reopenLetter(id)`
- [x] `setLetterCategory(id, category)`
- [x] فیلترهای helper: `getOpenLetters(box?)`, `getLettersByCategory(category)`

### ۱.۶ مهاجرت نامه‌های قدیمی

- [x] normalize در load: `category ?? 'other'`, `status ?? 'open'`

---

## فاز ۲ — داشبورد میز کار

**فایل:** [`src/views/meizito/panels/DashboardPanel.tsx`](src/views/meizito/panels/DashboardPanel.tsx)  
**کامپوننت‌های پیشنهادی جدید:** `src/views/meizito/components/DailyReportWidget.tsx`, `FieldVisitWidget.tsx` (اختیاری تفکیک)

### ۲.۱ گزارش روز

- [x] ویجت «گزارش امروز من»: وضعیت (ثبت نشده / پیش‌نویس / ارسال‌شده / فیدبک خورده)
- [x] بنر یادآوری اگر `submitted` نیست (متن فارسی، دکمه «ثبت الان»)
- [x] مودال فرم: عنوان، متن، «ذخیره پیش‌نویس»، «ارسال نهایی»
- [x] نمایش خلاصه فیدبک مدیر در صورت وجود
- [x] لیست فشرده «گزارش‌های امروز تیم» (۳–۵ مورد) + لینک `onGoTab('reports')` با section=daily

### ۲.۲ بازدید حضوری

- [x] ویجت «بازدیدهای امروز»: شمار + دکمه ثبت
- [x] مودال/فرم سریع: مشتری، دیزاینر، مدت (دقیقه)، نتیجه، یادداشت
- [x] جدول/لیست mini بازدیدهای امروز (حداکثر ۵ ردیف)

### ۲.۳ گفتگو زیر داشبورد

- [x] زیرتب داخل داشبورد: **خلاصه** | **گفتگو** (پیش‌فرض: خلاصه)
- [x] استخراج UI چت به [`MeizitoChatEmbed.tsx`](src/views/meizito/components/MeizitoChatEmbed.tsx) از [`ChatPanel.tsx`](src/views/meizito/panels/ChatPanel.tsx)
- [x] embed در داشبورد با ارتفاع ثابت (`min-h-[400px]`) و جداکننده عنوان «گفتگو»
- [x] `ChatPanel` = همان embed در حالت `fullHeight`

### ۲.۴ حفظ ویجت‌های فعلی

- [x] عدم regression: کار امروز، دیروز، معوق، پیگیری از دیگران
- [x] تست کلیک لینک‌ها به `boards` / `reports`

---

## فاز ۳ — گفتگو (بهبود UX)

**فایل‌ها:** [`ChatPanel.tsx`](src/views/meizito/panels/ChatPanel.tsx) · [`MeizitoChatEmbed.tsx`](src/views/meizito/components/MeizitoChatEmbed.tsx) (جدید)

### ۳.۱ جداکننده پیام

- [x] گروه‌بندی پیام‌ها بر اساس روز + هدر «امروز» / «دیروز» / تاریخ شمسی
- [x] فاصله بیشتر بین پیام نفر اول و نفر دوم متوالی
- [x] حالت خالی thread: CTA «گفتگوی جدید»

### ۳.۲ موبایل

- [x] در embed و full: لیست تمام‌عرض → باز شدن ناحیه پیام (back به لیست)

### ۳.۳ ناوبری تب (تصمیم محصول)

- [x] **گزینه A:** نگه‌داشتن تب `chat` برای تمام‌صفحه + داشبورد embed
- [ ] **گزینه B:** حذف `chat` از `MEIZITO_PRIMARY_TABS` و فقط embed — در صورت B به‌روز [`Chat.tsx`](src/views/Chat.tsx) redirect

- [x] ثبت تصمیم: **گزینه A** (تب گفتگو + embed در داشبورد)

---

## فاز ۴ — تب گزارش

**فایل:** [`src/views/meizito/panels/ReportsPanel.tsx`](src/views/meizito/panels/ReportsPanel.tsx)

### ۴.۱ ناوبری داخلی

- [x] سوئیچ بالا: **گزارش روز** | **بازدید حضوری** | **آمار میز کار** (همان UI فعلی)
- [x] sync با `?section=` در URL (فاز ۰.۵)

### ۴.۲ بخش گزارش روز

- [x] فیلتر تاریخ: امروز / دیروز / انتخاب تاریخ
- [x] جدول یا کارت: نویسنده، عنوان، وضعیت، نشان فیدبک
- [x] کلیک ردیف → پنل جزئیات (متن کامل + فیدبک)
- [x] دکمه «گزارش جدید» (مودال مشترک با داشبورد)
- [x] نقش مدیر: textarea فیدبک + «ثبت بازخورد»
- [x] بنر: «N نفر هنوز گزارش امروز ندارند» (از Context)

### ۴.۳ بخش بازدید

- [x] جدول بازدیدها با فیلتر تاریخ
- [x] دکمه ثبت (همان مودال داشبورد)
- [x] export CSV mock بازدیدها (client-side، مشابه گزارش آمار)

### ۴.۴ بخش آمار میز کار (موجود)

- [x] انتقال نمودارها و CSV فعلی به زیرتب «آمار میز کار» بدون حذف قابلیت
- [x] QA: بورد خالی → صفر

---

## فاز ۵ — نامه‌ها

**فایل:** [`src/views/meizito/panels/LettersPanel.tsx`](src/views/meizito/panels/LettersPanel.tsx)

### ۵.۱ فرم

- [x] `select` دسته (مالی، اداری، …)
- [x] پیش‌فرض `status: open` روی نامه جدید

### ۵.۲ فیلتر لیست

- [x] سوئیچ: **باز** (پیش‌فرض) | **همه** | **پایان‌یافته**
- [x] فیلتر دسته (همه + هر category)
- [x] جستجو در `subject` و `body`
- [x] چیپ فیلتر برچسب‌های موجود در داده (`labels`)

### ۵.۳ اکشن روی کارت

- [x] دکمه «پایان مکاتبه» → `status: closed` (در صورت تمایل: انتقال به archive)
- [x] دکمه «بازگشایی» برای closed
- [x] نمایش چیپ دسته رنگی روی کارت

### ۵.۴ صندوق‌ها

- [x] حفظ inbox / outbox / archive بدون regression
- [x] تعریف UX: `closed` vs `archive` (سند کوتاه در کامنت کد یا همین فایل)

---

## فاز ۶ — یکپارچگی اشخاص (mock)

**وابستگی:** [`src/context/CatalogContext.tsx`](src/context/CatalogContext.tsx)

- [x] کامپوننت مشترک `PersonCombobox` در `src/components/` یا `meizito/components/`
- [x] فرم بازدید: انتخاب شخص → پر کردن `personId` + `customerName`
- [x] فرم نامه: autocomplete گیرنده از `people` (+ متن آزاد)
- [x] (اختیاری) ساخت thread direct از روی نام شخص در گفتگو

---

## فاز ۷ — پوسته میز کار

**فایل:** [`src/views/meizito/MeizitoWorkspace.tsx`](src/views/meizito/MeizitoWorkspace.tsx)

- [x] سوئیچ کاربر mock در هدر (dropdown نام + نقش)
- [x] به‌روز توضیح زیر عنوان «میز کار»
- [x] پاس‌دادن `section` به `ReportsPanel` از searchParams
- [x] (اختیاری) badge تعداد نامه‌های باز روی تب letters

---

## فاز ۸ — هم‌ترازی ماژول‌های دیگر (اختیاری، اولویت پایین)

| فایل | کار |
|------|-----|
| [`src/views/InternalComms.tsx`](src/views/InternalComms.tsx) | بنر «گزارش روز → میز کار» یا حذف duplicate mock |
| [`src/views/CRM.tsx`](src/views/CRM.tsx) | لینک «ثبت بازدید در میز کار» از تب visits |
| [`src/views/MobileApp.tsx`](src/views/MobileApp.tsx) | دکمه بازدید → navigate به `/dashboard/tasks?tab=dashboard` |
| [`src/views/settings/NotificationsSettingsSection.tsx`](src/views/settings/NotificationsSettingsSection.tsx) | rule mock «یادآوری گزارش روز» (channel: in-app) |

---

## فاز ۹ — QA و تحویل

- [x] `npm run build` بدون خطا
- [x] RTL: مودال‌ها، جدول گزارش، embed چت
- [x] موبایل ۳۲۰px–۴۲۸px: داشبورد + زیرتب گفتگو
- [x] حالت خالی: بدون گزارش، بدون بازدید، بدون نامه باز
- [x] refresh صفحه → persistence در localStorage
- [x] سوئیچ کاربر → گزارش/بازدید/فیدبک با نقش درست
- [x] تست دستی مسیرها: `?tab=dashboard`, `reports`, `letters`, `chat`
- [x] به‌روز [`updates/10/00-README.md`](updates/10/00-README.md) یا یادداشت «فاز ۱۱ — v3» (یک خط)

---

## معیار اتمام v3

- [x] کاربر mock می‌تواند گزارش روز ثبت کند و مدیر mock فیدبک بگذارد
- [x] بازدید حضوری از داشبورد و تب گزارش قابل ثبت و مشاهده است
- [x] نامه‌ها با دسته فیلتر می‌شوند؛ پیش‌فرض لیست فقط **باز**
- [x] گفتگو از داشبورد (زیرتب یا embed) بدون رفتن اجباری به تب جدا قابل استفاده است
- [x] آمار کانبان قبلی در تب گزارش همچنان کار می‌کند

---

## برآورد حجم کار (فرانت)

| فاز | برآورد نسبی | توضیح |
|-----|-------------|--------|
| ۰ + ۱ | **بزرگ** | types + context + seed + migrate |
| ۲ | **بزرگ** | داشبورد + ۲ مودال + embed چت |
| ۳ | متوسط | جداکننده تاریخ + موبایل |
| ۴ | بزرگ | ReportsPanel سه‌بخشی |
| ۵ | متوسط | فیلترها و status نامه |
| ۶ | کوچک–متوسط | PersonCombobox |
| ۷ | کوچک | هدر workspace |
| ۸ | کوچک | لینک‌ها |
| ۹ | کوچک | QA |

**جمع تقریبی:** ۸–۱۲ فاز کاری متوالی؛ سنگین‌ترین بخش: **Context (فاز ۱)** و **داشبورد+گزارش (فاز ۲+۴)**.

---

## ترتیب پیشنهادی اجرا

```
۰ → ۱ → ۲.۱–۲.۲ → ۴.۲ → ۲.۳ → ۳ → ۵ → ۴.۳–۴.۴ → ۶ → ۷ → ۸ → ۹
```

---

## یادداشت برای Agent بعدی

- از [`todo-v2.md`](todo-v2.md) بخش ۹ (بک‌اند) استفاده نکنید تا اعلام خلاف.
- تقویم و Nextcloud را دست نزنید مگر پیوست گزارش روز روی NC خواسته شود.
