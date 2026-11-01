import {DEMO_CASES} from './case-data.js?v=visualbrief20261101';
import {calculate,diagnose} from './engine.js?v=visualbrief20261101';
import {financingNeed} from './financing-need.js?v=visualbrief20261101';
import {buildConsultationSummary} from './consultation.js?v=visualbrief20261101';
import {createLead,readLocal,writeLocal} from './opportunity.js?v=visualbrief20261101';
import {ROUTING_KEY} from './branch-routing.js?v=visualbrief20261101';
export {DEMO_CASES};
export const CASE_SET='mobile-complete-cases-20261031';
export const getDemoCase=id=>DEMO_CASES.find(item=>item.id===id);
export function casePlan(item){return {model:item.model,mode:item.input.mode||'twd',inputs:JSON.parse(JSON.stringify(item.input)),out:calculate(item.model,item.input),at:new Date().toLocaleString('zh-TW')};}
export function caseConsultation(item,plan=casePlan(item)){
 const values=plan.out.extra?.operating?.health||item.health;
 const health={inputs:{...values},out:diagnose(values),at:plan.at};
 return {payrollEmployees:item.payrollEmployees??null,company:item.company,businessType:item.businessType,purpose:item.model,amount:Math.round(financingNeed(plan).amount*100)/100,brand:item.brand,storeCount:item.stores,contact:item.contact,phone:'',preferredTime:item.time,desiredMonth:item.month,note:item.note,address:item.address,position:null,health:health.out,healthInputs:health.inputs,healthAt:health.at,documents:[],summary:buildConsultationSummary({plan,health,title:item.shortName,desiredMonth:item.month,documents:[]})};
}
export function addMissingCaseLeads(existing){
 const pending=DEMO_CASES.filter(item=>!existing.some(lead=>lead.sampleSet===CASE_SET&&lead.sampleKey===item.id));
 if(existing.length+pending.length>200)throw Error('案件已接近200筆上限，請先整理資料再載入案例。');
 const added=pending.map(item=>{
  const plan=casePlan(item),lead=createLead({plan,city:item.city,district:item.district,services:item.services,label:item.company,source:'完整情境案例（手動載入假資料）',consent:true,consultation:caseConsultation(item,plan)});
  lead.sampleSet=CASE_SET;lead.sampleKey=item.id;
  lead.consent.scope='使用者載入虛構案例供本機演示，並非真實客戶同意或正式送件。';
  return lead;
 });
 return [...added,...existing];
}
export function prepareCaseRouting(){
 const current=readLocal(ROUTING_KEY,{});
 if(current.threshold===undefined||current.threshold===null||current.threshold==='')writeLocal(ROUTING_KEY,{...current,threshold:600});
}
