import {DEMO_CASES} from './case-data.js?v=final20261102';
import {PLAN_EXAMPLES} from './franchise-scenarios.js?v=visualbrief20261101';
export const FINANCE_DRAFT_KEY='esun_mobile_review_finance_draft_v1';
export const HEALTH_KEYS=['cash','receipts','stock','shortDebt','totalDebt','assets','sales','profit','annualAvailable','annualDebt'];
export function pairedHealth(model,index=0){const example=PLAN_EXAMPLES[model]?.[index],item=DEMO_CASES.find(c=>c.id===example?.caseId);return {values:item?{...item.health}:Object.fromEntries(HEALTH_KEYS.map(k=>[k,null])),name:item?.title||'自行填寫的財務資料',note:item?.input.operating?'開業資產負債＋首年預估損益／本息，已含本案融資。':'僅示範本案還款安排，未提供的公司財務留白。'};}
export function sharedHealthPatch(plan){return plan?.model==='working'&&Number.isFinite(plan.inputs?.sales)?{sales:plan.inputs.sales}:{};}
export function readFinanceDraft(storage=globalThis.localStorage){try{const v=JSON.parse(storage.getItem(FINANCE_DRAFT_KEY)||'null',(_,value)=>typeof value==='string'?value.replaceAll('螺\u7d72粉','螺螄粉'):value);return v?.version===1&&['working','expansion','equipment','overseas'].includes(v.current)&&v.planInputs&&v.healthInputs?v:null;}catch{return null}}
export function writeFinanceDraft(value,storage=globalThis.localStorage){try{storage.setItem(FINANCE_DRAFT_KEY,JSON.stringify({...value,version:1}));return true;}catch{return false}}
