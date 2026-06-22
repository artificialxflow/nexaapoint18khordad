# QA / Backend / Frontend Strategy v12

این سند رویکرد اجرایی پروژه برای ساخت backend، اتصال frontend و تست مرحله‌ای منوها را مشخص می‌کند. هدف این است که هر منو فقط وقتی «تمام‌شده» حساب شود که هم backend آن به‌صورت مستقل تست شده باشد، هم رفتار واقعی کاربر در مرورگر خارجی تأیید شده باشد.

---

## 0. دستور اجرای ثابت QA برای این پروژه

این بخش برای همه اجرای‌های بعدی QA الزامی است و باید قبل از شروع تست خوانده شود.

### 0.1 حساب ادمین تست

برای هر تست browser، smoke، login bootstrap یا QA harness که نیاز به ورود دارد، از همین حساب ادمین استفاده شود:

- Username: `artificialxflow`
- Password: `Ronak#123Ronak`

قاعده اجرایی:

- اگر تست از API login استفاده می‌کند، همین username/password باید در login request استفاده شود.
- اگر تست با مرورگر انجام می‌شود، ورود باید با همین حساب انجام شود.
- اگر runner env می‌گیرد، مقدار پیش‌فرض یا env باید با همین حساب هماهنگ باشد.
- اگر login fail شد، تست نباید با حساب دیگر ادامه پیدا کند؛ باید failure ثبت شود.

نکته امنیتی:

- این credential فقط برای QA همین پروژه ثبت شده است.
- هنگام commit یا انتشار عمومی باید دقت شود که این فایل شامل credential است.

### 0.2 مرورگر تست

برای تست UI و browser harness:

- از مرورگر داخلی Cursor استفاده نشود.
- تست باید روی مرورگر خارجی جداگانه اجرا شود؛ مثل Chrome یا Edge که با CDP/harness باز می‌شود.
- تست‌ها روی local اجرا شوند، مثل `http://localhost:3000`.
- اگر dev server سنگین شد یا crash کرد، نباید Cursor browser باز شود؛ باید dev server پایدارتر بالا بیاید و همان مرورگر خارجی استفاده شود.
- برای اجرای‌های سنگین Next/Turbopack روی ویندوز، dev server بهتر است با heap بالاتر اجرا شود:
  - `NODE_OPTIONS=--max-old-space-size=4096`

### 0.3 اجرای خودکار تا قبل از تقویم

تا زمانی که QA به مرحله `Calendar / تقویم` نرسیده است، agent باید بدون سؤال اضافه از کاربر جلو برود.

قاعده اجرایی:

- اگر لازم است command اجرا شود، agent خودش اجرا کند.
- اگر لازم است دکمه‌ای در مرورگر کلیک شود، agent خودش با browser harness یا CDP کلیک کند.
- اگر لازم است login انجام شود، agent خودش با credential بالا login کند.
- اگر لازم است تست تکرار شود، agent خودش retest کند.
- اگر خطا قابل تشخیص و قابل fix است، agent خودش fix و retest کند.
- تا قبل از مرحله تقویم، برای تأیید گرفتن از کاربر توقف نکند.
- وقتی به مرحله `Calendar / تقویم` رسید، توقف کند و اجازه دهد کاربر بررسی کند یا ادامه را تأیید کند.

ترتیب عملی فعلی برای auto-run:

1. `Letters / نامه‌ها`
2. `Requests / درخواست‌ها`
3. `Workspace / Boards / Cards`
4. توقف قبل از `Calendar / تقویم`

اگر در یک برنامه تست دیگر ترتیب منوها متفاوت بود، باز هم قانون اصلی این است: **هر چیزی قبل از Calendar خودکار انجام شود؛ روی Calendar توقف شود.**

### 0.4 عدم سؤال برای کارهای اجرایی عادی

در این پروژه، کارهای زیر نیاز به سؤال از کاربر ندارند، مگر اینکه خطر حذف/تغییر داده واقعی داشته باشند:

- اجرای smoke test.
- اجرای browser harness.
- restart کردن dev server لوکال در صورت hang یا crash.
- بالا آوردن dev server با heap بیشتر.
- login با credential ادمین تست.
- کلیک روی دکمه‌های تستی در مرورگر خارجی.
- ساخت داده fake با prefix `QA_V12_` یا `QA_V11_`.
- refresh/reload برای تأیید persistence.
- close/archive/reopen فقط روی داده تستی.

کارهایی که همچنان باید با احتیاط انجام شوند:

- حذف داده واقعی.
- اجرای migration destructive.
- commit کردن credential یا secrets.
- اجرای تست روی production به جای localhost.
- تغییرات خارج از scope منوی در حال QA.

---

## 1. اصل کلی رویکرد

رویکرد درست برای این پروژه، تست لایه‌ای است:

1. **Contract قبل از کدنویسی**
   - موجودیت‌ها، statusها، permissionها، routeها و edge caseها مشخص شوند.
   - قبل از UI، معلوم باشد backend چه ورودی می‌گیرد و چه خروجی می‌دهد.

2. **Backend Smoke کنار همان قابلیت**
   - هر route یا قابلیت backend باید همان لحظه یک smoke script داشته باشد.
   - smoke باید login، ساخت business تستی، create/update/list، persistence و cleanup امن را پوشش دهد.

3. **اتصال Frontend فقط بعد از سبز شدن Backend**
   - وقتی smoke backend پاس شد، UI به API وصل شود.
   - اگر بعد از اتصال دکمه‌ای کار نکرد، تمرکز debug روی state/UI/network frontend می‌رود، نه دیتابیس.

4. **Browser Harness بعد از کامل شدن UI**
   - تست مرورگر خارجی باید رفتار انسان را شبیه‌سازی کند: کلیک، تایپ، submit، refresh، mobile، scroll و filter.
   - داده‌های تستی با prefix مشخص مثل `QA_V12_` ساخته شوند.

5. **Final E2E برای اعلام Done**
   - هر منو فقط وقتی done است که API smoke و browser harness هر دو پاس شوند.
   - اگر داده تستی برای audit لازم است، حذف نشود؛ اگر cleanup امن لازم است، فقط داده تستی حذف/close/archive شود.

---

## 2. قواعد تست داده

- همه داده‌های تستی باید prefix قابل جستجو داشته باشند: `QA_V12_<Module>_<timestamp>`.
- داده production واقعی نباید حذف یا دستکاری شود.
- delete فقط وقتی مجاز است که داده قطعاً تستی باشد.
- برای workflowهایی مثل نامه، درخواست، فاکتور و تاییدیه، بهتر است داده تستی حذف نشود و برای audit باقی بماند.
- هر create باید بعد از refresh یا reload مجدد تأیید شود.
- هر edit باید بعد از refresh باقی بماند.
- هر archive/close/reopen باید فقط روی داده تستی انجام شود.

---

## 3. معیار Done برای هر منو

یک منو فقط وقتی کامل است که موارد زیر پاس شود:

- API smoke مستقل پاس شده باشد.
- frontend به API واقعی وصل شده باشد، نه mock.
- browser harness با مرورگر خارجی پاس شده باشد.
- mobile viewport حداقل یک بار تست شده باشد.
- خطای blocker در console/network وجود نداشته باشد.
- داده تستی در دیتابیس یا UI قابل ردیابی باشد.
- نتیجه در `todo-v11.md` یا گزارش QA مربوط ثبت شده باشد.

---

## 4. منوهای دارای Backend و رویکرد هرکدام

### 4.1 Dashboard

**وضعیت backend:** انجام شده.

**APIهای اصلی:**

- `app/api/dashboard/[businessId]/summary/route.ts`
- وابسته به داده‌های business و workspace.

**Smoke موجود:**

- `scripts/meizito-smoke-dashboard.ts`

**رویکرد تست:**

- ابتدا login و business context تست شود.
- سپس summary API تست شود.
- تعداد افراد، chart data، production status و نام business بررسی شود.
- بعد از ساخت board در workspace، dashboard باید آن را در summary منعکس کند.
- browser harness باید باز شدن dashboard، نمایش کارت‌ها، chartها، warningهای console و responsive را بررسی کند.

**ریسک‌ها:**

- dashboard معمولاً aggregate است؛ اگر داده زیرسیستم‌ها خراب باشد، dashboard هم اشتباه دیده می‌شود.
- warningهای chart مثل width/height باید monitor شوند، حتی اگر blocker نیستند.

---

### 4.2 Workspace / Boards / Cards

**وضعیت backend:** انجام شده.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/workspace/route.ts`
- `app/api/meizito/[businessId]/boards/route.ts`
- `app/api/meizito/[businessId]/boards/[boardId]/route.ts`
- `app/api/meizito/[businessId]/boards/[boardId]/columns/route.ts`
- `app/api/meizito/[businessId]/cards/route.ts`
- `app/api/meizito/[businessId]/cards/[cardId]/route.ts`
- `app/api/meizito/[businessId]/card-move/route.ts`
- `app/api/meizito/[businessId]/card-search/route.ts`

**Smoke موجود:**

- `scripts/meizito-smoke-workspace.ts`

**رویکرد تست backend:**

- ساخت board.
- ساخت column پیش‌فرض یا column جدید.
- ساخت card.
- move card بین columnها.
- patch board.
- search card.
- بررسی persistence در DB.

**رویکرد تست frontend:**

- ساخت task با `QA_V12_Task_<timestamp>`.
- اگر board ستون ندارد، UI باید default column بسازد یا پیام قابل فهم بدهد.
- task باید بعد از refresh باقی بماند.
- edit title/description/due date/assignee/labels تست شود.
- horizontal scroll board تست شود.
- mobile board و modal تست شود.

**ریسک‌ها:**

- drag/drop در harness ممکن است brittle باشد؛ بهتر است API move هم smoke شود و UI move جداگانه با selector دقیق تست شود.
- اگر buttonهای hidden در DOM باشند، harness باید فقط visible element را کلیک کند.

---

### 4.3 Projects

**وضعیت backend:** انجام شده، زیرمجموعه workspace.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/projects/route.ts`
- `app/api/meizito/[businessId]/projects/[projectId]/route.ts`

**Smoke موجود:**

- در `scripts/meizito-smoke-workspace.ts` پوشش داده شده.

**رویکرد تست:**

- ساخت project با memberIds و boardId.
- بررسی تولید یا ذخیره `ncFolderPath`.
- edit project.
- اتصال project به board.
- در UI، ساخت project، مشاهده در لیست، refresh persistence و mobile تست شود.

**ریسک‌ها:**

- وابستگی به Nextcloud path یا folder reference باید جداگانه تست شود.
- اگر project به board وصل است، حذف/ویرایش board نباید project را orphan کند.

---

### 4.4 Notes / Starred

**وضعیت backend:** انجام شده، زیرمجموعه workspace.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/note-boards/route.ts`
- `app/api/meizito/[businessId]/notes/route.ts`
- `app/api/meizito/[businessId]/notes/[noteId]/route.ts`

**Smoke موجود:**

- در `scripts/meizito-smoke-workspace.ts` پوشش داده شده.

**رویکرد تست:**

- ساخت note-board.
- ساخت note.
- patch note برای starred.
- مشاهده note در Notes و Starred.
- refresh persistence.
- mobile layout.

**ریسک‌ها:**

- Starred یک نمای مشتق‌شده است؛ باید هم note اصلی و هم نمایش starred تست شود.
- اگر color یا boardId تغییر کند، باید در snapshot workspace هم درست بماند.

---

### 4.5 Reports داخل Meizito

**وضعیت backend:** انجام شده، زیرمجموعه workspace.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/daily-reports/route.ts`
- `app/api/meizito/[businessId]/daily-reports/[reportId]/route.ts`
- `app/api/meizito/[businessId]/daily-reports/[reportId]/feedback/route.ts`
- `app/api/meizito/[businessId]/field-visits/route.ts`
- `app/api/meizito/[businessId]/field-visits/[visitId]/route.ts`

**Smoke موجود:**

- در `scripts/meizito-smoke-workspace.ts` پوشش داده شده.

**رویکرد تست:**

- ساخت daily report.
- submit report.
- feedback report.
- ساخت field visit.
- حذف امن field visit فقط برای داده تستی.
- در UI، tabs گزارش، فرم، status، refresh و mobile تست شود.

**ریسک‌ها:**

- گزارش‌ها معمولاً audit-sensitive هستند؛ حذف نهایی نباید روی داده واقعی انجام شود.
- تاریخ‌ها باید با timezone/format سازگار باشند.

---

### 4.6 Requests / درخواست‌ها

**وضعیت backend:** انجام شده.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/requests/route.ts`
- `app/api/meizito/[businessId]/request-approval/route.ts`
- `app/api/meizito/[businessId]/request-update/route.ts`
- `app/api/meizito/[businessId]/pending-approvals/route.ts`

**Smoke موجود:**

- `scripts/meizito-smoke-requests.ts`

**رویکرد تست backend:**

- ساخت draft.
- submit draft.
- approve draft.
- ساخت request با submit همزمان.
- pending approvals.
- close.
- reopen.
- list.

**رویکرد تست frontend:**

- ساخت request با `QA_V12_Request_<timestamp>`.
- انتخاب category/priority/referral.
- submit برای approval.
- بررسی list، badge، filter و status.
- refresh persistence.
- close/reopen فقط روی داده تستی.
- mobile form/list.

**ریسک‌ها:**

- approval flow باید با کاربر فعلی و assignee واقعی تست شود.
- اگر UI فوراً state را reset کند ولی backend هنوز جواب نداده باشد، همان باگ async نامه‌ها تکرار می‌شود.

---

### 4.7 Letters / نامه‌ها

**وضعیت backend:** انجام شده. API smoke کامل پاس شده است. browser QA تقریباً کامل است ولی نیاز به اجرای نهایی پایدار دارد.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/letters/route.ts`
- `app/api/meizito/[businessId]/letter-reply/route.ts`
- `app/api/meizito/[businessId]/letter-approval/route.ts`
- `app/api/meizito/[businessId]/letter-update/route.ts`
- `app/api/meizito/[businessId]/pending-approvals/route.ts`

**Smoke موجود:**

- `scripts/meizito-smoke-letters.ts`

**Browser harness موجود:**

- `scripts/qa-browser-v11-letters.ts`

**ایرادهای پیدا شده تا اینجا:**

- `addLetter` و `replyToLetter` در frontend async/promise-safe نبودند.
- UI بعد از ارسال نامه در inbox می‌ماند، در حالی که نامه در outbox ساخته می‌شد.
- runner روی elementهای hidden یا متن‌های مشابه مثل `پاسخ` اشتباه کلیک می‌کرد.
- dev server در اجرای سنگین browser QA با `JavaScript heap out of memory` کرش کرد.

**اصلاحات انجام‌شده:**

- در `src/context/MeizitoContext.tsx`:
  - `addLetter` async شد.
  - `replyToLetter` async شد.
  - هر دو id نامه ساخته‌شده را برمی‌گردانند.

- در `src/views/meizito/panels/LettersPanel.tsx`:
  - `submitLetter` async شد.
  - `submitting` و `submitError` اضافه شد.
  - بعد از ارسال موفق، box روی `outbox` تنظیم می‌شود.
  - فیلترها reset می‌شوند.

- در `scripts/qa-browser-v11-letters.ts`:
  - login با API و cookie پایدار شد.
  - clickها visible-aware شدند.
  - actionها داخل کارت همان subject scoped شدند.
  - wait روی input value و API polling اضافه شد.

**رویکرد نهایی تست:**

- dev server با heap بالاتر اجرا شود:
  - `NODE_OPTIONS=--max-old-space-size=4096`
- اول API smoke:
  - `npm run test:meizito:letters`
- بعد browser harness:
  - `QA_BASE_URL=http://localhost:3000 QA_HEADFUL=1 npx tsx scripts/qa-browser-v11-letters.ts`
- نتیجه در `todo-v11.md` ثبت شود.

**ریسک‌ها:**

- نامه‌ها audit-sensitive هستند؛ داده تستی بهتر است حذف نشود.
- reply/thread باید هم API-level و هم UI-level تست شود.
- reload زودهنگام می‌تواند request را abort کند؛ harness باید قبل از reload persistence را تأیید کند.

---

### 4.8 Calendar / تقویم

**وضعیت backend:** انجام شده.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/calendar/route.ts`
- `app/api/meizito/[businessId]/calendars/route.ts`
- `app/api/meizito/[businessId]/calendar-update/route.ts`
- `app/api/meizito/[businessId]/calendar-events/route.ts`
- `app/api/meizito/[businessId]/calendar-event-update/route.ts`
- `app/api/meizito/[businessId]/calendar-event-rsvp/route.ts`
- `app/api/meizito/[businessId]/calendar-events-sync-from-cards/route.ts`

**Smoke موجود:**

- `scripts/meizito-smoke-calendar.ts`

**رویکرد تست backend:**

- بررسی default calendars مثل task/customer.
- ساخت calendar سفارشی.
- ساخت event.
- update calendar sharing.
- ساخت card با due date.
- sync event از card.
- RSVP.
- edit event.
- delete event تستی.

**رویکرد تست frontend:**

- ساخت event با `QA_V12_Event_<timestamp>`.
- مشاهده در calendar.
- refresh persistence.
- edit title/date/time.
- RSVP اگر UI دارد.
- sync با task/card.
- mobile calendar layout.

**ریسک‌ها:**

- تاریخ و زمان باید با timezone و فرمت فارسی/میلادی سازگار بمانند.
- eventهای ساخته‌شده از card نباید duplicate شوند.

---

### 4.9 Chat / گفتگوها

**وضعیت backend:** انجام شده.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/chat/route.ts`
- `app/api/meizito/[businessId]/chat-threads/route.ts`
- `app/api/meizito/[businessId]/chat-messages/route.ts`
- `app/api/meizito/[businessId]/chat-thread-update/route.ts`
- `app/api/meizito/[businessId]/chat-message-update/route.ts`

**Smoke موجود:**

- `scripts/meizito-smoke-chat.ts`

**رویکرد تست backend:**

- ساخت thread.
- ساخت message.
- pin/star thread.
- edit message.
- list و بررسی messageIds.

**رویکرد تست frontend:**

- اگر thread وجود ندارد، UI باید امکان ساخت thread بدهد.
- ارسال پیام `QA_V12_Message_<timestamp>`.
- ارسال با Enter و دکمه send جداگانه تست شود.
- refresh persistence.
- edit message.
- pin/star thread.
- mobile chat layout.

**ریسک‌ها:**

- اگر composer فقط وقتی thread فعال است نمایش داده شود، harness باید اول thread بسازد.
- ارسال با Enter ممکن است با IME/RTL رفتار متفاوت داشته باشد.

---

### 4.10 Phone Directory / دفتر تلفن

**وضعیت backend:** انجام شده.

**APIهای اصلی:**

- `app/api/meizito/[businessId]/team-directory/route.ts`
- `app/api/meizito/[businessId]/members/[userId]/profile/route.ts`

**Smoke موجود:**

- `scripts/meizito-smoke-phone.ts`

**رویکرد تست backend:**

- list members.
- patch profile.
- filter managers.
- search با شماره موبایل.
- DB persistence.

**رویکرد تست frontend:**

- جستجوی نام/شماره.
- filter managers/departments.
- edit profile اگر UI دارد.
- refresh persistence.
- mobile card/list.

**ریسک‌ها:**

- اطلاعات تماس حساس است؛ تست‌ها باید از شماره fake استفاده کنند.
- search باید روی name/mobile/extension تست شود.

---

### 4.11 Comms Hub / ارتباطات

**وضعیت backend:** مستقیم و مستقل نیست؛ hub روی chat، letters، requests، calendar و phone سوار است.

**رویکرد تست:**

- این منو خودش CRUD ندارد.
- باید navigation و badge/countها را تست کند.
- هر shortcut باید به منوی درست برود.
- اگر یک زیرمنو داده جدید دارد، hub باید count یا status درست نشان دهد.

**ریسک‌ها:**

- چون derived است، fail آن ممکن است از زیرسیستم‌ها باشد نه خود hub.

---

## 5. منوهایی که Backend کامل ندارند یا باید جدا ساخته شوند

### 5.1 Sales / فروش و درآمد

**وضعیت:** frontend/mock یا backend اختصاصی کامل ندارد.

**پیشنهاد backend:**

- SalesInvoice
- SalesInvoiceItem
- SalesReturn
- InstallmentContract
- IncomeType
- PaymentRecord
- TaxSnapshot

**Routeهای پیشنهادی:**

- `GET /api/sales/[businessId]/summary`
- `GET/POST /api/sales/[businessId]/invoices`
- `PATCH /api/sales/[businessId]/invoices/[invoiceId]`
- `POST /api/sales/[businessId]/returns`
- `GET/POST /api/sales/[businessId]/installments`
- `POST /api/sales/[businessId]/payments`

**Smoke لازم:**

- ساخت فاکتور draft.
- افزودن item.
- محاسبه subtotal/tax/total.
- approve invoice.
- ثبت payment.
- ساخت return از روی invoice.
- قرارداد اقساطی و due dates.
- list/filter/search.

**Browser QA:**

- ساخت فاکتور فروش.
- چاپ/preview اگر UI دارد.
- برگشت از فروش.
- قرارداد اقساطی.
- refresh persistence.
- mobile form.

---

### 5.2 Products / کالاها و قیمت‌ها

**وضعیت:** frontend گسترده دارد، backend اختصاصی کامل مشخص نیست.

**پیشنهاد backend:**

- Product
- ProductVariant
- ProductCategory
- PriceList
- ProductPrice
- TaxConfig
- InventorySnapshot
- Supplier/Customer relation

**Routeهای پیشنهادی:**

- `GET/POST /api/products/[businessId]/products`
- `PATCH /api/products/[businessId]/products/[productId]`
- `GET/POST /api/products/[businessId]/categories`
- `GET/POST /api/products/[businessId]/price-lists`
- `PATCH /api/products/[businessId]/prices`

**Smoke لازم:**

- ساخت product.
- set price در چند price list.
- tax on/off.
- edit product.
- search/filter.
- persistence.

**Browser QA:**

- create/edit product.
- tabs قیمت/مالیات/موجودی.
- search.
- mobile.

---

### 5.3 Production / تولید

**وضعیت:** frontend دارد، backend کامل مشخص نیست.

**پیشنهاد backend:**

- ProductionFormula
- FormulaMaterial
- ProductionOrder
- WorkOrder
- MaterialRequirement
- ProductionStatusLog

**Routeهای پیشنهادی:**

- `GET/POST /api/production/[businessId]/formulas`
- `PATCH /api/production/[businessId]/formulas/[formulaId]`
- `GET/POST /api/production/[businessId]/production-orders`
- `GET/POST /api/production/[businessId]/work-orders`
- `PATCH /api/production/[businessId]/work-orders/[workOrderId]`

**Smoke لازم:**

- ساخت formula.
- افزودن مواد اولیه.
- ساخت production order.
- تبدیل order به work order.
- تغییر status.
- محاسبه نیاز مواد.

**Browser QA:**

- فرم تولید.
- لیست فرمول.
- سفارش تولید.
- دستور تولید.
- status transitions.
- mobile.

---

### 5.4 Finance / مالی

**وضعیت:** frontend/mock دارد، backend کامل مشخص نیست.

**پیشنهاد backend:**

- FinancialTransaction
- Settlement
- Cashbox
- PettyCash
- Payable
- Receivable
- LedgerEntry

**Routeهای پیشنهادی:**

- `GET /api/finance/[businessId]/summary`
- `GET/POST /api/finance/[businessId]/transactions`
- `GET/POST /api/finance/[businessId]/settlements`
- `GET/POST /api/finance/[businessId]/cashboxes`
- `PATCH /api/finance/[businessId]/transactions/[transactionId]`

**Smoke لازم:**

- ثبت transaction.
- approve/reject.
- settlement فروشنده/سهم فروش.
- cashbox update.
- گزارش summary.

**Browser QA:**

- ثبت تراکنش.
- مشاهده در لیست.
- فیلتر status/type.
- گزارش مالی.
- mobile.

**ریسک:**

- مالی حساس‌ترین بخش است؛ audit log و idempotency ضروری است.

---

### 5.5 Banking

**وضعیت:** frontend/mock دارد، backend کامل مشخص نیست.

**پیشنهاد backend:**

- BankAccount
- BankTransaction
- Check
- Reconciliation

**Routeهای پیشنهادی:**

- `GET/POST /api/banking/[businessId]/accounts`
- `GET/POST /api/banking/[businessId]/transactions`
- `GET/POST /api/banking/[businessId]/checks`
- `PATCH /api/banking/[businessId]/checks/[checkId]`

**Smoke لازم:**

- ساخت حساب.
- ثبت تراکنش.
- ثبت چک.
- تغییر وضعیت چک.
- reconciliation ساده.

---

### 5.6 HR / سازمان

**وضعیت:** frontend/mock دارد، backend کامل مشخص نیست.

**پیشنهاد backend:**

- Employee
- Attendance
- HRRequest
- Department
- PerformanceRecord

**Routeهای پیشنهادی:**

- `GET/POST /api/hr/[businessId]/employees`
- `GET/POST /api/hr/[businessId]/requests`
- `PATCH /api/hr/[businessId]/requests/[requestId]`
- `GET/POST /api/hr/[businessId]/attendance`

**Smoke لازم:**

- ساخت employee.
- ثبت attendance.
- ساخت request.
- approve/reject request.
- filter by department.

---

### 5.7 CRM / Marketing / Sales Network / After Sales

**وضعیت:** frontend/mock یا نیمه‌نمایشی.

**پیشنهاد backend مشترک:**

- Customer
- Lead
- Opportunity
- Campaign
- Survey
- SalesAgent
- Branch
- ServiceTicket
- FollowUp

**رویکرد ساخت:**

- اول Customer/Lead مشترک ساخته شود.
- بعد CRM روی آن سوار شود.
- Marketing از campaign/survey استفاده کند.
- Sales Network از branch/agent استفاده کند.
- After Sales از service ticket استفاده کند.

**Smoke لازم:**

- lead create/update.
- convert lead to customer.
- create campaign.
- create ticket.
- assign ticket.
- close ticket.

---

### 5.8 Automation / Workflows

**وضعیت:** frontend/mock دارد، backend کامل مشخص نیست.

**پیشنهاد backend:**

- Workflow
- Trigger
- Action
- WorkflowRun
- WorkflowLog

**Routeهای پیشنهادی:**

- `GET/POST /api/automation/[businessId]/workflows`
- `PATCH /api/automation/[businessId]/workflows/[workflowId]`
- `POST /api/automation/[businessId]/workflows/[workflowId]/run`
- `GET /api/automation/[businessId]/logs`

**Smoke لازم:**

- ساخت workflow.
- enable/disable.
- run دستی.
- ثبت log.
- failure handling.

**ریسک:**

- automation نباید روی داده واقعی destructive action بزند.
- تست‌ها باید sandboxed باشند.

---

### 5.9 Store Admin

**وضعیت:** frontend/mock دارد، backend کامل مشخص نیست.

**پیشنهاد backend:**

- StoreProduct
- StoreOrder
- StoreSettings
- StoreAnalytics

**Routeهای پیشنهادی:**

- `GET/POST /api/store/[businessId]/products`
- `GET /api/store/[businessId]/orders`
- `PATCH /api/store/[businessId]/settings`
- `GET /api/store/[businessId]/analytics`

**Smoke لازم:**

- ساخت محصول فروشگاه.
- تغییر setting.
- list orders.
- analytics summary.

---

### 5.10 Reports عمومی

**وضعیت:** بخشی از dashboard backend دارد، اما گزارش‌های عمومی فروش/تولید/مالی احتمالاً mock هستند.

**رویکرد پیشنهادی:**

- Reports نباید source of truth داشته باشد.
- باید از APIهای Sales/Production/Finance داده بگیرد.
- وقتی backend آن بخش‌ها کامل شدند، reports روی aggregation آنها ساخته شود.

**Smoke لازم:**

- seed داده در sales/production/finance.
- call report API.
- مقایسه عدد summary با داده خام.

---

## 6. ترتیب پیشنهادی ادامه پروژه

### مرحله 1 — تثبیت منوهای API شده

1. Letters browser QA نهایی.
2. Requests full browser data QA.
3. Workspace full browser data QA.
4. Calendar full browser data QA.
5. Chat full browser data QA.
6. Phone full browser data QA.
7. Dashboard aggregate QA.

هدف این مرحله این است که تمام sliceهایی که `api` شده‌اند واقعاً قابل اعتماد شوند.

---

### مرحله 2 — ساخت backend برای منوهای کوچک‌تر

ترتیب پیشنهادی:

1. Products
2. Sales
3. Production
4. Finance
5. Banking

دلیل:

- Products پایه Sales و Production است.
- Sales به Products نیاز دارد.
- Production به Products/material نیاز دارد.
- Finance به Sales/Banking وابسته می‌شود.

---

### مرحله 3 — سازمان و ارتباط با مشتری

1. HR
2. CRM
3. Sales Network
4. After Sales
5. Marketing

دلیل:

- این‌ها روی people/customer/employee مشترک هستند.
- بهتر است اول مدل‌های مشترک ساخته شوند.

---

### مرحله 4 — Automation و Reports

1. Automation
2. General Reports

دلیل:

- Automation باید روی زیرسیستم‌های پایدار سوار شود.
- Reports باید از داده واقعی زیرسیستم‌ها aggregate بگیرد.

---

## 7. الگوی ثابت Smoke Script برای هر backend جدید

هر smoke script باید این ساختار را داشته باشد:

1. login با کاربر تست.
2. ساخت business تستی یا استفاده از sandbox business.
3. ساخت داده با prefix.
4. list و assert.
5. update و assert.
6. workflow action مثل approve/close/submit.
7. refresh/list مجدد.
8. DB persistence check فقط برای رکوردهای تستی.
9. cleanup امن یا باقی گذاشتن audit data.

نام‌گذاری پیشنهادی:

- `scripts/<module>-smoke.ts`
- نمونه:
  - `scripts/sales-smoke.ts`
  - `scripts/products-smoke.ts`
  - `scripts/production-smoke.ts`
  - `scripts/finance-smoke.ts`

---

## 8. الگوی ثابت Browser Harness

Browser harness فقط بعد از پاس شدن smoke backend نوشته یا اجرا شود.

باید تست کند:

- login
- navigation
- create
- UI feedback/loading
- duplicate click prevention
- list visibility
- search/filter
- edit/update
- refresh persistence
- mobile viewport
- console/network errors

قواعد مهم:

- فقط browser خارجی استفاده شود.
- click باید visible-aware باشد.
- اگر متن مشابه چند جا وجود دارد، action باید scoped به کارت/فرم همان رکورد باشد.
- قبل از reload، API یا UI persistence تأیید شود تا request abort نشود.
- برای Next/Turbopack در تست‌های سنگین، dev server با heap بالاتر اجرا شود:
  - `NODE_OPTIONS=--max-old-space-size=4096`

---

## 9. نتیجه عملی

وضعیت فعلی پروژه برای Meizito خوب است، چون backend شش slice اصلی `api` شده و smoke scriptهای جدا دارد. مشکل اصلی باقی‌مانده این است که browser QA کامل برای همه منوها هنوز به صورت رسمی بسته نشده است.

اولویت فوری:

1. نهایی کردن Letters browser QA.
2. ثبت نتیجه در `todo-v11.md`.
3. اجرای full browser QA برای Requests، Workspace، Calendar، Chat و Phone.
4. بعد از تثبیت این‌ها، شروع backend منوهای بزرگ‌تر مثل Products/Sales/Production.

اصل راهبردی:

**هیچ منویی فقط با ظاهر frontend کامل محسوب نمی‌شود، و هیچ backendای فقط با پاس شدن API کامل محسوب نمی‌شود. تکمیل واقعی یعنی API smoke + browser behavior + persistence + mobile.**
