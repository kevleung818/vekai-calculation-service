import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { calculateNumerology } from './calculationService.js';
import { getSummary, listHistory, recordCalculation } from './calculationStore.js';
import { createCheckoutSession, verifyWebhookSignature } from './airwallex.js';
import * as thirdParty from './thirdPartyPayment.js';

const app = express();
app.use(cors({ origin: true }));
function paymentAdapter() {
  return process.env.PAYMENT_PROVIDER === 'third_party' ? thirdParty : { createCheckoutSession, verifyWebhookSignature };
}

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  const adapter = paymentAdapter();
  if (!adapter.verifyWebhookSignature(req.body, timestamp, signature)) return res.status(401).json({ error: 'Invalid payment webhook signature.' });
  let event;
  try { event = JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).json({ error: 'Invalid webhook JSON.' }); }
  console.log(`${process.env.PAYMENT_PROVIDER || 'airwallex'} webhook received: ${event.name || event.type || 'unknown'}`);
  return res.status(200).json({ received: true });
});
app.post('/api/payments/airwallex/webhook', express.raw({ type: 'application/json' }), (req, res) => res.redirect(307, '/api/payments/webhook'));
app.use(express.json());

function admin(req, res, next) {
  if (!process.env.ADMIN_API_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: 'Admin authentication required.' });
  next();
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/payments/checkout-session', async (req, res) => {
  try {
    const { amount, currency = 'CNY', returnUrl, customerEmail } = req.body || {};
    const merchantOrderId = `calc_${crypto.randomUUID()}`;
    const provider = process.env.PAYMENT_PROVIDER || 'airwallex';
    const session = await paymentAdapter().createCheckoutSession({ amount: Number(amount), currency, merchantOrderId, returnUrl, customerEmail });
    res.status(201).json({ provider, merchantOrderId, session });
  } catch (error) { res.status(error.status || 502).json({ error: error.message || 'Unable to create checkout session.' }); }
});
app.post('/api/calculations', async (req, res) => {
  try {
    const { input, locale = 'en', source = 'web' } = req.body || {};
    const result = calculateNumerology(input);
    const record = await recordCalculation({ input, locale, source });
    const labels = locale === 'zh' ? { primary: '主卦', secondary: '变卦', base: '本卦', result: '结果', movingLine: '动爻' } : { primary: 'Primary Set', secondary: 'Secondary Set', base: 'Base', result: 'Result', movingLine: 'Moving line' };
    res.json({ calculationId: record.id, locale: record.locale, labels, result });
  } catch (error) { res.status(error.status || 500).json({ error: error.message || 'Calculation failed.' }); }
});
app.get('/api/admin/dashboard', admin, async (req, res, next) => { try { res.json({ summary: await getSummary(), recent: (await listHistory(10)).records }); } catch (error) { next(error); } });
app.get('/api/admin/calculations/history', admin, async (req, res, next) => { try { res.json(await listHistory(Math.min(Number(req.query.limit) || 50, 200), Math.max(Number(req.query.offset) || 0, 0))); } catch (error) { next(error); } });
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ error: 'Internal server error.' }); });
const port = process.env.PORT || 3015;
app.listen(port, () => console.log(`Calculation service listening on port ${port}`));
