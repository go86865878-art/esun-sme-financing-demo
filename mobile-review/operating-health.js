// An explicitly assumed year-end balance sheet, separate from the PDF cash budget.
export const WORKING_CAPITAL_DEFAULTS=Object.freeze({settlementDays:7,inventoryDays:7,payableDays:0});
export const HEALTH_FORECAST_NOTE='首年年底預估資產負債＋首年損益＋次年還款預估；電子支付7天入帳、備料7天、貨款現付為新增可改假設，並非PDF原始資料。';

function position(revenue,cost,o){
 // Merchant fees are already expensed in the PDF; use net settlement proceeds.
 const receipts=revenue*o.feeShare/100*(1-o.merchantRate/100)*o.settlementDays/30;
 const stock=cost*o.inventoryDays/30,payables=cost*o.payableDays/30;
 return {receipts,stock,payables,net:receipts+stock-payables};
}

export function forecastOperatingHealth(v,o,annual,monthly,payments){
 const last=monthly[11],wc=position(last.revenue,last.cost,o);
 const loan=Math.max(0,v.setup+v.reserve-v.equity);
 const loanBalance=Math.max(0,loan-annual.principal);
 const equipment=Math.max(0,v.setup-annual.depreciation);
 // The PDF deducts a tax reserve from available cash; assume it is unpaid at year-end.
 // Show it on both sides of the balance sheet, never as free cash or extra income.
 const taxReserve=annual.tax,availableCash=annual.cashClose-wc.net;
 const bankCash=availableCash+taxReserve;
 const equity=v.equity+annual.retainedFinal;
 const totalDebt=loanBalance+wc.payables+taxReserve;
 const assets=bankCash+wc.receipts+wc.stock+equipment;
 const next={revenue:0,cost:0,operatingProfit:0,interest:0,principal:0,tax:0,net:0,bonus:0,retained:0,depreciation:0};
 let nextLast;
 for(let m=13;m<=24;m++){
  const progress=v.ramp<=1?1:Math.min(1,(m-1)/(v.ramp-1));
  const revenue=(o.initialDaily+(o.matureDaily-o.initialDaily)*progress)*o.days*o.ticket/10000;
  const cost=revenue*o.costPercent/100,fee=revenue*o.feeShare/100*o.merchantRate/100;
  const depreciation=v.setup/o.depreciationMonths*Math.max(0,Math.min(1,o.depreciationMonths-(m-1)));
  const operatingProfit=revenue-cost-v.fixed-fee-depreciation;
  const {interest=0,principal=0}=payments[m-1]||{};
  const pretax=operatingProfit-interest,tax=Math.max(0,pretax)*o.tax/100,net=pretax-tax;
  const bonus=Math.max(0,net)*o.monthlyBonus/100,retained=net-bonus;
  const row={revenue,cost,operatingProfit,interest,principal,tax,net,bonus,retained,depreciation};
  for(const key of Object.keys(next))next[key]+=row[key];
  nextLast=row;
 }
 next.yearEnd=Math.max(0,next.retained)*o.yearEndBonus/100;
 next.retainedFinal=next.retained-next.yearEnd;
 next.workingCapitalChange=position(nextLast.revenue,nextLast.cost,o).net-wc.net;
 next.availableForDebt=next.retainedFinal+next.depreciation+next.interest-next.workingCapitalChange;
 next.debt=next.principal+next.interest;
 const fundingGap=Math.max(0,-availableCash),unfundedBankGap=Math.max(0,-bankCash);
 const health={cash:bankCash>=0?bankCash:null,receipts:wc.receipts,stock:wc.stock,shortDebt:next.principal+wc.payables+taxReserve,totalDebt,assets:bankCash>=0?assets:null,sales:annual.revenue,profit:annual.operatingProfit,annualAvailable:next.availableForDebt,annualDebt:next.debt};
 return {version:'year-end-working-capital-v1',period:'首年12月底',assumptions:{settlementDays:o.settlementDays,inventoryDays:o.inventoryDays,payableDays:o.payableDays,monthBasis:30,taxTreatment:'首年所得稅全額預留、尚未繳付；次年由預留款支付。'},receipts:wc.receipts,stock:wc.stock,payables:wc.payables,workingCapital:wc.net,pdfAvailableCash:annual.cashClose,availableCash,bankCash,taxReserve,loanBalance,equipment,equity,assets,totalDebt,balanceDifference:assets-totalDebt-equity,fundingGap,unfundedBankGap,next,health};
}
