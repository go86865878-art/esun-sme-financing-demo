import {briefFromLead,visualBriefSvg} from './visual-brief.js?v=visualbrief20261101';
import {buildVisualReport} from './visual-report.js?v=visualbrief20261101';
import {downloadPdf} from './pdf-report.js?v=visualbrief20261101';
import {dispatchTarget,dispatchActionLabel,buildDispatchMail,mailtoUrl,emlDraft,visualEmlDraft,loadContact,saveContact} from './dispatch-mail.js?v=visualbrief20261101';

export function mountDispatchMail(){
 const dialog=document.createElement('dialog');dialog.id='dispatchDialog';dialog.className='dispatch-dialog';
 dialog.innerHTML=`<div class="dispatch-heading"><div><span class="eyebrow">INTERNAL ASSIGNMENT NOTICE</span><h2 id="dispatchTitle">通知主管</h2></div><button type="button" id="closeDispatch" class="close-button" aria-label="關閉派任郵件">×</button></div>
 <div class="dispatch-target"><small id="dispatchBasis"></small><strong id="dispatchUnit"></strong><span id="dispatchRole"></span></div>
 <form id="dispatchMailForm" novalidate><div class="dispatch-contact"><label>此單位主管信箱<input id="dispatchEmail" name="email" type="email" autocomplete="off" maxlength="254" placeholder="請填寫該單位的內部信箱" required></label><label>主管稱呼（選填）<input id="dispatchManager" name="managerName" maxlength="40" placeholder="例如：王"></label></div>
 <p class="dispatch-hint">依推薦分行或對應服務組套用收件人；未提供的信箱不會自動猜測。更換單位會使用該單位自己的設定。</p>
 <label class="dispatch-remember"><input type="checkbox" id="rememberDispatch" checked>記住此單位的收件人（僅此瀏覽器）</label>
 <label class="dispatch-subject-label">郵件主旨<input id="dispatchSubject" readonly></label>
 <details class="dispatch-visual-preview" open><summary>圖表摘要預覽｜完整兩頁見PDF附件</summary><div id="dispatchVisualBody"></div></details><details class="dispatch-preview"><summary>完整文字內文（備查）</summary><pre id="dispatchBody"></pre></details>
 <p id="dispatchError" role="alert" class="error"></p><p id="dispatchFeedback" role="status"></p>
 <div class="dispatch-actions"><button type="button" class="button" id="downloadDispatchMail">下載圖表郵件草稿</button><button type="button" class="button outline" id="downloadDispatchPdf">下載圖表 PDF</button><button type="submit" class="button outline" id="openDispatchMail">開啟純文字郵件</button><button type="button" class="button outline" id="copyDispatchMail">複製文字內文</button></div>
 <p class="dispatch-hint">圖表草稿可用支援.eml的郵件程式開啟，內含圖表與PDF附件；使用純文字郵件時，請手動加入圖表PDF。請在郵件程式確認收件人與附件後寄出。平台只產生草稿，不會標記為已寄送。</p></form>`;
 document.body.append(dialog);
 const $=id=>dialog.querySelector('#'+id),form=$('dispatchMailForm');let lead=null,target=null;
 const actions=dialog.querySelector('.dispatch-actions');$('dispatchSubject').closest('label').after(actions);
 function fileStem(){return String(lead.id).replace(/[^a-z0-9_-]/gi,'').slice(0,64);}
 function downloadEml(text){const url=URL.createObjectURL(new Blob([text],{type:'message/rfc822'}));const a=document.createElement('a');a.href=url;a.download='assignment-'+fileStem()+'.eml';dialog.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 function contact(){return {email:$('dispatchEmail').value,managerName:$('dispatchManager').value};}
 function preview(){
  if(!lead||!target)return;
  const draft=buildDispatchMail(lead,target,{...contact(),email:'preview@example.invalid'});
  $('dispatchSubject').value=draft.subject;$('dispatchBody').textContent=draft.body;$('dispatchVisualBody').innerHTML=visualBriefSvg(briefFromLead(lead),1);
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
 $('downloadDispatchMail').addEventListener('click',async()=>{const button=$('downloadDispatchMail');try{const mail=prepare();button.disabled=true;button.textContent='正在產生圖表與附件…';const packet=await buildVisualReport(briefFromLead(lead));downloadEml(visualEmlDraft(mail,packet));$('dispatchFeedback').textContent='已產生含內嵌圖表與兩頁PDF附件的郵件草稿，尚未寄出；請在郵件程式確認收件人與附件。';}catch(error){failure(error);}finally{button.disabled=false;button.textContent='下載圖表郵件草稿';}});
 $('downloadDispatchPdf').addEventListener('click',async()=>{const button=$('downloadDispatchPdf');try{button.disabled=true;const packet=await buildVisualReport(briefFromLead(lead));downloadPdf('financial-brief-'+fileStem()+'.pdf',packet.pdf);$('dispatchFeedback').textContent='已產生兩頁圖表PDF，可另行附加到內部郵件。';}catch(error){failure(error);}finally{button.disabled=false;}});
 $('copyDispatchMail').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('dispatchSubject').value+'\n\n'+$('dispatchBody').textContent);$('dispatchFeedback').textContent='已複製主旨及內文，請自行貼入內部郵件並填寫收件人。';}catch{$('dispatchFeedback').textContent='無法自動複製，請選取下方內文複製。';const selection=getSelection(),range=document.createRange();range.selectNodeContents($('dispatchBody'));selection.removeAllRanges();selection.addRange(range);}});
 $('dispatchManager').addEventListener('input',preview);
 $('dispatchEmail').addEventListener('input',()=>{$('dispatchError').textContent='';$('dispatchFeedback').textContent='';});
 $('closeDispatch').addEventListener('click',()=>dialog.close());
 return {open(nextLead,suggestion,branchId){
  const nextTarget=dispatchTarget(nextLead,suggestion,branchId);lead=nextLead;target=nextTarget;
  const saved=loadContact(target);form.reset();$('dispatchEmail').value=saved.email;$('dispatchManager').value=saved.managerName;
  $('dispatchUnit').textContent=target.unit;$('dispatchRole').textContent=target.role;$('dispatchTitle').textContent=dispatchActionLabel(target);
  $('dispatchBasis').textContent=target.confirmed?'依已人工確認的承接單位':'依目前推薦單位／所選候選分行';
  $('dispatchError').textContent='';$('dispatchFeedback').textContent='';preview();
  dialog.showModal();if(!saved.email)$('dispatchEmail').focus();else $('downloadDispatchMail').focus();
 }};
}
