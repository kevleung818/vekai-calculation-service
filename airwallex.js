import crypto from 'node:crypto';

const baseUrl = (process.env.AIRWALLEX_BASE_URL || 'https://api-demo.airwallex.com').replace(/\/$/, '');
let accessTokenCache = null;

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Airwallex request failed (${response.status}): ${data.message || data.error || 'unknown error'}`);
  return data;
}

async function getAccessToken() {
  if (!process.env.AIRWALLEX_CLIENT_ID || !process.env.AIRWALLEX_API_KEY) {
    const error = new Error('Airwallex credentials are not configured.');
    error.status = 503;
    throw error;
  }
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) return accessTokenCache.token;
  const data = await request('/api/v1/authentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.AIRWALLEX_CLIENT_ID, api_key: process.env.AIRWALLEX_API_KEY })
  });
  accessTokenCache = { token: data.token, expiresAt: Date.now() + (Number(data.expires_in) || 900) * 1000 };
  return accessTokenCache.token;
}

export async function createCheckoutSession({ amount, currency, merchantOrderId, returnUrl, customerEmail }) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    const error = new Error('Amount must be a positive number in the smallest currency unit.');
    error.status = 400;
    throw error;
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    const error = new Error('Currency must be a three-letter uppercase code.');
    error.status = 400;
    throw error;
  }
  const token = await getAccessToken();
  return request('/api/v1/checkout_sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': merchantOrderId
    },
    body: JSON.stringify({ amount, currency, merchant_order_id: merchantOrderId, return_url: returnUrl, customer_email: customerEmail })
  });
}

export function verifyWebhookSignature(rawBody, timestamp, signature) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}${rawBody}`).digest('hex');
  const received = Buffer.from(signature, 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
}
