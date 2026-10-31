import {estimateRelationship} from './relationship-value.js?v=value2';
import {valueMarkup,bindValue} from './relationship-value-ui.js?v=value2';
import {pricingMarkup,bindPricing} from './relationship-pricing-ui.js?v=value2';
import {mountDispatchMail} from './dispatch-ui.js?v=value2';
import {dispatchTarget,dispatchActionLabel} from './dispatch-mail.js?v=value2';
import {receivedConsultationCard} from './planning-cards.js?v=value2';
import {mountBranchMap,branchCatalogue,routingThreshold,routeDescription} from './branch-map.js?v=cases1';
import {suggestAssignment,ROUTING_KEY,BRANCH_COORDS_KEY} from './branch-routing.js?v=cases1';
import {LEADS_KEY,ROUTES_KEY,SETTINGS_KEY,SERVICES,MODELS,AREAS,DEFAULT_ROUTES,DEFAULT_SETTINGS,FOLLOWUP_STATUSES,esc,loadDemoLeads,saveDemoLeads,loadRoutes,loadSettings,writeLocal,routeFor,calculatePotential,deriveOpportunitySignals,deriveOpportunityDetails,getOpportunityFollowup,updateOpportunityFollowup,createLead,fillCities,fillDistricts,serviceChecks} from './opportunity.js?v=value2';

const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(n);
const statuses=['未分派','已分派（示範）','已聯繫（示範）','暫不跟進（示範）'];
const inputNames={sales:['今年預估營收','萬元'],nextSales:['明年預估營收','萬元'],cost:['進貨／製造成本率','%'],dso:['出貨至收款','天'],dio:['進貨至售出','天'],dpo:['進貨至付款','天'],own:['自有週轉資金','萬元'],existing:['可用既有融資','萬元'],invest:['總投資預算','萬元'],equity:['自有資金','萬元'],interest:['假設年利率','%'],tenor:['還款年期','年'],grace:['寬限期','年'],annualBudget:['每年還款預算','萬元'],setup:['開店投入','萬元'],reserve:['營運預備金','萬元'],revenue:['成熟期每月營收','萬元'],margin:['貢獻毛利率','%'],fixed:['每月固定支出','萬元'],ramp:['穩定所需時間','月'],investTwd:['台幣支出預算','萬元'],equityTwd:['台幣自有資金','萬元'],investUsd:['美元支出預算','萬美元'],equityUsd:['美元自有資金','萬美元'],fx:['假設匯率','TWD/USD'],swing:['匯率變動情境','%'],buffer:['預備金率','%'],months:['投資計畫期間','月']};
let mapController=null;
const dispatchMail=mountDispatchMail();
function notificationFor(lead,suggestion=fullSuggestion(lead)){try{return dispatchTarget(lead,suggestion)}catch{return null}}
function openDispatchFor(id,branchId=''){const lead=leads.find(row=>row.id===id);if(!lead)return;try{dispatchMail.open(lead,fullSuggestion(lead),branchId);}catch(error){announce(error.message);}}

let leads=loadDemoLeads(),settings=loadSettings(),routes=loadRoutes(),activeId=null,messageTimer;
function announce(text){$('globalMessage').hidden=false;$('globalMessage').textContent=text;clearTimeout(messageTimer);messageTimer=setTimeout(()=>{$('globalMessage').hidden=true;},6500);}
function persist(){saveDemoLeads(leads);render();}
function stamp(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('zh-TW',{hour12:false}):String(value||'—');}
function optionStatus(value){return statuses.map(s=>`<option ${s===value?'selected':''}>${esc(s)}</option>`).join('');}
function estimateLabel(lead){const p=estimateRelationship(lead);return p.total===null?'<span class="muted">待補資料</span>':'<span class="amount">'+fmt(p.total)+' 萬</span><small>'+(p.complete?'首年潛在收入，未扣成本':'部分估算；未列入合計')+'</small>';}
function serviceTags(lead){return deriveOpportunityDetails(lead).map(signal=>{const followup=getOpportunityFollowup(lead,signal.key);return `<details class="opportunity-tag"><summary><span class="tag ${signal.derived?'overseas':''}">${esc(signal.label)}</span><span class="signal-state">${esc(followup.status)}</span></summary><div class="tag-explanation"><small>${esc(signal.origin)}</small><b>觸發原因</b><p>${esc(signal.trigger)}</p><b>待確認問題</b><ul>${signal.questions.map(question=>`<li>${esc(question)}</li>`).join('')}</ul><button class="link-button" data-open="${esc(lead.id)}">記錄這筆案例的線索跟進 →</button></div></details>`;}).join('');}
function render(){
  const completed=leads.map(l=>({lead:l,p:estimateRelationship(l)})).filter(x=>x.p.complete);
  $('statLeads').textContent=leads.length;$('statInterests').textContent=leads.reduce((n,l)=>n+l.services.length,0);$('statComplete').textContent=completed.length;
  $('statPotential').textContent=completed.length?fmt(completed.reduce((n,x)=>n+x.p.total,0))+'～'+fmt(completed.reduce((n,x)=>n+x.p.totalHigh,0))+' 萬':'—';
  $('statPotentialNote').textContent=`僅 ${completed.length} 筆假設完整案例；${leads.length-completed.length} 筆待補或不列計。單位：萬元`;
  const service=$('serviceFilter').value,status=$('statusFilter').value;
  const filtered=leads.filter(l=>(!service||(service==='overseas'?deriveOpportunitySignals(l).length>0:l.services.includes(service)))&&(!status||l.status===status));
  $('filterCount').textContent=`顯示 ${filtered.length} / ${leads.length} 筆`;
  $('emptyLeads').hidden=filtered.length>0;
  if(!filtered.length&&leads.length){$('emptyLeads').innerHTML='<h3>沒有符合條件的案例</h3><p>請調整服務或狀態篩選。</p>';}
  else if(!leads.length){$('emptyLeads').innerHTML='<span class="empty-icon" aria-hidden="true">▦</span><h3>等待第一份服務需求</h3><p>在客戶規劃頁填寫需求，勾選同意並按「建立諮詢需求」；<br>這裡會顯示客戶提供的資料與服務意願。</p><a href="index.html#simulator">前往客戶規劃頁 →</a>';}
  $('leadRows').innerHTML=filtered.map(l=>{const target=notificationFor(l);return `<tr><td><b>${esc(l.label)}</b><small>${esc(MODELS[l.plan?.model]||'未分類規劃')} · ${esc(l.source)}</small><small>${esc(stamp(l.at))}</small>${l.consultation?`<small>${esc(l.consultation.businessType)} · ${esc(l.consultation.preferredTime)}</small>`:''}</td><td>${esc(l.city)}<br>${esc(l.district)}</td><td>${serviceTags(l)}</td><td>${estimateLabel(l)}</td><td>${target?`<b>${esc(target.unit)}</b><small>${esc(target.role)} · ${target.confirmed?'已確認單位':'推薦單位'}</small>`:'待人工確認<small>請確認地區與金額設定</small>'}</td><td><span>${esc(l.status)}</span></td><td><button class="link-button" data-open="${esc(l.id)}">查看詳情 →</button><button type="button" class="dispatch-table-button" data-dispatch="${esc(l.id)}" ${target?'':'disabled'}>${esc(dispatchActionLabel(target))}</button></td></tr>`;}).join('');
  mapController?.refresh();
}
function sourceMarkup(lead){
  const p=lead.plan||{},o=p.out||{};return `<details class="source-details"><summary>查看原始試算摘要、輸入值與同意紀錄</summary><p><b>${esc(MODELS[p.model]||'規劃需求')}</b>：${esc(o.label)} ${Number.isFinite(o.value)?fmt(o.value):'—'} ${esc(o.unit||'')}</p><p class="local-note">試算時間：${esc(p.at||'—')}。海外預算依原幣別呈現，不直接推定新臺幣貸款餘額。</p><dl>${Object.entries(p.inputs||{}).map(([k,v])=>{const [label,unit]=inputNames[k]||[k,''];return `<div><dt>${esc(label)}</dt><dd>${esc(fmt(v))} ${esc(unit)}</dd></div>`;}).join('')}</dl><p class="local-note"><b>資料來源：</b>${esc(lead.source)}<br><b>示範同意版本：</b>${esc(lead.consent?.version||'假資料')}<br><b>示範同意時間：</b>${esc(stamp(lead.consent?.at))}<br><b>範圍：</b>${esc(lead.consent?.scope||'僅供假資料操作')}</p></details>`;
}
function followupMarkup(lead){const signals=deriveOpportunityDetails(lead);return `<section class="detail-section"><h3>商機線索與逐項跟進</h3><p>每個標籤都列出觸發依據與待確認問題。線索跟進紀錄與下方案件分派狀態分開保存，不會改變貢獻公式、核貸結果或發出通知。</p>${signals.length?`<form id="signalFollowupForm" class="signal-followup-form">${signals.map(signal=>{const saved=getOpportunityFollowup(lead,signal.key);return `<article class="signal-card" data-signal-key="${signal.key}"><div class="signal-heading"><h4>${esc(signal.label)}</h4><span class="tag ${signal.derived?'overseas':''}">${signal.derived?'依用途衍生，待確認':'已勾選服務，待確認細節'}</span></div><b>觸發原因</b><p>${esc(signal.trigger)}</p><b>待確認問題</b><ol>${signal.questions.map(question=>`<li>${esc(question)}</li>`).join('')}</ol>${signal.note?`<p class="signal-note">${esc(signal.note)}</p>`:''}<div class="signal-edit"><div><label for="signalStatus_${signal.key}">線索跟進狀態</label><select id="signalStatus_${signal.key}" data-signal-status>${FOLLOWUP_STATUSES.map(status=>`<option ${saved.status===status?'selected':''}>${esc(status)}</option>`).join('')}</select></div><div class="signal-note-field"><label for="signalNote_${signal.key}">示範跟進備註（最多 500 字）</label><textarea id="signalNote_${signal.key}" data-signal-note maxlength="500" rows="3" placeholder="例如：待補交易量與對帳流程；請勿輸入姓名、電話、統編或真實客戶資料。">${esc(saved.note)}</textarea></div></div><div class="signal-save-row"><button class="button outline" type="submit" data-signal-save="${signal.key}">儲存此線索</button><small data-signal-updated>${saved.at?'本機更新：'+esc(stamp(saved.at)):'尚無跟進紀錄'}</small></div><p class="signal-feedback" data-signal-feedback role="status" aria-live="polite"></p></article>`;}).join('')}</form>`:'<p class="muted">目前沒有可跟進的服務意願或用途線索。</p>'}<p class="local-note">跟進狀態與備註僅儲存在同一瀏覽器，不會自動寄出通知。</p></section>`;}
function bindSignalFollowups(lead){const form=$('signalFollowupForm');if(!form)return;form.addEventListener('submit',event=>{event.preventDefault();const key=event.submitter?.dataset.signalSave;if(!key)return;const card=[...form.querySelectorAll('[data-signal-key]')].find(element=>element.dataset.signalKey===key);if(!card)return;const feedback=card.querySelector('[data-signal-feedback]');feedback.classList.remove('error');try{const updated=updateOpportunityFollowup(lead,key,{status:card.querySelector('[data-signal-status]').value,note:card.querySelector('[data-signal-note]').value});saveDemoLeads(leads.map(item=>item.id===lead.id?updated:item));Object.assign(lead,updated);render();card.querySelector('[data-signal-updated]').textContent='本機更新：'+stamp(updated.followups[key].at);feedback.textContent='已儲存此線索的示範跟進狀態與備註；未通知任何人。';}catch(error){feedback.classList.add('error');feedback.textContent=error.message||'本機儲存失敗，請重試。';}});}
const financeFields=[
  {service:'deposit',key:'depositBalance',label:'預估月平均活存餘額',help:'使用可驗證的平均留存額，不把年營收直接當存款。'},
  {service:'loan',key:'loanBalance',label:'預估日平均貸款餘額',help:'依預計動用率與還款安排填寫，不直接使用試算缺口。'},
  {service:'payment',key:'monthlyVolume',label:'預估每月收款／收單交易金額',help:'僅計擬導入此服務的交易量；實際費率與成本須另確認。'},
  {service:'ebank',key:'annualEbankFee',label:'預估企業網銀年度淨手續費',help:'僅計可獨立辨識的收入，避免與收付通重複；免費可填 0。'}
];
function overseasResult(lead){return deriveOpportunitySignals(lead).map(signal=>`<aside class="overseas-signal"><div><span class="tag overseas">依用途衍生 · 待確認</span><h3>${esc(signal.label)}</h3></div><ul>${signal.items.map(item=>`<li><b>${esc(item.label)}</b>：${esc(item.detail)}</li>`).join('')}</ul><p><strong>${esc(signal.note)}</strong></p><p class="local-note">這些是下一次對談的線索，不能視為客戶已同意申辦，也不會自動代勾其他服務。若另有已確認的活存、放款或手續費假設，只計算那些已填項目。</p></aside>`).join('');}
function detailResult(lead){const p=calculatePotential(lead,settings),overseas=deriveOpportunitySignals(lead).length>0;return `<div class="contribution-result"><b>扣除輸入成本後的年度潛在貢獻參考</b><div class="number">${p.net===null?(overseas?'海外商機待確認金額與定價':'待補餘額或交易量假設'):fmt(p.net)+' 萬元'}</div>${p.net===null&&overseas?'<p>外匯收付、換匯與海外融資目前僅列線索，未填入收入或費率，尚未估算年度貢獻。</p>':`<p>收入小計 ${fmt(p.gross)} 萬 − 成本 ${fmt(p.costs)} 萬${p.complete?' · 已填服務的假設已補齊':p.missing.length?' · 尚缺：'+esc(p.missing.join('、')):' · 抵押需求本身不單獨計收益'}。</p>`}${p.rows.some(r=>r.active)?`<div class="table-wrap"><table><thead><tr><th>項目</th><th>示範公式</th><th>年度參考（萬元）</th></tr></thead><tbody>${p.rows.filter(r=>r.active).map(r=>`<tr><td>${esc(r.label)}</td><td>${esc(r.formula)}${r.rate?'（'+fmt(Number(settings[r.rate]))+'%）':''}</td><td class="amount">${r.value===null?'待補':fmt(r.value)}</td></tr>`).join('')}</tbody></table></div>`:''}<p class="local-note">這些是服務規劃假設，不是已發生收益。尚未完整反映 FTP、資本占用、預期信用損失、作業及服務成本；即使填入成本，也不取代銀行正式貢獻評估。</p></div>${overseasResult(lead)}`;}
function openLead(id){
  const lead=leads.find(l=>l.id===id);if(!lead)return;activeId=id;const suggested=suggestionFor(lead);
  $('dialogTitle').textContent=lead.label;
  $('detailBody').innerHTML=`<div class="detail-overview"><div><b>服務地區</b><p>${esc(lead.city)} ${esc(lead.district)}</p></div><div><b>來源用途</b><p>${esc(MODELS[lead.plan?.model]||'規劃需求')}</p></div><div><b>狀態</b><p>${esc(lead.status)}</p></div></div>${receivedConsultationCard(lead)}${routingDetail(lead)}${valueMarkup(lead)}${sourceMarkup(lead)}${pricingMarkup(lead)}${followupMarkup(lead)}<details class="detail-section finance-advanced"><summary>舊版手動估算（獨立參考）</summary><p>此區保留舊版資料，不加入上方自動貢獻或總覽合計。金額一律為<strong>新臺幣萬元</strong>。空白表示未知；填 0 表示已確認本次不列計。每筆假設應由服務人員另行驗證。</p><form id="financeForm"><div class="form-grid">${financeFields.filter(f=>lead.services.includes(f.service)).map(f=>`<label>${esc(f.label)}（萬元）<input type="number" min="0" max="100000000" step="0.01" data-finance="${f.key}" value="${lead.finance?.[f.key]??''}" placeholder="尚待確認"><small>${esc(f.help)}</small></label>`).join('')}</div><div class="cost-row">${[['operatingCost','預估年度作業／服務成本'],['creditCost','預估年度信用成本'],['capitalCost','預估年度資本成本']].map(([key,label])=>`<label>${label}（萬元）<input type="number" min="0" max="100000000" step="0.01" data-finance="${key}" value="${lead.finance?.[key]??0}" required></label>`).join('')}</div><p class="local-note">初值 0 只代表尚未加入成本，不能解讀成沒有成本。抵押品不額外重複計入收益。</p><button class="button" type="submit">儲存假設並更新參考值</button><p class="error" id="financeError" role="alert"></p></form><div id="contributionDetail">${detailResult(lead)}</div></details><details class="detail-section assignment-settings"><summary>案件狀態與承接單位調整</summary><p id="assignmentText">${lead.assignment?'已記錄示範分派：'+esc(lead.assignment.team):suggested?'建議承接：'+esc(suggested.team):'分派條件尚未完整，請先設定金額門檻、確認需求金額及服務單位。'}</p><div class="assignment"><label>處理狀態<select id="detailStatus">${optionStatus(lead.status)}</select></label><button class="button outline" id="assignLead" ${suggested?'':'disabled'}>確認承接單位（示範）</button><button class="button" id="saveStatus">儲存狀態</button></div><p class="local-note">狀態與承接單位僅記錄在本機；通知主管會先產生郵件草稿，由您在郵件程式確認寄出。承接人員由主管安排。</p></details><div class="delete-row"><button class="text-danger" id="deleteLead">刪除此筆本機假資料</button></div>`;
  bindSignalFollowups(lead);
  bindValue(lead,next=>{const updated={...lead,valueAssumptions:next};saveDemoLeads(leads.map(row=>row.id===lead.id?updated:row));lead.valueAssumptions=next;render();});
  bindPricing(lead,next=>{const updated={...lead,pricing:next};saveDemoLeads(leads.map(row=>row.id===lead.id?updated:row));lead.pricing=next;render();});
  $('prepareDispatchMail')?.addEventListener('click',()=>openDispatchFor(lead.id,$('assignmentBranch')?.value||''));
  $('viewLeadOnMap')?.addEventListener('click',()=>{$('leadDialog').close();mapController?.focusLead(lead.id)});
  $('financeForm').addEventListener('submit',e=>{e.preventDefault();const updated={...lead.finance};let bad=false;$('financeForm').querySelectorAll('[data-finance]').forEach(input=>{const raw=input.value.trim();const value=raw===''?null:Number(raw);if(value!==null&&(!Number.isFinite(value)||value<0||value>100000000))bad=true;updated[input.dataset.finance]=value;});if(bad){$('financeError').textContent='請填入 0 至 100,000,000 之間的金額。';return;}lead.finance=updated;persist();$('financeError').textContent='';$('contributionDetail').innerHTML=detailResult(lead);announce('已儲存本機假設；參考值已更新。');});
  $('assignLead').addEventListener('click',()=>{if(!suggested)return;const chosen=suggested.kind==='branch'?suggested.candidates.items.find(b=>b.id===$('assignmentBranch')?.value):null;lead.assignment={team:chosen?.name||suggested.team,rm:'',branchId:chosen?.id||suggested.branch?.id||null,kind:suggested.kind,threshold:routingThreshold(),amountTwd:suggested.need.amount,basis:suggested.candidates.basis,at:new Date().toISOString()};lead.status='已分派（示範）';persist();openLead(id);announce('已記錄示範分派，沒有實際通知任何人。');});
  $('saveStatus').addEventListener('click',()=>{const value=$('detailStatus').value;if(['已分派（示範）','已聯繫（示範）'].includes(value)&&!lead.assignment){announce('請先採用相符路由建議，才可記錄已分派或已聯繫狀態。');return;}lead.status=value;if(value==='未分派')lead.assignment=null;persist();openLead(id);announce('已儲存本機處理狀態。');});
  $('deleteLead').addEventListener('click',()=>{if(!confirm('刪除此筆本機示範資料？'))return;leads=leads.filter(l=>l.id!==id);persist();$('leadDialog').close();announce('已刪除此筆本機示範資料。');});
  history.replaceState(null,'','#lead='+encodeURIComponent(id));
  if(!$('leadDialog').open)$('leadDialog').showModal();
}
function renderRoutes(){
  $('routeRows').innerHTML=routes.map((r,i)=>`<tr><td><input value="${esc(r.city)}" data-route="city" aria-label="路由 ${i+1} 縣市" maxlength="8" required></td><td><input value="${esc(r.district)}" data-route="district" aria-label="路由 ${i+1} 行政區" maxlength="8" required></td><td><input value="${esc(r.team)}" data-route="team" aria-label="路由 ${i+1} 示範服務組" maxlength="30" required></td><td><input value="${esc(r.rm)}" data-route="rm" aria-label="路由 ${i+1} 示範人員" maxlength="30" required></td><td><button type="button" class="row-remove" data-delete-route="${i}" aria-label="刪除路由 ${i+1}">×</button></td></tr>`).join('');
}
function routesFromInputs(){return [...$('routeRows').querySelectorAll('tr')].map(tr=>Object.fromEntries([...tr.querySelectorAll('[data-route]')].map(i=>[i.dataset.route,i.value.trim()])));}
$('openManagement').addEventListener('click',()=>{$('managementSettings').open=true;});
if(['#managementSettings','#routes','#assumptions'].includes(location.hash))$('managementSettings').open=true;
$('routesForm').addEventListener('submit',e=>{e.preventDefault();const rows=routesFromInputs();const seen=new Set();for(const r of rows){if(!AREAS[r.city])return announce('路由縣市請使用下拉地區清單相同的名稱，例如「臺北市」。');if(r.district!=='*'&&!AREAS[r.city].split(' ').includes(r.district))return announce('行政區請填該縣市的行政區，或輸入 * 代表全區。');if(!r.team.includes('示範')||!r.rm.includes('示範'))return announce('服務組與人員名稱都需包含「示範」，請勿填真實員工資料。');const key=r.city+'|'+r.district;if(seen.has(key))return announce('有重複的縣市與行政區路由，請保留一筆。');seen.add(key);}routes=rows;writeLocal(ROUTES_KEY,routes);renderRoutes();render();announce('已儲存示範路由表。已確認的既有分派保持原紀錄。');});
$('addRoute').addEventListener('click',()=>{routes=routesFromInputs();routes.push({city:'',district:'*',team:'示範服務組',rm:'示範 RM'});renderRoutes();$('routeRows').lastElementChild?.querySelector('input')?.focus();});
$('routeRows').addEventListener('click',e=>{const b=e.target.closest('[data-delete-route]');if(!b)return;routes=routesFromInputs().filter((_,i)=>i!==Number(b.dataset.deleteRoute));renderRoutes();});

for(const k of Object.keys(DEFAULT_SETTINGS))$(k).value=settings[k];
$('settingsForm').addEventListener('submit',e=>{e.preventDefault();const next={};for(const k of Object.keys(DEFAULT_SETTINGS)){const n=Number($(k).value);if(!Number.isFinite(n)||n<(k==='paymentRate'?0:-100)||n>100)return announce('請檢查利差或費率，應為有效的百分比。');next[k]=n;}settings=next;writeLocal(SETTINGS_KEY,settings);render();announce('已更新示範假設，所有案例參考值已重新計算。');});

$('leadRows').addEventListener('click',e=>{const mail=e.target.closest('[data-dispatch]');if(mail){openDispatchFor(mail.dataset.dispatch);return;}const b=e.target.closest('[data-open]');if(b)openLead(b.dataset.open);});
$('serviceFilter').innerHTML='<option value="">全部服務與用途線索</option>'+Object.entries(SERVICES).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')+'<option value="overseas">海外投資線索（依用途）</option>';
$('statusFilter').innerHTML='<option value="">全部狀態</option>'+statuses.map(s=>`<option>${s}</option>`).join('');
$('serviceFilter').addEventListener('change',render);$('statusFilter').addEventListener('change',render);
$('closeDialog').addEventListener('click',()=>$('leadDialog').close());

$('clearData').addEventListener('click',()=>{if(!leads.length)return announce('目前沒有本機示範需求。');if(!confirm('清除此瀏覽器的全部示範需求？路由表與貢獻假設會保留。'))return;leads=[];persist();announce('已清除本機示範需求。');});
window.addEventListener('storage',e=>{if([LEADS_KEY,ROUTES_KEY,ROUTING_KEY].includes(e.key)&&$('dispatchDialog')?.open){$('dispatchDialog').close();announce('案件或分派設定已在其他分頁變更，請重新開啟派任通知確認收件人。');}if(e.key===LEADS_KEY){leads=loadDemoLeads();render();if($('leadDialog').open){const id=activeId;if(leads.some(l=>l.id===id))openLead(id);else $('leadDialog').close();}}if(e.key===ROUTES_KEY){routes=loadRoutes();renderRoutes();render();}if(e.key===SETTINGS_KEY){settings=loadSettings();for(const k of Object.keys(DEFAULT_SETTINGS))$(k).value=settings[k];render();}});
renderRoutes();render();

function fullSuggestion(lead){return suggestAssignment(lead,{threshold:routingThreshold(),branches:branchCatalogue(),routes});}
function suggestionFor(lead){const s=fullSuggestion(lead);return s.eligible?s:null;}
function routingDetail(lead){
 const s=fullSuggestion(lead);
 return '<section class="routing-detail"><div>'+routeDescription(s)+'</div><p class="local-note">'+esc(s.candidates.basis)+'</p>'+(s.kind==='branch'&&s.candidates.items.length?'<label>人工確認候選分行<select id="assignmentBranch">'+s.candidates.items.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+' · '+esc(b.match)+(b.distance!==null?' '+fmt(b.distance)+' km':'')+'</option>').join('')+'</select></label>':'')+'<div class="dispatch-routing-actions"><button type="button" class="button" id="prepareDispatchMail" '+(notificationFor(lead,s)?'':'disabled')+'>'+esc(dispatchActionLabel(notificationFor(lead,s)))+'</button><button type="button" class="button outline" id="viewLeadOnMap">在據點地圖檢視這筆需求</button></div><p class="dispatch-route-note">'+(lead.assignment?'郵件依已人工確認的承接單位準備；如需改派，請先重新採用建議。':'郵件依上方所選分行或對應區域中心準備；尚未設定收件人時，可先填寫主管信箱。')+'</p></section>';
}
mapController=mountBranchMap({target:'#routingMap',getLeads:()=>leads,getRoutes:()=>routes,onChange:()=>{render();if($('leadDialog').open&&activeId)openLead(activeId)}});
function openRequestedLead(){
 if(!location.hash.startsWith('#lead='))return;
 let id;try{id=decodeURIComponent(location.hash.slice(6))}catch{return announce('案件編號格式不正確。');}
 if(leads.some(l=>l.id===id))openLead(id);else announce('此瀏覽器找不到這筆需求。請使用提交諮詢時的同一瀏覽器開啟。');
}
addEventListener('hashchange',openRequestedLead);
addEventListener('storage',event=>{if(event.key===ROUTING_KEY||event.key===BRANCH_COORDS_KEY){mapController?.refresh();render();}});

openRequestedLead();

