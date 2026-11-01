import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,DEMO_SAMPLE_SET,FOLLOWUP_STATUSES,resetDemoSamples,isBuiltInDemoSample,deriveOpportunitySignals,deriveOpportunityDetails,getOpportunityFollowup,updateOpportunityFollowup,calculatePotential,createLead,saveDemoLeads,loadDemoLeads} from './opportunity.js';

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

test('each of six opportunity types has an explicit trigger and useful pending questions',()=>{
  const details=resetDemoSamples([],{at}).flatMap(deriveOpportunityDetails);
  for(const key of ['deposit','loan','collateral','payment','ebank','overseas']){
    const item=details.find(signal=>signal.key===key);
    assert.ok(item?.trigger.length>15,key+' trigger');
    assert.equal(item.questions.length,3,key+' questions');
    assert.ok(item.questions.every(question=>question.length>12),key+' question detail');
    assert.ok(item.origin.length>0,key+' origin');
  }
  assert.equal(details.find(signal=>signal.key==='payment').label,'展店收款／收付通');
  assert.equal(details.find(signal=>signal.key==='loan'&&signal.label==='週轉融資').derived,false);
});

test('explanations do not silently infer selected services from a budget or own funds',()=>{
  assert.deepEqual(deriveOpportunityDetails({plan:{...plan('working'),inputs:{own:900,sales:8000}},services:[]}),[]);
  const oldOverseas={plan:plan('overseas')};
  const signals=deriveOpportunityDetails(oldOverseas);
  assert.equal(signals.length,1);
  assert.equal(signals[0].key,'overseas');
  assert.equal(signals[0].derived,true);
  assert.match(signals[0].trigger,/不代表.*已同意/);
});

test('followup defaults support existing records and ignore unrecognized saved states',()=>{
  assert.deepEqual(getOpportunityFollowup({id:'old'},'deposit'),{status:'待確認',note:'',at:null});
  const value=getOpportunityFollowup({followups:{deposit:{status:'自動核貸',note:'待確認付款週期',at}}},'deposit');
  assert.equal(value.status,'待確認');
  assert.equal(value.note,'待確認付款週期');
  assert.ok(FOLLOWUP_STATUSES.includes(value.status));
});

test('editing an individual followup preserves case assignment, consent, formulas and other followups',()=>{
  const original=resetDemoSamples([],{at})[0];
  original.followups={deposit:{status:'待補資料',note:'假資料：待補收支高峰',at}};
  const before=calculatePotential(original,DEFAULT_SETTINGS);
  const updated=updateOpportunityFollowup(original,'loan',{status:'跟進中',note:'  假資料：待確認動用率與還款來源  '},{at});
  assert.equal(updated.followups.loan.note,'假資料：待確認動用率與還款來源');
  assert.equal(updated.followups.loan.status,'跟進中');
  assert.deepEqual(updated.followups.deposit,original.followups.deposit);
  assert.equal(original.followups.loan,undefined);
  assert.equal(updated.status,original.status);
  assert.equal(updated.assignment,original.assignment);
  assert.deepEqual(updated.services,original.services);
  assert.deepEqual(updated.consent,original.consent);
  assert.deepEqual(calculatePotential(updated,DEFAULT_SETTINGS),before);
});

test('followup validation rejects unknown opportunities, statuses and oversized notes',()=>{
  const lead=resetDemoSamples([],{at})[3];
  assert.throws(()=>updateOpportunityFollowup(lead,'loan',{status:'跟進中',note:''},{at}),/沒有相符/);
  assert.throws(()=>updateOpportunityFollowup(lead,'overseas',{status:'自動核貸',note:''},{at}),/有效/);
  assert.throws(()=>updateOpportunityFollowup(lead,'overseas',{status:'待確認',note:'字'.repeat(501)},{at}),/500/);
  const result=updateOpportunityFollowup(lead,'overseas',{status:'待補資料',note:'字'.repeat(500)},{at});
  assert.equal(result.followups.overseas.note.length,500);
  assert.equal(calculatePotential(result,DEFAULT_SETTINGS).net,null);
});

test('followup state and plain-text notes survive the existing local storage round trip',t=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),data=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}});
  t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;});
  const lead=resetDemoSamples([],{at})[3];delete lead.sampleSet;delete lead.sampleKey;lead.source='預約諮詢表單（本機示範）';
  const updated=updateOpportunityFollowup(lead,'overseas',{status:'待補資料',note:'假資料：<待確認> 匯款國別\n與換匯時點'},{at});
  saveDemoLeads([updated]);
  const loaded=loadDemoLeads()[0];
  assert.deepEqual(loaded.followups,updated.followups);
  assert.equal(loaded.status,'未分派');
  assert.equal(loaded.finance.loanBalance,null);
});

test('reloading four samples clears only their followups while retaining manual case history',()=>{
  const samples=resetDemoSamples([],{at});
  samples[3]=updateOpportunityFollowup(samples[3],'overseas',{status:'跟進中',note:'假資料：已調整線索'},{at});
  const manual={id:'manual-kept',source:'使用者手動假資料',services:['loan'],plan:plan('working'),followups:{loan:{status:'待補資料',note:'保留此筆手動跟進',at}}};
  const reset=resetDemoSamples([...samples,manual],{at});
  assert.equal(reset.length,5);
  assert.ok(reset.filter(isBuiltInDemoSample).every(lead=>Object.keys(lead.followups).length===0));
  assert.deepEqual(reset.find(lead=>lead.id===manual.id).followups,manual.followups);
  assert.equal(deriveOpportunityDetails(reset[3])[0].key,'overseas');
});

