import { addMonths, calculateTiming } from './timing-engine.js';

const format = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 });
const fmt = n => format.format(n);
const monthLabel = m => `${m.slice(0, 4)}年${Number(m.slice(5))}月`;
const models = { working: '營運週轉金', equipment: '廠房與設備', expansion: '展店與擴張', overseas: '海外投資' };

/**
 * Mount in a container, preferably inside the caller's optional <details>.
 * getSummary() returns a Traditional Chinese text summary only while up to date.
 * setPlan(null) clears rendered figures but retains input fields for review.
 * No onChange callback fires during initial mounting.
 */
export function mountTiming({ target, getPlan, onChange } = {}) {
  const emptyApi = { getSummary: () => null, markStale() {}, setPlan() {} };
  let container;
  try { container = typeof target === 'string' ? document.querySelector(target) : target; } catch { return emptyApi; }
  if (!container || container.nodeType !== 1) return emptyApi;
  const doc = container.ownerDocument;
  let plan = null;
  let last = null;
  let updatedAt = '';
  let dirty = false;
  let rowCount = 1;
  const readExternalPlan = () => {
    try { return typeof getPlan === 'function' ? getPlan() : plan; } catch { return null; }
  };
  plan = readExternalPlan();
  // An explicit setPlan(null) must suspend this planner even if the caller is
  // still in the process of clearing its own prior annual result.
  const activePlan = () => plan ? readExternalPlan() : null;
  container.innerHTML = `<section class="timing-panel" aria-label="可選月度資金規劃">
    <div class="timing-heading"><div><h3>月度收付款規劃</h3><p>選填，用每月實際收付時點，看看何時需要準備資金。</p></div><span class="timing-status" role="status">尚未規劃</span></div>
    <p class="timing-context"></p>
    <p class="timing-note">金額皆為新臺幣萬元；海外收支請先依自行設定的匯率換算為台幣，不直接填美元原幣。這份規劃獨立計算，不會與上方年度四模型自動加總，也不會把年度數字平均分配。請自行填寫每月預估；沒有收付請明確填0，空白不當作0。</p>
    <form class="timing-form" novalidate><fieldset class="timing-fieldset"><legend>填入月度規劃資料（金額單位：新臺幣萬元）</legend>
      <div class="timing-basics"><label>月度規劃起始月份<input name="startMonth" type="month" required><small>從這個月開始，最多連續規劃12個月；與預計開始用款月份可不同。</small></label><label>可動用期初現金<input name="openingCash" type="number" min="0" step="0.01" inputmode="decimal" required placeholder="請填金額"><small>起始月開始時可投入本計畫的現金；已計入的款項，勿再列當月收款。</small></label></div>
      <p class="timing-help">支出請包含營運、投資、稅款及還本付息等實際付款；按各月實際時點填寫。</p>
      <div class="timing-table-wrap"><table class="timing-input-table"><caption>每月預估收款與支出</caption><thead><tr><th scope="col">月份</th><th scope="col">預估收款（萬元）</th><th scope="col">預估支出（萬元）</th></tr></thead><tbody></tbody></table></div>
      <div class="timing-row-actions"><button class="timing-add" type="button">＋ 新增月份</button><button class="timing-remove" type="button">移除最後一個月</button><span class="timing-count"></span></div>
      <p class="timing-error" role="alert"></p><button class="timing-update" type="submit">更新月度資金規劃</button>
    </fieldset><button class="timing-reset" type="button">清除月度資料</button></form>
    <div class="timing-results" hidden><p class="timing-stale" role="status" hidden></p><div class="timing-metrics"></div><div class="timing-chart"></div><div class="timing-table-wrap timing-output-table"></div><p class="timing-result-note">以上以月末餘額觀察，月內先付後收仍可能短缺；請另核對實際收付款日期。這份缺口不等於銀行可貸額度。</p><p class="timing-updated"></p><button type="button" class="timing-copy" disabled>複製月度摘要</button><p class="timing-copy-status" role="status"></p><label class="timing-copy-fallback" hidden>請選取並複製摘要<textarea readonly rows="8"></textarea></label></div>
  </section>`;
  const find = s => container.querySelector(s);
  const form = find('.timing-form');
  const fieldset = find('.timing-fieldset');
  const startInput = form.elements.namedItem('startMonth');
  const cashInput = form.elements.namedItem('openingCash');
  const tbody = find('.timing-input-table tbody');
  const results = find('.timing-results');
  const status = find('.timing-status');
  const copyButton = find('.timing-copy');
  const error = find('.timing-error');

  function summaryText() {
    if (!last || dirty || !activePlan()) return null;
    const lines = [
      '月度資金規劃摘要（選填、獨立試算）',
      '以下金額皆為新臺幣萬元；海外原幣收支已由填寫者自行換算。',
      `討論用途：${models[plan?.model] || '本次資金計畫'}`,
      `期間：${monthLabel(last.startMonth)}至${monthLabel(last.endMonth)}`,
      `可動用期初現金：${fmt(last.openingCash)}萬元`,
      `首次月末不足：${last.firstShortfallMonth ? monthLabel(last.firstShortfallMonth) : '所填月份未出現不足'}`,
      `最大月末缺口：${fmt(last.maxGap)}萬元${last.maxGapMonth ? '（' + monthLabel(last.maxGapMonth) + '）' : ''}`,
      `期末餘額：${fmt(last.endingBalance)}萬元`,
      ...last.rows.map(r => `${r.month}：收款${fmt(r.receipts)}、支出${fmt(r.payments)}、月末餘額${fmt(r.closingBalance)}萬元`),
      '各月皆為自行填寫，未假設平均分配；本月度結果未與年度四模型相加。月末試算不反映月內收付順序，缺口不等於銀行核貸額度。',
      `更新時間：${updatedAt}`
    ];
    return lines.join('\n');
  }

  function notify() {
    if (typeof onChange !== 'function') return;
    try { onChange({ ready: !!summaryText(), stale: !!last && dirty, hasResult: !!last, summary: summaryText() }); } catch { /* Optional UI must not interrupt the annual calculator. */ }
  }

  function availability() {
    const available = !!activePlan();
    fieldset.disabled = !available;
    find('.timing-add').disabled = rowCount >= 12;
    find('.timing-remove').disabled = rowCount <= 1;
    copyButton.disabled = !last || dirty || !available;
    find('.timing-count').textContent = `${rowCount} / 12 個月`;
    find('.timing-context').textContent = available ? `目前討論用途：${models[plan?.model] || '本次資金計畫'}。月度金額需獨立確認。` : '請先完成上方任一用途試算；保留的月度表單不會自動套用到新情境。';
  }

  function updateMonthLabels() {
    for (const [index, row] of [...tbody.rows].entries()) {
      let month = '';
      try { month = addMonths(startInput.value, index); } catch { /* Keep blank month labels until a valid start is selected. */ }
      row.dataset.month = month;
      row.querySelector('th').textContent = month ? monthLabel(month) : `第${index + 1}個月`;
      row.querySelector('[data-kind="receipts"]').setAttribute('aria-label', `${month || '第' + (index + 1) + '個月'}預估收款，萬元`);
      row.querySelector('[data-kind="payments"]').setAttribute('aria-label', `${month || '第' + (index + 1) + '個月'}預估支出，萬元`);
    }
  }

  function appendRow() {
    const row = doc.createElement('tr');
    row.innerHTML = '<th scope="row"></th><td><input type="number" data-kind="receipts" min="0" step="0.01" inputmode="decimal" required placeholder="請填金額"></td><td><input type="number" data-kind="payments" min="0" step="0.01" inputmode="decimal" required placeholder="請填金額"></td>';
    tbody.append(row);
    rowCount = tbody.rows.length;
    updateMonthLabels();
    availability();
  }

  function markStale(reason = '月度資料已變更；圖表及表格仍為上次結果，請按「更新月度資金規劃」。') {
    dirty = true;
    error.textContent = '';
    find('.timing-copy-status').textContent = '';
    find('.timing-copy-fallback').hidden = true;
    find('.timing-copy-fallback textarea').value = '';
    if (last) {
      status.textContent = '舊結果待更新';
      status.classList.add('is-stale');
      results.classList.add('is-stale');
      find('.timing-stale').textContent = reason;
      find('.timing-stale').hidden = false;
    } else { status.textContent = '尚未更新'; }
    availability();
    notify();
  }

  function chartMarkup(rows) {
    const width = 720, height = 238, left = 65, right = 24, top = 23, bottom = 49;
    let min = Math.min(0, ...rows.map(r => r.closingBalance));
    let max = Math.max(0, ...rows.map(r => r.closingBalance));
    if (min === max) { min = -1; max = 1; }
    const padding = (max - min) * 0.08;
    min -= padding; max += padding;
    const x = i => rows.length === 1 ? (left + width - right) / 2 : left + i * (width - left - right) / (rows.length - 1);
    const y = n => top + (max - n) / (max - min) * (height - top - bottom);
    const points = rows.map((r, i) => `${x(i)},${y(r.closingBalance)}`).join(' ');
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="所填月份的月末現金餘額折線圖，表格提供各月完整數字"><text x="5" y="16" class="timing-axis-label">萬元</text><line x1="${left}" y1="${y(0)}" x2="${width - right}" y2="${y(0)}" class="timing-zero"/><text x="${left - 9}" y="${y(0) + 4}" text-anchor="end" class="timing-axis-label">0</text><polyline points="${points}" class="timing-line"/>${rows.map((r, i) => `<circle cx="${x(i)}" cy="${y(r.closingBalance)}" r="5" class="${r.closingBalance < 0 ? 'timing-negative' : 'timing-positive'}"><title>${r.month} 月末餘額 ${fmt(r.closingBalance)}萬元</title></circle><text x="${x(i)}" y="${height - 20}" text-anchor="middle" class="timing-axis-label">${r.month.slice(2).replace('-', '/')}</text>`).join('')}</svg>`;
  }

  function renderResult(result) {
    find('.timing-metrics').innerHTML = [
      ['首次月末不足', result.firstShortfallMonth ? monthLabel(result.firstShortfallMonth) : '所填月份未不足'],
      ['最大月末缺口', `${fmt(result.maxGap)}萬元`],
      ['期末現金餘額', `${fmt(result.endingBalance)}萬元`]
    ].map(([label, value]) => `<div><small>${label}</small><strong>${value}</strong></div>`).join('');
    find('.timing-chart').innerHTML = chartMarkup(result.rows);
    find('.timing-output-table').innerHTML = `<table><caption>月度規劃結果（金額單位：萬元）</caption><thead><tr><th scope="col">月份</th><th scope="col">收款</th><th scope="col">支出</th><th scope="col">當月淨收付</th><th scope="col">月末餘額</th></tr></thead><tbody>${result.rows.map(r => `<tr${r.closingBalance < 0 ? ' class="is-shortfall"' : ''}><th scope="row">${r.month}</th><td>${fmt(r.receipts)}</td><td>${fmt(r.payments)}</td><td>${fmt(r.net)}</td><td>${fmt(r.closingBalance)}${r.closingBalance < 0 ? '（不足）' : ''}</td></tr>`).join('')}</tbody></table>`;
    results.hidden = false;
    results.classList.remove('is-stale');
    find('.timing-stale').hidden = true;
    find('.timing-updated').textContent = `月度規劃更新時間：${updatedAt}`;
    find('.timing-copy-status').textContent = '';
    find('.timing-copy-fallback').hidden = true;
    status.textContent = '月度結果已更新';
    status.classList.remove('is-stale');
    availability();
  }

  function setPlan(nextPlan) {
    const changedModel = !!plan && !!nextPlan && plan.model !== nextPlan.model;
    plan = nextPlan;
    if (!nextPlan || changedModel) {
      last = null; dirty = true; results.hidden = true; results.classList.remove('is-stale');
      find('.timing-metrics').replaceChildren();
      find('.timing-chart').replaceChildren();
      find('.timing-output-table').replaceChildren();
      find('.timing-copy-fallback textarea').value = '';
      find('.timing-copy-fallback').hidden = true;
      error.textContent = '';
      status.textContent = nextPlan ? '新情境待確認' : '等待用途試算';
      status.classList.remove('is-stale');
      availability(); notify();
    } else if (last) {
      markStale('上方年度試算已更新；月度金額不會自動調整，請確認後更新月度規劃。');
    } else { availability(); notify(); }
  }

  form.addEventListener('input', event => { if (event.target === startInput) updateMonthLabels(); markStale(); });
  find('.timing-reset').addEventListener('click', () => {
    last = null; dirty = false; updatedAt = '';
    startInput.value = ''; cashInput.value = '';
    tbody.replaceChildren(); rowCount = 0; appendRow();
    results.hidden = true; results.classList.remove('is-stale');
    find('.timing-metrics').replaceChildren();
    find('.timing-chart').replaceChildren();
    find('.timing-output-table').replaceChildren();
    find('.timing-stale').hidden = true;
    find('.timing-copy-fallback textarea').value = '';
    find('.timing-copy-fallback').hidden = true;
    find('.timing-copy-status').textContent = '';
    error.textContent = '';
    status.textContent = activePlan() ? '尚未規劃' : '等待用途試算';
    status.classList.remove('is-stale');
    availability(); notify();
  });
  find('.timing-add').addEventListener('click', () => { if (rowCount >= 12) return; appendRow(); markStale(); tbody.rows[rowCount - 1].querySelector('input').focus(); });
  find('.timing-remove').addEventListener('click', () => { if (rowCount <= 1) return; tbody.lastElementChild.remove(); rowCount = tbody.rows.length; markStale(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!activePlan()) { error.textContent = '請先更新上方用途試算，再規劃月度收付款。'; return; }
    try {
      const input = { startMonth: startInput.value, openingCash: cashInput.value, months: [...tbody.rows].map(row => ({ month: row.dataset.month, receipts: row.querySelector('[data-kind="receipts"]').value, payments: row.querySelector('[data-kind="payments"]').value })) };
      const result = calculateTiming(input);
      plan = activePlan(); last = result; dirty = false;
      updatedAt = new Date().toLocaleString('zh-TW', { hour12: false });
      error.textContent = ''; renderResult(result); notify();
    } catch (err) { error.textContent = err instanceof Error ? err.message : '請確認月度規劃資料。'; if (last) markStale(); error.textContent = err instanceof Error ? err.message : '請確認月度規劃資料。'; }
  });
  copyButton.addEventListener('click', async () => {
    const text = summaryText();
    if (!text) return;
    try {
      if (!globalThis.navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      find('.timing-copy-status').textContent = '月度摘要已複製；可自行貼入給專人的需求說明。';
    } catch {
      if (!summaryText()) return;
      const box = find('.timing-copy-fallback'); box.hidden = false;
      const area = box.querySelector('textarea'); area.value = text; area.focus(); area.select();
      find('.timing-copy-status').textContent = '目前無法自動複製，請選取下方摘要文字自行複製。';
    }
  });
  appendRow(); availability();
  return { getSummary: summaryText, markStale, setPlan };
}
