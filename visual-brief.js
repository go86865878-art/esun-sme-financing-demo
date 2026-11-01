import {financingNeed} from './financing-need.js?v=visualbrief20261101';
import {operatingForDisplay} from './operating-view.js?v=visualbrief20261101';
import {MODELS} from './opportunity.js?v=visualbrief20261101';
export const MASCOT_URL=new URL('./business-mascots.png',import.meta.url).href;
export const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?Math.round(n).toLocaleString('zh-TW'):'待補';
const short=(s,n=32)=>{const chars=Array.from(String(s??''));return chars.length>n?chars.slice(0,n-1).join('')+'…':chars.join('');};
const colors={green:'#008577',ink:'#214f49',muted:'#637c75',line:'#d9e6df',pale:'#edf6f1',gold:'#c89a42',red:'#b64853',na:'#82948c'};
const state={green:'健康',yellow:'注意',red:'警示',na:'資料不足／不適用'};
export function briefFromLead(lead){const c=lead.consultation||{};return {plan:lead.plan,health:c.health?{inputs:c.healthInputs||{},out:c.health,at:c.healthAt}:null,company:c.company||lead.label,address:c.address||[lead.city,lead.district].filter(Boolean).join(' '),month:c.desiredMonth,documents:c.documents||[],contact:c.contact,phone:c.phone,sourceNote:'依案件送出時的試算與健檢紀錄；營運圖表以原輸入重算供檢視。'};}
function text(x,y,s,size=20,fill=colors.ink,bold=false,anchor='start'){return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${bold?700:400}" text-anchor="${anchor}">${safe(s)}</text>`;}
const rect=(x,y,w,h,fill=colors.pale,r=12)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
function lines(x,y,s,width=48,size=18,fill=colors.muted,leading=27){const chars=Array.from(String(s??'')),out=[];for(let i=0;i<chars.length;i+=width)out.push(text(x,y+(i/width)*leading,chars.slice(i,i+width).join(''),size,fill));return out.join('');}
function header(d,page){return rect(0,0,930,12,colors.green,0)+text(50,53,'企業資金規劃｜'+(page===1?'圖表摘要':'財務健檢與下一步'),23,colors.green,true)+text(50,100,short(d.company||'企業資金規劃',21),31,colors.ink,true)+text(50,137,(MODELS[d.plan?.model]||'資金需求')+' · 用款 '+(d.month||'待確認'),19,colors.muted)+text(50,163,'資料時間：'+short(d.plan?.at||d.health?.at||'未提供',46),15,colors.muted)+text(880,1280,page+' / 2',16,colors.muted,false,'end')+text(50,1280,'情境規劃參考 · 整數顯示，計算保留精度 · 非核貸承諾',15,colors.muted);}
function heading(y,title,subtitle=''){return text(50,y,title,25,colors.ink,true)+(subtitle?text(50,y+30,subtitle,16,colors.muted):'');}
function bars(rows,y,{width=830,rowHeight=48}={}){const maximum=Math.max(1,...rows.filter(r=>Number.isFinite(r.value)).map(r=>Math.abs(r.value)));return rows.map((r,i)=>{const yy=y+i*rowHeight;return text(50,yy+20,short(r.label,17),18)+rect(355,yy+5,width-420,15,'#e8f0eb',7)+(Number.isFinite(r.value)?rect(355,yy+5,(width-420)*Math.abs(r.value)/maximum,15,r.value<0?colors.red:i%2?colors.gold:colors.green,7):'')+text(880,yy+21,num(r.value),21,colors.ink,true,'end');}).join('');}
function lineGraph(series,labels,y,height=215){const values=series.flatMap(s=>s.values).filter(Number.isFinite),lo=Math.min(0,...values),hi=Math.max(1,...values),range=hi-lo,x=i=>95+i*750/Math.max(1,labels.length-1),py=v=>y+height-(v-lo)/range*(height-30);let svg='';for(const value of [lo,lo+range/2,hi])svg+=`<line x1="95" x2="845" y1="${py(value)}" y2="${py(value)}" stroke="${colors.line}"/>`+text(82,py(value)+6,num(value),16,colors.muted,false,'end');series.forEach((s,k)=>{const color=k?colors.gold:colors.green;svg+=`<polyline fill="none" stroke="${color}" stroke-width="4" points="${s.values.map((v,i)=>x(i)+','+py(v)).join(' ')}"/>`;s.values.forEach((v,i)=>{svg+=`<circle cx="${x(i)}" cy="${py(v)}" r="4" fill="${color}"/>`;});svg+=rect(55+k*270,y+height+58,16,16,color,4)+text(82+k*270,y+height+72,s.label,18,colors.muted);});labels.forEach((l,i)=>{if(labels.length<7||[0,2,5,8,11].includes(i))svg+=text(x(i),y+height+32,l,16,colors.muted,false,'middle');});return svg;}
export function visualBriefSvg(data,page=1){
 if(!data.plan?.out)throw Error('請先完成試算，才能產生圖表摘要。');
 const p=operatingForDisplay(data.plan),h=data.health?.inputs||{},o=data.plan.out,need=financingNeed(data.plan).amount,items=data.health?.out?.items||[];
 let s=header(data,page);
 if(page===1){
  const payment=p?.payment??o.extra?.monthlyPayment,third=Number.isFinite(payment)?['每月還款本息',payment]:['年度還款本息',h.annualDebt??o.extra?.annualDebt??o.extra?.peakAnnual];
  const kpis=[['融資規劃需求',need],['首年／年度營收',p?.annual?.revenue??h.sales],third];
  kpis.forEach(([label,value],i)=>{const x=50+i*283;s+=rect(x,182,264,108)+text(x+18,214,label,18,colors.muted)+text(x+18,265,num(value),37,colors.green,true)+text(x+242,264,'萬元',16,colors.muted,false,'end');});
  s+=heading(345,'資金規劃重點','單位：萬元；自有資金以減項呈現。');
  const funding=(o.breakdown||[]).slice(0,4).map(r=>({label:r.label,value:r.value}));
  s+=bars(funding.length?funding:[{label:'融資需求',value:need}],393,{rowHeight:43});
  if(p){s+=heading(620,'營收與稅後淨利','首年逐月預估／萬元');s+=lineGraph([{label:'營收',values:p.monthly.map(m=>m.revenue)},{label:'稅後淨利',values:p.monthly.map(m=>m.net)}],p.monthly.map(m=>m.month+'月'),655,180);s+=heading(960,'月底可用現金','原收付基準；12月已扣年終獎金／萬元');s+=lineGraph([{label:'月底可用現金',values:p.monthly.map(m=>m.cashClose)}],p.monthly.map(m=>m.month+'月'),992,155);s+=text(50,1250,'新增收款及備料假設另占用週轉金；未將應收、存貨重複加進現金。',16,colors.muted);}
  else{s+=heading(650,'還款與財務安排','所有金額均為規劃假設／萬元');s+=bars((o.schedule||[]).slice(0,8).map(r=>({label:'第'+r.year+'年本息',value:r.total})),705,{rowHeight:48});s+=lines(50,1180,'請與服務團隊確認還款時點、季節性週轉、利率及適用年期。',42,19);}
 }else{
  s+=heading(195,'五項健檢，一眼看重點',data.health?.out?'依本次已更新／送出時的健檢紀錄':'尚未完成健檢，不將未知數字補零。');
  if(items.length)items.forEach((item,i)=>{const y=247+i*62,color=item.status==='red'?colors.red:item.status==='yellow'?colors.gold:item.status==='green'?colors.green:colors.na;s+=rect(50,y,830,52)+rect(50,y,7,52,color,0)+text(70,y+33,short(item.label,23),19)+text(650,y+33,item.value,22,color,true,'end')+text(860,y+33,state[item.status]||'待確認',17,color,true,'end');});
  else s+=rect(50,250,830,100)+text(75,305,'請補充財務資料後再判讀。',23,colors.muted);
  s+=heading(650,'短期資金與應付款','已知數字顯示為整數萬元；空值維持「待補」。');
  s+=bars([{label:'現金與銀行存款',value:h.cash},{label:'一年內可收貨款',value:h.receipts},{label:'存貨成本',value:h.stock},{label:'一年內應付款',value:h.shortDebt}],700,{rowHeight:48});
  s+=heading(958,'文件準備進度','先備齊資料，再與服務團隊討論。');
  const docs=data.documents||[],ready=docs.filter(d=>d.ready).length;s+=rect(50,1006,670,20,'#e4eee8',10)+(docs.length?rect(50,1006,670*ready/docs.length,20,colors.green,10):'')+text(880,1028,docs.length?ready+' / '+docs.length+' 項':'尚未提供',24,colors.green,true,'end');
  docs.slice(0,10).forEach((d,i)=>{const col=i%2,row=Math.floor(i/2);s+=text(50+col*425,1074+row*29,(d.ready?'☑ ':'□ ')+short(d.title,22),16,d.ready?colors.green:colors.muted);});
  if(!docs.length)s+=lines(50,1084,'請確認：實際用款時點、資金來源、還款安排，以及本次申貸所需文件。',43,19);
  s+=text(50,1240,'勾選不代表已送件；資料不足不視為健康。完整文字摘要可於網頁展開。',16,colors.muted);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="930" height="1315" viewBox="0 0 930 1315"><rect width="930" height="1315" fill="white"/><g font-family="Microsoft JhengHei,Noto Sans TC,sans-serif">${s}</g></svg>`;
}
export function visualPrintHTML(data,sourceText=''){
 const mascot=safe(MASCOT_URL);
 return `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>企業資金規劃｜圖表摘要</title><style>@page{size:A4;margin:8mm}*{box-sizing:border-box}body{margin:0;background:#eef3ef;color:#214f49;font-family:"Microsoft JhengHei",sans-serif}.toolbar{max-width:930px;margin:24px auto;display:flex;gap:16px;align-items:center}.toolbar button{border:0;border-radius:9px;padding:14px 24px;background:#008577;color:#fff;font:inherit;font-weight:700}.toolbar span{font-size:14px;color:#607c70}.sheet{position:relative;width:930px;max-width:100%;margin:20px auto;background:#fff;box-shadow:0 4px 22px #1c453c18}.sheet>svg{display:block;width:100%;height:auto}.mascot{position:absolute;top:24px;right:48px;width:120px;height:118px;object-fit:contain}.source{max-width:930px;margin:24px auto;padding:18px}.source pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.8 "Microsoft JhengHei",sans-serif}@media print{body{background:white}.toolbar{display:none}.sheet{width:190mm;max-width:none;margin:0;box-shadow:none;break-after:page;break-inside:avoid}.sheet:last-of-type{break-after:auto}.mascot{top:5mm;right:10mm;width:25mm;height:24mm}.source:not([open]){display:none}.source[open]{break-before:page}}</style></head><body><div class="toolbar"><button onclick="window.print()">列印圖表摘要／存成 PDF</button><span>建議A4直式、比例100%；預設兩頁圖表。</span></div>${[1,2].map(page=>`<section class="sheet">${visualBriefSvg(data,page)}<img class="mascot" src="${mascot}" alt="綠領帶熊本熊與綠西裝貓咪"></section>`).join('')}<details class="source"><summary>完整文字摘要與原始依據（選讀）</summary><pre>${safe(sourceText)}</pre></details></body></html>`;
}
