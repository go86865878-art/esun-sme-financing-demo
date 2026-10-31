import {financingNeed} from './financing-need.js';
import {MODELS,SERVICES} from './opportunity.js?v=cases1';

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
  '【請協助事項】','確認本單位是否承接、指派負責 RM，並回覆預計聯繫時程；若需轉派，請註明建議單位與原因。','',
  '此為虛構案例的派任流程示範，並非正式授信申請。本平台無法追蹤郵件是否寄出或送達。'
 ].join('\r\n');
 return {to,subject,body,targetKey:target.key};
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

export function loadContact(target,storage=globalThis.localStorage){try{const book=JSON.parse(storage.getItem(CONTACTS_KEY)||'{}');const row=book[target.key];return row&&typeof row==='object'?{email:String(row.email||''),managerName:String(row.managerName||'')}: {email:'',managerName:''};}catch{return {email:'',managerName:''};}}
export function saveContact(target,contact,storage=globalThis.localStorage){
 const email=validateEmail(contact.email);let book;try{book=JSON.parse(storage.getItem(CONTACTS_KEY)||'{}')}catch{book={}}
 if(!book||typeof book!=='object'||Array.isArray(book))book={};
 book[target.key]={email,managerName:clean(contact.managerName,40)};storage.setItem(CONTACTS_KEY,JSON.stringify(book));
}
