# Targel Analiz Dashboard

Meta Ads + amoCRM uchun sodda reklama va sotuv nazorati. Loyiha demo ma'lumot ko'rsatmaydi: real ulanishlar sozlanmaguncha dashboard bo'sh holatda turadi va foydalanuvchiga faqat haqiqiy sozlangan ma'lumotlar ko'rinadi.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui style local components
- Recharts
- TanStack Table
- Prisma ORM
- PostgreSQL

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and fill real credentials. `APP_ADMIN_EMAIL` and `APP_ADMIN_PASSWORD` are required for login.

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
APP_ADMIN_EMAIL=
APP_ADMIN_PASSWORD=
APP_ADMIN_NAME=Administrator
APP_CLIENT_NAME=Targel Analiz
APP_TIMEZONE=Asia/Tashkent
APP_CURRENCY=USD
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_AD_ACCOUNT_ID=
FACEBOOK_ACCOUNT_NAME=
META_GRAPH_VERSION=v23.0
AMO_CLIENT_ID=
AMO_CLIENT_SECRET=
AMO_REDIRECT_URI=
AMO_BASE_URL=
AMO_SUBDOMAIN=
AMO_ACCESS_TOKEN=
AMO_REFRESH_TOKEN=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_IDS=
TELEGRAM_TIMEOUT_MS=10000
TELEGRAM_WEBHOOK_SECRET=
CRON_SECRET=
KPI_MAX_CPL=
KPI_MAX_CPA=
KPI_MIN_ROAS=
KPI_MIN_CONVERSION_RATE=
KPI_DAILY_BUDGET=
KPI_MONTHLY_BUDGET=
```

## MVP Routes

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Dashboard:

- `GET /api/dashboard/overview`
- `GET /api/dashboard/funnel`
- `GET /api/dashboard/lead-quality`
- `GET /api/dashboard/operators`
- `GET /api/dashboard/ads`

Facebook:

- `POST /api/integrations/facebook/connect`
- `POST /api/integrations/facebook/sync`
- `GET /api/integrations/facebook/accounts`
- `GET /api/facebook/campaigns`
- `GET /api/facebook/stats`

amoCRM:

- `POST /api/integrations/amo/connect`
- `POST /api/integrations/amo/sync`
- `GET /api/amo/leads`
- `GET /api/amo/pipelines`
- `GET /api/amo/statuses`

Matching:

- `POST /api/matching/run`
- `GET /api/matching/unmatched`
- `POST /api/matching/manual`

UI:

- `/matching` lidlarni reklama bilan qo'lda bog'lash oynasi

Alerts and Telegram:

- `GET /api/alerts`
- `POST /api/alerts/check`
- `POST /api/alerts/send-telegram`
- `POST /api/telegram/webhook`
- `POST /api/telegram/send-daily-report`
- `POST /api/telegram/send-weekly-report`
- `POST /api/telegram/send-monthly-report`
- `POST /api/cron/sync`
- `GET|POST /api/cron/telegram-reports`

Telegram reports:

- Kunlik hisobot: `Xarajat -> Tushgan lidlar soni -> Sotuv soni`
- Haftalik hisobot: oxirgi 7 kun bo'yicha shu metrikalar
- Oylik hisobot: shu oy bo'yicha shu metrikalar
- `TELEGRAM_CHAT_IDS` bir nechta chat uchun vergul bilan yoziladi: `123456,987654`.
- `TELEGRAM_TIMEOUT_MS` Telegram API sekinlashsa endpoint osilib qolmasligi uchun ishlatiladi.
- `TELEGRAM_WEBHOOK_SECRET` real webhook ulanganda `x-telegram-bot-api-secret-token` headerini tekshiradi.
- 22:00 Asia/Tashkent vaqti uchun external cronni har kuni `17:00 UTC` da `/api/cron/telegram-reports` endpointiga yuboring.
- Yakshanba kuni shu endpoint kunlik bilan birga haftalik hisobotni ham yuboradi.
- Oyning oxirgi kuni shu endpoint kunlik bilan birga oylik hisobotni ham yuboradi.
- Himoya uchun `Authorization: Bearer $CRON_SECRET` headeridan foydalaning.

## Data Logic

Dashboard natijalari `lib/analytics.ts` ichida hisoblanadi. Real ma'lumotlar server integration qatlamlari orqali keladi; ulanishlar sozlanmaguncha raqamlar 0 va jadvallar bo'sh bo'ladi.

Meta Ads:

- `FACEBOOK_ACCESS_TOKEN` Meta Marketing API access token.
- `FACEBOOK_AD_ACCOUNT_ID` reklama akkaunti ID, masalan `act_123456789` yoki `123456789`.
- Dashboard `/act_{ad_account_id}/campaigns` va `/act_{ad_account_id}/insights` orqali kampaniya, xarajat, klik, reach, impressions va lead actionlarini oladi.
- `META_GRAPH_VERSION` kerak bo'lsa Graph API versiyasini boshqaradi.

amoCRM:

- `AMO_SUBDOMAIN` CRM subdomain, masalan `chinargroup`.
- `AMO_ACCESS_TOKEN` amoCRM API access token.
- `AMO_REFRESH_TOKEN` access token tugaganda avtomatik yangilash uchun kerak.
- `AMO_CLIENT_ID`, `AMO_CLIENT_SECRET` va `AMO_REDIRECT_URI` refresh token oqimi uchun kerak.
- `AMO_BASE_URL` ixtiyoriy, masalan `https://chinargroup.amocrm.ru`.
- Dashboard `/api/v4/leads/pipelines` orqali varonka/statuslarni, `/api/v4/leads` orqali lidlarni oladi.
- Operator nomlari `/api/v4/users` orqali olinadi. Agar bu endpointga ruxsat bo'lmasa dashboard ID fallback bilan ishlaydi.

Telegram:

- `TELEGRAM_BOT_TOKEN` real bot token.
- `TELEGRAM_CHAT_IDS` hisobot boradigan chat IDlar, vergul bilan ajratiladi.
- `/api/cron/telegram-reports` kunlik, haftalik va oylik hisobotlarni yuboradi.

- CPL = Xarajat / Lidlar
- CPA = Xarajat / Sotuvlar
- ROAS = Tushum / Xarajat
- Sotuvga aylanish = Sotuvlar / Lidlar * 100
- Sifatli lid ulushi = Sifatli lidlar / Barcha lidlar * 100
- Aloqa ulushi = Javob bergan lidlar / Barcha lidlar * 100
- Spam ulushi = Spam lidlar / Barcha lidlar * 100

Lidni reklama bilan bog'lash ustuvorligi service qatlamida quyidagicha ishlaydi:

1. `utm_campaign`
2. `utm_content`
3. `ad_id`
4. `adset_id`
5. `campaign_id`
6. `source`

## Real Integration Path

Real ulanish adapterlari shu fayllarda turadi:

- `lib/services/facebook.ts`
- `lib/services/amo.ts`
- `lib/services/telegram.ts`
- `lib/services/matching.ts`
- `lib/services/alerts.ts`

The UI and API route contracts can stay the same while the adapters begin writing to PostgreSQL through Prisma.

## Deploy

Render and Railway config files are included:

- `render.yaml`
- `railway.json`

Use Supabase PostgreSQL or Neon for `DATABASE_URL`, then run:

```bash
npx prisma generate
npx prisma db push
```
