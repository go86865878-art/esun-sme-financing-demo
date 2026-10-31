import test from 'node:test';
import assert from 'node:assert/strict';
import {buildConsultationSummary,consultationPrintHTML} from './consultation.js';
const plan={model:'working',at:'測試時間',out:{label:'尚待規劃資金',value:123.45,unit:'萬元',metrics:[{label:'資金占用',value:'500 萬元'}]}};
test('摘要保留資金用途、用款時間、文件準備及獨立月度結果',()=>{const text=buildConsultationSummary({plan,title:'營運週轉金',desiredMonth:'2027-03',documents:[{title:'財報',ready:true},{title:'雙證件',ready:false}],timing:'首個不足月份：2027-03'});assert.match(text,/營運週轉金/);assert.match(text,/2027-03/);assert.match(text,/123.45 萬元/);assert.match(text,/☑ 財報/);assert.match(text,/☐ 雙證件/);assert.match(text,/不與上方年度需求自動加總/);assert.match(text,/不會自動傳送/);});
test('未健檢時不產生虛構健康結果',()=>{const text=buildConsultationSummary({plan,title:'週轉'});assert.match(text,/尚未完成/);assert.doesNotMatch(text,/整體：健康/);assert.match(text,/待與專人確認/);});
test('部分健檢資料的不適用與資料不足會保留',()=>{const health={at:'測試',out:{overall:'na',items:[{label:'還款餘裕',status:'na',value:'資料不足'}]}};const text=buildConsultationSummary({plan,health});assert.match(text,/整體：不適用/);assert.match(text,/還款餘裕：不適用／資料不足/);});
test('沒有試算不得產生摘要',()=>{assert.throws(()=>buildConsultationSummary({plan:null}),/請先更新/);});
test('列印頁以純文字顯示摘要內容',()=>{const html=consultationPrintHTML('<script>bad()</script> & "引號"');assert.doesNotMatch(html,/<script>bad/);assert.match(html,/&lt;script&gt;bad/);assert.match(html,/&amp;/);assert.match(html,/@page\{size:A4/);});

