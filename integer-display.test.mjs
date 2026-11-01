import test from 'node:test';
import assert from 'node:assert/strict';
import {setIntegerField,exactFieldValue,markIntegerFieldEdited,integerAmount} from './integer-display.js';
import {pipelineSummary,caseFinanceCharts} from './pipeline-charts.js';
import {DEMO_CASES,casePlan,caseConsultation} from './demo-cases.js';
const make=id=>{const item=DEMO_CASES.find(c=>c.id===id),plan=casePlan(item);return {id,label:item.title,status:'未分派',services:item.services,plan,consultation:caseConsultation(item,plan)};};
test('integer display never rounds the stored calculation; deliberate editing does',()=>{
 const el={value:'',dataset:{}};setIntegerField(el,23.86545);assert.equal(el.value,'24');assert.equal(Number(exactFieldValue(el)),23.86545);
 markIntegerFieldEdited(el);assert.equal(Number(exactFieldValue(el)),24);
 setIntegerField(el,12.495);assert.equal(el.value,'12');assert.equal(integerAmount(12.495),'12');
 setIntegerField(el,null);assert.equal(el.value,'');assert.equal(exactFieldValue(el),'');
});
test('pipeline charts use financing demand and exclude incomplete income without filling unknowns with zero',()=>{
 const incomplete=make('04');incomplete.services.push('payroll');const d=pipelineSummary([make('02'),incomplete]);assert.equal(d.count,2);assert.deepEqual(d.funding.map(x=>x.amount),[800,300]);assert.equal(d.complete,1);
 const sum=d.contribution.reduce((n,r)=>n+r.low,0);assert.ok(Math.abs(sum-32.716630472887196)<1e-7);
 assert.equal(d.services.find(r=>r.key==='loan').value,2);assert.equal(d.services.find(r=>r.key==='loan').label,'融資規劃');
 assert.equal(d.statuses[0].value,2);
});
test('empty charts remain empty and each filtered population reconciles to its own cases',()=>{
 assert.deepEqual(pipelineSummary([]).funding,[]);assert.equal(pipelineSummary([]).complete,0);
 const d=pipelineSummary([make('02')]);assert.equal(d.count,1);assert.equal(d.funding[0].amount,300);
 assert.match(caseFinanceCharts(make('02').plan),/逐月營收與稅後淨利/);assert.match(caseFinanceCharts(make('02').plan),/年底資產與資金來源/);
});

test('legacy case charts reconstruct the forecast without overwriting the submitted snapshot',()=>{const p=make('02').plan;delete p.out.extra.operating.forecast;delete p.inputs.operating.settlementDays;delete p.inputs.operating.inventoryDays;delete p.inputs.operating.payableDays;const before=JSON.stringify(p);assert.match(caseFinanceCharts(p),/年底資產與資金來源/);assert.equal(JSON.stringify(p),before);});
