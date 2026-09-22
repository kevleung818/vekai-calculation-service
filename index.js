import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { calculateNumerology } from './calculationService.js';
import { getSummary, listHistory, listPayments, recordCalculation, recordPayment, updatePaymentStatus } from './calculationStore.js';
import { createCheckoutSession, verifyWebhookSignature } from './airwallex.js';
import * as thirdParty from './thirdPartyPayment.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.static('public'));
function paymentAdapter() {
  return process.env.PAYMENT_PROVIDER === 'third_party' ? thirdParty : { createCheckoutSession, verifyWebhookSignature };
}

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  const adapter = paymentAdapter();
  if (!adapter.verifyWebhookSignature(req.body, timestamp, signature)) return res.status(401).json({ error: 'Invalid payment webhook signature.' });
  let event;
  try { event = JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).json({ error: 'Invalid webhook JSON.' }); }
  const merchantOrderId = event.merchant_order_id || event.merchantOrderId || event.data?.merchant_order_id;
  const eventStatus = String(event.name || event.type || '').toLowerCase();
  if (merchantOrderId && /paid|success|completed/.test(eventStatus)) await updatePaymentStatus(merchantOrderId, 'paid');
  console.log(`${process.env.PAYMENT_PROVIDER || 'airwallex'} webhook received: ${event.name || event.type || 'unknown'}`);
  return res.status(200).json({ received: true });
});
app.post('/api/payments/airwallex/webhook', express.raw({ type: 'application/json' }), (req, res) => res.redirect(307, '/api/payments/webhook'));
app.use(express.json());

function admin(req, res, next) {
  if (!process.env.ADMIN_API_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: 'Admin authentication required.' });
  next();
}

const traditionalMap = {
  变: '變', 复: '復', 业: '業', 习: '習', 乡: '鄉', 书: '書', 争: '爭', 亲: '親', 产: '產', 体: '體', 伤: '傷', 价: '價', 侣: '侶', 侦: '偵', 侧: '側', 俩: '倆', 养: '養', 关: '關', 兴: '興', 养: '養',  决: '決',  几: '幾',  则: '則',  刚: '剛',  剑: '劍',  务: '務',  势: '勢',  动: '動',  医: '醫',  协: '協',  单: '單',  卖: '賣',  压: '壓',  厅: '廳',  参: '參',  发: '發',  变: '變',  叶: '葉',  各: '各',  后: '後',  吗: '嗎',  听: '聽',  员: '員',  周: '週',  和: '和',  咨: '諮',  响: '響',  响: '響',  响: '響',  喻: '喻',  团: '團',  国: '國',  场: '場',  坚: '堅',  声: '聲',  处: '處',  备: '備',  复: '復',  够: '夠',  大: '大',  学: '學',  宁: '寧',  实: '實',  审: '審',  宽: '寬',  导: '導',  币: '幣',  帮: '幫',  并: '並',  广: '廣',  庆: '慶',  开: '開',  异: '異',  强: '強',  归: '歸',  总: '總',  态: '態',  急: '急',  恋: '戀',  恶: '惡',  惊: '驚',  愿: '願',  慎: '慎',  戏: '戲',  才: '才',  扫: '掃',  护: '護',  报: '報',  担: '擔',  择: '擇',  持: '持',  挣: '掙',  换: '換',  据: '據',  掌: '掌',  推: '推',  教: '教',  故: '故',  数: '數',  断: '斷',  旧: '舊',  时: '時',  显: '顯',  晋: '晉',  晚: '晚',  景: '景',  智: '智',  术: '術',  机: '機',  材: '材',  极: '極',  标: '標',  样: '樣',  梦: '夢',  楼: '樓',  欢: '歡',  步: '步',  死: '死',  残: '殘',  毕: '畢',  气: '氣',  汇: '匯',  没: '沒',  法: '法',  流: '流',  涉: '涉',  渐: '漸',  温: '溫',  滤: '濾',  灵: '靈',  点: '點',  为: '為',  烦: '煩',  热: '熱',  爱: '愛',  状: '狀',  环: '環',  现: '現',  产: '產',  电: '電',  疑: '疑',  疗: '療',  疾: '疾',  病: '病',  皱: '皺',  盘: '盤',  监: '監',  盖: '蓋',  码: '碼',  祸: '禍',  积: '積',  稳: '穩',  突: '突',  笑: '笑',  筹: '籌',  简: '簡',  类: '類',  粤: '粵',  纪: '紀',  约: '約',  级: '級',  终: '終',  络: '絡',  统: '統',  绩: '績',  维: '維',  缺: '缺',  网: '網',  美: '美',  翻: '翻',  者: '者',  职: '職',  联: '聯',  能: '能',  脑: '腦',  致: '致',  艺: '藝',  节: '節',  苏: '蘇',  获: '獲',  营: '營',  落: '落',  薄: '薄',  虑: '慮',  补: '補',  视: '視',  觉: '覺',  认: '認',  让: '讓',  议: '議',  记: '記',  讲: '講',  证: '證',  评: '評',  词: '詞',  试: '試',  该: '該',  语: '語',  说: '說',  请: '請',  读: '讀',  调: '調',  谈: '談',  谨: '謹',  谱: '譜',  负: '負',  责: '責',  败: '敗',  购: '購',  赏: '賞',  费: '費',  资: '資',  赔: '賠',  赚: '賺',  赵: '趙',  赶: '趕',  进: '進',  远: '遠',  违: '違',  迟: '遲',  选: '選',  释: '釋',  钟: '鐘',  销: '銷',  长: '長',  问: '問',  间: '間',  队: '隊',  阳: '陽',  阴: '陰',  际: '際',  难: '難',  集: '集',  须: '須',  预: '預',  领: '領',  频: '頻',  风: '風',  飞: '飛',  食: '食',  饮: '飲',  饰: '飾',  驱: '驅',  鱼: '魚',  鸟: '鳥',  麦: '麥',  黄: '黃',  黑: '黑',  龙: '龍',  见: '見',  处: '處',  复: '復',  变: '變',  这: '這',  还: '還',  过: '過',  还: '還',  这: '這',  远: '遠',  适: '適',  关: '關',  关: '關',  关: '關',  头: '頭',  里: '裡',  说: '說',  让: '讓',  传: '傳',  统: '統',  产: '產',  额: '額',  颜: '顏',  识: '識',  变: '變'
};
traditionalMap['伙'] = '夥';
traditionalMap['尽'] = '盡';
traditionalMap['乱'] = '亂';

function toTraditional(value) {
  return [...value].map((character) => traditionalMap[character] || character).join('');
}

function traditionalizeSet(set) {
  return {
    ...set,
    base: { ...set.base, meaning: [set.base.meaning[0], toTraditional(set.base.meaning[1])] },
    result: { ...set.result, meaning: [set.result.meaning[0], toTraditional(set.result.meaning[1])] },
    summary: set.summary ? toTraditional(set.summary) : set.summary,
    insight: set.insight ? toTraditional(set.insight) : set.insight
  };
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/payments/checkout-session', async (req, res) => {
  try {
    const { amount, currency = 'CNY', returnUrl, customerEmail } = req.body || {};
    const merchantOrderId = `calc_${crypto.randomUUID()}`;
    const provider = process.env.PAYMENT_PROVIDER || 'airwallex';
    const session = await paymentAdapter().createCheckoutSession({ amount: Number(amount), currency, merchantOrderId, returnUrl, customerEmail });
    await recordPayment({ merchantOrderId, providerSessionId: session.id || session.session_id || null, amount: Number(amount), currency, customerEmail });
    res.status(201).json({ provider, merchantOrderId, session });
  } catch (error) { res.status(error.status || 502).json({ error: error.message || 'Unable to create checkout session.' }); }
});
app.post('/api/calculations', async (req, res) => {
  try {
    const { input, locale = 'zh-TW', source = 'web' } = req.body || {};
    const result = calculateNumerology(input, { locale });
    const record = await recordCalculation({ input, locale, source });
    const isTraditional = locale === 'zh-TW';
    const isChinese = locale === 'zh' || isTraditional;
    const labels = isTraditional ? { primary: '主卦', secondary: '變卦', base: '本卦', result: '結果', movingLine: '動爻' } : isChinese ? { primary: '主卦', secondary: '变卦', base: '本卦', result: '结果', movingLine: '动爻' } : { primary: 'Primary Set', secondary: 'Secondary Set', base: 'Base', result: 'Result', movingLine: 'Moving line' };
    const localizedResult = isTraditional ? { ...result, primary: traditionalizeSet(result.primary), secondary: traditionalizeSet(result.secondary), summary: toTraditional(result.summary), insight: toTraditional(result.insight) } : result;
    res.json({ calculationId: record.id, locale: record.locale, labels, result: localizedResult });
  } catch (error) { res.status(error.status || 500).json({ error: error.message || 'Calculation failed.' }); }
});
app.get('/api/admin/dashboard', admin, async (req, res, next) => { try { res.json({ summary: await getSummary(), recent: (await listHistory(100)).records, payments: (await listPayments(100)).records }); } catch (error) { next(error); } });
app.get('/api/admin/calculations/history', admin, async (req, res, next) => { try { res.json(await listHistory(Math.min(Number(req.query.limit) || 50, 200), Math.max(Number(req.query.offset) || 0, 0))); } catch (error) { next(error); } });
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ error: 'Internal server error.' }); });

const requestedPort = Number(process.env.PORT || 3015);
const host = process.env.HOST || '0.0.0.0';

function startServer(port, retriesLeft = 10) {
  const server = app.listen(port, host, () => {
    console.log(`Calculation service listening on http://${host}:${port}`);
  });

  server.on('error', (error) => {
    if (['EADDRINUSE', 'EACCES', 'EPERM'].includes(error.code) && retriesLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} unavailable (${error.code}), retrying on ${nextPort}.`);
      startServer(nextPort, retriesLeft - 1);
      return;
    }

    console.error(`Unable to start server on ${host}:${port}:`, error);
    process.exit(1);
  });
}

startServer(requestedPort);
