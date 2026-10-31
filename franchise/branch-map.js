import {BRANCHES,BRANCH_SOURCE} from './branch-data.js';
import {ROUTING_KEY,BRANCH_COORDS_KEY,validPoint,validThreshold,suggestAssignment} from './branch-routing.js';
import {esc,readLocal,writeLocal} from './opportunity.js';
export function routingThreshold(){try{return validThreshold(readLocal(ROUTING_KEY,{}).threshold)}catch{return null}}
export function branchCatalogue(){const overrides=readLocal(BRANCH_COORDS_KEY,{});return BRANCHES.map(branch=>{const point=overrides?.[branch.id];return validPoint(point)?{...branch,lat:point.lat,lng:point.lng,coordinateSource:'管理者補登（請覆核）'}:branch;});}
const number=n=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:1}):'待確認';
export function routeDescription(s){
 return '<strong>'+esc(s.label)+'</strong><p>需求折合新臺幣：'+number(s.need.amount)+' 萬元。'+esc(s.need.note)+'</p>'+(s.team?'<p>候選承接單位：<b>'+esc(s.team)+'</b></p>':'')+'<small>'+esc(s.note||'設定門檻後，再依金額與營業位置提出建議。')+'</small>';
}
export function mountBranchMap({target,getLeads,getRoutes,onChange}){
 const host=document.querySelector(target);if(!host)return null;
 const cities=[...new Set(BRANCHES.map(b=>b.city))];
 host.innerHTML='<div class="card-heading"><div><p class="eyebrow">BRANCH MATCHING</p><h2>把需求，接到合適的服務據點。</h2><p>依金額判斷分行或區域中心，再參考營業地區選擇窗口，最後由人員確認。</p></div><span class="map-count">'+BRANCHES.length+' 個官方名單據點</span></div><form id="routingThresholdForm" class="routing-controls"><label>分行／區域中心分界（新臺幣萬元）<input id="routingThreshold" type="number" min="0.01" max="100000000" step="0.01" placeholder="請自行設定示範門檻"></label><button class="button" type="submit">儲存分派規則</button><button class="button outline" type="button" id="sampleThreshold">帶入 600 萬示範值</button><p id="routingRuleNote">未達門檻建議分行；達門檻（含）建議區域中心。本設定為展示規則，非玉山內規。</p></form><div class="branch-map-layout"><div class="branch-map-panel"><div class="map-filter-row"><label>以哪筆需求查看<select id="mapLead"><option value="">先瀏覽據點</option></select></label><label>瀏覽縣市<select id="mapCity">'+cities.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select></label></div><div id="mapRecommendation" class="map-recommendation" aria-live="polite"></div><div id="branchList" class="branch-list"></div></div><div class="map-display"><div id="selectedBranch" class="selected-branch"></div><iframe id="branchMapFrame" title="玉山服務據點地址地圖" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><p class="map-footnote">地圖依所選官方地址查詢，位置仍以銀行最新公告為準。<a id="openBranchMap" target="_blank" rel="noopener noreferrer">在 Google 地圖開啟 ↗</a></p><details class="coordinate-editor"><summary>進階：補登已核實的分行座標</summary><p>官方名單提供地址但未提供座標。補登後，具營業位置的案件才會在「已載入且有座標」的據點中比較直線距離；沒有座標時只列同區候選。</p><form id="branchCoordinateForm"><div class="coordinate-inputs"><label>緯度<input id="branchLat" type="number" step="any" min="21" max="27"></label><label>經度<input id="branchLng" type="number" step="any" min="117" max="124"></label><button class="button outline" type="submit">保存此據點座標</button></div><p id="coordinateMessage" role="status"></p></form></details></div></div><p class="map-footnote">資料範圍：'+esc(BRANCH_SOURCE.coverage)+' 名單整理日：'+esc(BRANCH_SOURCE.retrievedAt)+'。<a href="'+esc(BRANCH_SOURCE.url)+'" target="_blank" rel="noopener noreferrer">官方來源 ↗</a></p>';
 const $=id=>document.getElementById(id);
 let selectedId=null;
 $('routingThreshold').value=routingThreshold()??'';
 function showBranch(id){
  const b=branchCatalogue().find(x=>x.id===id);if(!b)return;selectedId=id;
  $('selectedBranch').innerHTML='<b>'+esc(b.name)+'</b><span>'+esc(b.address)+'</span><small>'+esc(b.phone)+(b.reviewRequired?' · 地址資訊待人工核實':'')+'</small>';
  const q='玉山銀行 '+b.name+' '+b.address;
  $('branchMapFrame').src='https://www.google.com/maps?q='+encodeURIComponent(q)+'&output=embed';
  $('openBranchMap').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
  $('branchLat').value=b.lat??'';$('branchLng').value=b.lng??'';
  $('branchList').querySelectorAll('[data-branch]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.branch===id)));
 }
 function refresh(){
  const previous=$('mapLead').value,leads=getLeads();
  $('mapLead').innerHTML='<option value="">先瀏覽據點</option>'+leads.map(l=>'<option value="'+esc(l.id)+'">'+esc(l.label)+'</option>').join('');
  if(leads.some(l=>l.id===previous))$('mapLead').value=previous;
  renderList();
 }
 function renderList(){
  const branches=branchCatalogue(),lead=getLeads().find(l=>l.id===$('mapLead').value);
  let list;
  if(lead){
   const s=suggestAssignment(lead,{threshold:routingThreshold(),branches,routes:getRoutes()});
   $('mapRecommendation').innerHTML=routeDescription(s)+'<p>'+esc(s.candidates.basis)+'</p>';
   list=s.candidates.items;
   if(!list.length)$('mapRecommendation').innerHTML+='<p>此資料集沒有同地區候選，請改用縣市瀏覽，並由人員查核合適據點。</p>';
  }else{
   list=branches.filter(b=>b.city===$('mapCity').value);
   $('mapRecommendation').textContent='點選下方據點，右側地圖會切換到該分行地址。';
  }
  $('branchList').innerHTML=list.map(b=>'<button type="button" data-branch="'+esc(b.id)+'" aria-pressed="false"><span><b>'+esc(b.name)+'</b><small>'+esc(b.address)+'</small></span><em>'+esc(b.reviewRequired?'待核實':b.distance!==null&&Number.isFinite(b.distance)?number(b.distance)+' km 直線距離':b.match||b.district)+'</em></button>').join('')||'<p class="local-note">暫無候選資料，請選擇其他縣市或官方名單查詢。</p>';
  if(list.length)showBranch(list.find(b=>b.id===selectedId)?.id||list[0].id);
  else{selectedId=null;$('selectedBranch').textContent='請改用縣市瀏覽以選擇據點';$('branchMapFrame').removeAttribute('src');$('openBranchMap').removeAttribute('href');$('branchLat').value='';$('branchLng').value='';}
 }
 $('mapLead').addEventListener('change',renderList);
 $('mapCity').addEventListener('change',()=>{$('mapLead').value='';renderList();});
 $('branchList').addEventListener('click',e=>{const button=e.target.closest('[data-branch]');if(button)showBranch(button.dataset.branch);});
 $('routingThresholdForm').addEventListener('submit',e=>{e.preventDefault();try{const threshold=validThreshold($('routingThreshold').value);writeLocal(ROUTING_KEY,{threshold});$('routingRuleNote').textContent=threshold===null?'門檻已清空，改為人工確認。':'已儲存：未達 '+number(threshold)+' 萬建議分行，達 '+number(threshold)+' 萬（含）建議區域中心。此為示範規則。';onChange();renderList();}catch(error){$('routingRuleNote').textContent=error.message;}});
 $('sampleThreshold').addEventListener('click',()=>{$('routingThreshold').value=600;$('routingRuleNote').textContent='已帶入 600 萬示範值；請按儲存才會套用，並非銀行內規。';});
 $('branchCoordinateForm').addEventListener('submit',e=>{e.preventDefault();try{
  if(!selectedId)throw Error('請先選擇分行。');
  const values=readLocal(BRANCH_COORDS_KEY,{});
  if($('branchLat').value===''&&$('branchLng').value===''){delete values[selectedId];}
  else{if($('branchLat').value===''||$('branchLng').value==='')throw Error('座標請兩欄都填，或兩欄留白以移除。');const point={lat:Number($('branchLat').value),lng:Number($('branchLng').value)};if(!validPoint(point)||point.lat<21||point.lat>27||point.lng<117||point.lng>124)throw Error('請確認臺灣據點的緯度與經度。');values[selectedId]=point;}
  writeLocal(BRANCH_COORDS_KEY,values);$('coordinateMessage').textContent='已保存本機座標設定，建議已重新計算。';onChange();renderList();
 }catch(error){$('coordinateMessage').textContent=error.message;}});
 refresh();return {refresh,focusLead:id=>{$('mapLead').value=id;renderList();host.scrollIntoView({behavior:'smooth',block:'start'});}};
}

