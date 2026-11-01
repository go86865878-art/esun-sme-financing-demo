import {DEMO_CASES} from './case-data.js?v=presentation1';
export const BUSINESS_TYPES=['加盟飲料','加盟餐飲','自主品牌餐飲','一般中小企業','中央廚房／食品製造','海外拓店'];
export const PURPOSE_TITLES={working:'營運週轉金',expansion:'展店與開張',overseas:'海外投資／拓店',equipment:'中央廚房與設備'};
export const PLAN_EXAMPLES=Object.fromEntries(Object.keys(PURPOSE_TITLES).map(model=>[model,DEMO_CASES.filter(c=>c.model===model).map(c=>({name:c.title,caseId:c.id,values:c.input}))]));
export const HEALTH_EXAMPLES=DEMO_CASES.map(c=>({id:c.id,name:c.title,note:c.input.operating?'開業資產負債＋首年預估損益／本息。':'僅示範本案還款安排，其餘公司財務待補。',values:c.health}));
const f=n=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:1}):'待補資料';
export function profitData(v){
 if(!Number.isFinite(v?.sales)||!Number.isFinite(v?.profit)||v.sales<=0)return null;
 return {sales:v.sales,profit:v.profit,expenses:v.sales-v.profit,margin:v.profit/v.sales*100};
}
export function profitabilityMarkup(v){
 const d=profitData(v);if(!d)return '<div class="profit-empty">補上同年度營收與營業利益，更新後即可看圖；營收為 0 時不計算利益率。</div>';
 const rows=[['營業收入',d.sales,'#118477'],['成本與營業費用合計',d.expenses,'#92bfb3'],['營業利益／虧損',d.profit,d.profit<0?'#bc4b54':'#d69f42']];
 const lo=Math.min(0,...rows.map(x=>x[1])),hi=Math.max(1,...rows.map(x=>x[1])),range=hi-lo,zero=175+(0-lo)/range*330;
 const chart=rows.map(([label,value,color],i)=>{const end=175+(value-lo)/range*330;return '<text x="0" y="'+(35+i*59)+'" fill="#234638" font-size="15">'+label+'</text><rect x="'+Math.min(zero,end)+'" y="'+(17+i*59)+'" width="'+Math.max(2,Math.abs(end-zero))+'" height="27" rx="4" fill="'+color+'"/><text x="610" y="'+(36+i*59)+'" text-anchor="end" fill="#234638" font-size="15">'+f(value)+'</text>'}).join('');
 return '<div class="profit-headline"><span>每 100 元營收的營業利益</span><strong class="'+(d.margin<0?'negative':'')+'">'+f(d.margin)+'<small> 元</small></strong></div><svg viewBox="0 0 625 182" role="img" aria-label="營業收入 '+f(d.sales)+' 萬元，成本與營業費用 '+f(d.expenses)+' 萬元，營業利益 '+f(d.profit)+' 萬元"><line x1="'+zero+'" y1="6" x2="'+zero+'" y2="177" stroke="#658b7e" stroke-dasharray="3 3"/>'+chart+'</svg><div class="profit-values">'+rows.map(([label,value])=>'<span>'+label+'<b>'+f(value)+' 萬元</b></span>').join('')+'</div><p class="tiny">單位：萬元。成本與營業費用合計＝營收－營業利益；不含利息與稅。'+(d.expenses<0?'目前推算費用為負值，請核對輸入。':'')+'</p>';
}

