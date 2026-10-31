import {DEMO_CASES} from './case-data.js?v=cases1';
import {HEALTH_EXAMPLES,PLAN_EXAMPLES} from './franchise-scenarios.js';
export const FINANCE_DRAFT_KEY='esun_mobile_review_finance_draft_v1';
export const HEALTH_KEYS=['cash','receipts','stock','shortDebt','totalDebt','assets','sales','profit','annualAvailable','annualDebt'];
const h=id=>HEALTH_EXAMPLES.find(x=>x.id===id).values;
const c=id=>DEMO_CASES.find(x=>x.id===id).health;
// Each pair is a complete fictional company snapshot. Project budgets are never
// substituted for company-wide assets, debt, cash or accounting operating profit.
const paired={
 working:[{...h('drink'),sales:960,profit:115.2},{...h('food'),sales:1800,profit:54},c('01')],
 expansion:[c('02'),{...h('food'),sales:2880,profit:86.4},{cash:160,receipts:30,stock:40,shortDebt:180,totalDebt:400,assets:800,sales:1800,profit:90,annualAvailable:160,annualDebt:90}],
 equipment:[c('04'),h('food')],
 overseas:[c('03'),{cash:1800,receipts:900,stock:600,shortDebt:2200,totalDebt:4000,assets:9000,sales:14000,profit:980,annualAvailable:1300,annualDebt:800}]
};
export function pairedHealth(model,index=0){const i=paired[model]?.[index]?index:0;return {values:{...paired[model]?.[i]},name:PLAN_EXAMPLES[model]?.[i]?.name||'規劃情境',note:'配對教學財務資料；資產負債與原有本息未加入本次投資，不代表投資後報表。'};}
export function sharedHealthPatch(plan){return plan?.model==='working'&&Number.isFinite(plan.inputs?.sales)?{sales:plan.inputs.sales}:{};}
export function readFinanceDraft(storage=globalThis.localStorage){try{const v=JSON.parse(storage.getItem(FINANCE_DRAFT_KEY)||'null');return v?.version===1&&['working','expansion','equipment','overseas'].includes(v.current)&&v.planInputs&&v.healthInputs?v:null;}catch{return null}}
export function writeFinanceDraft(value,storage=globalThis.localStorage){try{storage.setItem(FINANCE_DRAFT_KEY,JSON.stringify({...value,version:1}));return true;}catch{return false}}
