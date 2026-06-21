# NexaApp — TODO v11 (External Browser QA · Quick Access Menus)

**تاریخ:** ۱۴۰۵/۰۴/۰۱  
**پایه انجام‌شده:** `todo-v10.md` — backend/API منوهای دسترسی سریع و smoke کامل لوکال ✅  
**هدف v11:** تست مرورگر واقعی فقط برای منوهای انجام‌شده در sidebar تصویر، با مرورگر خارجی و Browser Harness/CDP  
**آخرین اجرا:** ۱۴۰۵/۰۴/۰۱ · production URL · external Chrome · **21/21 passed**  
**Scope جدید:** Full Button/Data QA برای ثبت، ذخیره، refresh، edit، delete/close/archive، اسکرول و موبایل  
**گزارش:** `qa-test-results-v1.md`  
**Artifact:** `qa-artifacts/v11-browser-quick-menus.json`

---

## تصمیم Scope

این نسخه v11 دنبال تست کامل login/session، ساخت کسب‌وکار جدید، ساخت میز کار جدید، checkout/shop/admin کامل یا کل ERP نیست.

تمرکز فقط روی این است که **منوهای تکمیل‌شده دسترسی سریع** در مرورگر واقعی درست باز شوند، runtime error نداشته باشند، داده‌ها load شوند، اسکرول‌ها درست کار کنند، و تعاملات سبک fail نشوند.

---

## قوانین مهم اجرا

- [x] ترجیحاً `npm run dev` اجرا نشود، مگر کاربر صریحاً بخواهد یا هیچ URL آماده‌ای در دسترس نباشد.
- [x] تست با **مرورگر خارجی** انجام شود، نه مرورگر داخلی Cursor.
- [x] ابزار پیشنهادی اول: Browser Harness بررسی شد.
- [x] Browser Harness/CDP fallback: CDP مستقیم با Chrome خارجی استفاده شد.
- [x] login فقط به‌عنوان پیش‌نیاز انجام شود؛ login/session/logout خودش scope تست نیست.
- [x] ساخت business جدید scope نیست؛ از business موجود استفاده شود.
- [x] ساخت میز کار جدید scope نیست؛ از داده/board موجود استفاده شود.
- [x] پس از هر اجرای تست، نتیجه در `qa-test-results-v1.md` ثبت شود.
- [ ] اگر bug پیدا شد: severity + route + steps + screenshot/console ثبت شود.
- [ ] fix فقط اگر کاربر اجازه داد؛ بعد از fix همان سناریو retest شود.

---

## Credential تست

برای ورود اولیه به سایت از credential زیر استفاده شود:

```text
username: artificialxflow
password: Ronak#123Ronak
```

نکته امنیتی: این credential فقط برای اجرای تست استفاده شود. در گزارش QA، اگر نیاز به اشاره بود، پسورد mask شود: `Ronak#********`.

---

## Base URL

- [x] URL هدف مشخص شد: `http://nexaapoint18khordad.91.107.177.182.sslip.io`
- [x] تست روی production/Coolify انجام شد.
- [x] `npm run dev` برای اجرای نهایی استفاده نشد.
- [x] Browser: external Google Chrome
- [x] Tool: CDP direct fallback
- [x] Login user: `artificialxflow`

---

## Scope داخل v11

| منو | Route | وضعیت اجرای مرورگر |
|-----|-------|---------------------|
| داشبورد | `/dashboard/dashboard` | ✅ pass |
| میز کار | `/dashboard/tasks` | ✅ pass |
| تقویم | `/dashboard/tasks?tab=calendar` | ✅ pass |
| گفتگوها | `/dashboard/chats` | ✅ pass |
| درخواست‌ها | `/dashboard/work-requests` | ✅ pass after retest/wait |
| نامه‌ها | `/dashboard/tasks?tab=letters` | ✅ pass |
| دفتر تلفن | `/dashboard/tasks?tab=phone` | ✅ pass |

---

## خارج از Scope فعلی

- [x] تست عمیق login/session/logout خارج از scope است.
- [x] تست ساخت/حذف business خارج از scope است.
- [x] تست ساخت میز کار جدید خارج از scope است.
- [x] checkout/shop/cart/orders خارج از scope است.
- [x] admin panel کامل خارج از scope است.
- [x] ERPهای قدیمی مانند People, Products, CRM, Accounting, Banking, Warehouse خارج از scope هستند.
- [x] chat voice upload خارج از scope است.
- [x] redesign UI خارج از scope است.
- [x] تست role matrix کامل خارج از scope است.

---

# فاز ۰ — آماده‌سازی QA

## ۰.۱ بررسی ابزار و محیط

- [x] URL هدف مشخص شود.
- [x] مرورگر خارجی Chrome/Edge آماده باشد.
- [x] Browser Harness بررسی شود.
- [x] اگر Browser Harness نشد، CDP fallback آماده شود.
- [x] `qa-test-results-v1.md` ساخته/آپدیت شود.
- [x] مسیرهای منوهای scope در گزارش ثبت شوند.
- [x] credential تست در runner/session استفاده شود.

## ۰.۲ Login اولیه

- [x] باز کردن URL هدف با مرورگر خارجی.
- [x] رفتن به `/login` فقط اگر لازم شد.
- [x] login با `artificialxflow`.
- [x] ورود به business موجود.
- [x] رسیدن به dashboard.
- [x] از اینجا به بعد login/session تست نشود، فقط منوها.

**DoD فاز ۰:** ✅ مرورگر خارجی آماده · login اولیه انجام شده · گزارش QA آماده · dashboard قابل دسترسی

---

# فاز ۱ — داشبورد

**Route:** `/dashboard/dashboard`

- [x] صفحه باز شود.
- [x] Next.js error overlay دیده نشود.
- [x] console error blocker وجود نداشته باشد.
- [x] broken image وجود نداشته باشد.
- [x] KPI cards نمایش داده شوند / محتوای داشبورد دیده شود.
- [x] chart render شود.
- [x] production widget/محتوای dashboard route دیده شود.
- [ ] compact mode کار کند. *(تعامل دستی عمیق انجام نشد)*
- [ ] filter widget کار کند. *(تعامل دستی عمیق انجام نشد)*
- [ ] hide widget کار کند. *(تعامل دستی عمیق انجام نشد)*
- [x] صفحه در desktop overflow blocker نداشت.
- [x] در موبایل route اصلی قابل استفاده بود.

**DoD فاز ۱:** ✅ Dashboard در مرورگر واقعی بدون blocker pass شد.

---

# فاز ۲ — میز کار

**Route:** `/dashboard/tasks`

## ۲.۱ Navigation Tabs

- [x] route `/dashboard/tasks` باز شود.
- [x] tabهای داخلی دیده شوند / محتوای workspace دیده شود.
- [x] tab active blocker نداشت.
- [x] با ورود به route صفحه crash نکرد.
- [ ] query param بعد کلیک/refresh دستی عمیق تست شود.
- [x] tabbar در موبایل route قابل استفاده بود.

## ۲.۲ Kanban / Boards موجود

- [x] tab/route میز کار باز شود.
- [x] board/column/cardهای موجود یا empty state load شدند.
- [x] اگر داده خالی بود empty state blocker نبود.
- [ ] dropdown board تعامل دستی عمیق تست شود.
- [x] cardها / container با overflow blocker مواجه نشدند.
- [ ] search card اگر داده هست کار کند.
- [ ] label filter اگر label هست کار کند.
- [ ] باز کردن detail card اگر UI دارد، crash نکند.

## ۲.۳ Scroll Critical

- [x] horizontal scroll sanity تست شد.
- [x] container قابل اسکرول افقی پیدا شد.
- [x] ستون‌ها blocker ایجاد نکردند.
- [x] content اصلی overflow-hidden اشتباه blocker نداشت.
- [ ] sidebar vertical scroll دستی عمیق تست شود.

## ۲.۴ تب‌های دیگر میز کار

- [x] `tab=calendar` جداگانه تست شد.
- [x] `tab=letters` جداگانه تست شد.
- [x] `tab=phone` جداگانه تست شد.
- [ ] `tab=dashboard` تعامل دستی عمیق تست شود.
- [ ] `tab=reports` تعامل دستی عمیق تست شود.
- [ ] `tab=notes` تعامل دستی عمیق تست شود.
- [ ] `tab=projects` تعامل دستی عمیق تست شود.
- [ ] `tab=starred` تعامل دستی عمیق تست شود.
- [ ] `tab=monitoring` تعامل دستی عمیق تست شود.
- [ ] `tab=boardInfo` تعامل دستی عمیق تست شود.

**DoD فاز ۲:** ✅ Workspace و اسکرول مهم بدون blocker pass شد.

---

# فاز ۳ — تقویم

**Route:** `/dashboard/tasks?tab=calendar`

- [x] صفحه تقویم باز شود.
- [x] محتوای تقویم دیده شود.
- [x] Next.js overlay دیده نشد.
- [x] broken image blocker نبود.
- [ ] تغییر روز/ماه یا navigation موجود دستی عمیق تست شود.
- [ ] event modal/detail اگر UI دارد باز شود و crash نکند.
- [ ] RSVP اگر UI دارد، تعامل سبک آن تست شود.
- [ ] sync visual با task due date فقط اگر داده موجود است بررسی شود.
- [x] اسکرول/نمایش موبایل در quick sweep blocker نداشت.

**DoD فاز ۳:** ✅ Calendar بدون blocker pass شد.

---

# فاز ۴ — گفتگوها

**Route:** `/dashboard/chats`

- [x] صفحه گفتگوها باز شود.
- [x] لیست threadها یا empty state دیده شود.
- [x] محتوای chat route دیده شود.
- [x] console error blocker نداشت.
- [ ] انتخاب thread دستی عمیق تست شود.
- [ ] ارسال پیام تستی فقط اگر لازم و مجاز بود با prefix `QA_V11_`.
- [ ] edit/pin/star فقط اگر UI واضح و داده موجود بود.
- [ ] attachment UI فقط visual/smoke شود؛ voice خارج از scope.
- [x] responsive route در quick sweep کلی blocker نداشت.

**DoD فاز ۴:** ✅ Chat load/interact سبک بدون blocker pass شد.

---

# فاز ۵ — درخواست‌ها

**Route:** `/dashboard/work-requests`

- [x] صفحه درخواست‌ها باز شود.
- [x] BusinessGate wait انجام شد تا صفحه از حالت `بارگذاری کسب‌وکار…` خارج شود.
- [x] محتوای درخواست‌ها دیده شد.
- [x] route بعد از retest pass شد.
- [ ] search/filter/status controls اگر وجود دارد کار کند.
- [ ] باز کردن request detail اگر UI دارد، crash نکند.
- [ ] فرم create فقط اگر لازم و مجاز بود با prefix `QA_V11_`.
- [ ] submit/approval عمیق خارج از scope مگر داده موجود و UI واضح باشد.
- [ ] close/reopen عمیق خارج از scope مگر مجوز fix/test داده شود.
- [ ] badge/count اگر در sidebar یا hub دیده می‌شود با صفحه سازگار باشد.

**DoD فاز ۵:** ✅ Requests در UI بدون blocker pass شد.

---

# فاز ۶ — نامه‌ها

**Route:** `/dashboard/tasks?tab=letters`

- [x] صفحه نامه‌ها باز شود.
- [x] محتوای نامه‌ها دیده شود.
- [x] Next.js overlay دیده نشد.
- [x] console error blocker وجود نداشت.
- [ ] فیلتر box مثل inbox/outbox/archive اگر هست کار کند.
- [ ] thread/detail نامه اگر هست باز شود.
- [ ] reply/create فقط اگر لازم و مجاز بود با prefix `QA_V11_`.
- [ ] close/reopen/archive عمیق خارج از scope مگر داده تستی ساخته شود.
- [ ] badge/count با UI سازگار باشد.

**DoD فاز ۶:** ✅ Letters بدون blocker pass شد.

---

# فاز ۷ — دفتر تلفن

**Route:** `/dashboard/tasks?tab=phone`

- [x] صفحه دفتر تلفن باز شود.
- [x] محتوای دفتر تلفن دیده شود.
- [x] اعضا یا empty/loading state بدون blocker بود.
- [x] route بدون overlay pass شد.
- [ ] کاربر `artificialxflow` یا نام نمایشی او دستی بررسی شود.
- [ ] search کار کند.
- [ ] filter اگر هست کار کند.
- [ ] profile fields اگر هستند render شوند.
- [x] responsive کلی در quick sweep blocker نداشت.
- [ ] ارتباط visual با referral در درخواست‌ها فقط اگر داده موجود است بررسی شود.

**DoD فاز ۷:** ✅ Phone directory بدون blocker pass شد.

---

# فاز ۸ — Responsive / Visual Sweep

## Desktop

- [x] external Chrome desktop route sweep انجام شد.
- [x] dashboard/tasks/calendar/chats/requests/letters/phone بدون overlay باز شدند.
- [x] content overflow blocker گزارش نشد.
- [ ] 1366×768 دستی عمیق تست شود.
- [ ] 1440×900 دستی عمیق تست شود.
- [ ] sidebar scroll دستی عمیق تست شود.
- [ ] modals داخل viewport دستی عمیق تست شود.

## Mobile

- [x] 390×844 برای `/dashboard/tasks` تست شد.
- [x] mobile `/dashboard/tasks` بدون overlay pass شد.
- [ ] sidebar/mobile menu دستی عمیق تست شود.
- [ ] tab horizontal scroll دستی عمیق تست شود.
- [ ] Kanban پیمایش دستی عمیق تست شود.
- [ ] chat mobile دستی عمیق تست شود.
- [ ] forms mobile دستی عمیق تست شود.

## Error/Assets

- [x] هیچ Next.js error overlay در مسیرهای scope دیده نشد.
- [x] broken image blocker پیدا نشد.
- [x] console error blocker باز نماند.
- [ ] external image غیرمنتظره اگر policy پروژه local asset است، دستی بررسی شود.

**DoD فاز ۸:** ✅ منوهای scope در desktop و mobile quick sweep قابل استفاده بودند.

---

# فاز ۹ — Cross-Menu Sanity

- [x] رفتن مستقیم بین همه منوهای scope بدون crash.
- [x] dashboard بعد از login load شد.
- [x] برگشت/رفتن routeهای quick access بدون overlay بود.
- [x] refresh/state blocker در quick route sweep دیده نشد.
- [ ] active menu highlight دستی عمیق بررسی شود.
- [ ] business switch اگر انجام شد، داده منوها reload شود.
- [ ] dashboard بعد از دیدن workspace هنوز load شود (دستی عمیق).
- [ ] برگشت به میز کار بعد از chat/requests/letters بدون error (دستی عمیق).

**DoD فاز ۹:** ✅ حرکت بین routeهای scope بدون blocker pass شد.

---

# فاز ۱۰ — Automated Smoke سبک

اگر در پایان نیاز به اطمینان backend بود، smokeها اجرا شوند:

- [ ] `npm run test:auth`
- [ ] `npm run test:business`
- [ ] `npm run test:meizito:foundation`
- [ ] `npm run test:meizito:phone`
- [ ] `npm run test:meizito:workspace`
- [ ] `npm run test:meizito:requests`
- [ ] `npm run test:meizito:letters`
- [ ] `npm run test:meizito:calendar`
- [ ] `npm run test:meizito:chat`
- [ ] `npm run test:dashboard`

نکته: اجرای این فاز اختیاری است چون قبلاً 104/104 pass شده و درخواست فعلی QA مرورگر خارجی بود.

---

# فاز ۱۱ — Bug Fix / Retest Loop

برای هر bug:

- [x] ثبت در `qa-test-results-v1.md`
- [x] severity مشخص شود.
- [x] route و منو مشخص شود.
- [x] steps/evidence ثبت شود.
- [x] اگر کاربر اجازه fix داد، fix انجام شود. *(در این run باگ blocker نبود)*
- [x] retest انجام شود. *(Requests wait retest شد و pass شد)*
- [ ] اگر لازم بود smoke همان بخش اجرا شود.

Severity:

| سطح | تعریف |
|-----|-------|
| Blocker | crash، صفحه سفید، ذخیره نشدن داده حیاتی، tenant leak |
| Major | منوی اصلی قابل استفاده نیست یا تعامل اصلی fail می‌شود |
| Minor | scroll، responsive، label، empty state، visual issue |
| Trivial | copy/style جزئی |

**DoD فاز ۱۱:** ✅ هیچ Blocker باز نماند.

---

# فاز ۱۲ — Production Readiness سبک

- [x] تست روی production انجام شد.
- [x] URL و ابزار در گزارش ثبت شد.
- [ ] commit/deploy status دقیق Coolify بررسی شود.
- [ ] `NEXT_PUBLIC_APP_URL` با URL تست سازگار باشد.
- [ ] `AUTH_SESSION_TTL_DAYS=30` در محیط هدف تأیید شود.
- [ ] `AUTH_COOKIE_SECURE` با HTTP/HTTPS سازگار باشد.
- [ ] Nextcloud status فقط اگر در منوها به آن برخورد شد بررسی شود.

---

# خروجی‌های نهایی v11

- [x] `qa-test-results-v1.md`
- [x] لیست منوهای تست‌شده
- [x] pass/fail/blocked هر منو
- [x] bugها با severity
- [x] شواهد مهم
- [x] retest بعد از fix/wait adjustment
- [x] موارد باقی‌مانده
- [ ] پیشنهاد v12

---

## خلاصه اجرای فعلی

| مورد | نتیجه |
|------|--------|
| ابزار | External Chrome + CDP direct |
| Base URL | `http://nexaapoint18khordad.91.107.177.182.sslip.io` |
| Login user | `artificialxflow` |
| Quick menu tests | **21/21 passed** |
| Blocker | 0 |
| Major | 0 |
| Minor | 1 open/monitor |
| Artifact | `qa-artifacts/v11-browser-quick-menus.json` |
| Report | `qa-test-results-v1.md` |

---

## Bug / Risk باز

| ID | Severity | Area | Status | Summary |
|----|----------|------|--------|---------|
| QA-V11-001 | Minor | Dashboard | Open / monitor | Recharts warning about chart width/height `-1`; no visible blocker in this run |

---

## Acceptance Criteria v11 سبک

- [x] همه منوهای تصویر با مرورگر خارجی باز و بررسی شوند.
- [x] هیچ Next.js runtime overlay دیده نشود.
- [x] هیچ console error blocker باز نماند.
- [x] dashboard pass شود.
- [x] workspace و Kanban scroll pass شود.
- [x] calendar pass شود.
- [x] chat pass شود.
- [x] requests pass شود.
- [x] letters pass شود.
- [x] phone directory pass شود.
- [x] responsive quick sweep برای منوهای scope pass شود.
- [x] report نهایی کامل باشد.

---

# فاز ۱۳ — Full Button/Data QA جدید

این فاز بعد از quick sanity اضافه شد چون در تست دستی کاربر، مودال «ایجاد وظیفه جدید» در میز کار باز شد اما دکمه «ثبت» ظاهراً داده را ذخیره نکرد.

قانون اجرای این فاز:

- [ ] همه داده‌های تستی با prefix `QA_V11_` ساخته شوند.
- [ ] داده واقعی production حذف یا دستکاری نشود.
- [ ] هر create باید با refresh/reopen تأیید شود.
- [ ] هر edit باید بعد از refresh باقی بماند.
- [ ] هر delete/close/archive فقط روی داده تستی `QA_V11_` انجام شود.
- [ ] اگر یک دکمه fail شد، route + steps + console/network + severity ثبت شود.
- [ ] اگر fail جلوی ادامه را گرفت، کد همان بخش fix شود و همان سناریو retest شود.
- [ ] مرورگر تست همچنان خارجی باشد، نه Cursor browser.

## ۱۳.۱ Workspace / Boards / وظیفه‌ها

**Route:** `/dashboard/tasks`

- [ ] باز کردن مودال «وظیفه جدید».
- [ ] وارد کردن عنوان `QA_V11_Task_<timestamp>`.
- [ ] انتخاب ستون موجود.
- [ ] کلیک روی «ثبت».
- [ ] اطمینان از بسته شدن مودال یا نمایش پیام خطای قابل فهم.
- [ ] اطمینان از دیده شدن task جدید در board/column.
- [ ] refresh صفحه و اطمینان از باقی ماندن task.
- [ ] باز کردن detail task.
- [ ] edit عنوان task به `QA_V11_Task_Edited_<timestamp>`.
- [ ] edit description/due date/assignee/labels اگر UI فعال است.
- [ ] refresh و اطمینان از باقی ماندن editها.
- [ ] search task با `QA_V11_`.
- [ ] تست label filter اگر label ساخته/انتخاب شد.
- [ ] move task بین ستون‌ها اگر UI drag/drop یا action دارد.
- [ ] archive/delete task فقط اگر روی task تستی امکان‌پذیر است.
- [ ] تست horizontal scroll با board فعلی.
- [ ] تست desktop viewportهای 1366×768 و 1440×900.
- [ ] تست mobile viewport 390×844 برای tabbar/board/modal.
- [ ] اگر ثبت task fail شد، bug blocker/major ثبت و fix شود.

## ۱۳.۲ Requests / درخواست‌ها

**Route:** `/dashboard/work-requests`

- [ ] ساخت request تستی با subject `QA_V11_Request_<timestamp>`.
- [ ] انتخاب category/priority/referral اگر اجباری یا واضح است.
- [ ] کلیک روی «ثبت و ارسال برای تایید».
- [ ] اطمینان از دیده شدن request در list یا empty-state update.
- [ ] refresh و اطمینان از باقی ماندن request.
- [ ] باز کردن detail request.
- [ ] تست filter/status/search با داده `QA_V11_`.
- [ ] approval/close/reopen فقط اگر روی داده تستی و UI واضح بود.
- [ ] بررسی badge/count اگر در sidebar یا hub دیده می‌شود.
- [ ] تست mobile form/list.
- [ ] cleanup یا close کردن داده تستی اگر امکان امن دارد.

## ۱۳.۳ Letters / نامه‌ها

**Route:** `/dashboard/tasks?tab=letters`

- [ ] ساخت نامه تستی با subject `QA_V11_Letter_<timestamp>`.
- [ ] پر کردن گیرنده/متن/category اگر لازم است.
- [ ] submit/create نامه.
- [ ] اطمینان از دیده شدن نامه در inbox/outbox/list مربوط.
- [ ] refresh و اطمینان از باقی ماندن نامه.
- [ ] باز کردن detail/thread.
- [ ] reply با subject/body دارای `QA_V11_` اگر UI اجازه داد.
- [ ] تست box filter مثل inbox/outbox/archive.
- [ ] archive/close فقط روی داده تستی اگر امکان امن دارد.
- [ ] تست mobile list/detail/form.

## ۱۳.۴ Chat / گفتگوها

**Route:** `/dashboard/chats`

- [ ] انتخاب thread موجود یا ساخت/شروع conversation اگر UI اجازه داد.
- [ ] ارسال پیام `QA_V11_Message_<timestamp>`.
- [ ] اطمینان از دیده شدن پیام در thread.
- [ ] refresh و اطمینان از باقی ماندن پیام.
- [ ] تست pin/star/edit فقط اگر UI فعال و امن است.
- [ ] تست responsive/mobile chat layout.
- [ ] اگر ارسال پیام امکان‌پذیر نیست، علت دقیق blocked ثبت شود.

## ۱۳.۵ Calendar / تقویم

**Route:** `/dashboard/tasks?tab=calendar`

- [ ] ساخت event/task تقویمی `QA_V11_Event_<timestamp>` اگر UI اجازه داد.
- [ ] navigation روز/هفته/ماه.
- [ ] باز کردن event detail/modal.
- [ ] refresh و اطمینان از باقی ماندن event.
- [ ] edit/delete فقط روی داده تستی اگر امن است.
- [ ] تست mobile calendar.
- [ ] اگر create event UI موجود نیست، blocked با evidence ثبت شود.

## ۱۳.۶ Dashboard / Widgets

**Route:** `/dashboard/dashboard`

- [ ] تست دکمه‌های widget مثل compact/filter/hide اگر وجود دارند.
- [ ] بررسی اینکه dashboard بعد از ساخت داده تستی crash نمی‌کند.
- [ ] بررسی warning chart/Recharts از نظر visual.
- [ ] تست viewportهای desktop/mobile.

## ۱۳.۷ Phone Directory / دفتر تلفن

**Route:** `/dashboard/tasks?tab=phone`

- [ ] search برای `artificialxflow` یا نام نمایشی کاربر.
- [ ] تست filter اگر UI دارد.
- [ ] باز کردن profile/detail اگر UI دارد.
- [ ] بررسی referral visual با requests فقط اگر داده موجود است.
- [ ] تست mobile list/search.

## ۱۳.۸ Cross-Menu / Persistence

- [ ] ساخت داده تستی در Workspace و رفتن به Dashboard/Requests/Letters/Chat و برگشت بدون از دست رفتن state.
- [ ] refresh بعد از چند navigation.
- [ ] back/forward browser.
- [ ] بررسی active sidebar menu highlight.
- [ ] بررسی scroll sidebar و main content.
- [ ] بررسی اینکه هیچ Next.js overlay یا console blocker باقی نماند.

## ۱۳.۹ Backend Smoke اختیاری بعد از UI QA

- [ ] `npm run test:meizito:workspace`
- [ ] `npm run test:meizito:requests`
- [ ] `npm run test:meizito:letters`
- [ ] `npm run test:meizito:calendar`
- [ ] `npm run test:meizito:chat`
- [ ] `npm run test:dashboard`

**DoD فاز ۱۳:** همه دکمه‌ها و فرم‌های اصلی منوهای scope با داده `QA_V11_` تست شوند، blockerها fix/retest شوند، و نتیجه نهایی در `qa-test-results-v1.md` ثبت شود.
