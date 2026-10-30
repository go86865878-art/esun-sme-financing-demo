import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from './engine.js';
import {snapshotContext,planningSummary} from './handoff-context.js';
import {createLead} from './opportunity.js';
const inputs={sales:12000,nextSales:13800,cost:75,dso:60,dio:75,dpo:45,own:500,existing:2000};
const plan={model:'working',inputs,out:calculate('working',inputs),at:'2026/10/30 12:00:00'};
test('transferred lead retains the exact gap, month and independently derived repayment check',()=>{
 const lead=createLead({plan,city:'新北市',district:'新莊區',services:['loan'],context:{desiredMonth:'2027-01',annualAvailable:1200,annualDebt:900,repayment:{value:'999倍',status:'green'},privateField:'discard'}});
 assert.equal(lead.plan.out.value,plan.out.value);assert.equal(lead.context.desiredMonth,'2027-01');assert.equal(lead.context.repayment.value,'1.33 倍');assert.equal(lead.context.privateField,undefined);assert.equal(lead.status,'未分派');assert.equal(lead.assignment,null);
 inputs.dso=90;assert.equal(lead.plan.inputs.dso,60);inputs.dso=60;
});
test('missing/zero denominator is not healthy; reduced cash is a warning',()=>{
 assert.equal(snapshotContext({}).repayment.status,'na');assert.equal(snapshotContext({annualAvailable:1200,annualDebt:0}).repayment.status,'na');assert.equal(snapshotContext({annualAvailable:600,annualDebt:900}).repayment.status,'red');
});
test('invalid context and missing consent cannot be transferred',()=>{
 assert.throws(()=>snapshotContext({desiredMonth:'2027-13'}));assert.throws(()=>snapshotContext({annualDebt:-1}));assert.throws(()=>snapshotContext({annualAvailable:Infinity}));assert.throws(()=>createLead({plan,city:'新北市',district:'新莊區',services:['loan'],consent:false}));
});
test('summary preserves pending fields and does not turn blanks into zero',()=>{
 const summary=planningSummary(plan,{});assert.match(summary,/預計用款：待確認/);assert.match(summary,/可用還款現金：待確認/);assert.match(summary,/619.2/);
});
