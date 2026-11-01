import {WORKING_CAPITAL_DEFAULTS,forecastOperatingHealth} from './operating-health.js?v=health20261101';
// Fictional restaurant operating plan. Currency is TWD ten-thousands unless labelled otherwise.
export const OPERATING_KIND='luosifen-v1';
export const OPERATING_TITLE='螺絲粉營運計畫預估';
export const OPERATING_DEFAULTS=Object.freeze({...WORKING_CAPITAL_DEFAULTS,kind:OPERATING_KIND,ticket:300,days:30,initialDaily:100,matureDaily:170,costPercent:35,fullTime:3,fullSalary:4.5,partTime:6,partHours:150,hourlyWage:220,personnelExtra:10,rent:10,misc:3,utilities:3,fixedAdjustment:0,feeShare:70,merchantRate:4.5,tax:20,monthlyBonus:20,yearEndBonus:30,fullTimeShare:80,depreciationMonths:60});
export const OPERATING_FIELDS=[
 ['ticket','實收客單價','元',1,100000],['days','每月營業天數','天',1,31],['initialDaily','初期每日交易','筆',0,100000],['matureDaily','成熟期每日交易','筆',0,100000],['costPercent','營業成本率','%',0,100],
 ['fullTime','正職人數','人',0,10000],['fullSalary','每位正職月薪','萬元',0,1000],['partTime','兼職人數','人',0,10000],['partHours','每位兼職月工時','小時',0,744],['hourlyWage','兼職時薪','元',0,100000],['personnelExtra','薪資附加成本','%',0,100],
 ['rent','每月租金','萬元',0,1000000],['misc','每月雜支','萬元',0,1000000],['utilities','每月水電瓦斯','萬元',0,1000000],['fixedAdjustment','其他固定收支調整','萬元',-1000000,1000000],
 ['feeShare','收費交易占比','%',0,100],['merchantRate','金流商戶費率','%',0,100],['tax','所得稅預留','%',0,100],['monthlyBonus','正的稅後淨利月分紅','%',0,100],['yearEndBonus','年終前保留盈餘提撥','%',0,100],['fullTimeShare','年終分給正職','%',0,100],['depreciationMonths','裝修設備攤提','月',1,600],
 ['settlementDays','電子支付結算天數（新增假設）','天',0,365],['inventoryDays','備料存貨天數（新增假設）','天',0,365],['payableDays','供應商付款帳期（新增假設）','天',0,365]
];
export const hasOperatingPlan=v=>v?.operating?.kind===OPERATING_KIND;
export function normalizeOperating(raw){
 if(raw?.kind!==OPERATING_KIND)throw Error('營運情境格式不符。');
 const o={kind:OPERATING_KIND};
 for(const [key,label,,min,max] of OPERATING_FIELDS){const value=raw[key]===undefined&&key in WORKING_CAPITAL_DEFAULTS?WORKING_CAPITAL_DEFAULTS[key]:raw[key];const n=Number(value);if(value===''||value==null||!Number.isFinite(n)||n<min||n>max)throw Error('請確認「'+label+'」。');o[key]=n;}
 for(const key of ['fullTime','partTime'])if(!Number.isInteger(o[key]))throw Error('員工人數請填整數。');
 if(o.fullTime+o.partTime===0)throw Error('請至少保留一位員工，或改用一般展店試算。');
 if((!o.fullTime&&o.fullTimeShare>0)||(!o.partTime&&o.fullTimeShare<100))throw Error('年終分配比例須對應有在職員工的組別。');
 return o;
}
export const payrollTotal=o=>o.fullTime*o.fullSalary+o.partTime*o.partHours*o.hourlyWage/10000;
export function operatingMainFields(raw){const o=normalizeOperating(raw);return {revenue:o.ticket*o.days*o.matureDaily/10000,margin:100-o.costPercent-o.feeShare*o.merchantRate/100,fixed:payrollTotal(o)*(1+o.personnelExtra/100)+o.rent+o.misc+o.utilities+o.fixedAdjustment};}
export function operatingFromMain(raw,key,value){const o=normalizeOperating(raw);if(key==='revenue')o.matureDaily=value*10000/o.ticket/o.days;if(key==='margin')o.costPercent=100-value-o.feeShare*o.merchantRate/100;if(key==='fixed')o.fixedAdjustment=value-(payrollTotal(o)*(1+o.personnelExtra/100)+o.rent+o.misc+o.utilities);return o;}
const fmt=n=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:2}):'不適用';
export function calculateOperating(v){
 const o=normalizeOperating(v.operating);
 for(const key of ['setup','reserve','equity','revenue','fixed','margin','ramp','interest','tenor'])if(typeof v[key]!=='number'||!Number.isFinite(v[key])||v[key]<0)throw Error('請確認展店欄位：'+key);
 if(v.tenor<1||v.tenor>30||!Number.isInteger(v.tenor)||v.ramp>60||!Number.isInteger(v.ramp)||v.margin>100||v.interest>30)throw Error('請確認年數、爬坡月份、利率或剩餘比例。');
 const derived=operatingMainFields(o);for(const key of ['revenue','margin','fixed'])if(Math.abs(v[key]-derived[key])>1e-7)throw Error('營運明細與'+key+'不同步，請重新更新。');
 const loan=Math.max(0,v.setup+v.reserve-v.equity),openingCash=v.equity+loan-v.setup;
 const r=v.interest/1200,payment=loan===0?0:r===0?loan/(v.tenor*12):loan*r/-Math.expm1(-v.tenor*12*Math.log1p(r));
 let balance=loan;const payments=[];const schedule=[];
 for(let m=0;m<v.tenor*12;m++){const interest=balance*r,principal=Math.min(balance,Math.max(0,payment-interest));payments.push({interest,principal,total:interest+principal,opening:balance});balance=Math.max(0,balance-principal);const year=Math.floor(m/12);schedule[year]??={year:year+1,principal:0,interest:0,total:0};for(const key of ['principal','interest','total'])schedule[year][key]+=payments[m][key];}
 const grossSalary=payrollTotal(o),salary=grossSalary*(1+o.personnelExtra/100),depreciation=v.setup/o.depreciationMonths,monthly=[];let cash=openingCash;
 for(let m=1;m<=12;m++){
  const progress=v.ramp<=1?1:Math.min(1,(m-1)/(v.ramp-1));
  const daily=o.initialDaily+(o.matureDaily-o.initialDaily)*progress,revenue=daily*o.days*o.ticket/10000,cost=revenue*o.costPercent/100,fee=revenue*o.feeShare/100*o.merchantRate/100;
  const otherCash=v.fixed-salary+fee,otherExpense=otherCash+depreciation,operatingProfit=revenue-cost-salary-otherExpense;
  const {interest,principal}=payments[m-1],pretax=operatingProfit-interest,tax=Math.max(0,pretax)*o.tax/100,net=pretax-tax,bonus=Math.max(0,net)*o.monthlyBonus/100,retained=net-bonus;
  const cashChange=retained+depreciation-principal;
  monthly.push({month:m,daily,revenue,cost,grossProfit:revenue-cost,salary,fee,otherExpense,operatingProfit,interest,principal,tax,net,bonus,retained,depreciation,yearEnd:0,cashOpen:cash,cashChange,cashClose:cash+cashChange});cash+=cashChange;
 }
 const keys=['revenue','cost','grossProfit','salary','fee','otherExpense','operatingProfit','interest','principal','tax','net','bonus','retained','depreciation'];
 const annual=Object.fromEntries(keys.map(k=>[k,monthly.reduce((n,x)=>n+x[k],0)]));
 annual.yearEnd=Math.max(0,annual.retained)*o.yearEndBonus/100;annual.retainedFinal=annual.retained-annual.yearEnd;
 monthly[11].yearEnd=annual.yearEnd;monthly[11].cashChange-=annual.yearEnd;monthly[11].cashClose-=annual.yearEnd;
 annual.cashChange=monthly.reduce((n,x)=>n+x.cashChange,0);annual.cashClose=monthly[11].cashClose;annual.cashOpen=openingCash;annual.debt=annual.interest+annual.principal;
 annual.availableForDebt=annual.cashChange+annual.debt;
 const fullBonus=annual.yearEnd*o.fullTimeShare/100,partBonus=annual.yearEnd-fullBonus;
 const employeeSalaryAverage=grossSalary*.6*6,employeeBonusAverage=monthly.reduce((n,x)=>n+x.bonus*.6*(12-x.month)/12,0);
 const employeeYearEnd=grossSalary*.6*12+(annual.bonus+annual.yearEnd)*.6;
 const lowestCash=Math.min(openingCash,...monthly.map(x=>x.cashClose)),mature=monthly[Math.min(11,Math.max(0,v.ramp-1))];
 const forecast=forecastOperatingHealth(v,o,annual,monthly,payments),health=forecast.health;
 const summary={kind:OPERATING_KIND,title:OPERATING_TITLE,assumptions:o,loan,payment,openingCash,grossSalary,salary,monthly,annual,fullBonus,partBonus,fullEach:o.fullTime?fullBonus/o.fullTime:0,partEach:o.partTime?partBonus/o.partTime:0,employeeSalaryAverage,employeeBonusAverage,employeeYearEnd,forecast,health};
 return {label:'需規劃的融資金額',value:loan,unit:'萬元',sub:'首年營收 '+fmt(annual.revenue)+' 萬元；已按月計入利息、還本、稅金預留及分紅。',metrics:[{label:'首年營收',value:fmt(annual.revenue)+' 萬元'},{label:'成熟期月保留（年終前）',value:fmt(mature.retained)+' 萬元'},{label:'年終獎金',value:fmt(annual.yearEnd)+' 萬元'},{label:'全年保留（年終後）',value:fmt(annual.retainedFinal)+' 萬元'},{label:'年底可用現金',value:fmt(annual.cashClose)+' 萬元'},{label:'每月還款本息',value:fmt(payment)+' 萬元'}],breakdown:[{label:'裝修設備',value:v.setup},{label:'營運預備金',value:v.reserve},{label:'自有資金',value:-v.equity},{label:'融資需求',value:loan}],formula:'融資需求＝裝修設備＋預備金－自有資金。首年依初期到成熟期逐月成長計算。',note:'虛構營運預估；老闆補班不另支薪。成本與各項費率均可調。月分紅按正的稅後淨利提撥，年終再從全年保留盈餘提撥，12月底發放。分紅採稅後分配假設，不回推減稅、未另估附加費；收款未另拆營業稅。',schedule,extra:{loan,monthlyPayment:payment,annualDebt:annual.debt,monthlySurplus:mature.cashChange,operatingSurplus:mature.operatingProfit+depreciation,firstYearCash:annual.cashChange,rampFunding:Math.max(0,openingCash-lowestCash),reserveGap:Math.max(0,-lowestCash),annualBudget:annual.availableForDebt,coverage:annual.debt?annual.availableForDebt/annual.debt:null,operating:summary}};
}
