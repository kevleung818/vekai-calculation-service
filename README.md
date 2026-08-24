# Vekai Calculation Service

Standalone bilingual calculation API for web embeds and mobile apps.

## Setup

```bash
npm install
cp .env.example .env
npm run check
npm run dev
```

Run `supabase-schema.sql` in the Supabase SQL Editor, then set `SUPABASE_SERVICE_ROLE_KEY` in `.env`. The key is server-only. When Supabase variables are absent, development history uses `data/calculations.json`.

## API

`POST /api/calculations` accepts `{ "input": "13800138000", "locale": "zh", "source": "mobile" }`. Eleven-digit inputs use the first 6 digits and final 5 digits as the primary groups.

Admin endpoints require `x-admin-key: ADMIN_API_KEY`:

- `GET /api/admin/dashboard`
- `GET /api/admin/calculations/history`

## Payment versions

This project supports two payment versions selected with `PAYMENT_PROVIDER`:

- `airwallex`: uses `airwallex.js`, sandbox/live API authentication, checkout sessions, and signed webhooks.
- `third_party`: uses `thirdPartyPayment.js` as a neutral adapter contract. Replace its checkout implementation with your provider SDK/API and keep its webhook verification.

Both versions use `POST /api/payments/checkout-session` with `{ "amount": 1999, "currency": "CNY", "returnUrl": "https://example.com/paid" }`. Amounts use the smallest currency unit.

Configure the selected provider to send webhooks to `POST /api/payments/webhook`. The legacy Airwallex URL remains available. Only after a verified webhook should a future credits/payment record be marked paid.
