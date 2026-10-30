import {diagnose} from './engine.js';
export function snapshotContext(context){
  if(!context)return null;
  const desiredMonth=String(context.desiredMonth||'');
  if(desiredMonth&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(desiredMonth))throw new Error('請確認預計用款月份。');
  const numeric=(v,negative=false)=>{if(v===null||v===undefined||v==='')return null;if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>100000000||(!negative&&v<0))throw new Error('請確認還款檢查的金額。');return v;};
  const annualAvailable=numeric(context.annualAvailable,true),annualDebt=numeric(context.annualDebt);
  const item=diagnose({annualAvailable,annualDebt}).items.find(x=>x.label==='一年還款餘裕');
  return {version:1,desiredMonth,annualAvailable,annualDebt,repayment:{value:item.value,status:item.status,advice:item.advice},scope:'還款初步檢查，並非完整財務健檢或核貸評等'};
}
export function planningSummary(plan,context){
  const c=snapshotContext(context),n=v=>Number(v).toLocaleString('zh-TW',{maximumFractionDigits:1});
  return ['週轉金規劃摘要',`尚待規劃資金：${n(plan.out.value)} 萬元`,`預計用款：${c?.desiredMonth||'待確認'}（自行填寫，非系統預測）`,`還款餘裕：${c?.repayment.value||'資料不足'}`,`可用還款現金：${c?.annualAvailable==null?'待確認':n(c.annualAvailable)+' 萬元'}`,`一年全部本息：${c?.annualDebt==null?'待確認':n(c.annualDebt)+' 萬元'}`,`試算時間：${plan.at}`,'簡化資金規劃，缺口不等於可核貸額度。新增融資本息須納入預估，再與銀行確認。'].join('\n');
}
