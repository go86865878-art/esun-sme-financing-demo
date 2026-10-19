import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,DEMO_SAMPLE_SET,resetDemoSamples,isBuiltInDemoSample,deriveOpportunitySignals,calculatePotential,createLead} from './opportunity.js';

const at='2026-10-20T10:00:00.000Z';
const plan=model=>({model,mode:'twd',inputs:{},out:{value:1000,unit:'萬元'},at});

test('reset replaces edited samples with four default unassigned cases without duplication',()=>{
  const first=resetDemoSamples([],{at});
  assert.equal(first.length,4);
  assert.equal(new Set(first.map(l=>l.plan.model)).size,4);
  first[0].status='已聯繫（示範）';first[0].assignment={rm:'示範 RM Z'};first[0].finance.loanBalance=9000;
  const reset=resetDemoSamples(first,{at:'2026-10-21T10:00:00.000Z'});
  assert.equal(reset.length,4);
  assert.equal(new Set(reset.map(l=>l.id)).size,4);
  assert.ok(reset.every(l=>l.sampleSet===DEMO_SAMPLE_SET&&l.status==='未分派'&&l.assignment===null));
  assert.equal(reset[0].finance.loanBalance,2500);
  assert.equal(calculatePotential(reset[0],DEFAULT_SETTINGS).net,51.5);
  assert.equal(first[0].finance.loanBalance,9000,'input list is not mutated');
});

test('reset retains customer and manually entered cases even with a legacy-like sample key',()=>{
  const customer={id:'customer-1',source:'網站試算（使用者同意）',services:['loan'],sampleKey:'假案例 A｜擴充產線',status:'已聯繫（示範）',finance:{loanBalance:500}};
  const manual={id:'manual-1',source:'使用者手動假資料',services:['deposit'],status:'暫不跟進（示範）',finance:{depositBalance:200}};
  const output=resetDemoSamples([customer,manual],{at});
  assert.equal(output.length,6);
  assert.deepEqual(output.find(l=>l.id===customer.id),customer);
  assert.deepEqual(output.find(l=>l.id===manual.id),manual);
  assert.equal(isBuiltInDemoSample(customer),false);
});

test('reset migrates the three known legacy button samples and removes their old identities',()=>{
  const old=['假案例 A｜擴充產線','假案例 B｜第二間門市','假案例 C｜批發備貨'].map((sampleKey,i)=>({id:'legacy-'+i,source:'手動載入假資料',sampleKey,services:[],status:'已分派（示範）'}));
  const output=resetDemoSamples(old,{at});
  assert.equal(output.length,4);
  assert.ok(!output.some(l=>l.id.startsWith('legacy-')));
});

test('reset refuses overflow instead of silently dropping non-sample records',()=>{
  const records=Array.from({length:197},(_,i)=>({id:'customer-'+i,source:'網站試算（使用者同意）',services:[]}));
  assert.throws(()=>resetDemoSamples(records,{at}),/196/);
  assert.equal(records.length,197);
});

test('overseas purpose derives all three qualitative opportunities without any selected service',()=>{
  const lead=createLead({plan:plan('overseas'),city:'桃園市',district:'龜山區',services:[],consent:true});
  const signals=deriveOpportunitySignals(lead);
  assert.equal(signals[0].label,'海外投資潛在商機');
  assert.deepEqual(signals[0].items.map(i=>i.label),['外匯收付','換匯','海外融資']);
  assert.equal(signals[0].value,null);
  assert.equal(calculatePotential(lead,DEFAULT_SETTINGS).net,null);
  assert.equal(calculatePotential(lead,DEFAULT_SETTINGS).complete,false);
  assert.equal(lead.finance.loanBalance,null);
});

test('purpose-derived overseas opportunities work for older records and do not change numeric formulas',()=>{
  assert.equal(deriveOpportunitySignals({plan:{model:'overseas'}}).length,1);
  assert.deepEqual(deriveOpportunitySignals({plan:{model:'working'}}),[]);
  const lead={plan:{model:'overseas'},services:['loan'],finance:{loanBalance:1000,operatingCost:1}};
  assert.equal(calculatePotential(lead,DEFAULT_SETTINGS).net,19);
  assert.equal(deriveOpportunitySignals(lead)[0].value,null);
});

test('fourth sample shows overseas signals while leaving numerical contribution unestimated',()=>{
  const lead=resetDemoSamples([],{at}).find(l=>l.plan.model==='overseas');
  assert.deepEqual(lead.services,[]);
  assert.equal(lead.plan.mode,'dual');
  assert.equal(deriveOpportunitySignals(lead).length,1);
  assert.equal(calculatePotential(lead,DEFAULT_SETTINGS).net,null);
});

test('overseas still requires consent and other purposes still require an explicit selected service',()=>{
  assert.throws(()=>createLead({plan:plan('overseas'),city:'桃園市',district:'龜山區',services:[],consent:false}),/同意/);
  assert.throws(()=>createLead({plan:plan('working'),city:'桃園市',district:'龜山區',services:[],consent:true}),/至少一項/);
});
