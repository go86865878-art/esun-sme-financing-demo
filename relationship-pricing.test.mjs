import test from 'node:test';
import assert from 'node:assert/strict';
import {createLead,deriveOpportunityDetails,calculatePotential,serviceChecks} from './opportunity.js';
import {RELATIONSHIP_PRODUCTS,evaluatePricing,normalizePricing,pricingMailLines} from './relationship-pricing.js';
import {buildDispatchMail} from './dispatch-mail.js';
const request={company:'新增服務測試',businessType:'加盟餐飲',purpose:'expansion',note:'收單、薪轉、開戶',address:'新北市新莊區幸福路171號'};
const make=services=>createLead({plan:null,city:'新北市',district:'新莊區',services,consultation:request,consent:true});
const product=(bps,condition='已核對約定往來條件')=>({confirmed:true,discountBps:bps,condition});
test('customer product needs reach case, followups and manager draft without invented income',()=>{
 const l=make(['loan','cardAcquiring','payroll','accountOpening']),signals=deriveOpportunityDetails(l);
 for(const key of ['cardAcquiring','payroll','accountOpening']){assert.ok(l.services.includes(key));assert.ok(signals.some(x=>x.key===key));}
 assert.equal(calculatePotential(l).net,null);assert.equal(l.pricing,undefined);
 const mail=buildDispatchMail(l,{key:'center:test',unit:'測試單位',kind:'center',role:'區域中心主管'},{email:'manager@example.com'});
 for(const label of ['信用卡收單','員工薪轉','公司戶開立'])assert.ok(mail.body.includes(label));
 assert.doesNotMatch(mail.body,/內部試算 .*%/);
});
test('unselected products are never inferred, and grouped checkbox lists have no duplicates',()=>{
 const l=make(['loan']);assert.deepEqual(l.services,['loan']);assert.equal(deriveOpportunityDetails(l).length,1);
 const html=serviceChecks('consult',['payment','ebank']);assert.doesNotMatch(html,/cardAcquiring|payroll|accountOpening/);
});
test('unknown pricing stays unknown and customer interest does not count as confirmed',()=>{
 const r=evaluatePricing({});assert.equal(r.ready,false);assert.equal(r.rate,null);assert.equal(r.count,0);
 const r2=evaluatePricing({baseRate:3,floorRate:2.6,capBps:30,products:{payroll:{confirmed:false,discountBps:10,condition:'有興趣'}}});assert.equal(r2.rate,3);assert.equal(r2.count,0);
});
test('only confirmed conditions qualify; blank discount and missing evidence block a quote',()=>{
 assert.equal(evaluatePricing({baseRate:3,floorRate:2,capBps:50,products:{payroll:product(null)}}).ready,false);
 assert.equal(evaluatePricing({baseRate:3,floorRate:2,capBps:50,products:{payroll:product(10,'')}}).ready,false);
});
test('overlapping collection/account products use the larger discount, then cap and floor',()=>{
 const p={baseRate:3,floorRate:2.8,capBps:25,products:{cardAcquiring:product(15),payment:product(10),payroll:product(10),accountOpening:product(5),deposit:product(4)}};
 const r=evaluatePricing(p);assert.equal(r.rawBps,30);assert.equal(r.count,5);assert.equal(r.groupCount,3);assert.equal(r.discountBps,20);assert.equal(r.rate,2.8);
 assert.equal(evaluatePricing({...p,floorRate:2}).rate,2.75);
});
test('zero discount is valid, invalid rate/floor/discount is rejected, records are copied',()=>{
 const p={baseRate:3,floorRate:3,capBps:0,products:{payroll:product(0)}};
 assert.equal(evaluatePricing(p).rate,3);assert.equal(evaluatePricing(p).ready,true);
 assert.throws(()=>normalizePricing({...p,floorRate:4}),/不能高於/);
 assert.throws(()=>normalizePricing({...p,capBps:-1}),/範圍/);
 assert.throws(()=>normalizePricing({...p,baseRate:false}),/範圍/);
 const copy=normalizePricing(p);copy.products.payroll.confirmed=false;assert.equal(p.products.payroll.confirmed,true);
});
test('saved pricing is included as an internal proposal and never modifies original loan terms',()=>{
 const l=make(['loan','payroll']);l.plan.inputs.interest=3.4;
 l.pricing={baseRate:3,floorRate:2.8,capBps:30,products:{payroll:product(10)}};
 const lines=pricingMailLines(l).join('\n');assert.match(lines,/2.9%/);assert.match(lines,/非正式報價/);assert.equal(l.plan.inputs.interest,3.4);
 const blank=pricingMailLines({...l,pricing:{}}).join('\n');assert.match(blank,/資料待補/);assert.doesNotMatch(blank,/試算 0%/);
});
