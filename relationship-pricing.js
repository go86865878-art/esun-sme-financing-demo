export const RELATIONSHIP_PRODUCTS=Object.freeze([
 {key:'cardAcquiring',label:'信用卡收單',group:'collections',hint:'收單通路、月交易量與約定費率'},
 {key:'payroll',label:'員工薪轉',group:'payroll',hint:'薪轉人數、每月金額與導入時程'},
 {key:'accountOpening',label:'公司戶開立',group:'account',hint:'帳戶用途、留存餘額與往來條件'},
 {key:'deposit',label:'活存與資金管理',group:'account',hint:'月平均留存餘額與付款安排'},
 {key:'payment',label:'收付通與收款整合',group:'collections',hint:'導入通路、交易量與對帳方式'},
 {key:'ebank',label:'企業網路銀行',group:'ebank',hint:'使用功能、交易量與服務條件'}
]);
const clean=v=>String(v??'').trim().slice(0,300);
function number(v,label,max){if(v===''||v===null||v===undefined)return null;const n=typeof v==='number'?v:typeof v==='string'?Number(v):NaN;if(!Number.isFinite(n)||n<0||n>max)throw Error(label+'超出可填範圍。');return n;}
export function normalizePricing(value={}){
 const baseRate=number(value.baseRate,'基準年利率',30),floorRate=number(value.floorRate,'最低年利率',30),capBps=number(value.capBps,'折減上限',3000);
 if(baseRate!==null&&floorRate!==null&&floorRate>baseRate)throw Error('最低年利率不能高於基準年利率。');
 return {baseRate,floorRate,capBps,products:Object.fromEntries(RELATIONSHIP_PRODUCTS.map(p=>{const r=value.products?.[p.key]||{};return [p.key,{confirmed:r.confirmed===true,discountBps:number(r.discountBps,p.label+'折減',3000),condition:clean(r.condition)}]}))};
}
export function evaluatePricing(value={}){
 const p=normalizePricing(value),confirmed=RELATIONSHIP_PRODUCTS.filter(x=>p.products[x.key].confirmed),groups=new Map(),missing=[];
 for(const item of confirmed){const row=p.products[item.key];if(row.discountBps===null)missing.push(item.label+'折減幅度');if(!row.condition)missing.push(item.label+'往來條件');if(row.discountBps!==null)groups.set(item.group,Math.max(groups.get(item.group)||0,row.discountBps));}
 if(p.baseRate===null)missing.push('基準年利率');if(p.floorRate===null)missing.push('最低年利率');if(p.capBps===null)missing.push('折減上限');
 const rawBps=[...groups.values()].reduce((a,b)=>a+b,0),count=confirmed.length,groupCount=new Set(confirmed.map(p=>p.group)).size;
 if(missing.length)return {ready:false,count,groupCount,missing,rawBps,discountBps:null,rate:null};
 const rawRate=Math.max(p.floorRate,p.baseRate-Math.min(rawBps,p.capBps)/100),rate=Number(rawRate.toFixed(6)),discountBps=Number(((p.baseRate-rate)*100).toFixed(6));
 return {ready:true,count,groupCount,missing:[],rawBps,discountBps,rate,baseRate:p.baseRate,floorRate:p.floorRate,capBps:p.capBps};
}
export function pricingMailLines(lead){
 if(!lead?.pricing)return [];
 try{const p=normalizePricing(lead.pricing),r=evaluatePricing(p);return ['【往來產品與內部優惠試算】','已確認符合條件產品：'+RELATIONSHIP_PRODUCTS.filter(x=>p.products[x.key].confirmed).map(x=>x.label+'（'+p.products[x.key].condition.replace(/[\r\n]+/g,' ')+'）').join('、'),r.ready?'基準 '+r.baseRate+'% ／ 折減 '+r.discountBps+' bps ／ 內部試算 '+r.rate+'%':'資料待補，尚未產生優惠利率。','僅內部提案；非正式報價，須依核實條件與銀行定價審核。',''];}catch{return ['內部優惠試算資料待確認，尚無可提議利率。',''];}
}
