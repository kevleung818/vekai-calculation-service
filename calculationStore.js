import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const useSupabase = Boolean(url && key && !key.startsWith('replace-with-'));
const localPath = process.env.CALCULATION_STORE_PATH || path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'calculations.json');

async function supabase(pathname, options = {}) {
  const response = await fetch(`${url}/rest/v1/${pathname}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}
async function localRead() {
  try { return JSON.parse(await fs.readFile(localPath, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
async function localWrite(records) { await fs.mkdir(path.dirname(localPath), { recursive: true }); await fs.writeFile(localPath, `${JSON.stringify(records, null, 2)}\n`); }
function fromRow(row) { return { id: row.id, inputHash: row.input_hash, maskedInput: row.masked_input, inputLength: row.input_length, userId: row.user_id, locale: row.locale, source: row.source, createdAt: row.created_at }; }
function fromPaymentRow(row) { return { id: row.id, merchantOrderId: row.merchant_order_id, providerSessionId: row.airwallex_session_id, amount: Number(row.amount), currency: row.currency, status: row.status, customerEmail: row.customer_email, createdAt: row.created_at, paidAt: row.paid_at }; }

export async function recordCalculation({ input, userId = 'anonymous', locale = 'en', source = 'web' }) {
  const normalized = String(input).replace(/\D/g, '');
  const record = { id: `calc_${crypto.randomUUID()}`, inputHash: crypto.createHash('sha256').update(normalized).digest('hex'), maskedInput: `${'*'.repeat(Math.max(normalized.length - 4, 4))}${normalized.slice(-4)}`, inputLength: normalized.length, userId, locale: locale === 'zh-TW' ? 'zh-TW' : locale === 'zh' ? 'zh' : 'en', source: String(source).slice(0, 64), createdAt: new Date().toISOString() };
  if (useSupabase) {
    const rows = await supabase('calculations', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id: record.id, input_hash: record.inputHash, masked_input: record.maskedInput, input_length: record.inputLength, user_id: record.userId, locale: record.locale, source: record.source, created_at: record.createdAt }) });
    return fromRow(rows[0]);
  }
  const records = await localRead(); records.push(record); await localWrite(records); return record;
}

export async function getSummary() {
  const records = useSupabase ? (await supabase('calculations?select=*')).map(fromRow) : (await localRead()).filter((record) => record.inputHash);
  const byLocale = { en: 0, zh: 0, 'zh-TW': 0 }; const bySource = {}; const daily = {};
  for (const record of records) { byLocale[record.locale] = (byLocale[record.locale] || 0) + 1; bySource[record.source] = (bySource[record.source] || 0) + 1; const day = record.createdAt.slice(0, 10); daily[day] = (daily[day] || 0) + 1; }
  return { totalCalculations: records.length, uniqueNumbers: new Set(records.map((record) => record.inputHash)).size, byLocale, bySource, daily: Object.entries(daily).sort().map(([date, count]) => ({ date, count })) };
}

export async function listHistory(limit = 50, offset = 0) {
  const records = useSupabase ? (await supabase(`calculations?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`)).map(fromRow) : (await localRead()).filter((record) => record.inputHash).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(offset, offset + limit);
  return { records };
}

export async function recordPayment({ merchantOrderId, providerSessionId = null, amount, currency, customerEmail = null }) {
  const record = { id: `payment_${crypto.randomUUID()}`, merchantOrderId, providerSessionId, amount: Number(amount), currency, status: 'pending', customerEmail, createdAt: new Date().toISOString(), paidAt: null };
  if (useSupabase) {
    const rows = await supabase('payments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id: record.id, merchant_order_id: record.merchantOrderId, airwallex_session_id: record.providerSessionId, amount: record.amount, currency: record.currency, status: record.status, customer_email: record.customerEmail, created_at: record.createdAt }) });
    return fromPaymentRow(rows[0]);
  }
  const records = await localRead(); records.push(record); await localWrite(records); return record;
}

export async function updatePaymentStatus(merchantOrderId, status) {
  const paidAt = status === 'paid' ? new Date().toISOString() : null;
  if (useSupabase) {
    const rows = await supabase(`payments?merchant_order_id=eq.${encodeURIComponent(merchantOrderId)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status, paid_at: paidAt }) });
    return rows[0] ? fromPaymentRow(rows[0]) : null;
  }
  const records = await localRead(); const record = records.find((item) => item.merchantOrderId === merchantOrderId);
  if (!record) return null;
  record.status = status; record.paidAt = paidAt; await localWrite(records); return record;
}

export async function listPayments(limit = 50, offset = 0) {
  const records = useSupabase ? (await supabase(`payments?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`)).map(fromPaymentRow) : (await localRead()).filter((record) => record.merchantOrderId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(offset, offset + limit);
  return { records };
}
