// All TWD amounts are in 萬元; USD amounts are in 萬美元. Rates use percent,
// e.g. 70 means 70%, and fx is TWD per USD. No bank approval is implied.
const F = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 });
const money = n => `${F.format(n)} 萬元`;
const usd = n => `${F.format(n)} 萬美元`;
const ratio = n => `${F.format(n)} 倍`;
const percent = n => `${F.format(n * 100)}%`;
const nearZero = n => Math.abs(n) < 1e-9 ? 0 : n;

function object(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('請提供完整的試算資料。');
}

function number(v, key, { min = 0, max = Infinity, integer = false, optional = false, fallback } = {}) {
  const raw = v[key];
  if (raw === undefined || raw === null || (typeof raw === 'string' && !raw.trim())) {
    if (fallback !== undefined) return fallback;
    if (optional) return null;
    throw new Error(`請填寫 ${key}。`);
  }
  if (typeof raw !== 'number' && typeof raw !== 'string') throw new Error(`${key} 必須是有效數字。`);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new Error(`${key} 的數值不合理，請檢查範圍與單位。`);
  }
  return n;
}

function annualEqualPrincipal(principal, interest, tenor, grace = 0) {
  const rows = [];
  let balance = principal;
  const instalment = principal / (tenor - grace);
  for (let year = 1; year <= tenor; year++) {
    const charge = balance * interest / 100;
    const capital = year <= grace ? 0 : (year === tenor ? balance : Math.min(balance, instalment));
    rows.push({ year, principal: nearZero(capital), interest: nearZero(charge), total: nearZero(capital + charge) });
    balance = nearZero(balance - capital);
  }
  return rows;
}

function monthlyAnnuity(principal, interest, tenor) {
  const months = tenor * 12;
  const r = interest / 1200;
  const payment = principal === 0 ? 0 : r === 0 ? principal / months : principal * r / -Math.expm1(-months * Math.log1p(r));
  const schedule = [];
  let balance = principal;
  for (let month = 1; month <= months; month++) {
    const charge = balance * r;
    const capital = month === months ? balance : Math.min(balance, Math.max(0, payment - charge));
    const yearIndex = Math.floor((month - 1) / 12);
    schedule[yearIndex] ||= { year: yearIndex + 1, principal: 0, interest: 0, total: 0 };
    schedule[yearIndex].principal += capital;
    schedule[yearIndex].interest += charge;
    schedule[yearIndex].total += capital + charge;
    balance = nearZero(balance - capital);
  }
  return { payment, schedule };
}

function working(v) {
  const sales = number(v, 'sales');
  const nextSales = number(v, 'nextSales');
  const cost = number(v, 'cost', { max: 1000 }) / 100;
  const dso = number(v, 'dso');
  const dio = number(v, 'dio');
  const dpo = number(v, 'dpo');
  const own = number(v, 'own', { fallback: 0 });
  const existing = number(v, 'existing', { fallback: 0 });
  const parts = revenue => ({ ar: revenue * dso / 365, stock: revenue * cost * dio / 365, ap: revenue * cost * dpo / 365 });
  const current = parts(sales);
  const future = parts(nextSales);
  const currentNeed = current.ar + current.stock - current.ap;
  const futureNeed = future.ar + future.stock - future.ap;
  const change = nearZero(futureNeed - currentNeed);
  const incremental = Math.max(0, change);
  const need = Math.max(0, Math.max(0, futureNeed) - own - existing);
  return {
    label: '明年尚待規劃的週轉資金', value: need, unit: '萬元',
    sub: '估計明年總資金占用，扣除明年可投入自有資金與可確認可用的既有融資。' + (change < 0 ? ' 與今年相比，資金占用減少。' : ''),
    metrics: [
      { label: '今年週轉資金占用', value: money(currentNeed) },
      { label: '明年週轉資金占用', value: money(futureNeed) },
      { label: '相較今年增減', value: `${change > 0 ? '+' : ''}${money(change)}` },
      { label: '備貨到收款的時間落差', value: `${F.format(dso + dio - dpo)} 天` }
    ],
    breakdown: [{ label: '收款等待占用', value: future.ar }, { label: '備貨占用', value: future.stock }, { label: '供應商帳期支持', value: -future.ap }],
    formula: '週轉占用＝年營收×收款天數÷365＋年營收×成本率×存貨天數÷365－年營收×成本率×付款天數÷365；明年尚待規劃週轉資金＝MAX(0，MAX(0，明年占用)－明年可投入自有資金－明年可用既有融資)。',
    note: '採全年平均、進貨約等於銷貨成本的簡化假設；未納入旺季、預收預付與稅款。自有資金請填可投入明年總營運規模的金額；既有融資含已動用及尚未動用、且可確認明年能持續使用的金額。負占用不代表完全不需現金；結果不是銀行核貸額度。' + (cost > 1 ? ' 成本率超過100%，表示毛利為負，請確認輸入並另評估虧損資金需求。' : ''),
    extra: { currentNeed, futureNeed, change, incremental, own, existing, cashCycle: dso + dio - dpo, ...future }
  };
}

function equipment(v) {
  const invest = number(v, 'invest');
  const equity = number(v, 'equity');
  const interest = number(v, 'interest', { max: 100 });
  const tenor = number(v, 'tenor', { min: 1, max: 50, integer: true });
  const grace = number(v, 'grace', { max: tenor - 1, integer: true, fallback: 0 });
  const annualBudget = number(v, 'annualBudget');
  const loan = Math.max(0, invest - equity);
  const schedule = annualEqualPrincipal(loan, interest, tenor, grace);
  const peakAnnual = Math.max(...schedule.map(row => row.total));
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const coverage = peakAnnual > 0 ? annualBudget / peakAnnual : null;
  return {
    label: '每年預計還款金額', value: peakAnnual, unit: '萬元／年',
    sub: loan > 0 ? `第 ${grace + 1} 年開始還本金；此處顯示最高年度本息，之後逐年遞減。` : '自有資金已涵蓋本次投資，試算無新增借款。',
    metrics: [
      { label: '需規劃的借款金額', value: money(loan) },
      { label: '寬限期間每年利息', value: grace ? money(loan * interest / 100) : '未設定寬限期' },
      { label: '每年可用於還款', value: money(annualBudget) },
      { label: '最高年度還款餘裕', value: coverage === null ? '無新增本息／不適用' : ratio(coverage) }
    ],
    breakdown: [{ label: '可投入自有資金', value: Math.min(equity, invest) }, { label: '需規劃借款', value: loan }],
    formula: '借款＝MAX(0，投資總額－自有資金)；寬限期僅付息；寬限期後每年還本金＝借款÷(總年期－寬限年數)，利息＝當年期初本金×年利率。',
    note: '採等額本金、每年繳付一次的展示假設，並非銀行報價。還款預算應為扣除營運支出、稅款與其他既有借款本息後，可供本案還款的金額；未納入工程分批撥款、費用與利率變動。' + (coverage !== null && coverage < 1 ? ' 目前預算不足以支付最高年度本息。' : ''),
    schedule,
    extra: { loan, peakAnnual, annualBudget, coverage, totalInterest, firstYearPayment: schedule[0].total, firstAmortizationYear: grace + 1, graceAnnualInterest: grace ? loan * interest / 100 : 0 }
  };
}

function expansion(v) {
  const setup = number(v, 'setup');
  const reserve = number(v, 'reserve');
  const equity = number(v, 'equity');
  const revenue = number(v, 'revenue');
  const margin = number(v, 'margin', { max: 100 }) / 100;
  const fixed = number(v, 'fixed');
  const ramp = number(v, 'ramp', { max: 120, integer: true });
  const interest = number(v, 'interest', { max: 100 });
  const tenor = number(v, 'tenor', { min: 1, max: 50, integer: true });
  const annualBudget = number(v, 'annualBudget');
  const totalInvestment = setup + reserve;
  const loan = Math.max(0, totalInvestment - equity);
  const { payment, schedule } = monthlyAnnuity(loan, interest, tenor);
  const annualDebt = schedule[0].total;
  const operatingSurplus = revenue * margin - fixed;
  const monthlySurplus = operatingSurplus - payment;
  const rampMonthlySurplus = revenue * 0.5 * margin - fixed - payment;
  const rampFunding = Math.max(0, -rampMonthlySurplus * ramp);
  const firstYearCash = revenue * (12 - Math.min(ramp, 12) * 0.5) * margin - fixed * 12 - annualDebt;
  const breakEvenRevenue = margin > 0 ? (fixed + payment) / margin : null;
  const coverage = annualDebt > 0 ? annualBudget / annualDebt : null;
  const stablePayback = operatingSurplus > 0 ? totalInvestment / operatingSurplus : null;
  return {
    label: '穩定營運後每月餘額', value: monthlySurplus, unit: '萬元／月',
    sub: '以預估營收扣除變動成本、固定支出與本案貸款本息；尚未扣除稅金。',
    metrics: [
      { label: '需規劃的借款金額', value: money(loan) },
      { label: '每月預計貸款本息', value: money(payment) },
      { label: '含還款的每月損益平衡營收', value: breakEvenRevenue === null ? '貢獻毛利率為0／無法計算' : money(breakEvenRevenue) },
      { label: '爬坡期間預估虧損墊付', value: money(rampFunding) },
      { label: '第一年還款後營運餘額', value: money(firstYearCash) },
      { label: '年度還款預算餘裕', value: coverage === null ? '無新增本息／不適用' : ratio(coverage) }
    ],
    breakdown: [{ label: '開店建置投入', value: setup }, { label: '預留週轉金', value: reserve }],
    formula: '借款＝MAX(0，建置費＋週轉準備－自有資金)；每月餘額＝月營收×貢獻毛利率－月固定支出－貸款月付。爬坡期營收設為穩定期50%；貸款採月繳本息平均攤還。',
    note: '固定支出含租金、固定人事等；貢獻毛利須先扣除商品／食材、包材及平台抽成等變動成本，避免與固定支出重複。預留週轉金是融資用途，仍應檢查是否足以支應爬坡虧損；爬坡月數可能跨年。未含稅、季節性與既有店面借款。' + (reserve < rampFunding ? ' 目前週轉準備低於爬坡期估計墊付金額。' : ''),
    schedule,
    extra: { totalInvestment, loan, monthlyPayment: payment, annualDebt, operatingSurplus, monthlySurplus, rampMonthlySurplus, rampFunding, firstYearCash, breakEvenRevenue, annualBudget, coverage, reserveGap: Math.max(0, rampFunding - reserve), stablePaybackMonths: stablePayback }
  };
}

function overseas(v) {
  const mode = v.mode;
  if (!['twd', 'usd', 'dual'].includes(mode)) throw new Error('請選擇台幣、美元或雙幣別模式。');
  // Ignore inactive fields so changing a mode never carries hidden budgets into results.
  const investTwd = mode === 'usd' ? 0 : number(v, 'investTwd');
  const investUsd = mode === 'twd' ? 0 : number(v, 'investUsd');
  const equityTwd = mode === 'usd' ? 0 : number(v, 'equityTwd');
  const equityUsd = mode === 'twd' ? 0 : number(v, 'equityUsd');
  const fx = number(v, 'fx', { min: Number.MIN_VALUE });
  const swing = number(v, 'swing', { max: 100 }) / 100;
  const buffer = number(v, 'buffer', { max: 100 }) / 100;
  const months = number(v, 'months', { min: 1, max: 120, integer: true });
  const twdGap = Math.max(0, investTwd - equityTwd);
  const usdGap = Math.max(0, investUsd - equityUsd);
  const baseNeed = twdGap + usdGap * fx;
  const stressedFx = fx * (1 + swing);
  const stressNeed = twdGap + usdGap * stressedFx;
  const reserve = stressNeed * buffer;
  const total = stressNeed + reserve;
  return {
    label: '含匯率壓力與預備金的缺口', value: total, unit: '萬元（台幣等值）',
    sub: '台幣與美元子預算各自扣除同幣自有資金，再換算；未進行跨幣別抵銷或換匯。',
    metrics: [
      { label: '台幣子預算缺口', value: money(twdGap) },
      { label: '美元子預算缺口', value: usd(usdGap) },
      { label: '原匯率下合計缺口', value: money(baseNeed) },
      { label: '壓力情境匯率', value: `1 美元＝${F.format(stressedFx)} 台幣` },
      { label: '匯率變動增加的台幣等值', value: money(stressNeed - baseNeed) },
      { label: '預留資金', value: money(reserve) },
      { label: '分攤至計畫期間的每月平均', value: `${money(total / months)}／月` }
    ],
    breakdown: [{ label: '台幣缺口', value: twdGap }, { label: '美元缺口台幣等值', value: usdGap * fx }, { label: '美元升值壓力', value: stressNeed - baseNeed }, { label: '預備金', value: reserve }],
    formula: '台幣缺口＝MAX(0，台幣投資－台幣自有)；美元缺口＝MAX(0，美元投資－美元自有)；壓力缺口＝台幣缺口＋美元缺口×原匯率×(1＋美元升值幅度)；總缺口＝壓力缺口×(1＋預備金率)。',
    note: '台幣與美元金額須為互不重複的用途子預算，請勿把同一筆投資填兩次。僅美元缺口承受美元升值情境；台幣模式不受美元壓力影響。其他幣別盈餘未換匯抵用；每月平均是資金配置參考，不是貸款還款金額，未含境外稅費、利息或投資報酬。',
    extra: { mode, twdGap, usdGap, fx, stressedFx, baseNeed, stressNeed, fxImpact: stressNeed - baseNeed, reserve, bufferRate: buffer, total, monthlyAverage: total / months, months }
  };
}

export function calculate(model, v) {
  object(v);
  const models = { working, equipment, expansion, overseas };
  if (!Object.hasOwn(models, model)) throw new Error('找不到此融資試算模型。');
  const result = models[model](v);
  const check = value => {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('試算金額過大，請檢查輸入單位。');
    if (value && typeof value === 'object') Object.values(value).forEach(check);
  };
  check(result);
  return result;
}

export function diagnose(v) {
  object(v);
  const p = {};
  for (const key of ['cash', 'receipts', 'stock', 'shortDebt', 'totalDebt', 'assets', 'sales', 'profit', 'annualAvailable', 'annualDebt']) {
    p[key] = number(v, key, { optional: true, min: ['profit', 'annualAvailable'].includes(key) ? -Infinity : 0 });
  }
  if (p.shortDebt !== null && p.totalDebt !== null && p.shortDebt > p.totalDebt) throw new Error('一年內應付總額不可大於全部負債，請確認兩欄均含借款與應付款。');
  if (p.assets !== null && [p.cash, p.receipts, p.stock].every(x => x !== null) && p.cash + p.receipts + p.stock > p.assets + 1e-8) throw new Error('現金、應收款與庫存合計不可大於全部資產，請確認金額與單位。');
  const make = (label, keys, denominator, get, thresholds, format, definition, advice) => {
    if (keys.some(key => p[key] === null)) return { label, value: '資料不足', status: 'na', definition, advice: '補齊此項需要的欄位後，再更新結果。' };
    if (p[denominator] === 0) return { label, value: '不適用', status: 'na', definition, advice: '分母為0，此指標不作紅黃綠判定；請確認是否確實沒有相關金額。' };
    const value = get();
    if (!Number.isFinite(value)) throw new Error('健檢金額過大，請檢查輸入單位。');
    const status = thresholds(value);
    return { label, value: format(value), status, definition, advice: advice[status] };
  };
  const ascending = (red, green) => n => n < red ? 'red' : n < green ? 'yellow' : 'green';
  const items = [
    make('短期付款能力', ['cash', 'receipts', 'stock', 'shortDebt'], 'shortDebt', () => (p.cash + p.receipts + p.stock) / p.shortDebt, ascending(1, 1.5), ratio,
      '（可動用現金＋一年內可收貨款＋可售庫存成本）÷一年內全部應付款；紅＜1、黃1～未滿1.5、綠≥1.5。為簡化流動比率，不含其他流動資產。',
      { red: '短期可變現資金低於應付款，先盤點收款、存貨與到期借款。', yellow: '目前可涵蓋應付款，但緩衝較薄，應保留備用資金。', green: '短期付款緩衝達測試參考值，仍應核對實際收款與到期時點。' }),
    make('不賣庫存的付款能力', ['cash', 'receipts', 'shortDebt'], 'shortDebt', () => (p.cash + p.receipts) / p.shortDebt, ascending(0.7, 1), ratio,
      '（可動用現金＋一年內可收貨款）÷一年內全部應付款；紅＜0.7、黃0.7～未滿1、綠≥1。為簡化速動比率。',
      { red: '付款可能仰賴庫存出售或額外融資，優先檢查近期現金流。', yellow: '部分付款仍需靠庫存變現，留意滯銷品與客戶延遲付款。', green: '不計庫存仍有一定付款緩衝；應收款須確認收得到。' }),
    make('全部負債占資產的比例', ['totalDebt', 'assets'], 'assets', () => p.totalDebt / p.assets, n => n > 0.7 ? 'red' : n > 0.5 ? 'yellow' : 'green', percent,
      '全部借款與應付款÷全部資產帳面金額；綠≤50%、黃大於50%～70%、紅＞70%。',
      { red: '負債占比較高，新增投資前應檢查自有資金與償債來源。', yellow: '負債已有一定比重，宜控制新增槓桿並保留現金。', green: '負債占比低於測試參考值；資產品質仍需另行確認。' }),
    make('每100元營收留下的營業利益', ['profit', 'sales'], 'sales', () => p.profit / p.sales, ascending(0, 0.05), n => `${F.format(n * 100)} 元`,
      '全年營業利益（未扣利息與稅）÷全年營收×100；紅為營業虧損、黃為0～未滿5元、綠≥5元。以本業收入扣除營業成本與營業費用計算，不含業外損益；產業差異會影響解讀。',
      { red: '目前本業為營業虧損，先確認成本、售價與營業費用。', yellow: '本業雖未虧損，但營業利益緩衝有限，應評估營收下滑情境。', green: '營業利益達測試參考值，仍須確認成本與營業費用是否完整計入。' }),
    make('一年還款餘裕', ['annualAvailable', 'annualDebt'], 'annualDebt', () => p.annualAvailable / p.annualDebt, ascending(1, 1.2), ratio,
      '扣除營運支出與稅款後、還本息前的年度可用現金÷全年全部借款本金及利息；紅＜1、黃1～未滿1.2、綠≥1.2。',
      { red: '年度可用現金低於本息，需調整投資、還款安排或資金來源。', yellow: '剛好或接近涵蓋本息，宜測試營收下滑與利率上升。', green: '本息支應達測試參考值；仍須留意季節性與付款時點。' })
  ];
  const overall = items.some(i => i.status === 'red') ? 'red' : items.some(i => i.status === 'yellow') ? 'yellow' : items.some(i => i.status === 'na') ? 'na' : 'green';
  return { items, overall, note: '紅黃綠門檻為本測試網自訂參考值，並非銀行授信標準。請以同一期間、同一公司與相同金額單位填寫；資料不足或分母為0不視為健康。' };
}
