export const BUSINESS_TYPES=['加盟飲料','加盟餐飲','自主品牌餐飲','一般中小企業','中央廚房／食品製造','海外拓店'];
export const PURPOSE_TITLES={working:'營運週轉金',expansion:'展店與開張',overseas:'海外投資／拓店',equipment:'中央廚房與設備'};
export const PLAN_EXAMPLES={
 working:[
  {name:'加盟飲料｜備料與平台帳期',values:{sales:960,nextSales:1152,cost:38,dso:7,dio:12,dpo:7,own:20,existing:0}},
  {name:'加盟餐飲｜旺季備貨',values:{sales:1800,nextSales:2160,cost:42,dso:10,dio:18,dpo:7,own:30,existing:20}},
  {name:'中小企業｜批發週轉',values:{sales:12000,nextSales:13800,cost:75,dso:60,dio:75,dpo:45,own:500,existing:2000}}
 ],
 expansion:[
  {name:'加盟飲料｜第一間店',values:{setup:420,reserve:90,equity:180,revenue:100,margin:60,fixed:48,ramp:6,interest:3,tenor:5,annualBudget:100}},
  {name:'加盟餐飲｜開第二間店',values:{setup:900,reserve:180,equity:350,revenue:240,margin:58,fixed:115,ramp:8,interest:3,tenor:7,annualBudget:160}},
  {name:'自主品牌｜新店開張',values:{setup:600,reserve:120,equity:250,revenue:150,margin:62,fixed:78,ramp:8,interest:3,tenor:5,annualBudget:120}}
 ],
 equipment:[
  {name:'中央廚房｜擴充製程',values:{invest:5000,equity:1500,interest:3,tenor:7,grace:1,annualBudget:950}},
  {name:'加盟餐飲｜汰換設備',values:{invest:600,equity:200,interest:3,tenor:5,grace:0,annualBudget:120}}
 ],
 overseas:[
  {name:'海外拓店｜美元支出',values:{investTwd:300,equityTwd:100,investUsd:80,equityUsd:30,fx:32,swing:10,buffer:10,months:12}},
  {name:'海外餐飲｜多店布局',values:{investTwd:1000,equityTwd:500,investUsd:200,equityUsd:60,fx:32,swing:15,buffer:15,months:24}}
 ]
};
export const HEALTH_EXAMPLES=[
 {id:'drink',name:'加盟飲料｜營運穩定',note:'營業利益率 12%，還款現金尚有緩衝。',values:{cash:90,receipts:20,stock:25,shortDebt:70,totalDebt:180,assets:450,sales:1200,profit:144,annualAvailable:150,annualDebt:100}},
 {id:'food',name:'加盟餐飲｜擴店初期',note:'營業利益率 3%，營業額成長但現金緩衝偏薄。',values:{cash:70,receipts:60,stock:50,shortDebt:190,totalDebt:500,assets:850,sales:2400,profit:72,annualAvailable:120,annualDebt:140}},
 {id:'trade',name:'中小企業｜薄利多銷',note:'營業利益率 2%，需留意帳期與資金占用。',values:{cash:200,receipts:800,stock:500,shortDebt:1200,totalDebt:1800,assets:3000,sales:6000,profit:120,annualAvailable:200,annualDebt:180}},
 {id:'kitchen',name:'中央廚房｜設備投產',note:'營業利益率 8%，投資後還款支出提高。',values:{cash:400,receipts:600,stock:300,shortDebt:900,totalDebt:3500,assets:6000,sales:4800,profit:384,annualAvailable:500,annualDebt:550}},
 {id:'stress',name:'新店壓力｜營運虧損',note:'營業利益率 -8%，觀察虧損與還款缺口。',values:{cash:25,receipts:15,stock:20,shortDebt:100,totalDebt:250,assets:300,sales:900,profit:-72,annualAvailable:-30,annualDebt:80}}
];
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

