// Independent monthly cash planning. All amounts use the same unit: 萬元.
// This module deliberately does not accept or combine annual model results.
const zero = n => Math.abs(n) < 1e-9 ? 0 : n;

function monthIndex(value) {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value) || Number(value.slice(0, 4)) < 1) {
    throw new Error('請選擇有效的月度規劃起始月份，例如2026-11。');
  }
  return Number(value.slice(0, 4)) * 12 + Number(value.slice(5)) - 1;
}

export function addMonths(month, offset) {
  const start = monthIndex(month);
  if (!Number.isInteger(offset) || offset < 0) throw new Error('月份間隔必須是非負整數。');
  const next = start + offset;
  const year = Math.floor(next / 12);
  if (year > 9999) throw new Error('規劃月份超出可處理的範圍。');
  return `${String(year).padStart(4, '0')}-${String(next % 12 + 1).padStart(2, '0')}`;
}

function amount(raw, label) {
  if (raw === null || raw === undefined || (typeof raw === 'string' && !raw.trim())) {
    throw new Error(`請填寫${label}；沒有金額時請明確填0。`);
  }
  if (!['string', 'number'].includes(typeof raw)) throw new Error(`${label}必須是有效金額。`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label}必須是0或正數，請檢查金額與單位。`);
  if (value > Number.MAX_SAFE_INTEGER) throw new Error(`${label}金額過大，請檢查輸入單位。`);
  return value;
}

export function calculateTiming(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('請填寫月度規劃資料。');
  const { startMonth, months } = input;
  monthIndex(startMonth);
  const openingCash = amount(input.openingCash, '可動用期初現金');
  if (!Array.isArray(months) || months.length < 1 || months.length > 12) throw new Error('請至少填寫1個月，最多規劃12個月。');
  let balance = openingCash;
  let totalReceipts = 0;
  let totalPayments = 0;
  let firstShortfallMonth = null;
  let maxGap = 0;
  let maxGapMonth = null;
  const rows = months.map((row, index) => {
    const month = addMonths(startMonth, index);
    if (!row || typeof row !== 'object' || row.month !== month) throw new Error(`第${index + 1}筆月份應為${month}；請依連續月份填寫，不可跳月或重複。`);
    const receipts = amount(row.receipts, `${month}收款`);
    const payments = amount(row.payments, `${month}支出`);
    const openingBalance = balance;
    const net = zero(receipts - payments);
    balance = zero(balance + net);
    totalReceipts += receipts;
    totalPayments += payments;
    if (![balance, totalReceipts, totalPayments].every(n => Number.isFinite(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER)) throw new Error('月度金額過大，請檢查輸入單位。');
    const gap = Math.max(0, -balance);
    if (gap > 0 && firstShortfallMonth === null) firstShortfallMonth = month;
    if (gap > maxGap) { maxGap = gap; maxGapMonth = month; }
    return { month, receipts, payments, net, openingBalance, closingBalance: balance, gap };
  });
  return { startMonth, endMonth: rows.at(-1).month, openingCash, totalReceipts, totalPayments, endingBalance: balance, firstShortfallMonth, maxGap, maxGapMonth, rows, unit: '萬元' };
}
