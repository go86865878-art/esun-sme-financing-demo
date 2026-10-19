import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, diagnose } from './engine.js';

const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const working = { sales: 1000, nextSales: 1200, cost: 70, dso: 60, dio: 45, dpo: 30, own: 0, existing: 0 };
const factory = { invest: 1000, equity: 200, interest: 3, tenor: 5, grace: 1, annualBudget: 300 };
const store = { setup: 300, reserve: 60, equity: 120, revenue: 100, margin: 60, fixed: 40, ramp: 3, interest: 3, tenor: 5, annualBudget: 80 };
const offshore = { mode: 'dual', investTwd: 100, investUsd: 10, equityTwd: 20, equityUsd: 2, fx: 32, swing: 10, buffer: 5, months: 12 };
const health = { cash: 100, receipts: 80, stock: 50, shortDebt: 100, totalDebt: 200, assets: 500, sales: 1000, profit: 60, annualAvailable: 150, annualDebt: 100 };

test('working capital prices receivables at sales and inventory/payables at cost', () => {
  const result = calculate('working', working);
  close(result.extra.currentNeed, 193.15068493150685);
  close(result.extra.futureNeed, 231.78082191780823);
  close(result.value, 231.78082191780823);
  close(result.extra.change, 38.63013698630138);
  close(result.breakdown.reduce((n, x) => n + x.value, 0), result.extra.futureNeed);
});

test('next-year total need is reduced by available equity and usable existing financing', () => {
  close(calculate('working', { ...working, own: 10, existing: 5 }).value, 216.78082191780823);
  assert.equal(calculate('working', { ...working, own: 1000 }).value, 0);
  close(calculate('working', { ...working, nextSales: 800 }).value, 154.52054794520546);
  close(calculate('working', { ...working, nextSales: 1000 }).value, 193.15068493150685);
  assert.ok(calculate('working', { ...working, cost: 120 }).note.includes('毛利為負'));
});

test('a cash cycle below zero does not blindly force working-capital occupation to zero', () => {
  const result = calculate('working', { ...working, sales: 1000, nextSales: 2000, cost: 50, dso: 30, dio: 0, dpo: 40 });
  assert.equal(result.extra.cashCycle, -10);
  assert.ok(result.extra.futureNeed > 0);
  assert.ok(result.value > 0);
});

test('factory grace is interest only, followed by declining annual equal-principal payments', () => {
  const result = calculate('equipment', factory);
  assert.equal(result.schedule.length, 5);
  assert.deepEqual(result.schedule[0], { year: 1, principal: 0, interest: 24, total: 24 });
  assert.deepEqual(result.schedule[1], { year: 2, principal: 200, interest: 24, total: 224 });
  assert.deepEqual(result.schedule[4], { year: 5, principal: 200, interest: 6, total: 206 });
  close(result.schedule.reduce((n, row) => n + row.principal, 0), 800);
  assert.equal(result.value, 224);
  close(result.extra.coverage, 300 / 224);
});

test('factory zero interest and fully equity-funded cases remain finite', () => {
  const zero = calculate('equipment', { ...factory, interest: 0, grace: 0 });
  assert.equal(zero.value, 160);
  assert.equal(zero.extra.totalInterest, 0);
  const equity = calculate('equipment', { ...factory, equity: 1000 });
  assert.equal(equity.value, 0);
  assert.equal(equity.extra.coverage, null);
});

test('store debt amortizes in full and ramp losses do not disappear from first-year cash', () => {
  const result = calculate('expansion', store);
  close(result.schedule.reduce((n, row) => n + row.principal, 0), 240);
  close(result.value, 100 * 0.6 - 40 - result.extra.monthlyPayment);
  close(result.extra.firstYearCash, 100 * (12 - 1.5) * 0.6 - 40 * 12 - result.extra.annualDebt);
  close(result.extra.breakEvenRevenue * 0.6, 40 + result.extra.monthlyPayment);
  assert.ok(result.extra.rampFunding > 0);
});

test('store handles zero margin, zero interest and a ramp spanning more than one year', () => {
  const result = calculate('expansion', { ...store, margin: 0, interest: 0, ramp: 18 });
  assert.equal(result.extra.breakEvenRevenue, null);
  close(result.extra.monthlyPayment, 240 / 60);
  close(result.extra.firstYearCash, -40 * 12 - 48);
  assert.equal(result.extra.stablePaybackMonths, null);
  assert.ok(Number.isFinite(result.value));
});

test('overseas dual budgets do not cross-net surplus currency funds', () => {
  const result = calculate('overseas', offshore);
  close(result.extra.twdGap, 80);
  close(result.extra.usdGap, 8);
  close(result.extra.fxImpact, 25.6);
  close(result.value, (80 + 8 * 32 * 1.1) * 1.05);
  const excessTwd = calculate('overseas', { ...offshore, equityTwd: 5000 });
  assert.equal(excessTwd.extra.twdGap, 0);
  assert.equal(excessTwd.extra.usdGap, 8);
  close(excessTwd.value, 8 * 32 * 1.1 * 1.05);
});

test('TWD-only mode ignores hidden USD amounts and FX stress has no impact', () => {
  const result = calculate('overseas', { ...offshore, mode: 'twd', investUsd: 99999, swing: 80 });
  assert.equal(result.extra.usdGap, 0);
  assert.equal(result.extra.fxImpact, 0);
  close(result.value, 80 * 1.05);
  const usd = calculate('overseas', { ...offshore, mode: 'usd', investTwd: 99999 });
  assert.equal(usd.extra.twdGap, 0);
});

test('diagnosis healthy and exact threshold cases match the visible definitions', () => {
  const result = diagnose(health);
  assert.equal(result.overall, 'green');
  assert.equal(result.items.length, 5);
  assert.match(result.items[3].label, /營業利益/);
  assert.match(result.items[3].definition, /不含業外損益/);
  const boundary = diagnose({ ...health, cash: 50, receipts: 50, stock: 50, profit: 50, annualAvailable: 120, totalDebt: 250 });
  assert.deepEqual(boundary.items.map(x => x.status), ['green', 'green', 'green', 'green', 'green']);
  const stressed = diagnose({ ...health, annualAvailable: 99 });
  assert.equal(stressed.items[4].status, 'red');
  assert.equal(stressed.overall, 'red');
});

test('missing and zero denominators never become healthy or NaN', () => {
  assert.equal(diagnose({}).overall, 'na');
  const result = diagnose({ ...health, shortDebt: 0, annualDebt: 0, sales: 0 });
  for (const i of [0, 1, 3, 4]) assert.equal(result.items[i].status, 'na');
  assert.equal(result.overall, 'na');
  assert.equal(JSON.stringify(result).includes('NaN'), false);
});

test('negative profit/cash for repayments is valid stress data, while inconsistent balances fail', () => {
  const result = diagnose({ ...health, profit: -10, annualAvailable: -20 });
  assert.equal(result.items[3].status, 'red');
  assert.equal(result.items[4].status, 'red');
  assert.throws(() => diagnose({ ...health, shortDebt: 201 }), /不可大於/);
  assert.throws(() => diagnose({ ...health, assets: 100 }), /不可大於/);
});

test('validation rejects invalid data without coercing blanks/booleans to healthy zeros', () => {
  assert.throws(() => calculate('equipment', { ...factory, grace: 5 }), /數值不合理/);
  assert.throws(() => calculate('equipment', { ...factory, tenor: 1.5 }), /數值不合理/);
  assert.throws(() => calculate('working', { ...working, sales: '' }), /請填寫/);
  assert.throws(() => calculate('working', { ...working, sales: true }), /有效數字/);
  assert.throws(() => calculate('overseas', { ...offshore, fx: 0 }), /數值不合理/);
  assert.throws(() => calculate('overseas', { ...offshore, mode: 'other' }), /請選擇/);
  assert.throws(() => calculate('other', {}), /找不到/);
  assert.throws(() => calculate('__proto__', {}), /找不到/);
  assert.throws(() => calculate('working', { ...working, sales: 1e308, nextSales: 0, dso: 10000 }), /金額過大/);
  assert.throws(() => diagnose({ cash: Infinity }), /數值不合理/);
});
