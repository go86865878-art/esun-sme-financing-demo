import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_CASES,casePlan,caseConsultation} from './demo-cases.js';
import {calculate,diagnose} from './engine.js';
import {normalizeOperating,operatingMainFields} from './operating-plan.js';
import {healthForecastMarkup} from './operating-health-ui.js';
const source=DEMO_CASES.find(c=>c.id==='02');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function result(overrides={},main={}){const v=structuredClone(source.input);Object.assign(v.operating,overrides);Object.assign(v,operatingMainFields(v.operating),main);return calculate('expansion',v);}

test('year-end receivables and inventory use December run-rate, not annual sales or annual cost',()=>{
 const q=result().extra.operating.forecast;
 near(q.receipts,23.86545);near(q.stock,12.495);near(q.payables,0);
 near(q.availableCash,302.19818973608497);
 assert.notEqual(q.receipts,1647);assert.notEqual(q.stock,576.45);
 assert.equal(diagnose(q.health).items.some(x=>x.status==='na'),false);
});
test('working capital changes cash without creating assets twice; reserved tax balances both sides',()=>{
 const {annual,forecast:q}=result().extra.operating;
 near(q.assets,q.totalDebt+q.equity);near(q.balanceDifference,0);
 near(q.bankCash,q.availableCash+annual.tax);
 near(q.loanBalance,300-annual.principal);near(q.equipment,420-84);
 near(q.health.shortDebt,q.next.principal+q.payables+annual.tax);
 near(q.equity,300+annual.retainedFinal);
});
test('zero-day scenario reconciles to the PDF and supplier credit does not invent equity',()=>{
 const zero=result({settlementDays:0,inventoryDays:0,payableDays:0}).extra.operating.forecast;
 near(zero.availableCash,338.55863973608496);near(zero.receipts,0);near(zero.stock,0);
 const base=result().extra.operating.forecast,credit=result({payableDays:10}).extra.operating.forecast;
 near(credit.payables,17.85);near(credit.availableCash-base.availableCash,17.85);
 near(credit.totalDebt-base.totalDebt,17.85);near(credit.equity,base.equity);
});
test('future repayment comes from months 13-24 and not the already-paid first-year principal',()=>{
 const p=result().extra.operating,q=p.forecast;
 near(q.next.revenue,1836);near(q.next.principal,58.63667667007084);
 near(q.next.interest,4.8577644592198705);near(q.next.debt,63.49444112929071);
 near(q.health.annualAvailable,274.8441739814894);
 assert.notEqual(q.next.principal,p.annual.principal);
 near(result({}, {tenor:1}).extra.operating.forecast.next.debt,0);
});
test('missing new fields in legacy operating cases use only the disclosed scenario defaults',()=>{
 const raw=structuredClone(source.input.operating);delete raw.settlementDays;delete raw.inventoryDays;delete raw.payableDays;
 const o=normalizeOperating(raw);near(o.settlementDays,7);near(o.inventoryDays,7);near(o.payableDays,0);
 for(const value of ['',null,-1,366])assert.throws(()=>normalizeOperating({...raw,settlementDays:value}));
 const other=DEMO_CASES.find(c=>c.id==='04');assert.equal(other.health.receipts,null);assert.equal(other.health.stock,null);
});
test('a cash shortfall is flagged without silently granting a new loan or converting unknown cash to zero',()=>{
 const p=result({settlementDays:365,inventoryDays:365}).extra.operating,q=p.forecast;
 assert.ok(q.fundingGap>0);assert.ok(q.unfundedBankGap>0);
 assert.equal(q.health.cash,null);assert.equal(q.health.assets,null);
 near(q.loanBalance,300-p.annual.principal);
 assert.equal(diagnose(q.health).overall,'na');
});
test('edited operating assumptions propagate into the actual consultation snapshot and disclose their source',()=>{
 const inputs=structuredClone(source.input);inputs.operating.inventoryDays=14;
 const plan={...casePlan(source),inputs,out:calculate('expansion',inputs)};
 const c=caseConsultation(source,plan);near(c.healthInputs.stock,24.99);
 near(c.healthInputs.cash,plan.out.extra.operating.forecast.bankCash);
 assert.match(c.summary,/備料 14 天/);
 const markup=healthForecastMarkup(plan);assert.match(markup,/非PDF既載數字/);assert.match(markup,/24.99/);
 assert.match(healthForecastMarkup(plan,false),/自行填寫/);
});
