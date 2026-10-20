import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, calculateTiming } from './timing-engine.js';

const sample = () => ({ startMonth: '2026-11', openingCash: 10, months: [
  { month: '2026-11', receipts: 0, payments: 30 },
  { month: '2026-12', receipts: 10, payments: 20 },
  { month: '2027-01', receipts: 50, payments: 0 }
] });

test('monthly gaps carry forward cumulatively and recovery does not erase an earlier peak', () => {
  const result = calculateTiming(sample());
  assert.deepEqual(result.rows.map(r => r.closingBalance), [-20, -30, 20]);
  assert.deepEqual(result.rows.map(r => r.openingBalance), [10, -20, -30]);
  assert.equal(result.firstShortfallMonth, '2026-11');
  assert.equal(result.maxGap, 30);
  assert.equal(result.maxGapMonth, '2026-12');
  assert.equal(result.endingBalance, 20);
  assert.equal(result.totalReceipts, 60);
  assert.equal(result.totalPayments, 50);
});

test('calendar generation supports different starting months and crosses the year correctly', () => {
  assert.equal(addMonths('2026-12', 1), '2027-01');
  assert.equal(addMonths('2027-02', 11), '2028-01');
  const result = calculateTiming({ startMonth: '2027-06', openingCash: 50, months: [
    { month: '2027-06', receipts: 0, payments: 50 },
    { month: '2027-07', receipts: 0, payments: 2.5 }
  ] });
  assert.equal(result.firstShortfallMonth, '2027-07');
  assert.equal(result.rows[0].closingBalance, 0);
  assert.equal(result.maxGap, 2.5);
});

test('explicit zeros are valid and do not invent a deficit or an average monthly distribution', () => {
  const result = calculateTiming({ startMonth: '2026-11', openingCash: '0', months: [
    { month: '2026-11', receipts: '120', payments: '0' },
    { month: '2026-12', receipts: '0', payments: '30' }
  ] });
  assert.deepEqual(result.rows.map(r => r.closingBalance), [120, 90]);
  assert.equal(result.maxGap, 0);
  assert.equal(result.firstShortfallMonth, null);
  assert.equal(result.maxGapMonth, null);
  assert.equal(result.rows.length, 2);
});

test('no data, blank cash and blank monthly amounts are rejected rather than treated as zero', () => {
  assert.throws(() => calculateTiming({}), /起始月份/);
  assert.throws(() => calculateTiming({ ...sample(), months: [] }), /至少填寫/);
  assert.throws(() => calculateTiming({ ...sample(), openingCash: '' }), /期初現金/);
  assert.throws(() => calculateTiming({ startMonth: '2026-11', openingCash: 0, months: [{ month: '2026-11', receipts: '', payments: 0 }] }), /收款/);
  assert.throws(() => calculateTiming({ startMonth: '2026-11', openingCash: 0, months: [{ month: '2026-11', receipts: 0, payments: null }] }), /支出/);
});

test('duplicate, skipped and mismatching months cannot silently imply missing cash flows', () => {
  for (const month of ['2026-11', '2027-01', '2026-10']) {
    const input = sample(); input.months[1].month = month;
    assert.throws(() => calculateTiming(input), /不可跳月或重複/);
  }
  assert.throws(() => calculateTiming({ ...sample(), startMonth: '2026-10' }), /第1筆/);
  const months = Array.from({ length: 13 }, (_, i) => ({ month: addMonths('2026-11', i), receipts: 0, payments: 0 }));
  assert.throws(() => calculateTiming({ ...sample(), months }), /最多規劃12/);
});

test('negative and nonfinite financial inputs fail while negative computed balances remain valid', () => {
  for (const value of [-1, NaN, Infinity, true, 'not a number']) {
    assert.throws(() => calculateTiming({ ...sample(), openingCash: value }), /期初現金/);
    const input = sample(); input.months[0].receipts = value;
    assert.throws(() => calculateTiming(input), /收款/);
    const out = sample(); out.months[0].payments = value;
    assert.throws(() => calculateTiming(out), /支出/);
  }
  assert.equal(calculateTiming(sample()).rows[0].closingBalance, -20);
});

test('invalid calendars and numeric overflow fail clearly; source input is not mutated', () => {
  for (const startMonth of ['', '2026-13', '26-01', '0000-01']) assert.throws(() => calculateTiming({ ...sample(), startMonth }), /起始月份/);
  assert.throws(() => addMonths('2026-11', -1), /非負整數/);
  const overflow = { startMonth: '2026-11', openingCash: 1e308, months: [{ month: '2026-11', receipts: 1e308, payments: 0 }] };
  assert.throws(() => calculateTiming(overflow), /金額過大/);
  const input = sample(), before = JSON.stringify(input);
  calculateTiming(input);
  assert.equal(JSON.stringify(input), before);
});
