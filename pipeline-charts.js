import {financingNeed} from './financing-need.js?v=roundcharts20261101';
import {estimateRelationship} from './relationship-value.js?v=roundcharts20261101';
import {MODELS,SERVICES,esc} from './opportunity.js?v=roundcharts20261101';
const n=x=>Number.isFinite(x)?Math.round(x).toLocaleString('zh-TW'):'待補';
const colors=['#008577','#58a893','#e6b95c','#5b8398','#9cabb1','#97c8c0','#8d9b75'];
export function pipelineSummary(leads){
 const statuses=new Map(),services=new Map(),funding=[],contribution=new Map();let complete=0,unknownFunding=0;
 for(const l of leads){statuses.set(l.status,(statuses.get(l.status)||0)+1);for(const key of new Set(l.services||[]))services.set(key,(services.get(key)||0)+1);
  const need=financingNeed(l.plan).amount;if(Number.isFinite(need))funding.push({id:l.id,label:l.label,amount:need});else unknownFunding++;
  const r=estimateRelationship(l);if(!r.complete)continue;complete++;
  for(const row of r.rows.filter(x=>x.active&&Number.isFinite(x.value))){const prior=contribution.get(row.key)||{key:row.key,label:row.label,low:0,high:0};prior.low+=row.value;prior.high+=Number.isFinite(row.valueHigh)?row.valueHigh:row.value;contribution.set(row.key,prior);}
 }
 return {count:leads.length,statuses:[...statuses].map(([label,value])=>({label,value})),services:[...services].map(([key,value])=>({key,label:SERVICES[key]||key,value})),funding:funding.sort((a,b)=>b.amount-a.amount),unknownFunding,complete,contribution:[...contribution.values()]};
}
const empty=text=>`<p class="chart-empty">${text}</p>`;
function bars(rows,{unit='',value='value',click=false}={}){
 const max=Math.max(1,...rows.map(r=>r[value]));return `<div class="chart-bars">${rows.map((r,i)=>`<${click?'button type="button"':'div'} class="chart-bar-row" ${click?`data-chart-lead="${esc(r.id)}"`:''}><span class="chart-label" title="${esc(r.label)}">${esc(r.label)}</span><span class="chart-track"><span style="width:${Math.max(0,r[value]/max*100)}%;background:${colors[i%colors.length]}"></span></span><strong>${n(r[value])}${unit}</strong></${click?'button':'div'}>`).join('')}</div>`;
}
export function renderPipelineCharts(root,leads,onOpen){
 const d=pipelineSummary(leads),total=d.count||1;
 root.innerHTML=`<div class="chart-section-heading"><div><p class="eyebrow">CASE OVERVIEW</p><h3>案件圖表總覽</h3></div><span>目前篩選 ${d.count} 筆 · 金額顯示整數，計算保留精度</span></div><div class="pipeline-grid">
 <article class="chart-card"><h4>案件處理進度</h4>${d.count?`<div class="status-stack" role="img" aria-label="${esc(d.statuses.map(r=>r.label+' '+r.value+'筆').join('，'))}">${d.statuses.map((r,i)=>`<span style="width:${r.value/total*100}%;background:${colors[i%colors.length]}">${r.value}</span>`).join('')}</div><ul class="chart-legend">${d.statuses.map((r,i)=>`<li><i style="background:${colors[i%colors.length]}"></i>${esc(r.label)} <b>${r.value} 筆</b></li>`).join('')}</ul>`:empty('目前沒有符合篩選的案件。')}</article>
 <article class="chart-card"><h4>融資需求比較 <small>萬元</small></h4>${d.funding.length?bars(d.funding.slice(0,8),{value:'amount',click:true}):empty('尚未有可確認金額的案件。')}<p class="chart-note">${d.funding.length>8?'顯示需求最高的8筆；':''}點選案件可查看明細。${d.unknownFunding} 筆金額待補；需求不等於核貸額度。</p></article>
 <article class="chart-card"><h4>客戶勾選的服務需求 <small>案件數</small></h4>${d.services.length?bars(d.services):empty('尚無服務需求紀錄。')}<p class="chart-note">同一案件可複選服務，各項筆數不可加總當成案件總數。</p></article>
 <article class="chart-card"><h4>首年往來貢獻組成 <small>元／年</small></h4>${d.contribution.length?bars(d.contribution.map(r=>({...r,value:r.low*10000}))):empty('尚無假設完整、可列計的案件。')}<p class="chart-note">僅 ${d.complete} 筆完整案例；顯示利率區間下限情境的未扣成本收入，非銀行淨利。</p></article></div>`;
 root.querySelectorAll('[data-chart-lead]').forEach(b=>b.addEventListener('click',()=>onOpen(b.dataset.chartLead)));
}
function lineChart(series,labels){
 const values=series.flatMap(s=>s.values),lo=Math.min(0,...values),hi=Math.max(1,...values),range=hi-lo;
 const x=i=>42+i*620/11,y=v=>190-(v-lo)/range*156;
 const ticks=[lo,lo+range/2,hi];
 return `<svg class="case-line-chart" viewBox="0 0 700 230" role="img" aria-label="${esc(series.map(s=>s.label).join('與'))}，單位萬元">${ticks.map(t=>`<line x1="42" x2="662" y1="${y(t)}" y2="${y(t)}" stroke="#dce8e3"/><text x="36" y="${y(t)+4}" text-anchor="end">${n(t)}</text>`).join('')}${labels.map((label,i)=>`<text x="${x(i)}" y="215" text-anchor="middle">${label}</text>`).join('')}${series.map((s,k)=>`<polyline fill="none" stroke="${colors[k]}" stroke-width="3" points="${s.values.map((v,i)=>x(i)+','+y(v)).join(' ')}"/>${s.values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${colors[k]}"><title>${labels[i]} · ${esc(s.label)} ${n(v)}萬元</title></circle>`).join('')}`).join('')}</svg><ul class="chart-legend">${series.map((s,k)=>`<li><i style="background:${colors[k]}"></i>${esc(s.label)}</li>`).join('')}</ul>`;
}
export function caseFinanceCharts(plan){
 const p=plan?.out?.extra?.operating;if(!p)return '';
 const labels=p.monthly.map(m=>m.month+'月'),q=p.forecast;
 const parts=[{label:'營業成本',value:p.annual.cost},{label:'薪資含附加',value:p.annual.salary},{label:'其他費用含折舊',value:p.annual.otherExpense},{label:'利息',value:p.annual.interest},{label:'所得稅',value:p.annual.tax}];
 return `<section class="detail-section"><h3>營運與財務圖表</h3><div class="pipeline-grid"><article class="chart-card"><h4>逐月營收與稅後淨利 <small>萬元</small></h4>${lineChart([{label:'營收',values:p.monthly.map(m=>m.revenue)},{label:'稅後淨利',values:p.monthly.map(m=>m.net)}],labels)}</article><article class="chart-card"><h4>逐月可用現金 <small>原PDF收付基準／萬元</small></h4>${lineChart([{label:'月底可用現金',values:p.monthly.map(m=>m.cashClose)}],labels)}<p class="chart-note">12月已扣年終獎金；年底另加週轉假設後可用現金 ${n(q?.availableCash)} 萬元。</p></article><article class="chart-card"><h4>首年費用結構 <small>萬元</small></h4>${bars(parts)}</article><article class="chart-card"><h4>年底資產與資金來源 <small>萬元</small></h4>${q?bars([{label:'現金與銀行存款',value:q.bankCash},{label:'應收貨款',value:q.receipts},{label:'存貨',value:q.stock},{label:'設備淨額',value:q.equipment},{label:'全部負債',value:q.totalDebt},{label:'股東權益',value:q.equity}]):empty('本案尚無年底推估。')}<p class="chart-note">資產 ${n(q?.assets)}＝負債 ${n(q?.totalDebt)}＋權益 ${n(q?.equity)}。圖表金額四捨五入，可能有尾差。</p></article></div></section>`;
}
