import {financingNeed} from './financing-need.js';
import {esc,SERVICES} from './opportunity.js?v=services1';
import {PURPOSE_TITLES} from './franchise-scenarios.js';
const fmt=n=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:1}):'待確認';
const status={green:'健康',yellow:'注意',red:'警示',na:'資料待補'};
export function planningCard(context={}){
 const {plan,health,desiredMonth='',documents=[]}=context;
 if(!plan?.out)return '<div class="planning-empty"><img src="esun-meow.png" alt="玉山喵喵"><div><h4>先把數字算清楚，再聊下一步。</h4><p>完成試算後，這裡會整理用途、資金需求、用款時間與財務提醒。也可以直接到下方留下諮詢需求。</p></div></div>';
 const need=financingNeed(plan);
 const ready=documents.filter(x=>x.ready).length;
 return '<article class="planning-card"><div class="planning-card-heading"><div><span>YOUR FINANCING BRIEF</span><h4>'+esc(PURPOSE_TITLES[plan.model])+'</h4><p>一份規劃，接續同一筆服務需求。</p></div><img src="esun-meow.png" alt="玉山喵喵"></div><div class="planning-kpis"><div><small>'+'需規劃的融資金額'+'</small><strong>'+fmt(need.amount)+'<em>'+'萬元'+'</em></strong></div><div><small>預計用款時間</small><strong>'+esc(desiredMonth||'待確認')+'</strong></div><div><small>文件準備</small><strong>'+ready+'<em> / '+documents.length+' 項</em></strong></div></div><div class="planning-metrics">'+(plan.out.metrics||[]).slice(0,4).map(x=>'<div><small>'+esc(x.label)+'</small><b>'+esc(x.value)+'</b></div>').join('')+'</div><div class="planning-health"><b>財務提醒</b>'+(health?.out?health.out.items.map(x=>'<span class="health-chip '+esc(x.status)+'">'+esc(x.label)+'：'+esc(x.value)+'</span>').join(''):'<span>尚未完成健檢，可在諮詢時補充。</span>')+'</div><p class="planning-note">資金缺口是規劃需求，不等於可核貸額度。試算與健檢結果會隨本次諮詢一併保留。</p></article>';
}
export function receivedConsultationCard(lead){
 const need=financingNeed(lead.plan),c=lead.consultation;if(!c)return '';
 return '<section class="received-consultation"><div class="received-heading"><span>客戶諮詢資料</span><strong>'+esc(c.company||lead.label)+'</strong><code>'+esc(lead.id)+'</code></div><div class="received-grid">'+[
 ['經營型態',c.businessType],['希望討論的服務',(lead.services||[]).map(key=>SERVICES[key]).filter(Boolean).join('、')||'未填寫'],['品牌／店數',[c.brand,c.storeCount!==null?c.storeCount+' 間店':''].filter(Boolean).join(' · ')||'未提供'],['聯絡稱呼',c.contact||'未提供'],['示範電話',c.phone||'未提供'],['方便聯繫時段',c.preferredTime],['預計用款',c.desiredMonth||'待確認'],['營業地址',c.address||lead.city+' '+lead.district],['需求金額',need.amount!==null?fmt(need.amount)+' 萬元':'待確認']
 ].map(([label,value])=>'<div><small>'+label+'</small><b>'+esc(value)+'</b></div>').join('')+'</div><div class="received-note"><b>預約諮詢內容</b><p>'+esc(c.note||'未補充')+'</p></div>'+(c.health?'<p class="local-note">財務健檢：'+esc(status[c.health.overall]||'待確認')+' · '+c.health.items.map(x=>esc(x.label)+' '+esc(x.value)).join('／')+'</p>':'')+healthInputMarkup(c)+(c.summary?'<details><summary>本次保存的完整規劃摘要</summary><pre>'+esc(c.summary)+'</pre></details>':'')+'</section>';
}


const healthLabels={cash:'現金與銀行存款',receipts:'一年內應收貨款',stock:'存貨成本',shortDebt:'一年內應付款項',totalDebt:'負債總額',assets:'資產總額',sales:'全年營收',profit:'營業利益',annualAvailable:'未來一年可還款現金',annualDebt:'未來一年本息'};
function healthInputMarkup(c){
 if(!c.healthInputs)return '';
 return '<details class="received-health-inputs" open><summary>客戶填寫的財務健檢數字（萬元）</summary><div class="received-grid">'+Object.entries(healthLabels).map(([key,label])=>'<div><small>'+label+'</small><b>'+esc(Number.isFinite(c.healthInputs[key])?c.healthInputs[key].toLocaleString('zh-TW',{maximumFractionDigits:8}):'未填寫')+'</b></div>').join('')+'</div><p class="tiny">以客戶送出時已更新的資料保存；未填欄位不補入示範值。'+esc(c.healthAt||'')+'</p></details>';
}

