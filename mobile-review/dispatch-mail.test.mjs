import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchTarget,dispatchActionLabel,validateEmail,buildDispatchMail,mailtoUrl,emlDraft,loadContact,saveContact} from './dispatch-mail.js';
import {addMissingCaseLeads} from './demo-cases.js';
import {suggestAssignment} from './branch-routing.js';
import {DEFAULT_ROUTES} from './opportunity.js';
import {BRANCHES} from './branch-data.js';
const leads=addMissingCaseLeads([]);
const shop=leads.find(lead=>lead.sampleKey==='02');
const kitchen=leads.find(lead=>lead.sampleKey==='04');
assert.ok(shop,'Dajun shop fixture is available');
assert.ok(kitchen,'Kai central kitchen fixture is available');
const suggestion=lead=>suggestAssignment(lead,{threshold:600,branches:BRANCHES,routes:DEFAULT_ROUTES});
test('selected branch and exact regional team resolve to separate manager contact keys',()=>{
 const s=suggestion(shop),first=dispatchTarget(shop,s),second=dispatchTarget(shop,s,s.candidates.items[1].id);
 assert.equal(first.role,'分行協理');assert.equal(dispatchActionLabel(first),'通知分行協理');assert.notEqual(first.key,second.key);assert.equal(second.unit,s.candidates.items[1].name);
 const center=dispatchTarget(kitchen,suggestion(kitchen));assert.equal(center.role,'區域中心主管');assert.equal(dispatchActionLabel(center),'通知區域中心主管');assert.equal(center.unit,'新北示範服務組');assert.ok(center.key.startsWith('center:'));
 assert.throws(()=>dispatchTarget(shop,s,'invalid'),/找不到/);assert.throws(()=>dispatchTarget(shop,{eligible:false}),/先設定/);
});
test('confirmed assignment takes priority over subsequently changed recommendations',()=>{
 const confirmed={...shop,assignment:{kind:'branch',branchId:'8080749',team:'北新莊分行',rm:'小愷'}};
 const target=dispatchTarget(confirmed,{eligible:true,kind:'center',team:'其他示範組',rm:'其他'});
 assert.equal(target.unit,'北新莊分行');assert.equal(target.confirmed,true);assert.equal(target.rm,'小愷');
 assert.throws(()=>dispatchTarget({...shop,assignment:{team:'incomplete'}},suggestion(shop)),/不完整/);
});
test('mail includes loan demand, selected target and appointment fields without changing lead status',()=>{
 const lead=shop,before=structuredClone(lead),target=dispatchTarget(lead,suggestion(lead));
 const mail=buildDispatchMail(lead,target,{email:'manager@example.invalid',managerName:'王'});
 assert.ok(mail.body.includes('融資需求：300 萬元（新臺幣等值，非核貸額度）'));assert.equal(mail.to,'manager@example.invalid');assert.ok(mail.body.includes('承接單位：'+target.unit));assert.ok(!mail.body.includes('6.07 萬元'));
 assert.ok(mail.body.includes(lead.consultation.address));assert.ok(!mail.body.includes('建議 RM：'));assert.ok(mail.body.includes('承接人員：由單位主管安排'));assert.ok(mail.body.includes('王 協理您好'));assert.ok(mail.body.includes('分行協理'));
 assert.ok(mail.body.includes(lead.consultation.desiredMonth));assert.ok(mail.body.includes('尚待人工確認'));assert.deepEqual(lead,before);
 const centerTarget=dispatchTarget(kitchen,suggestion(kitchen));
 const centralKitchen=buildDispatchMail(kitchen,centerTarget,{email:'center@example.invalid'});
 assert.equal(centralKitchen.to,'center@example.invalid');assert.equal(centerTarget.kind,'center');assert.ok(centralKitchen.body.includes('融資需求：800 萬元（新臺幣等值，非核貸額度）'));assert.ok(centralKitchen.body.includes('小愷央廚'));assert.ok(centralKitchen.body.includes('承接單位：'+centerTarget.unit));
});
test('single-recipient validation blocks header and URL injection or ambiguous multiple recipients',()=>{
 for(const value of ['', 'name@example.com\r\nBcc:other@example.com','one@example.com,two@example.com','One <one@example.com>','one@example.com?bcc=two@example.com','a b@example.com','.a@example.com'])assert.throws(()=>validateEmail(value));
 const mail={to:'manager+team@example.invalid',subject:'測試 &cc=other@example.com #標題',body:'第一行\r\n第二行 &subject=bad'};
 const uri=mailtoUrl(mail);const u=new URL(uri);assert.equal(u.searchParams.get('subject'),mail.subject);assert.equal(u.searchParams.get('body'),mail.body);assert.equal(u.searchParams.has('cc'),false);
});
test('EML is an unsent UTF-8 draft and each encoded-word independently preserves multibyte text',()=>{
 const mail={to:'manager@example.invalid',subject:'【派任通知／示範】巷口螺螄粉新莊加盟店（示範）｜展店與開張',body:'臺灣中文\r\n地址：新北市新莊區幸福路168號\r\n🙂'};
 const eml=emlDraft(mail);assert.ok(eml.includes('X-Unsent: 1\r\n'));
 const header=eml.split('\r\n\r\n')[0],encoded=[...header.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)].map(m=>Buffer.from(m[1],'base64').toString('utf8')).join('');
 assert.equal(encoded,mail.subject);assert.equal(Buffer.from(eml.split('\r\n\r\n')[1].replace(/\r\n/g,''),'base64').toString('utf8'),mail.body);
 assert.ok(!eml.includes('\r\nBcc:'));
});
test('contacts remain per branch or regional team, missing contacts are blank',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const a=dispatchTarget(shop,suggestion(shop)),b=dispatchTarget(kitchen,suggestion(kitchen));
 assert.equal(loadContact(a,storage).email,'');saveContact(a,{email:'branch@example.invalid',managerName:'王'},storage);
 assert.equal(loadContact(a,storage).email,'branch@example.invalid');assert.equal(loadContact(b,storage).email,'');
 saveContact(b,{email:'center@example.invalid'},storage);assert.equal(loadContact(a,storage).email,'branch@example.invalid');assert.equal(loadContact(b,storage).email,'center@example.invalid');
});
