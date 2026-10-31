import {financingNeed} from './financing-need.js';

// All amounts are TWD ten-thousands. These are editable teaching assumptions,
// not E.SUN prices, revenue-sharing terms, FTP or realized profit.
export const VALUE_FIELDS=[
 ['collectionShare','營收導入比例（%）',100,100],['feeShare','收費交易占比（%）',70,100],
 ['merchantRate','商戶金流費率（%）',4,100],['bankShare','本行取得手續費比例（%）',50,100],
 ['depositDays','公司收款平均留存（天）',15,365],['depositYield','公司活存年收益率（%）',0.5,100],
 ['salary','每人月薪（萬元）',3,1000],['savingShare','員工薪資儲蓄比例（%）',60,100],
 ['employeeYield','員工活存年收益率（%）',1,100],
 ['utilization','融資需求預估動用比例（%）',100,100],['loanRate','放款試算年利率下限（%）',2,100],['loanRateHigh','放款試算年利率上限（%）',2.5,100]
];
export const VALUE_DEFAULTS=Object.freeze(Object.fromEntries(VALUE_FIELDS.map(([k,,v])=>[k,v])));
const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const n=v=>valid(v)?v:null;
const format=v=>!Number.isFinite(v)?'待補':v.toLocaleString('zh-TW',{maximumFractionDigits:2});
export function normalizeValueAssumptions(raw={}){
 const result=Object.fromEntries(VALUE_FIELDS.map(([key,label,initial,max])=>{
  const value=Object.hasOwn(raw,key)?raw[key]:initial;
  if(value===''||value===null||value===undefined)return [key,null];
  const num=Number(value);
  if(typeof value==='boolean'||!Number.isFinite(num)||num<0||num>max)throw Error(label+'超出可用範圍。');
  return [key,num];
 }));
 if(result.loanRate!==null&&result.loanRateHigh!==null&&result.loanRate>result.loanRateHigh)throw Error('放款利率下限不可高於上限。');
 return result;
}
export function estimateRelationship(lead){
 const c=lead.consultation||{},p=lead.plan||{},i=p.inputs||{},services=lead.services||[];
 let a;try{a=normalizeValueAssumptions(lead.valueAssumptions||{})}catch(error){return {rows:[],missing:[error.message],total:null,complete:false,company:null,employee:null,error:error.message};}
 let sales=null,salesSource='尚未提供年收款或營收';
 const explicit=n(c.annualReceipts);
 if(explicit!==null){sales=explicit;salesSource='客戶另填的預計導入本行年收款';}
 else if(p.model==='expansion'&&valid(i.revenue)&&valid(i.ramp)){sales=i.revenue*(12-Math.min(i.ramp,12)*0.5);salesSource='新店首年營收：爬坡期按成熟期50%';}
 else if(p.model==='working'&&valid(i.nextSales)){sales=i.nextSales;salesSource='週轉規劃的明年全年營收';}
 else if(valid(c.healthInputs?.sales)){sales=c.healthInputs.sales;salesSource='財務健檢的公司全年營收（非新增投資營收）';}
 const collections=services.some(s=>['payment','cardAcquiring'].includes(s));
 const depositActive=collections||services.includes('deposit');
 const receipts=sales!==null&&(explicit!==null||a.collectionShare!==null)?sales*(explicit!==null?1:a.collectionShare/100):null;
 const feeVolume=collections&&receipts!==null&&a.feeShare!==null?receipts*a.feeShare/100:null;
 const merchantFee=collections?(feeVolume!==null&&a.merchantRate!==null?feeVolume*a.merchantRate/100:null):0;
 const bankFee=merchantFee!==null&&a.bankShare!==null?merchantFee*a.bankShare/100:null;
 const depositBase=receipts!==null&&merchantFee!==null&&a.depositDays!==null?(receipts-merchantFee)*a.depositDays/365:null;
 const depositIncome=depositBase!==null&&a.depositYield!==null?depositBase*a.depositYield/100:null;
 const people=n(c.payrollEmployees);
 const savings=people!==null&&a.salary!==null&&a.savingShare!==null?people*a.salary*a.savingShare/100:null;
 let employeeBalance=null;
 if(savings!==null){employeeBalance=savings*6;}
 const employeeYearEnd=savings!==null?savings*12:null;
 const employeeIncome=employeeBalance!==null&&a.employeeYield!==null?employeeBalance*a.employeeYield/100:null;
 const need=financingNeed(p).amount;
 const principal=need!==null&&a.utilization!==null?need*a.utilization/100:null;
 const rate=a.loanRate,rateHigh=a.loanRateHigh;
 let loanBasis='假設全年維持預估動用餘額；非實際放款';
 function averagePrincipal(atRate){
  if(principal===null||atRate===null)return null;
  if(p.model==='expansion'&&!p.notCalculated){
   if(!valid(i.tenor)||i.tenor<1)return null;
   const r=atRate/1200,months=i.tenor*12,payment=r===0?principal/months:principal*r/-Math.expm1(-months*Math.log1p(r));let balance=principal,sum=0;
   for(let m=0;m<12;m++){sum+=balance/12;balance=Math.max(0,balance-(payment-balance*r));}
   return sum;
  }
  return principal;
 }
 if(p.model==='expansion'&&!p.notCalculated)loanBasis='按各情境利率分別重算月繳本息均攤及首年平均月初本金';
 else if(p.model==='equipment'&&!p.notCalculated)loanBasis='沿用設備模型每年年底還本，首年期初本金全年計息';
 const avgLoan=averagePrincipal(rate),avgLoanHigh=averagePrincipal(rateHigh);
 const loanIncome=avgLoan!==null&&avgLoanHigh!==null?avgLoan*rate/100:null;
 const loanIncomeHigh=avgLoan!==null&&avgLoanHigh!==null?avgLoanHigh*rateHigh/100:null;
 const rows=[
  {key:'deposit',label:'公司活存',active:depositActive,value:depositIncome,formula:'收款扣商戶金流費 × 留存天數 ÷ 365 × 活存年收益率',basis:'估計均額 '+format(depositBase)+' 萬元；不另加健檢現金餘額'},
  {key:'payment',label:'金流手續費',active:collections,value:bankFee,formula:'年導入收款 × 收費交易占比 × 商戶費率 × 本行取得比例',basis:'商戶總手續費 '+format(merchantFee)+' 萬元；本行比例 '+format(a.bankShare)+'%'},
  {key:'loan',label:'放款利息',active:services.includes('loan'),value:loanIncome,valueHigh:loanIncomeHigh,formula:'首年平均本金 × 貸款年利率',basis:'年利率 '+format(rate)+'%～'+format(rateHigh)+'%；本金均額 '+format(avgLoan)+'～'+format(avgLoanHigh)+' 萬元；'+loanBasis},
  {key:'employee',label:'員工延伸貢獻',active:services.includes('payroll'),value:employeeIncome,formula:'人數 × 月薪 × 儲蓄比例 → 持續累積首年均額 × 年收益率',basis:format(people)+' 人；首年均額 '+format(employeeBalance)+' 萬元；年底餘額 '+format(employeeYearEnd)+' 萬元；期初0、月中入帳、不提領，離職不移出既存儲蓄'}
 ];
 const active=rows.filter(r=>r.active),known=active.filter(r=>r.value!==null),missing=active.filter(r=>r.value===null).map(r=>r.label);
 const companyRows=rows.filter(r=>r.active&&r.key!=='employee');
 const company=companyRows.some(r=>r.value!==null)?companyRows.reduce((sum,r)=>sum+(r.value??0),0):null;
 const companyHigh=company===null?null:companyRows.reduce((sum,r)=>sum+(r.valueHigh??r.value??0),0);
 const totalHigh=known.length?known.reduce((sum,r)=>sum+(r.valueHigh??r.value),0):null;
 return {a,rows,missing,companyHigh,totalHigh,employeeYearEnd,avgLoanHigh,rateHigh,complete:active.length>0&&!missing.length,total:known.length?known.reduce((sum,r)=>sum+r.value,0):null,company,employee:services.includes('payroll')?employeeIncome:null,sales,salesSource,receipts,feeVolume,merchantFee,depositBase,employeeBalance,avgLoan,rate,people,loanBasis};
}
export function relationshipMailLines(lead){
 const r=estimateRelationship(lead);
 return ['【前台資料推估往來貢獻】','年度潛在貢獻：'+format(r.total)+'～'+format(r.totalHigh)+' 萬元'+(r.complete?'':'（部分估算；待補 '+r.missing.join('、')+'）'),...r.rows.filter(x=>x.active).map(x=>x.label+'：'+format(x.value)+(x.valueHigh!==undefined?'～'+format(x.valueHigh):'')+' 萬元／年'), '收入來源：'+r.salesSource,'金流假設：收費占比 '+format(r.a?.feeShare??null)+'%；商戶費率 '+format(r.a?.merchantRate??null)+'%；本行取得 '+format(r.a?.bankShare??null)+'%。','各項為潛在商機試算，未扣資金、信用、資本及作業成本，不是淨利或已實現收入。',''];
}
