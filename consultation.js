const statusNames={green:'健康',yellow:'注意',red:'警示',na:'不適用'};
export const CONTACT_URL='https://www.esunbank.com/zh-tw/about/services/customer/message-board';
export function buildConsultationSummary({plan,health=null,documents=[],timing=null,desiredMonth='',title=''}){
  if(!plan?.out)throw new Error('請先更新試算結果。');
  const o=plan.out;
  const n=value=>Number.isFinite(value)?value.toLocaleString('zh-TW',{maximumFractionDigits:2}):'不適用';
  const rows=['企業資金規劃｜諮詢摘要（測試網）',`資金用途：${title}`,`預計用款：${desiredMonth||'待與專人確認'}`,`試算時間：${plan.at}`,`${o.label}：${n(o.value)} ${o.unit}`,...o.metrics.map(x=>`${x.label}：${x.value}`)];
  if(plan.model==='overseas')rows.push(`預算幣別：${{twd:'台幣',usd:'美元',dual:'台幣與美元'}[plan.mode]||'待確認'}`);
  rows.push('', '財務健檢');
  if(health?.out){rows.push(`整體：${statusNames[health.out.overall]||'不適用'}（${health.at}）`,...health.out.items.map(x=>`${x.label}：${statusNames[x.status]}／${x.value}`));}
  else rows.push('尚未完成；可另提供財務資料與專人討論。');
  if(timing)rows.push('', '選填月度資金規劃',timing,'月度結果為獨立收支規劃，不與上方年度需求自動加總。');
  rows.push('', '文件準備狀態',...documents.map(x=>`${x.ready?'☑':'☐'} ${x.title}`), '填寫、用印及適用表單，請先與銀行確認。', '', '與專人確認：實際用款時點、資金來源、還款安排及適用文件。', '資金缺口不等於可核貸額度；健檢與商機標示僅供規劃參考。', '本摘要由您自行複製或下載，不會自動傳送給銀行。');
  return rows.join('\n');
}
export function consultationPrintHTML(text){
  const safe=String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>企業資金規劃諮詢摘要</title><style>@page{size:A4;margin:13mm}body{font:11pt/1.45 "Microsoft JhengHei",sans-serif;color:#173d50;margin:0;border-top:7px solid #008577;padding-top:14px}h1{font-size:18pt;color:#00776d;margin:0 0 10px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;margin:0}button{padding:10px 18px;background:#008577;color:white;border:0;margin:15px 0}@media print{button{display:none}}</style><h1>企業資金規劃諮詢摘要</h1><pre>${safe}</pre><button onclick="window.print()">列印／存成 PDF</button></html>`;
}
