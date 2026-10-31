import test from 'node:test';
import assert from 'node:assert/strict';
import {createLead} from './opportunity.js';
import {sanitizeConsultation} from './consultation-context.js';
import {suggestAssignment,needInTwd,branchCandidates,distanceKm,validThreshold} from './branch-routing.js';
import {HEALTH_EXAMPLES,PLAN_EXAMPLES,profitData,profitabilityMarkup} from './franchise-scenarios.js';
import {calculate,diagnose} from './engine.js';
import {buildWorkbook} from './report.js';
const request={company:'示範茶飲店',note:'第二間店資金與收款整合',businessType:'加盟飲料',purpose:'expansion',amount:450,preferredTime:'平日下午'};
const lead=amount=>({city:'新北市',district:'新莊區',plan:{model:'expansion',out:{value:amount,unit:'萬元'},inputs:{}},consultation:{}});
const branches=[{id:'a',name:'測試甲分行',city:'新北市',district:'新莊區',lat:25.03,lng:121.43},{id:'b',name:'測試乙分行',city:'新北市',district:'板橋區',lat:25.01,lng:121.46},{id:'review',name:'待核對',city:'新北市',district:'新莊區',lat:25.03,lng:121.43,reviewRequired:true}];
test('consultation without a calculator preserves unknown amount rather than inventing zero',()=>{
 const c=createLead({plan:null,city:'新北市',district:'新莊區',services:['loan'],consultation:{...request,amount:''},consent:true});
 assert.equal(c.plan.out.value,null);assert.equal(c.plan.notCalculated,true);assert.equal(c.consultation.note,request.note);assert.equal(c.assignment,null);
 assert.equal(needInTwd(c).amount,null);
});
test('consultation saves an immutable plan with explicit consent and whitelisted fields',()=>{
 const plan={model:'working',inputs:{sales:1000},out:{label:'缺口',value:50,unit:'萬元'},at:'demo'};
 const c=createLead({plan,city:'新北市',district:'新莊區',services:['loan'],consultation:{...request,password:'private',documents:[{title:'登記',ready:true}]},consent:true});
 plan.out.value=999;assert.equal(c.plan.out.value,50);assert.equal(c.consultation.password,undefined);assert.equal(c.consultation.documents[0].ready,true);
 assert.throws(()=>createLead({plan,city:'新北市',district:'新莊區',services:['loan'],consultation:request,consent:false}),/同意/);
});
test('invalid consultation amounts, fractional stores and invalid month are rejected',()=>{
 assert.throws(()=>sanitizeConsultation({...request,amount:-1}),/範圍/);
 assert.throws(()=>sanitizeConsultation({...request,storeCount:1.5}),/整數/);
 assert.throws(()=>sanitizeConsultation({...request,desiredMonth:'2026-13'}),/月份/);
});
test('routing waits for a threshold and amount, with exact threshold going to regional center',()=>{
 const routes=[{city:'新北市',district:'*',team:'示範區域中心',rm:'示範窗口'}];
 assert.equal(suggestAssignment(lead(500),{branches,routes}).eligible,false);
 assert.equal(suggestAssignment(lead(null),{threshold:600,branches,routes}).eligible,false);
 assert.equal(suggestAssignment(lead(599),{threshold:600,branches,routes}).kind,'branch');
 assert.equal(suggestAssignment(lead(600),{threshold:600,branches,routes}).kind,'center');
 assert.equal(suggestAssignment(lead(600),{threshold:600,branches,routes:[]}).eligible,false);
 assert.equal(validThreshold(''),null);assert.throws(()=>validThreshold(0));
});
test('district candidates are not mislabeled nearest; reviewed addresses are excluded',()=>{
 const noCoordinates=branches.map(b=>({...b,lat:null,lng:null}));
 const list=branchCandidates(lead(100),noCoordinates);
 assert.equal(list.items[0].match,'同一行政區');assert.equal(list.items[0].distance,null);
 assert.equal(list.items.some(x=>x.id==='review'),false);
});
test('distance requires real coordinates and ranks only the loaded coordinate records',()=>{
 const l=lead(100);l.consultation.position={lat:25.03,lng:121.43};
 const list=branchCandidates(l,branches);
 assert.equal(list.items[0].id,'a');assert.equal(list.items[0].distance,0);
 assert.ok(list.items[1].distance>0);assert.equal(distanceKm(null,branches[0]),null);
 assert.match(list.basis,/僅在/);
});
test('USD routing uses explicit FX assumptions and never treats dollar need as TWD',()=>{
 const l=lead(50);l.plan.out.unit='萬美元';l.plan.inputs.fx=32;
 assert.equal(needInTwd(l).amount,1600);delete l.plan.inputs.fx;assert.equal(needInTwd(l).amount,null);
});
test('all franchise and health scenarios are valid; loss remains negative on the chart',()=>{
 for(const [model,examples]of Object.entries(PLAN_EXAMPLES))for(const p of examples){const v={...p.values,...(model==='overseas'?{mode:'dual'}:{})};assert.ok(Number.isFinite(calculate(model,v).value));}
 for(const p of HEALTH_EXAMPLES)assert.ok(diagnose(p.values).items.length===5);
 assert.equal(profitData(HEALTH_EXAMPLES.find(p=>p.id==='stress').values).margin,-8);
 assert.match(profitabilityMarkup({sales:100,profit:-8}),/-8/);assert.equal(profitData({sales:0,profit:5}),null);
});
test('workbook embeds an actual PNG drawing with numeric cells and no formula injection',async()=>{
 const png=new Uint8Array([137,80,78,71,13,10,26,10]);
 const blob=buildWorkbook([{name:'喵喵規劃卡',widths:[20,20,20,20,12,12],rows:[[{v:'規劃',style:'title'}],['金額',123.45],['文字','=HYPERLINK("unsafe")']]}],{brandImage:png});
 const bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer),files=new Map();let offset=0;
 while(view.getUint32(offset,true)===0x04034b50){const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extra=view.getUint16(offset+28,true),start=offset+30+nameLength+extra;const name=new TextDecoder().decode(bytes.slice(offset+30,offset+30+nameLength));files.set(name,bytes.slice(start,start+size));offset=start+size;}
 assert.deepEqual(files.get('xl/media/esun-meow.png'),png);
 const sheet=new TextDecoder().decode(files.get('xl/worksheets/sheet1.xml'));
 assert.match(sheet,/<drawing r:id="rIdBrand"/);assert.match(sheet,/<v>123.45<\/v>/);assert.doesNotMatch(sheet,/<f>/);
 assert.ok(files.has('xl/drawings/_rels/drawing1.xml.rels'));
});

test('real calculator submissions route on financing demand, not annual payments or monthly surplus',()=>{
 const expected={working:18.378082191780824,equipment:3500,expansion:330,overseas:2156};
 for(const model of Object.keys(PLAN_EXAMPLES)){
  const inputs={...PLAN_EXAMPLES[model][0].values,mode:'dual'},out=calculate(model,inputs);
  const created=createLead({plan:{model,mode:'dual',inputs,out},city:'新北市',district:'新莊區',services:['loan'],consultation:{...request,purpose:model},consent:true});
  const saved=JSON.parse(JSON.stringify(created));
  const need=needInTwd(saved);
  const demand=model==='working'?out.value:expected[model];
  assert.ok(Math.abs(need.amount-demand)<1e-6,model+' financing amount');
  const routed=suggestAssignment(saved,{threshold:600,branches,routes:[{city:'新北市',district:'*',team:'新北示範中心',rm:'示範窗口'}]});
  assert.equal(routed.kind,demand>=600?'center':'branch',model);
  assert.equal(routed.eligible,true,model);
  assert.equal(saved.consultation.note,request.note);
 }
});

