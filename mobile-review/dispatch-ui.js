import {dispatchTarget,buildDispatchMail,mailtoUrl,emlDraft,loadContact,saveContact} from './dispatch-mail.js?v=dispatch1';

export function mountDispatchMail(){
 const dialog=document.createElement('dialog');dialog.id='dispatchDialog';dialog.className='dispatch-dialog';
 dialog.innerHTML=`<div class="dispatch-heading"><div><span class="eyebrow">INTERNAL ASSIGNMENT NOTICE</span><h2>寄送派任通知</h2></div><button type="button" id="closeDispatch" class="close-button" aria-label="關閉派任郵件">×</button></div>
 <div class="dispatch-target"><small id="dispatchBasis"></small><strong id="dispatchUnit"></strong><span id="dispatchRole"></span></div>
 <form id="dispatchMailForm" novalidate><div class="dispatch-contact"><label>此單位主管信箱<input id="dispatchEmail" name="email" type="email" autocomplete="off" maxlength="254" placeholder="請填寫該單位的內部信箱" required></label><label>主管稱呼（選填）<input id="dispatchManager" name="managerName" maxlength="40" placeholder="例如：王經理"></label></div>
 <p class="dispatch-hint">依推薦分行或對應服務組套用收件人；未提供的信箱不會自動猜測。更換單位會使用該單位自己的設定。</p>
 <label class="dispatch-remember"><input type="checkbox" id="rememberDispatch" checked>記住此單位的收件人（僅此瀏覽器）</label>
 <label class="dispatch-subject-label">郵件主旨<input id="dispatchSubject" readonly></label>
 <details class="dispatch-preview" open><summary>案件摘要與派任內容</summary><pre id="dispatchBody"></pre></details>
 <p id="dispatchError" role="alert" class="error"></p><p id="dispatchFeedback" role="status"></p>
 <div class="dispatch-actions"><button type="submit" class="button" id="openDispatchMail">開啟郵件程式</button><button type="button" class="button outline" id="downloadDispatchMail">下載 .eml 草稿</button><button type="button" class="button outline" id="copyDispatchMail">複製內文</button></div>
 <p class="dispatch-hint">請在郵件程式內確認收件人後寄出。開啟或下載草稿不會標記為「已寄送」；此測試網尚未串接銀行郵件系統。若沒有跳出郵件程式，可下載草稿使用。</p></form>`;
 document.body.append(dialog);
 const $=id=>dialog.querySelector('#'+id),form=$('dispatchMailForm');let lead=null,target=null;
 function contact(){return {email:$('dispatchEmail').value,managerName:$('dispatchManager').value};}
 function preview(){
  if(!lead||!target)return;
  const draft=buildDispatchMail(lead,target,{...contact(),email:'preview@example.invalid'});
  $('dispatchSubject').value=draft.subject;$('dispatchBody').textContent=draft.body;
 }
 function prepare(){
  $('dispatchError').textContent='';$('dispatchFeedback').textContent='';
  const mail=buildDispatchMail(lead,target,contact());
  if($('rememberDispatch').checked){try{saveContact(target,contact());}catch{$('dispatchFeedback').textContent='瀏覽器未能儲存收件人；本次仍可使用郵件草稿。';}}
  return mail;
 }
 function failure(error){$('dispatchError').textContent=error.message||'無法準備郵件，請確認收件信箱。';$('dispatchEmail').focus();}
 form.addEventListener('submit',event=>{
  event.preventDefault();try{const mail=prepare();const link=document.createElement('a');link.href=mailtoUrl(mail);link.style.display='none';dialog.append(link);link.click();link.remove();$('dispatchFeedback').textContent='已嘗試開啟郵件程式；請在郵件程式確認並寄出，平台無法判定是否已寄送。';}catch(error){failure(error);}
 });
 $('downloadDispatchMail').addEventListener('click',()=>{try{
  const mail=prepare(),url=URL.createObjectURL(new Blob([emlDraft(mail)],{type:'message/rfc822'}));
  const a=document.createElement('a');a.href=url;a.download='assignment-'+String(lead.id).replace(/[^a-z0-9_-]/gi,'').slice(0,64)+'.eml';dialog.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  $('dispatchFeedback').textContent='已產生 .eml 郵件草稿，尚未寄出；案件處理狀態保持不變。';
 }catch(error){failure(error);}});
 $('copyDispatchMail').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('dispatchSubject').value+'\n\n'+$('dispatchBody').textContent);$('dispatchFeedback').textContent='已複製主旨及內文，請自行貼入內部郵件並填寫收件人。';}catch{$('dispatchFeedback').textContent='無法自動複製，請選取下方內文複製。';const selection=getSelection(),range=document.createRange();range.selectNodeContents($('dispatchBody'));selection.removeAllRanges();selection.addRange(range);}});
 $('dispatchManager').addEventListener('input',preview);
 $('dispatchEmail').addEventListener('input',()=>{$('dispatchError').textContent='';$('dispatchFeedback').textContent='';});
 $('closeDispatch').addEventListener('click',()=>dialog.close());
 return {open(nextLead,suggestion,branchId){
  const nextTarget=dispatchTarget(nextLead,suggestion,branchId);lead=nextLead;target=nextTarget;
  const saved=loadContact(target);form.reset();$('dispatchEmail').value=saved.email;$('dispatchManager').value=saved.managerName;
  $('dispatchUnit').textContent=target.unit;$('dispatchRole').textContent=target.role+' · RM '+(target.rm||'待指定');
  $('dispatchBasis').textContent=target.confirmed?'依已人工確認的承接單位':'依目前推薦單位／所選候選分行';
  $('dispatchError').textContent='';$('dispatchFeedback').textContent='';preview();
  dialog.showModal();if(!saved.email)$('dispatchEmail').focus();else $('openDispatchMail').focus();
 }};
}
