const form = document.querySelector('#calculation-form');
const input = document.querySelector('#number-input');
const count = document.querySelector('#input-count');
const error = document.querySelector('#form-error');
const emptyState = document.querySelector('#empty-state');
const resultContent = document.querySelector('#result-content');
const resultSubtitle = document.querySelector('#result-subtitle');
const localeSelect = document.querySelector('#locale-select');
const apiStatuses = document.querySelectorAll('.status[id$="api-status"], #api-status');
const translations = {
  en: { language: 'Language', source: 'Source', calculate: 'Calculate reading', reading: 'Reading...', base: 'BASE', result: 'RESULT', moving: 'Moving line', length: 'Input length', error: 'Enter between 8 and 64 digits.', number: 'Your number', help: 'Enter 8 to 64 digits', sequence: 'Number sequence', readingTitle: 'Your reading', waiting: 'Waiting for a number', empty: 'Your result will appear here', primary: 'PRIMARY SET', secondary: 'SECONDARY SET', love: 'LOVE', finance: 'FINANCE', career: 'CAREER / STUDY', healthArea: 'HEALTH', heroEyebrow: 'DIGITAL NUMEROLOGY / 01', heroTitle: 'Find the pattern', heroEmphasis: 'inside the number.', heroLede: 'A clear reading from the digits you bring with you.', dashboard: 'OPERATOR DASHBOARD', health: 'API HEALTH', online: 'API ONLINE', offline: 'API OFFLINE', checking: 'API CHECKING', format: 'digits' },
  zh: { language: '语言', source: '来源', calculate: '开始测算', reading: '测算中...', base: '本卦', result: '结果', moving: '动爻', length: '输入长度', error: '请输入 8 至 64 位数字。', number: '输入数字', help: '请输入 8 至 64 位数字', sequence: '数字序列', readingTitle: '测算结果', waiting: '等待输入数字', empty: '测算结果将在此显示', primary: '主卦', secondary: '变卦', love: '爱情运势', finance: '财政状况', career: '职业 / 学业', healthArea: '健康状态', heroEyebrow: '数字命理 / 01', heroTitle: '易经数理智鉴', heroEmphasis: '见微知著，', heroThird: '启迪睿智生活', heroLede: '', dashboard: '运营后台', health: '接口状态', online: '接口在线', offline: '接口离线', checking: '检查接口中', format: '位数字' },
  'zh-TW': { language: '語言', source: '來源', calculate: '開始測算', reading: '測算中...', base: '本卦', result: '結果', moving: '動爻', length: '輸入長度', error: '請輸入 8 至 64 位數字。', number: '輸入數字', help: '請輸入 8 至 64 位數字', sequence: '數字序列', readingTitle: '測算結果', waiting: '等待輸入數字', empty: '測算結果將在此顯示', primary: '主卦', secondary: '變卦', love: '愛情運勢', finance: '財政狀況', career: '職業 / 學業', healthArea: '健康狀態', heroEyebrow: '數位命理 / 01', heroTitle: '易經數理智鑑', heroEmphasis: '見微知著', heroThird: '啟迪睿智生活', heroLede: '', dashboard: '管理後台', health: '介面狀態', online: '介面在線', offline: '介面離線', checking: '檢查介面中', format: '位數字' }
};

function applyLocale() {
  const locale = localeSelect.value;
  const text = translations[locale];
  document.documentElement.lang = locale === 'en' ? 'en' : locale;
  document.querySelector('#language-label').textContent = text.language;
  document.querySelector('#hero-eyebrow').textContent = text.heroEyebrow;
  document.querySelector('#hero-title').textContent = text.heroTitle;
  document.querySelector('#hero-emphasis').textContent = text.heroEmphasis;
  document.querySelector('#hero-third').textContent = text.heroThird || '';
  document.querySelector('#hero-lede').textContent = text.heroLede;
  document.querySelector('#hero-break').hidden = !text.heroEmphasis;
  document.querySelector('#hero-emphasis').hidden = !text.heroEmphasis;
  document.querySelector('#hero-break-two').hidden = !text.heroThird;
  document.querySelector('#hero-third').hidden = !text.heroThird;
  document.querySelector('#hero-lede').hidden = !text.heroLede;
  document.querySelector('#dashboard-link').innerHTML = `${text.dashboard} &#8599;`;
  document.querySelector('#health-link').innerHTML = `${text.health} &#8599;`;
  document.querySelector('#footer-label').textContent = locale === 'en' ? 'VEKAI / 2026' : locale === 'zh-TW' ? 'VEKAI / 2026' : 'VEKAI / 2026';
  document.querySelector('#source-select').previousElementSibling.textContent = text.source;
  document.querySelector('#number-title').textContent = text.number;
  document.querySelector('#number-help').textContent = text.help;
  document.querySelector('#number-label').textContent = text.sequence;
  document.querySelector('#reading-title').textContent = text.readingTitle;
  document.querySelector('#empty-message').textContent = text.empty;
  document.querySelector('#result-subtitle').textContent = text.waiting;
  document.querySelector('#locale-select').options[0].textContent = locale === 'en' ? 'English' : 'English';
  document.querySelector('#source-select').options[0].textContent = locale === 'en' ? 'Web' : locale === 'zh-TW' ? '網頁' : '网页';
  document.querySelector('#source-select').options[1].textContent = locale === 'zh-TW' ? '行動裝置' : locale === 'zh' ? '移动端' : 'Mobile';
  form.querySelector('button span').textContent = text.calculate;
}

function updateCount() {
  count.textContent = `${input.value.replace(/\D/g, '').length} / 64`;
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

function renderResult(payload) {
  const { result } = payload;
  const text = translations[payload.locale] || translations['zh-TW'];
  const readings = [
    [text.primary, text.base, result.primary.base],
    [text.primary, text.result, result.primary.result],
    [text.secondary, text.base, result.secondary.base],
    [text.secondary, text.result, result.secondary.result]
  ];
  emptyState.hidden = true;
  resultContent.hidden = false;
  resultSubtitle.textContent = `${result.format} / ${result.inputLength} ${translations[payload.locale]?.format || 'digits'}`;
  document.querySelector('#hexagram-readings').innerHTML = readings.map(([set, type, hexagram]) => {
    const { reading } = hexagram;
    return `<article class="hexagram-card"><header><span>${set} / ${type}</span><strong>${hexagram.number}</strong></header><h3>${reading.name || hexagram.meaning[1]}</h3><p class="hexagram-title">${reading.title || ''}</p><dl><div><dt>${text.love}</dt><dd>${reading.love || ''}</dd></div><div><dt>${text.finance}</dt><dd>${reading.finance || ''}</dd></div><div><dt>${text.career}</dt><dd>${reading.career || ''}</dd></div><div><dt>${text.healthArea}</dt><dd>${reading.health || ''}</dd></div></dl></article>`;
  }).join('');
}

input.addEventListener('input', updateCount);
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.hidden = true;
  const digits = input.value.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 64) {
    showError(translations[localeSelect.value].error);
    return;
  }
  const button = form.querySelector('button');
  button.disabled = true;
  button.querySelector('span').textContent = translations[localeSelect.value].reading;
  try {
    const response = await fetch('/api/calculations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: digits, locale: document.querySelector('#locale-select').value, source: document.querySelector('#source-select').value }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Calculation failed.');
    renderResult(payload);
  } catch (requestError) {
    showError(requestError.message);
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = translations[localeSelect.value].calculate;
  }
});

localeSelect.addEventListener('change', () => { applyLocale(); checkApiHealth(); });
applyLocale();
updateCount();

const dashboardView = document.querySelector('#dashboard-view');
const appView = document.querySelector('body > .shell');
const dashboardContent = document.querySelector('#dashboard-content');
const accessPanel = document.querySelector('#access-panel');
const dashboardError = document.querySelector('#dashboard-error');
const dashboardKey = document.querySelector('#admin-key');
const dashboardKeyStorage = 'vekai-admin-key';

async function checkApiHealth() {
  const online = await fetch('/health', { cache: 'no-store' }).then((response) => response.ok).catch(() => false);
  apiStatuses.forEach((status) => {
    status.classList.remove('status-checking', 'status-online', 'status-offline');
    status.classList.add(online ? 'status-online' : 'status-offline');
    const text = translations[localeSelect.value] || translations['zh-TW'];
    status.querySelector('span:last-child').textContent = online ? text.online : text.offline;
  });
}

checkApiHealth();
setInterval(checkApiHealth, 30000);

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function emptyRow(columns, message) {
  return `<tr><td class="empty-row" colspan="${columns}">${message}</td></tr>`;
}

function renderActivity(daily) {
  const chart = document.querySelector('#activity-chart');
  const recent = daily.slice(-14);
  const maximum = Math.max(...recent.map((item) => item.count), 1);
  chart.innerHTML = recent.length ? recent.map((item) => `<div class="activity-bar" title="${item.date}: ${item.count}"><i style="height:${Math.max(item.count / maximum * 100, 3)}%"></i><b>${item.count}</b><small>${item.date.slice(5)}</small></div>`).join('') : '<p class="empty-row">No calculation activity yet.</p>';
}

function renderDashboard(data) {
  const { summary, recent, payments } = data;
  const paid = payments.filter((payment) => payment.status === 'paid');
  const volume = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  document.querySelector('#metric-calculations').textContent = summary.totalCalculations;
  document.querySelector('#metric-unique').textContent = summary.uniqueNumbers;
  document.querySelector('#metric-volume').textContent = `${(volume / 100).toFixed(2)} ${payments[0]?.currency || 'CNY'}`;
  document.querySelector('#metric-paid').textContent = paid.length;
  document.querySelector('#metric-payment-note').textContent = `${payments.length} checkout attempts`;
  document.querySelector('#metric-paid-note').textContent = payments.length ? `${Math.round(paid.length / payments.length * 100)}% completion` : 'payment completion';
  document.querySelector('#activity-total').textContent = `${summary.totalCalculations} total`; renderActivity(summary.daily);
  document.querySelector('#calculation-log').innerHTML = recent.length ? recent.map((record) => `<tr><td>${formatTime(record.createdAt)}</td><td>${record.maskedInput}</td><td><span class="tag">${record.locale}</span></td><td>${record.source}</td></tr>`).join('') : emptyRow(4, 'No calculations recorded yet.');
  document.querySelector('#payment-log').innerHTML = payments.length ? payments.map((payment) => `<tr><td>${formatTime(payment.createdAt)}</td><td>${payment.merchantOrderId.slice(-12)}</td><td>${(payment.amount / 100).toFixed(2)} ${payment.currency}</td><td><span class="tag ${payment.status}">${payment.status}</span></td></tr>`).join('') : emptyRow(4, 'No payment activity yet.');
  document.querySelector('#last-updated').textContent = `Updated ${formatTime(new Date())}`;
  accessPanel.hidden = true; dashboardContent.hidden = false;
}

async function loadDashboard(key) {
  dashboardError.hidden = true;
  const response = await fetch('/api/admin/dashboard', { headers: { 'x-admin-key': key } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load dashboard.');
  sessionStorage.setItem(dashboardKeyStorage, key); renderDashboard(payload);
}

if (new URLSearchParams(location.search).get('view') === 'dashboard') {
  appView.hidden = true; dashboardView.hidden = false;
  const savedKey = sessionStorage.getItem(dashboardKeyStorage);
  if (savedKey) loadDashboard(savedKey).catch((requestError) => { sessionStorage.removeItem(dashboardKeyStorage); dashboardError.textContent = requestError.message; dashboardError.hidden = false; });
  document.querySelector('#access-form').addEventListener('submit', async (event) => { event.preventDefault(); try { await loadDashboard(dashboardKey.value); } catch (requestError) { dashboardError.textContent = requestError.message; dashboardError.hidden = false; } });
  document.querySelector('#refresh-dashboard').addEventListener('click', () => { const key = sessionStorage.getItem(dashboardKeyStorage); if (key) loadDashboard(key).catch((requestError) => { dashboardError.textContent = requestError.message; dashboardError.hidden = false; }); });
  document.querySelector('#sign-out').addEventListener('click', () => { sessionStorage.removeItem(dashboardKeyStorage); dashboardContent.hidden = true; accessPanel.hidden = false; dashboardKey.value = ''; document.querySelector('#last-updated').textContent = 'Awaiting access'; });
}