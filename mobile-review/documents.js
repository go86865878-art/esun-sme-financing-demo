import {baseDocs,documentsFor,modelNames,normalizeModel,readDocumentChecks,saveDocumentChecks,DOCUMENT_STORAGE_KEY} from './document-data.js';
const $=id=>document.getElementById(id);
const query=new URL(location.href);
let current=normalizeModel(query.searchParams.get('model'));
let checked=readDocumentChecks();
let lastSaveSucceeded=true;
$('documentPurpose').value=current;
let toastTimer;
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true},3200)}
function showStorageStatus(saved){
 $('docsStorageNote').textContent=saved
 ?'勾選進度僅儲存在目前瀏覽器，並可帶入資金規劃頁的諮詢摘要；不代表已送件。'
 :'目前瀏覽器無法儲存勾選進度；本頁仍可勾選，關閉後不會保留，也不會同步至諮詢摘要。';
}
function updateProgress(){
 const docs=documentsFor(current),count=docs.filter(x=>checked.has(x[1])).length;
 $('documentList').querySelectorAll('[data-doc]').forEach(box=>{const ready=checked.has(box.dataset.doc);box.defaultChecked=ready;box.checked=ready;box.closest('label').querySelector('.docs-item-state').textContent=ready?'已備妥':'待準備';});
 $('docCount').textContent=count+' / '+docs.length+' 項';
 $('foldCount').textContent=count+' / '+docs.length+' 已準備';
 $('docProgress').style.width=count/docs.length*100+'%';
 const bar=$('docProgress').parentElement;bar.setAttribute('role','progressbar');bar.setAttribute('aria-label','文件準備進度');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(docs.length));bar.setAttribute('aria-valuenow',String(count));
}
function render(){
 $('docHint').textContent='目前用途：'+modelNames[current]+'。下列是準備方向，部分項目依案件補充。';
 const fragment=document.createDocumentFragment();
 documentsFor(current).forEach((item,index)=>{
  if(index===0||index===baseDocs.length){const group=document.createElement('div');group.className='doc-group';group.textContent=index===0?'共通準備資料':'依本次用途補充';fragment.append(group)}
  const label=document.createElement('label');label.className='doc-item';
  const box=document.createElement('input');box.type='checkbox';box.dataset.doc=item[1];box.autocomplete='off';box.defaultChecked=checked.has(item[1]);box.checked=checked.has(item[1]);
  const span=document.createElement('span'),title=document.createElement('b'),help=document.createElement('small');
  title.textContent=item[1];help.textContent=item[2];const state=document.createElement('em');state.className='docs-item-state';state.textContent=checked.has(item[1])?'已備妥':'待準備';span.append(title,help,state);label.append(box,span);fragment.append(label);
 });
 $('documentList').replaceChildren(fragment);updateProgress();
}
$('documentPurpose').addEventListener('change',()=>{
 current=normalizeModel($('documentPurpose').value);
 const next=new URL(location.href);next.searchParams.set('model',current);history.replaceState(null,'',next);
 render();
});
$('documentList').addEventListener('change',event=>{
 const box=event.target;if(!box.matches('[data-doc]'))return;
 // Merge changes made in another tab before applying this checkbox.
 if(lastSaveSucceeded)checked=readDocumentChecks();
 if(box.checked)checked.add(box.dataset.doc);else checked.delete(box.dataset.doc);
 lastSaveSucceeded=saveDocumentChecks(checked);showStorageStatus(lastSaveSucceeded);updateProgress();
});
addEventListener('storage',event=>{if(event.key===DOCUMENT_STORAGE_KEY||event.key===null){checked=readDocumentChecks();render()}});
function downloadChecklist(file,name,message){const link=document.createElement('a');link.href=file;link.download=name;document.body.append(link);link.click();link.remove();toast(message)}
$('downloadDocs').addEventListener('click',()=>downloadChecklist(Math.random()<.5?'checklist-kumamon-a.pdf':'checklist-kumamon-b.pdf','企業申貸文件準備清單.pdf','已開啟熊本熊版文件清單下載。'));
$('downloadDocsMeow').addEventListener('click',()=>downloadChecklist('checklist-meow.pdf','企業申貸文件準備清單_玉山喵喵版.pdf','已開啟玉山喵喵版文件清單下載。'));
document.querySelectorAll('[data-icon="download"]').forEach(node=>{node.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'});
function openLinkedSection(){
 const id=location.hash.slice(1);
 if(id==='formDownloads'||id==='checklistFold'){
  const detail=$(id);detail.open=true;
  requestAnimationFrame(()=>detail.scrollIntoView({block:'start',behavior:'auto'}));
 }
}
addEventListener('hashchange',openLinkedSection);
addEventListener('pageshow',()=>{if(lastSaveSucceeded)checked=readDocumentChecks();render();openLinkedSection()});
render();openLinkedSection();

