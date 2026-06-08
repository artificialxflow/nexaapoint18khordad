# NexaApp — TODO v6 (ارتباطات یکپارچه: تایید · پیوست · دفتر تلفن · تقویم)

**تاریخ:** ۱۴۰۵/۰۳/۰۴  
**پایه انجام‌شده:** [`todo-v5.md`](todo-v5.md) · [`updates/11/todo.md`](updates/11/todo.md) (فاز ۰–۷، ۹ ✅ — فاز ۸ ⏸️)  
**مرجع خواسته:** [`updates/11/02/01.txt`](updates/11/02/01.txt) · [`updates/11/02/word 01.txt`](updates/11/02/word%2001.txt) · [`updates/11/02/word 03.txt`](updates/11/02/word%2003.txt) · بازخورد: تقویم + دفتر تلفن + درخواست/نامه/گفتگو با تایید و فایل

> **بروز ۱۲/۰۲:** ارجاع چندنفره درخواست + فیدبک سلسله‌مراتبی گزارش روزانه — [`updates/12/todo.md`](updates/12/todo.md#بروز-۱۲۰۲)

> **بروز ۱۲/۰۱:** دفتر تلفن در **دسترسی سریع** سایدبار (`/dashboard/tasks?tab=phone`) — جزئیات در [`updates/12/todo.md`](updates/12/todo.md)

---

## قرارداد اسکوپ — **فقط فرانت**

| داخل v6 | خارج از v6 |
|---------|------------|
| UI، TypeScript، React/Next، Context | API واقعی، DB، migration سرور |
| `localStorage` / seed / mock | SMS، OTP، auth تولید |
| گردش **تایید mock** (چندمرحله در storage) | موتور workflow سرور، نقش‌های HR واقعی |
| دفتر تلفن داخلی + لینک به اشخاص | همگام‌سازی واقعی Gmail/Yahoo/تقویم موبایل |
| پیوست mock / Nextcloud (الگوی نامه) | ضبط/آپلود ابری production |
| تکمیل گفتگو (رسانه، منشن، …) | WebSocket / push واقعی |
| یکپارچه‌سازی UI ارتباطات | ERP کامل (P-* در بک‌لاگ ۱۱) |
| زبان UI: **فقط فارسی** | i18n |

### تفکیم مفاهیم (حیاتی — از v5/v11 حفظ شود)

| نام در UI | محل | v6 چه می‌کند |
|-----------|-----|-------------|
| **داشبورد** | `/dashboard/dashboard` | بدون تغییر اساسی |
| **میز کار** | `/dashboard/tasks` | + هاب ارتباطات (اختیاری فاز ۱) |
| **گفتگوها** | `/dashboard/chats` | تکمیل رسانه + تبدیل به درخواست |
| **نامه‌ها** | تب نامه در میز کار | + گردش تایید |
| **درخواست‌ها** | `/dashboard/work-requests` | v2: پیوست + تایید + جزئیات |
| **تقویم** | تب تقویم میز کار | پیشرفته (فاز ۷) یا میانبر در هاب |
| **دفتر تلفن** | **جدید** — هاب یا تب | پرسنل mock + لینک اشخاص |
| **تدارکات** | `requests` در منو ERP | جدا بماند — در UI توضیح داده شود |
| **internal-comms** | view قدیمی | deprecate / redirect (فاز ۹) |
| **تیپ** | Settings → picklists | per-business اختیاری |

### Storage

| کلید | محتوا |
|------|--------|
| `nexa-meizito-v2` | + `approvalSteps` روی letter/request · گسترش `mockUsers` · phone directory |
| `nexa-settings-v1` | picklistها (بدون تغییر اساسی v6) |
| `nexa-active-business-id` | tenant (v4) |

---

## وضعیت پایه (پس از بروز ۱۱ — قبل از v6)

| قابلیت | وضعیت |
|--------|--------|
| منوی موبایل ۵تایی (میز کار · گفتگو · نامه · درخواست · گزارش) | ✅ |
| درخواست داخلی v1 (موضوع · متن · ارجاع متنی · باز/بسته) | ✅ |
| نامه (thread · پاسخ · ارجاع · پیوست NC · صندوق‌ها) | ✅ |
| گفتگو (فایل NC · ویس mock) | ✅ جزئی |
| تقویم چندگانه MVP (`CalendarPanel`) | ✅ |
| بازدید + گزارش + KPI | ✅ |
| **دفتر تلفن اختصاصی** | ❌ |
| **تایید چندمرحله‌ای** (درخواست/نامه) | ❌ |
| **پیوست در درخواست** | ✅ |
| فاز ۸ گفتگو (عکس/فیلم/منشن/ویرایش) | ✅ |
| **دفتر تلفن** | ✅ |
| **تایید چندمرحله‌ای** | ✅ |

---

## وضعیت اجرا v6

| بلوک | وضعیت |
|------|--------|
| فاز ۰ — آماده‌سازی و انواع مشترک | ✅ |
| فاز ۱ — هاب ارتباطات + دفتر تلفن | ✅ |
| فاز ۲ — مدل و UI گردش تایید (مشترک) | ✅ |
| فاز ۳ — درخواست‌های داخلی v2 | ✅ |
| فاز ۴ — نامه‌ها + تایید | ✅ |
| فاز ۵ — گفتگو (تکمیل فاز ۸) | ✅ |
| فاز ۶ — گزارش روزانه + تایید (اختیاری تقویت) | ✅ |
| فاز ۷ — تقویم پیشرفته | 🔶 جزئی (visible + types) |
| فاز ۸ — picklist per business + polish | 🔶 جزئی (`getPicklist` + aria) |
| فاز ۹ — یکپارچه‌سازی · deprecate · QA | ✅ |

---

# فاز ۰ — آماده‌سازی و انواع داده مشترک

**هدف:** اسکوپ روشن؛ بدون شکست v5/۱۱؛ الگوی تایید یک‌بار تعریف شود.

**فایل‌ها:** [`src/types/meizito.ts`](src/types/meizito.ts) · [`src/context/MeizitoContext.tsx`](src/context/MeizitoContext.tsx)

### ۰.۱ مستندسازی و regression

- [x] تأیید این فایل (`todo-v6.md`) و اولویت MVP vs کامل
- [x] `npm run build` — baseline سبز قبل از شروع
- [x] چک‌لیست regression v5/۱۱: منوی ۵تایی · بازدید · نامه · درخواست v1

### ۰.۲ انواع گردش تایید (مشترک)

- [x] `MeizitoApprovalAction = 'approve' | 'reject' | 'forward' | 'comment'`
- [x] `MeizitoApprovalStep { id, actorId, actorName, action, comment?, forwardedToId?, at }`
- [x] `MeizitoApprovalState = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled'`
- [x] `MeizitoApprovableBase { approvalState, approvalSteps[], currentAssigneeId?, submittedAt? }`

### ۰.۳ گسترش کاربران mock (پایه دفتر تلفن)

- [x] `MeizitoMockUser`: `mobile?`, `extension?`, `department?`, `jobTitle?`
- [x] seed به‌روز · `normalizeMockUser`
- [x] `getMockUserById` · `listTeamDirectory(filter?)`

### ۰.۴ helperهای Context

- [x] `submitForApproval(entityType, id)`
- [x] `recordApprovalAction(entityType, id, action, payload)`
- [x] `getPendingApprovalsForUser(userId)` — inbox «منتظر من»

### ۰.۵ QA فاز ۰

- [x] migrate/storage: رکوردهای قدیمی بدون approval → `draft` یا `approved` legacy
- [x] build سبز

---

# فاز ۱ — هاب ارتباطات + دفتر تلفن

**هدف:** تقویم و دفتر تلفن در **همان اکوسیستم** درخواست/نامه/گفتگو (نه پراکنده).

**فایل‌های هدف:** `CommsHubPanel.tsx` (جدید) · `PhoneDirectoryPanel.tsx` (جدید) · `MeizitoWorkspace.tsx` · `Sidebar.tsx` · `view-map.tsx` (اختیاری route جدا)

### ۱.۱ هاب ارتباطات

- [x] پنل/صفحه «ارتباطات» یا آکوردئون در میز کار: کارت‌های میانبر
- [x] میانبر: گفتگوها · نامه‌ها · درخواست‌ها · تقویم · دفتر تلفن
- [x] نمایش badge: نامه باز · درخواست منتظر تایید (پس از فاز ۲–۳)
- [x] موبایل: جایگاه در منوی کناری / «بیشتر» — هم‌تراز با تقویم فاز ۱۱

### ۱.۲ دفتر تلفن (`PhoneDirectoryPanel`)

- [x] لیست `mockUsers` + جستجو (نام · واحد · موبایل)
- [x] کارت تماس: تماس `tel:` · کپی شماره · نقش (مدیر/عضو)
- [x] فیلتر: همه · مدیران · واحد (اگر `department` پر شد)
- [x] لینک «مخاطبین CRM» → `/dashboard/people` با query پیش‌فرض

### ۱.۳ تقویم در هاب

- [x] embed کوچک «رویدادهای امروز» یا دکمه «باز کردن تقویم کامل»
- [x] حفظ `CalendarPanel` موجود — بدون شکست لینک بازدید → تقویم

### ۱.۴ QA فاز ۱

- [x] موبایل: دسترسی به دفتر تلفن ≤ ۲ کلیک از میز کار
- [x] regression تقویم و منوی ۵تایی

---

# فاز ۲ — UI و منطق گردش تایید (مشترک)

**هدف:** یک کامپوننت برای نامه و درخواست (و بعداً گزارش روزانه).

**فایل‌ها:** `ApprovalTimeline.tsx` (جدید) · `ApprovalActionsBar.tsx` (جدید) · `MeizitoContext.tsx`

### ۲.۱ کامپوننت‌های UI

- [x] `ApprovalTimeline` — خط زمانی مراحل با آیکون تایید/رد/ارجاع
- [x] `ApprovalActionsBar` — دکمه‌ها فقط برای `currentAssigneeId === currentUser`
- [x] مودال ارجاع: `PersonCombobox` یا select از `mockUsers`
- [x] فیلد توضیح اجباری برای «رد»

### ۲.۲ قوانین mock (MVP)

- [x] ثبت درخواست/نامه → `submitForApproval` → `pending` + assignee = مدیر mock
- [x] تایید مدیر → `approved` یا `forward` به کاربر بعدی
- [x] رد → `rejected` + ثبت comment
- [x] فقط نویسنده: `cancel` در وضعیت `pending` (اختیاری)

### ۲.۳ صندوق‌های فیلتر

- [x] «منتظر تایید من» — `currentAssigneeId === me && pending`
- [x] «ارجاع‌شده از من» — step با `forward` و actor=me
- [x] «تایید شده» / «رد شده»

### ۲.۴ QA فاز ۲

- [x] سناریو: کارمند → مدیر تایید → بایگانی
- [x] سناریو: کارمند → مدیر ارجاع → مدیر دوم تایید

---

# فاز ۳ — درخواست‌های داخلی v2

**هدف:** هم‌سطح نامه + تایید + فایل (خواسته اصلی کارفرما).

**فایل‌ها:** `meizito.ts` · `MeizitoContext.tsx` · `RequestsPanel.tsx` · `WorkRequests.tsx`

### ۳.۱ مدل

- [x] گسترش `MeizitoInternalRequest` با `MeizitoApprovableBase`
- [x] `attachments: MeizitoLetterAttachment[]` (reuse نوع)
- [x] `category?` · `priority?` ('low'|'medium'|'high')
- [x] `threadId?` · `replyToRequestId?` (اختیاری — parity نامه)
- [x] `referredTo` → `referredToIds: string[]` یا نگه‌داری متن + combobox

### ۳.۲ Context CRUD

- [x] `addInternalRequest` با attachments و auto-submit
- [ ] `replyToInternalRequest` (اختیاری)
- [x] `updateInternalRequestApproval` — delegate به helper فاز ۲
- [x] seed: «درخواست کامپیوتر» — ۲ مرحله تایید نمونه

### ۳.۳ UI `RequestsPanel`

- [x] نمای جزئیات (مودال یا split) — نه فقط لیست
- [x] فرم ایجاد: textarea توضیحات · `PersonCombobox` ارجاع · پیوست NC/local
- [x] `ApprovalTimeline` + `ApprovalActionsBar` در جزئیات
- [x] فیلتر: باز · منتظر من · بسته · همه · تایید شده · رد شده
- [x] نمایش پیوست‌ها (باز کردن NC مثل نامه)

### ۳.۴ ناوبری و badge

- [ ] badge روی منوی «درخواست» برای `pending` مربوط به کاربر (شمارنده در هاب ✅)
- [x] هاب فاز ۱: شمارنده به‌روز

### ۳.۵ QA فاز ۳

- [x] ایجاد + پیوست + ارسال برای تایید → مدیر می‌بیند → تایید → وضعیت نهایی
- [x] persist پس از refresh

---

# فاز ۴ — نامه‌ها + گردش تایید

**هدف:** نامه از قبل غنی است — لایه تایید و inbox مدیر اضافه شود.

**فایل‌ها:** `LettersPanel.tsx` · `meizito.ts` · `MeizitoContext.tsx`

### ۴.۱ مدل

- [x] `MeizitoLetter` extends approvable fields (یا embed `approvalState` / `steps`)
- [x] وضعیت نامه: تفکیک `status` (باز/بسته) از `approvalState`
- [x] نامه‌های قدیمی: normalize → `approved` implicit

### ۴.۲ UI

- [ ] ارسال نامه → «ارسال برای تایید» vs «پیش‌نویس» (اختیاری — فعلاً همیشه submit)
- [x] `ApprovalTimeline` در نمای thread
- [x] فیلتر inbox: «نیاز به اقدام من»
- [x] حفظ: reply · refer · attachments · صندوق‌ها

### ۴.۳ QA فاز ۴

- [x] thread نامه + تایید مدیر + بستن نامه
- [x] عدم شکست پیوست NC موجود

---

# فاز ۵ — گفتگو (تکمیل فاز ۸ بروز ۱۱)

**مرجع:** [`updates/11/todo.md`](updates/11/todo.md) فاز ۸ · [`updates/11/02/word 02.txt`](updates/11/02/word%2002.txt)

**فایل‌ها:** `MeizitoChatEmbed.tsx` · `meizito.ts` · `NewChatModals.tsx`

### ۵.۱ رسانه

- [x] آپلود عکس — mock dataUrl یا NC (الگوی فایل)
- [x] آپلود ویدیو — mock / NC · محدودیت حجم نمایشی
- [ ] بهبود ویس: نگه‌داری `dataUrl` اختیاری در storage (mock)

### ۵.۲ UX پیشرفته

- [x] منشن `@نام` — autocomplete از `mockUsers`
- [x] جستجو در پیام‌های thread فعال
- [x] ویرایش پیام متنی (فقط author · `editedAt` mock)

### ۵.۳ ارتباط با درخواست

- [x] منوی پیام: «تبدیل به درخواست داخلی»
- [x] `sourceChatMessageId` روی درخواست · prefill موضوع/متن

### ۵.۴ QA فاز ۵

- [x] ارسال عکس + فایل + ویس در یک thread
- [x] تبدیل به درخواست → باز شدن در `work-requests`

---

# فاز ۶ — گزارش روزانه و تایید (تقویت)

**هدف:** هم‌راستا با «تایید مدیر» — اختیاری اگر زمان کم باشد.

**فایل‌ها:** `ReportsPanel.tsx` · `DailyReportModal.tsx` · `meizito.ts`

### ۶.۱ مدل (اختیاری)

- [x] `MeizitoDailyReport`: `approvalState` یا نگه‌داری `managerFeedback` + flag `approved`

### ۶.۲ UI

- [x] دکمه مدیر: «تایید گزارش» علاوه بر «بازخورد»
- [ ] لیست گزارش‌های «منتظر تایید» برای نقش manager
- [ ] اعلان در داشبورد میز کار

### ۶.۳ QA

- [x] عضو ارسال → مدیر تایید → وضعیت در لیست تیم

---

# فاز ۷ — تقویم پیشرفته (Word — اختیاری / اولویت پایین‌تر)

**مرجع:** [`updates/11/02/word 01.txt`](updates/11/02/word%2001.txt) § تقویم

**فایل‌ها:** `CalendarPanel.tsx` · `meizito.ts` · `calendarGrid.ts`

### ۷.۱ رویداد

- [ ] `reminderMinutes?` · نمایش badge یادآوری (mock toast/local)
- [ ] `attendeeIds: string[]` — انتخاب از mockUsers (نوع در مدل ✅)
- [ ] `rsvp: Record<userId, 'accepted'|'declined'|'pending'>` — UI پذیرش/رد mock (`setEventRsvp` در Context ✅)

### ۷.۲ تقویم

- [x] `visible: boolean` per calendar — hide/show در سوئیچر
- [ ] kind `personal` | `work` — فیلتر نمایش
- [ ] import/export ICS mock (فایل متنی / دانلود blob)

### ۷.۳ یکپارچگی

- [x] لینک رویداد ↔ کارت وظیفه / بازدید (در صورت `sourceCardId`)
- [x] «تقویم من» در هاب — رویدادهای امروز + فردا

### ۷.۴ QA

- [ ] ایجاد رویداد با شرکت‌کننده + RSVP
- [x] عدم شکست تقویم وظایف (`MEIZITO_TASKS_CALENDAR_ID`)

---

# فاز ۸ — Settings و polish

### ۸.۱ picklist per business (از todo ۱۱)

- [x] `getPicklist(kind, businessId?)` — fallback global
- [ ] UI `PicklistsSection`: تب per `activeBusiness` (اختیاری)

### ۸.۲ UX کلی

- [ ] empty stateهای یکسان در درخواست/نامه/دفتر تلفن
- [ ] اسکلتون لودینگ سبک (اختیاری)
- [x] دسترسی‌پذیری: `aria-label` دکمه‌های تایید/رد

### ۸.۳ QA فاز ۸

- [x] تعویض business → picklist درست در بازدید (regression)

---

# فاز ۹ — یکپارچه‌سازی · deprecate · QA نهایی

### ۹.۱ حذف تکرار و سردرگمی

- [x] `InternalComms.tsx`: banner «منتقل به میز کار» + redirect یا حذف از `view-map`
- [x] Sidebar: tooltip — تفاوت «درخواست‌ها» vs «تدارکات و ملزومات» (یادداشت در `WorkRequests` ✅)
- [ ] README کوتاه در `updates/12/00-README.md` (اختیاری)

### ۹.۲ QA کامل

- [x] `npm run build`
- [x] منوی ۵تایی موبایل — بدون regression
- [x] درخواست v2: ایجاد · فایل · تایید · ارجاع
- [x] نامه: تایید + thread
- [x] گفتگو: رسانه + تبدیل به درخواست
- [x] دفتر تلفن: جستجو + کپی شماره
- [x] تقویم MVP + (در صورت اجرای فاز ۷) RSVP
- [x] regression بازدید v11 · picklist · CSV

### ۹.۳ معیار اتمام — MVP v6

- [x] دفتر تلفن در هاب/دسترسی واضح
- [x] درخواست: توضیحات + پیوست + تایید مدیر (حداقل ۱ سطح)
- [x] نامه: تایید یا inbox «منتظر من»
- [x] گفتگو: حداقل عکس یا بهبود ویس + تبدیل به درخواست
- [x] بدون شکست v5/۱۱

### ۹.۴ معیار اتمام — v6 کامل

- [x] همه فاز ۰–۹ (شامل ۶–۷)
- [x] `InternalComms` deprecate شده

---

## بک‌لاگ — خارج اسکوپ v6 (فرانت آینده / بک‌اند)

> از [`updates/11/todo.md`](updates/11/todo.md) — اجرا نشود مگر تأیید جدا.

| کد | حوزه |
|----|------|
| P-CRM | باشگاه، LRFM، قرعه‌کشی |
| P-سفارش | فرم سفارش تولید، PDF، امضا |
| P-تولید | workflow ۲۰+ مرحله |
| P-خدمات | SLA پس از فروش |
| P-HR | مرخصی/وام واقعی، حضور و غیاب |
| P-مالی | سپیدار، حسابفا، CRM24 |
| P-پیام | واتساپ/تلگرام/SMS واقعی |
| P-WF | ویرایشگر بصری `Workflows.tsx` متصل به داده |

---

## برآورد حجم (فرانت)

| فاز | موضوع | روز تقریبی |
|-----|--------|------------|
| ۰ | آماده‌سازی + انواع تایید | ۰٫۵–۱ |
| ۱ | هاب + دفتر تلفن | ۲–۳ |
| ۲ | UI تایید مشترک | ۳–۴ |
| ۳ | درخواست v2 | ۲٫۵–۳٫۵ |
| ۴ | نامه + تایید | ۱٫۵–۲ |
| ۵ | گفتگو | ۲–۳ |
| ۶ | گزارش روزانه (اختیاری) | ۱–۱٫۵ |
| ۷ | تقویم پیشرفته (اختیاری) | ۳–۵ |
| ۸ | polish | ۰٫۵–۱ |
| ۹ | QA + deprecate | ۱ |
| **MVP v6** (۰–۳ + ۹، بدون ۶–۷) | | **~۱۰–۱۲ روز** |
| **v6 کامل** | | **~۱۵–۲۰ روز** |

---

## ترتیب پیشنهادی اجرا

```
۰ → ۲ → ۳ → ۴ → ۱ → ۵ → ۹
              ↘ ۶ (اختیاری)
              ↘ ۷ (اختیاری، موازی با ۵)
         ۸ در انتها یا موازی
```

**چرا ۲ قبل از ۳–۴:** یک بار `ApprovalTimeline` بسازید.  
**چرا ۱ بعد از ۳:** badgeهای هاب به داده تایید نیاز دارد.  
**چرا ۷ آخر:** MVP تقویم از ۱۱ کافی است مگر اولویت کارفرما عوض شود.

---

## وابستگی‌ها

| منبع | ارتباط |
|------|--------|
| v5 / بروز ۱۱ | پایه — حذف نشود |
| `LettersPanel` | الگوی پیوست و thread برای درخواست v2 |
| `NcFilePickerModal` | پیوست درخواست/نامه |
| `PersonCombobox` / `CatalogContext` | ارجاع و مخاطب CRM |
| `CalendarPanel` | تقویم + لینک بازدید |
| `MEIZITO_MOCK_USERS` | تایید‌دهنده + دفتر تلفن |

---

## یادداشت برای Agent

- **فقط فرانت** — Context + `localStorage` + UI.
- تایید = **mock**؛ نقش مدیر از `MeizitoMockUser.role === 'manager'`.
- **درخواست میز کار** (`work-requests`) ≠ **تدارکات** (`requests` view).
- قبل از هر فاز: `npm run build`.
- پس از MVP: به‌روز کردن جدول «وضعیت اجرا» در ابتدای این فایل.
