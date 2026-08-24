import crypto from 'node:crypto';

// Generic provider contract. Replace these functions with the third-party gateway SDK/API.
export async function createCheckoutSession({ amount, currency, merchantOrderId, returnUrl, customerEmail }) {
  if (!process.env.THIRD_PARTY_CHECKOUT_URL) {
    const error = new Error('Third-party payment provider is not configured.');
    error.status = 503;
    throw error;
  }

  return {
    provider: 'third_party',
    merchantOrderId,
    amount,
    currency,
    returnUrl,
    customerEmail,
    checkoutUrl: `${process.env.THIRD_PARTY_CHECKOUT_URL}?order_id=${encodeURIComponent(merchantOrderId)}`
  };
}

export function verifyWebhookSignature(rawBody, timestamp, signature) {
  const secret = process.env.THIRD_PARTY_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}${rawBody}`).digest('hex');
  const received = Buffer.from(signature, 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
}
