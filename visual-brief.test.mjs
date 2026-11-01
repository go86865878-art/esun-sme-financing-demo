import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_CASES,casePlan,caseConsultation} from './demo-cases.js';
import {briefFromLead,visualBriefSvg,visualPrintHTML} from './visual-brief.js';
import {consultationPrintHTML} from './consultation.js';
import {buildDispatchMail,visualEmlDraft} from './dispatch-mail.js';
const item=DEMO_CASES.find(c=>c.id==='02'),plan=casePlan(item);
const lead={id:'visual-test',label:item.company,plan,city:item.city,district:item.district,services:item.services,consultation:caseConsultation(item,plan)};
const target={key:'branch:test',unit:'測試分行',role:'分行協理',kind:'branch',confirmed:false};
test('print summary contains two distinct chart pages and preserves escaped original text',()=>{
 const context=briefFromLead(lead),html=consultationPrintHTML('<script>alert(1)</script>',context);
 assert.equal((html.match(/<section class="sheet">/g)||[]).length,2);
 assert.match(html,/營收與稅後淨利/);assert.match(html,/月底可用現金/);assert.match(html,/五項健檢/);
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.match(html,/business-mascots\.png/);
});
test('chart reports use financing demand, keep missing health unknown and never mutate the snapshot',()=>{
 const before=JSON.stringify(lead),context=briefFromLead(lead);
 const svg=visualBriefSvg(context,1);assert.match(svg,/300/);assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('undefined'));
 const incomplete=visualBriefSvg({...context,health:null},2);assert.match(incomplete,/尚未完成健檢/);assert.match(incomplete,/待補/);
 assert.equal(JSON.stringify(lead),before);
});
test('untrusted company labels are escaped in chart, print and manager email views',()=>{
 const hostile={...lead,label:'<img src=x onerror=alert(1)>',consultation:{...lead.consultation,company:'<script>injected</script>'}};
 const context=briefFromLead(hostile),svg=visualBriefSvg(context,1),html=visualPrintHTML(context);
 assert.ok(!svg.includes('<script>'));assert.ok(!html.includes('<script>'));
 const mail=buildDispatchMail(hostile,target,{email:'manager@example.com'});assert.ok(!mail.html.includes('<script>'));assert.match(mail.html,/&lt;script&gt;/);
});
test('visual EML is an unsent draft with text, HTML, inline chart and PDF attachment',()=>{
 const mail=buildDispatchMail(lead,target,{email:'manager@example.com'});
 const result=visualEmlDraft(mail,{image:{mime:'image/jpeg',base64:'L2ltYWdlLw=='},pdf:new TextEncoder().encode('%PDF-1.4\nvisual test')});
 for(const fragment of ['X-Unsent: 1','multipart/mixed','multipart/related','multipart/alternative','text/plain','text/html','Content-ID: <financial-summary@local>','application/pdf','filename="financial-brief.pdf"'])assert.ok(result.includes(fragment),fragment);
 assert.ok(mail.html.includes('cid:financial-summary@local'));
 assert.throws(()=>visualEmlDraft(mail,{image:{mime:'text/html',base64:'abc'},pdf:new Uint8Array()}));
 assert.equal(lead.status,undefined);
});
