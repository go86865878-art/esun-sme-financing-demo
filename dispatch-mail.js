import {relationshipMailLines,estimateRelationship} from './relationship-value.js?v=visualbrief20261101';
import {financingNeed} from './financing-need.js?v=visualbrief20261101';
import {MODELS,SERVICES} from './opportunity.js?v=visualbrief20261101';

import {pricingMailLines} from './relationship-pricing.js?v=visualbrief20261101';

export const CONTACTS_KEY='esun_mobile_review_dispatch_contacts_v1';
const clean=(value,max=160)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(n):'待確認';

export function dispatchTarget(lead,suggestion,selectedBranchId=''){
 const confirmed=lead?.assignment;
 if(confirmed){
  if(confirmed.kind==='branch'&&confirmed.branchId&&confirmed.team)return {key:'branch:'+confirmed.branchId,kind:'branch',unit:clean(confirmed.team),role:'分行協理',rm:clean(confirmed.rm),confirmed:true};
  if(confirmed.kind==='center'&&confirmed.team)return {key:'center:'+clean(confirmed.team),kind:'center',unit:clean(confirmed.team),role:'區域中心主管',rm:clean(confirmed.rm),confirmed:true};
  throw Error('此案件的既有分派資料不完整，請先重新確認承接單位。');
 }
 if(!suggestion?.eligible)throw Error('請先設定分派門檻及服務地區，確認推薦單位後再準備通知。');
 if(suggestion.kind==='branch'){
  const branches=suggestion.candidates?.items||[];
  const branch=selectedBranchId?branches.find(b=>b.id===selectedBranchId):suggestion.branch||branches[0];
  if(!branch?.id||!branch.name)throw Error('找不到所選候選分行，請重新選擇。');
  return {key:'branch:'+branch.id,kind:'branch',unit:clean(branch.name),role:'分行協理',rm:clean(suggestion.rm),confirmed:false};
 }
 if(suggestion.kind==='center'&&suggestion.team)return {key:'center:'+clean(suggestion.team),kind:'center',unit:clean(suggestion.team),role:'區域中心主管',rm:clean(suggestion.rm),confirmed:false};
 throw Error('尚未確認承接類型，請先設定服務單位。');
}

export function dispatchActionLabel(target){return target?.kind==='branch'?'通知分行協理':target?.kind==='center'?'通知區域中心主管':'通知主管';}

export function validateEmail(value){
 const raw=String(value??'');
 if(/[\r\n\u0000-\u001f\u007f]/.test(raw))throw Error('收件信箱不能含換行或控制字元。');
 const email=raw.trim();
 if(email.length>254||!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(email)||/\s/.test(email)||email.startsWith('.')||email.split('@')[0].endsWith('.')||email.split('@')[0].includes('..'))throw Error('請填寫一個完整的主管信箱，例如 name@example.com；不要填多人或顯示名稱。');
 return email;
}

export function buildDispatchMail(lead,target,{email,managerName=''}={}){
 const to=validateEmail(email),info=lead.consultation||{},need=financingNeed(lead.plan);
 const company=clean(info.company||lead.label,80),name=clean(managerName,40);
 const subject='【派任通知／示範】'+company+'｜'+(MODELS[lead.plan?.model]||'企業資金需求');
 const greeting=target.unit+' '+(name?name+' ':'')+(target.kind==='branch'?'協理':'主管')+'您好：';
 const shortNote=String(info.note||'尚待補充').replace(/\r\n?/g,'\n').slice(0,900);
 const body=[greeting,'','以下為潛在客戶案件派任平台整理的需求，請協助確認承接與安排聯繫。','',
  '【派任資訊】','承接單位：'+target.unit,'承接角色：'+target.role,'承接人員：由單位主管安排',
  '分派狀態：'+(target.confirmed?'已人工確認承接單位':'依推薦單位準備，尚待人工確認'),
  '案件編號：'+clean(lead.id,100),'',
  '【客戶需求】','企業名稱：'+company,'經營型態：'+(clean(info.businessType)||'待確認'),
  '規劃用途：'+(MODELS[lead.plan?.model]||'待確認'),'融資需求：'+fmt(need.amount)+' 萬元（新臺幣等值，非核貸額度）',
  '營業地區：'+clean(lead.city)+' '+clean(lead.district),'營業地址：'+(clean(info.address)||'待補充'),
  '聯絡稱呼：'+(clean(info.contact,40)||'待補充'),'聯絡電話：'+(clean(info.phone,40)||'未提供'),
  '方便聯繫：'+(clean(info.preferredTime)||'待確認'),'預計用款：'+(clean(info.desiredMonth)||'待確認'),
  '討論服務：'+(lead.services||[]).map(key=>SERVICES[key]).filter(Boolean).join('、'),'',
  '【預約諮詢內容】',shortNote,'',
  ...relationshipMailLines(lead),...pricingMailLines(lead),'【請協助事項】','確認本單位是否承接、指派負責 RM，並回覆預計聯繫時程；若需轉派，請註明建議單位與原因。','',
  '此為虛構案例的派任流程示範，並非正式授信申請。本平台無法追蹤郵件是否寄出或送達。'
 ].join('\r\n');
 return {to,subject,body,html:visualMailHTML(lead,target,greeting),targetKey:target.key};
}
const htmlEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function visualMailHTML(lead,target,greeting='主管您好：'){
 const c=lead.consultation||{},need=financingNeed(lead.plan).amount,r=estimateRelationship(lead),f=n=>Number.isFinite(n)?Math.round(n).toLocaleString('zh-TW'):'待補';
 const income=r.complete&&Number.isFinite(r.total)?f(r.total)+'～'+f(r.totalHigh)+' 萬元':'假設待補';
 const state={green:'健康',yellow:'注意',red:'警示',na:'資料不足／不適用'};
 const company=htmlEsc(c.company||lead.label),unit=htmlEsc(target.unit);
 return `<!doctype html><html lang="zh-Hant"><meta charset="UTF-8"><body style="margin:0;background:#f0f5f1;font:18px/1.75 'Microsoft JhengHei',Arial,sans-serif;color:#214f49"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="760" style="max-width:100%;background:white;border-top:8px solid #008577" cellspacing="0" cellpadding="26"><tr><td><p style="margin:0;color:#008577">案件派任｜圖表摘要</p><h1 style="font-size:28px;margin:10px 0">${company}</h1><p>${htmlEsc(greeting)}</p><p>請協助確認 <b>${unit}</b> 是否承接，並安排負責 RM 與聯繫時程。</p><table role="presentation" width="100%" cellspacing="8" cellpadding="16" style="background:#edf6f1"><tr><td style="width:33%">融資需求<br><b style="font-size:30px;color:#008577">${f(need)}</b> 萬元</td><td style="width:34%">首年潛在貢獻<br><b style="font-size:24px">${income}</b></td><td>財務健檢<br><b style="font-size:24px">${htmlEsc(state[c.health?.overall]||'尚未完成')}</b></td></tr></table><p style="font-size:15px;color:#637c75">貢獻為利率情境下未扣資金、信用、資本與作業成本的潛在收入；資料不足不列計。</p><img src="cid:financial-summary@local" alt="資金組成、逐月營收與現金流圖表；完整兩頁摘要另附PDF。" width="708" style="width:100%;max-width:708px;height:auto;border:1px solid #dce8e1"><h2 style="font-size:22px">請協助三件事</h2><ol><li>確認承接單位。</li><li>指派負責 RM。</li><li>回覆預計聯繫時程；如需轉派，請提供建議單位。</li></ol><p>完整健檢與文件進度請見隨信的 <b>financial-brief.pdf</b>，可直接列印。</p><p style="font-size:14px;color:#637c75">此為流程示範，非正式授信申請；融資需求不等於核貸額度。圖表為案件輸入與假設，不代表已發生收入。完整資料亦保留於純文字內文。</p></td></tr></table></td></tr></table></body></html>`;
}
export function mailtoUrl(mail){return 'mailto:'+encodeURIComponent(validateEmail(mail.to))+'?subject='+encodeURIComponent(mail.subject)+'&body='+encodeURIComponent(mail.body);}
function base64Utf8(value){const bytes=new TextEncoder().encode(value);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);}
export function emlDraft(mail){
 const to=validateEmail(mail.to),subject=clean(mail.subject,180),body=base64Utf8(mail.body);
 const words=[];let chunk='',length=0;
 for(const char of subject){const size=new TextEncoder().encode(char).length;if(length+size>36){words.push(chunk);chunk='';length=0;}chunk+=char;length+=size;}if(chunk)words.push(chunk);
 const encodedSubject=words.map(part=>'=?UTF-8?B?'+base64Utf8(part)+'?=').join('\r\n ');
 return ['To: '+to,'Subject: '+encodedSubject,'MIME-Version: 1.0','X-Unsent: 1','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',...(body.match(/.{1,76}/g)||['']),''].join('\r\n');
}

function folded64(base64){if(!/^[A-Za-z0-9+/=\r\n]*$/.test(base64))throw Error('附件編碼不正確。');return (base64.replace(/[\r\n]/g,'').match(/.{1,76}/g)||['']).join('\r\n');}
function bytes64(bytes){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);}
export function visualEmlDraft(mail,{image,pdf}){
 if(!image?.base64||!['image/jpeg','image/png'].includes(image.mime)||!(pdf instanceof Uint8Array))throw Error('請先產生圖表影像與PDF附件。');
 const header=emlDraft(mail).split('\r\nContent-Type:')[0];
 const mixed='=_sme_mixed_visual_v1',related='=_sme_related_visual_v1',alternative='=_sme_alternative_visual_v1';
 return [header,'Content-Type: multipart/mixed; boundary="'+mixed+'"','',
 '--'+mixed,'Content-Type: multipart/related; boundary="'+related+'"','',
 '--'+related,'Content-Type: multipart/alternative; boundary="'+alternative+'"','',
 '--'+alternative,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',folded64(base64Utf8(mail.body)),
 '--'+alternative,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',folded64(base64Utf8(mail.html||htmlEsc(mail.body))),
 '--'+alternative+'--','',
 '--'+related,'Content-Type: '+image.mime,'Content-ID: <financial-summary@local>','Content-Disposition: inline; filename="financial-summary.'+(image.mime==='image/png'?'png':'jpg')+'"','Content-Transfer-Encoding: base64','',folded64(image.base64),
 '--'+related+'--','',
 '--'+mixed,'Content-Type: application/pdf','Content-Disposition: attachment; filename="financial-brief.pdf"','Content-Transfer-Encoding: base64','',folded64(bytes64(pdf)),
 '--'+mixed+'--',''].join('\r\n');
}

export function loadContact(target,storage=globalThis.localStorage){try{const book=JSON.parse(storage.getItem(CONTACTS_KEY)||'{}');const row=book[target.key];return row&&typeof row==='object'?{email:String(row.email||''),managerName:String(row.managerName||'')}: {email:'',managerName:''};}catch{return {email:'',managerName:''};}}
export function saveContact(target,contact,storage=globalThis.localStorage){
 const email=validateEmail(contact.email);let book;try{book=JSON.parse(storage.getItem(CONTACTS_KEY)||'{}')}catch{book={}}
 if(!book||typeof book!=='object'||Array.isArray(book))book={};
 book[target.key]={email,managerName:clean(contact.managerName,40)};storage.setItem(CONTACTS_KEY,JSON.stringify(book));
}
