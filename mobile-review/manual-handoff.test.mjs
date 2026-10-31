import test from 'node:test';
import assert from 'node:assert/strict';
import {createLead,loadDemoLeads,LEADS_KEY} from './opportunity.js';
import {calculate,diagnose} from './engine.js';
import {receivedConsultationCard} from './planning-cards.js';
const health={cash:517,receipts:1900,stock:1600,shortDebt:2500,totalDebt:3500,assets:6500,sales:12345,profit:-9.5,annualAvailable:600,annualDebt:0};
const inputs={sales:12345,nextSales:14789,cost:72,dso:55,dio:66,dpo:31,own:512,existing:1900};
function make(){return createLead({plan:{model:'working',inputs,out:calculate('working',inputs)},city:'新北市',district:'新莊區',services:['loan'],consent:true,consultation:{company:'手動測試',note:'人工輸入',address:'新北市新莊區幸福路171號',health:diagnose(health),healthInputs:health,healthAt:'2026-10-31'}});}
test('manual health and plan inputs are immutable snapshots, including losses and zero',()=>{
 const lead=make();assert.deepEqual(lead.plan.inputs,inputs);assert.deepEqual(lead.consultation.healthInputs,health);
 lead.consultation.healthInputs.cash=900;assert.equal(health.cash,517);
 assert.equal(lead.consultation.healthInputs.profit,-9.5);assert.equal(lead.consultation.healthInputs.annualDebt,0);
 const card=receivedConsultationCard(make());assert.match(card,/12,345/);assert.match(card,/-9.5/);assert.match(card,/171/);
});
test('incomplete health preserves unknown amounts, never supplies sample numbers',()=>{
 const lead=createLead({plan:null,city:'新北市',district:'新莊區',services:['loan'],consent:true,consultation:{company:'不完整測試',note:'手動填寫',healthInputs:{cash:0,profit:-3,sales:null,assets:''}}});
 assert.equal(lead.consultation.healthInputs.cash,0);assert.equal(lead.consultation.healthInputs.sales,null);assert.equal(lead.consultation.healthInputs.assets,null);
 assert.equal(lead.consultation.healthInputs.profit,-3);assert.match(receivedConsultationCard(lead),/未填寫/);
});
test('old preloaded fixtures disappear but manually submitted cases and their numbers remain',t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),manual=make();
 const fixtures=[{...manual,id:'preset-a',sampleSet:'mobile-complete-cases-20261031'},{...manual,id:'preset-b',sampleSet:'esun-sme-built-in-samples-v2'},{...manual,id:'legacy',source:'手動載入假資料',sampleKey:'假案例 A｜擴充產線'}];
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>key===LEADS_KEY?JSON.stringify([...fixtures,manual]):null}});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage});
 const rows=loadDemoLeads();assert.equal(rows.length,1);assert.equal(rows[0].id,manual.id);assert.deepEqual(rows[0].consultation.healthInputs,health);
});
