// Mobile presentation only. Existing calculators and storage remain the source of truth.
const mobile=matchMedia('(max-width:760px)');
const $=id=>document.getElementById(id);
const body=document.body;
const disclosures=[];
function disclosure(nodes,title,klass=''){
 nodes=nodes.filter(Boolean);if(!nodes.length)return null;
 const box=document.createElement('details');box.className='mobile-disclosure '+klass;box.open=!mobile.matches;
 const summary=document.createElement('summary');summary.textContent=title;box.append(summary);
 nodes[0].before(box);nodes.forEach(node=>box.append(node));disclosures.push(box);return box;
}
function goTop(node,focus=false){
 if(!node)return;requestAnimationFrame(()=>{node.scrollIntoView({block:'start',behavior:'instant'});if(focus){const heading=node.querySelector('h2,h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}});
}
if(body.classList.contains('mobile-experience')){
 const panes=['models','simulator','health','consultation'];
 let pane=panes.includes(location.hash.slice(1))?location.hash.slice(1):'models';
 let previousMobile=mobile.matches;
 const nav=document.createElement('nav');nav.id='mobileStepNav';nav.className='mobile-bottom-nav mobile-only';nav.setAttribute('aria-label','主要功能');
 const symbols=['M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z','M6 3h12v18H6zM9 7h6M9 11h1m4 0h1m-6 4h1m4 0h1','M3 12h4l3-7 4 14 3-7h4','M4 4h16v12H9l-5 4z'];
 nav.innerHTML=panes.map((id,i)=>'<a href="#'+id+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+symbols[i]+'"/></svg><span>'+['選用途','資金試算','財務健檢','預約諮詢'][i]+'</span></a>').join('');
 body.append(nav);
 const documentLink=document.querySelector('[data-document-link]').cloneNode(true);documentLink.className='mobile-doc-link mobile-only';documentLink.textContent='申貸文件 ↗';document.querySelector('header .nav').append(documentLink);
 const journey=document.querySelector('.journey');
 disclosure([journey],'第一次使用？看規劃步驟','mobile-journey');
 disclosure([document.querySelector('.franchise-offer')],'加盟優惠適用說明','mobile-offer');
 const formNames=[['simulator','試算','修改數字','查看結果'],['health','健檢','填寫資料','健康報告']];
 for(const [id,label,inputLabel,resultLabel]of formNames){
  const bar=document.createElement('div');bar.className='mobile-view-switch mobile-only';bar.setAttribute('role','group');bar.setAttribute('aria-label',label+'顯示內容');
  bar.innerHTML='<button type="button" data-mobile-view="input" aria-pressed="true">'+inputLabel+'</button><button type="button" data-mobile-view="result" aria-pressed="false" disabled>'+resultLabel+'</button>';
  $(id).querySelector('.section-head').after(bar);body.dataset[id+'View']='input';
  const help=document.createElement('button');help.type='button';help.className='mobile-help mobile-only';help.textContent='顯示填寫說明';help.setAttribute('aria-pressed','false');
  $(id==='simulator'?'modelForm':'healthForm').before(help);
  help.addEventListener('click',()=>{body.classList.toggle('mobile-show-help');document.querySelectorAll('.mobile-help').forEach(b=>{b.setAttribute('aria-pressed',String(body.classList.contains('mobile-show-help')));b.textContent=body.classList.contains('mobile-show-help')?'收起填寫說明':'顯示填寫說明';});});
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-mobile-view]');if(!b)return;setView(id,b.dataset.mobileView,true);});
 }
 const modelSelect=document.createElement('label');modelSelect.className='mobile-model-select mobile-only';modelSelect.innerHTML='<span>這次想規劃</span><select id="mobileModelSelect" aria-label="切換資金用途">'+[...document.querySelectorAll('.model-card')].map(b=>'<option value="'+b.dataset.model+'">'+b.querySelector('h3').textContent+'</option>').join('')+'</select>';
 $('simulator').querySelector('.mobile-view-switch').after(modelSelect);
 $('mobileModelSelect').addEventListener('change',()=>{document.querySelector('.model-card[data-model="'+$('mobileModelSelect').value+'"]').click();});
 disclosure(['resultMetrics','resultBars','cycleGraphic','schedule'].map($),'查看計算明細與還款表','mobile-calculation-details');
 disclosure([$('explanation')],'了解計算假設','mobile-explanation');
 const resultDetails=$('resultContent').querySelector('details:not(.mobile-disclosure)');
 if(resultDetails)resultDetails.classList.add('mobile-formula');
 const extraActions=document.createElement('div');extraActions.className='mobile-summary-actions';$('copyConsultation').before(extraActions);extraActions.append($('copyConsultation'),$('printConsultation'));
 disclosure([extraActions],'複製或列印摘要','mobile-export');
 const consultFields=$('consultationForm')?.querySelector('.consultation-fields');
 if(consultFields)consultFields.firstElementChild.classList.add('full-field');
 const resultObserver=new MutationObserver(records=>{
  const ids=new Set(records.map(r=>r.target.nodeType===3?r.target.parentElement.id:r.target.id));
  if(ids.has('resultStatus')){const ready=$('resultStatus').textContent==='已更新';$('simulator').querySelector('[data-mobile-view=result]').disabled=$('resultStatus').textContent==='等待試算';if(ready&&mobile.matches){setView('simulator','result',pane==='simulator');}else if($('resultStatus').textContent==='等待試算')setView('simulator','input');}
  if(ids.has('healthStatus')){const ready=$('healthStatus').textContent.startsWith('整體：');$('health').querySelector('[data-mobile-view=result]').disabled=$('healthStatus').textContent==='等待健檢';if(ready&&mobile.matches)setView('health','result',pane==='health');else if($('healthStatus').textContent==='等待健檢')setView('health','input');}
 });
 for(const id of ['resultStatus','healthStatus'])resultObserver.observe($(id),{childList:true,characterData:true,subtree:true});
 function setView(id,view,scroll=false){
  if(view==='result'&&mobile.matches&&document.activeElement?.matches('input,textarea,select'))document.activeElement.blur();
  body.dataset[id+'View']=view;
  $(id).querySelectorAll('[data-mobile-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mobileView===view)));
  if(scroll&&mobile.matches)goTop($(id));
 }
 function navigate(id,{push=false,scroll=false}={}){
  pane=panes.includes(id)?id:id==='documents'||id==='formDownloads'?'consultation':'models';
  body.dataset.mobilePane=pane;
  nav.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+pane)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(push&&location.hash!=='#'+pane)history.pushState(null,'','#'+pane);
  if(scroll&&mobile.matches)goTop($(pane),true);
 }
 document.addEventListener('click',e=>{
  if(!mobile.matches)return;
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  const id=a.getAttribute('href').slice(1);
  if(['top',...panes,'documents','formDownloads'].includes(id)){
   e.preventDefault();navigate(id,{push:true,scroll:true});
   if(id==='documents'||id==='formDownloads')goTop($('documents'));
  }
 });
 for(const b of document.querySelectorAll('.model-card'))b.addEventListener('click',()=>{
  $('mobileModelSelect').value=b.dataset.model;
  if(mobile.matches){setView('simulator','input');navigate('simulator',{push:true,scroll:true});}
 });
 addEventListener('hashchange',()=>{if(mobile.matches)navigate(location.hash.slice(1),{scroll:true});});
 addEventListener('popstate',()=>{if(mobile.matches)navigate(location.hash.slice(1),{scroll:true});});
 function sync(){
  body.classList.toggle('mobile-ready',mobile.matches);
  if(mobile.matches){navigate(location.hash.slice(1)||pane);$('mobileModelSelect').value=document.querySelector('.model-card.active')?.dataset.model||'working';}
  if(previousMobile!==mobile.matches){disclosures.forEach(d=>d.open=!mobile.matches);previousMobile=mobile.matches;}
 }
 mobile.addEventListener('change',sync);sync();
 function keyboardState(){
  const focused=document.activeElement;
  const typing=mobile.matches&&focused?.matches('textarea,input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=submit]):not([type=button])')&&!focused.closest('#esun-assistant-panel');
  body.classList.toggle('mobile-typing',!!typing);
 }
 document.addEventListener('focusin',keyboardState);document.addEventListener('focusout',()=>setTimeout(keyboardState,0));
}
if(body.classList.contains('docs-page')){
 // Keep all six steps visible by title; expand just the detail currently needed.
 document.querySelectorAll('.docs-steps li>div').forEach(content=>{
  const h=content.querySelector('h3');if(!h)return;
  const box=document.createElement('details');box.className='mobile-step-detail';box.open=!mobile.matches;
  const summary=document.createElement('summary');summary.append(...h.childNodes);box.append(summary);h.remove();box.append(...content.childNodes);content.replaceWith(box);disclosures.push(box);
 });
 mobile.addEventListener('change',()=>disclosures.forEach(d=>d.open=!mobile.matches));
}
if(body.classList.contains('mobile-workbench')){
 const table=document.querySelector('.lead-table');
 if(table){const labels=[...table.querySelectorAll('th')].map(x=>x.textContent);const labelRows=()=>table.querySelectorAll('tbody tr').forEach(row=>[...row.cells].forEach((cell,i)=>cell.dataset.label=labels[i]||''));labelRows();new MutationObserver(labelRows).observe($('leadRows'),{childList:true});}
}
