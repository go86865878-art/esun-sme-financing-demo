import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_CASES,casePlan,caseConsultation} from './demo-cases.js';
import {createLead,planSnapshot} from './opportunity.js';
import {calculate} from './engine.js';
import {operatingMainFields,operatingFromMain} from './operating-plan.js';
import {estimateRelationship} from './relationship-value.js';
import {operatingSummary} from './operating-plan-ui.js';
const c=DEMO_CASES.find(c=>c.id==='02'),clone=x=>JSON.parse(JSON.stringify(x)),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
function lead(p=casePlan(c)){return createLead({plan:p,city:c.city,district:c.district,services:c.services,consent:true,consultation:caseConsultation(c,p)});}
test('approved PDF financial totals match website with principal and two distributions',()=>{
 const a=casePlan(c).out.extra.operating.annual;
 for(const [k,v]of Object.entries({revenue:1647,cost:576.45,salary:439.56,net:236.14903789577787,bonus:48.14655757915558,yearEnd:56.40074409498669,retainedFinal:131.60173622163563,principal:63.06662011193959,cashClose:242.535116109696}))near(a[k],v);
 near(a.cashChange,a.retainedFinal+a.depreciation-a.principal);
 const p=casePlan(c).out.extra.operating;near(p.fullBonus+p.partBonus,a.yearEnd);near(p.fullEach,15.040198425329785);near(p.partEach,1.8800248031662224);
 assert.equal(p.monthly[0].bonus,0);assert.ok(p.monthly[11].cashChange<0);
});
test('sanitized backend snapshot preserves and recomputes all editable operating assumptions',()=>{
 const p=casePlan(c),l=lead(p);assert.deepEqual(l.plan.inputs.operating,c.input.operating);
 near(l.plan.out.extra.operating.annual.revenue,1647);near(l.consultation.healthInputs.sales,1647);
 p.inputs.operating.ticket=1;assert.equal(l.plan.inputs.operating.ticket,300);
 assert.ok(l.consultation.summary.includes('年終'));
});
test('per-case relationship assumptions reproduce the approved PDF contribution subtotal and total',()=>{
 const r=estimateRelationship(lead());near(r.sales,1647);near(r.total,33.26388107001155);near(r.totalHigh,34.77713514347913);
 near(r.company,32.61681019087742);near(r.employee,.6470708791341221);
 assert.equal(r.rows.find(x=>x.key==='employeeYearEnd').value,0);near(r.employeeYearEnd,302.48838100448535);
 assert.equal(r.a.depositDays,30);assert.equal(r.a.employeeYield,.5);
});
test('editing cost, ticket and staff recalculates plan, health and backend revenue',()=>{
 const input=clone(c.input);Object.assign(input.operating,{ticket:250,costPercent:40,partTime:4});Object.assign(input,operatingMainFields(input.operating));
 const p={...casePlan(c),inputs:input,out:calculate('expansion',input)},l=lead(p);
 l.consultation.healthInputs=p.out.extra.operating.health;l.consultation.payrollEmployees=7;
 near(l.plan.out.extra.operating.annual.revenue,1372.5);near(estimateRelationship(l).sales,1372.5);
 near(l.consultation.healthInputs.sales,1372.5);assert.ok(operatingSummary(p).includes('250'));
});
test('main fixed/revenue edits work with DOM string inputs and snapshot rejects contradictory values',()=>{
 const raw=Object.fromEntries(Object.entries(c.input.operating).map(([k,v])=>[k,String(v)]));
 const fixed=operatingFromMain(raw,'fixed',60);near(operatingMainFields(fixed).fixed,60);
 const revenue=operatingFromMain(raw,'revenue',180);near(operatingMainFields(revenue).revenue,180);
 const p=casePlan(c);p.inputs.revenue=999;assert.throws(()=>planSnapshot(p),/不同步/);
});
test('zero bonus and zero interest preserve cash identities; per-lead overrides remain authoritative',()=>{
 const input=clone(c.input);input.operating.monthlyBonus=0;input.operating.yearEndBonus=0;input.interest=0;
 const p={...casePlan(c),inputs:input,out:calculate('expansion',input)},a=p.out.extra.operating.annual;
 near(a.bonus,0);near(a.yearEnd,0);near(a.interest,0);near(a.cashChange,a.net+a.depreciation-a.principal);
 const l=lead();l.valueAssumptions={depositDays:10,employeeYield:1};const r=estimateRelationship(l);assert.equal(r.a.depositDays,10);assert.equal(r.a.employeeYield,1);
});

