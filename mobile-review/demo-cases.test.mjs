import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_CASES,casePlan,caseConsultation,addMissingCaseLeads,CASE_SET,prepareCaseRouting} from './demo-cases.js';
import {financingNeed} from './financing-need.js';
import {DEFAULT_ROUTES,LEADS_KEY,readLocal} from './opportunity.js';
import {BRANCHES} from './branch-data.js';
import {ROUTING_KEY,suggestAssignment} from './branch-routing.js';
const expected=[619.1780821917814,330,2156,3500],rms=['小玉','小愷','小宇','大鈞'];
test('four cases preserve numeric budgets, address, original inputs and health in backend snapshots',()=>{
 const rows=addMissingCaseLeads([]);
 assert.equal(rows.length,4);
 for(let i=0;i<4;i++){
  const item=DEMO_CASES[i],lead=rows[i],plan=casePlan(item);
  assert.ok(Math.abs(financingNeed(lead.plan).amount-expected[i])<1e-7);
  assert.equal(lead.consultation.address,item.address);
  assert.equal(lead.consultation.company,item.company);
  assert.equal(lead.consultation.desiredMonth,item.month);
  assert.equal(lead.consultation.health.items.length,5);
  for(const[k,v]of Object.entries(item.input))if(k!=='mode')assert.equal(lead.plan.inputs[k],v);
  assert.ok(lead.consultation.summary.includes('資金'));
  assert.equal(lead.assignment,null);assert.equal(lead.status,'未分派');
  const route=suggestAssignment(lead,{threshold:600,branches:BRANCHES,routes:DEFAULT_ROUTES});
  assert.equal(route.kind,i===1?'branch':'center');assert.ok(route.rm.includes(rms[i]));
 }
});
test('seeding preserves edited cases and unrelated enquiries, with no duplicates on rerun',()=>{
 const existing=addMissingCaseLeads([{id:'manual',label:'untouched',assignment:{rm:'Custom'},followups:{}}]);
 existing[0].status='已聯繫（示範）';existing[0].followups={loan:{note:'Keep this'}};
 const again=addMissingCaseLeads(existing);
 assert.deepEqual(again,existing);assert.equal(again.length,5);
 assert.throws(()=>addMissingCaseLeads(Array.from({length:198},(_,i)=>({id:'u'+i}))),/200/);
});
test('preview storage migrates once and never writes franchise records or replaces a custom threshold',()=>{
 const store=new Map([['esun_franchise_demo_leads_v1',JSON.stringify([{id:'old'}])]]);
 globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
 assert.ok(LEADS_KEY.startsWith('esun_mobile_review_'));assert.deepEqual(readLocal(LEADS_KEY,[]),[{id:'old'}]);
 store.set(LEADS_KEY,'[]');assert.equal(store.get('esun_franchise_demo_leads_v1'),'[{"id":"old"}]');
 prepareCaseRouting();assert.equal(JSON.parse(store.get(ROUTING_KEY)).threshold,600);
 store.set(ROUTING_KEY,'{"threshold":1000}');prepareCaseRouting();assert.equal(JSON.parse(store.get(ROUTING_KEY)).threshold,1000);
 delete globalThis.localStorage;
});
