// A repayment amount or operating surplus must never be mistaken for loan demand.
export function financingNeed(plan){
 const unknown={amount:null,note:'尚未確認融資需求金額'};
 if(!plan?.out)return unknown;
 const input=plan.inputs||{},number=k=>typeof input[k]==='number'&&Number.isFinite(input[k])&&input[k]>=0;
 if(plan.model==='equipment'&&plan.out.unit==='萬元／年'){
  if(!number('invest')||!number('equity'))return unknown;
  return {amount:Math.max(0,input.invest-input.equity),note:'投資預算減自有資金；不是年度還款額'};
 }
 if(plan.model==='expansion'&&plan.out.unit==='萬元／月'){
  if(!number('setup')||!number('reserve')||!number('equity'))return unknown;
  return {amount:Math.max(0,input.setup+input.reserve-input.equity),note:'建置費加週轉準備減自有資金；不是每月營運餘額'};
 }
 const value=plan.out.value;if(typeof value!=='number'||!Number.isFinite(value)||value<0)return unknown;
 if(plan.out.unit==='萬美元'){
  if(!number('fx')||input.fx<=0)return {amount:null,note:'美元需求尚缺有效規劃匯率，暫不分級'};
  return {amount:value*input.fx,note:'美元需求按客戶規劃匯率換算；非成交匯率'};
 }
 if(['萬元','新臺幣萬元','萬元（台幣等值）'].includes(plan.out.unit))return {amount:value,note:plan.notCalculated?'客戶自述金額，尚未試算':plan.model==='overseas'?'包含匯率壓力與預備金的台幣等值缺口':'依本次試算需求金額'};
 return {amount:null,note:'需求幣別尚待確認'};
}

