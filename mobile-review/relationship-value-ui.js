import {VALUE_FIELDS,normalizeValueAssumptions,estimateRelationship} from './relationship-value.js?v=value2';
import {esc} from './opportunity.js?v=value2';
const fmt=v=>v===null?'待補資料':v.toLocaleString('zh-TW',{maximumFractionDigits:2})+' 萬元';
const range=(low,high)=>low===null||high===null?'待補資料':low.toLocaleString('zh-TW',{maximumFractionDigits:2})+'～'+high.toLocaleString('zh-TW',{maximumFractionDigits:2})+' 萬元';
function resultMarkup(lead){
 const r=estimateRelationship(lead);
 if(r.error)return '<p class="error">'+esc(r.error)+'</p>';
 const max=Math.max(...r.rows.filter(x=>x.active).map(x=>x.value||0),1);
 return '<div class="value-summary"><div><small>企業貢獻'+(r.complete?'':'（已知部分）')+'</small><strong>'+range(r.company,r.companyHigh)+'</strong></div><div><small>員工延伸貢獻</small><strong>'+(lead.services.includes('payroll')?fmt(r.employee):'未列計')+'</strong></div><div><small>首年潛在貢獻'+(r.complete?'':'（部分估算）')+'</small><strong>'+range(r.total,r.totalHigh)+'</strong></div></div><p class="value-source">收款依據：'+esc(r.salesSource)+' · '+fmt(r.sales)+'<br>預計導入本行年收款：'+fmt(r.receipts)+'；薪轉人數：'+(r.people??'未提供')+' 人。</p><div class="value-rows">'+r.rows.filter(x=>x.active).map(x=>'<article><div class="value-row-head"><b>'+x.label+'</b><strong>'+(x.key==='loan'?range(x.value,x.valueHigh):fmt(x.value))+'</strong></div><div class="value-bar" aria-hidden="true"><span style="width:'+((x.value||0)/max*100)+'%"></span></div><p>'+esc(x.formula)+'</p><small>'+esc(x.basis)+'</small></article>').join('')+'</div>'+(r.missing.length?'<p class="error">待補：'+esc(r.missing.join('、'))+'。缺少資料的項目不補零，案件暫不列入總覽合計。</p>':'')+'<p class="local-note">各項均為未扣資金、信用、資本及作業成本的潛在收入。公司活存＝（年導入收款－商戶金流費）× 留存天數 ÷ 365，再乘活存收益率。留存天數是假設，不是帳戶實際餘額。員工儲蓄自薪資支付後另計；不將薪資留存再加回公司存款。開戶只列需求，沒有收款或存款規劃時不獨立計價。網銀、外匯等未另定價的服務不列入本次合計。</p>';
}
export function valueMarkup(lead){
 let a;try{a=normalizeValueAssumptions(lead.valueAssumptions||{})}catch{a=normalizeValueAssumptions({})}
 return '<section class="detail-section relationship-value" id="relationshipValue"><div class="eyebrow">CUSTOMER INPUT → POTENTIAL VALUE</div><h3>客戶資料，直接推估往來貢獻</h3><p>依本案送出時的規劃、健檢與薪轉人數，自動估算首年商機。下列參數為可調整的示範假設。</p><div id="relationshipValueResult" aria-live="polite">'+resultMarkup(lead)+'</div><details><summary>查看／調整本案計算假設</summary><form id="relationshipValueForm"><div class="value-fields">'+VALUE_FIELDS.map(([key,label,,max])=>'<label>'+label+'<input type="number" min="0" max="'+max+'" step="any" name="'+key+'" value="'+(a[key]??'')+'" placeholder="'+'未設定'+'"></label>').join('')+'</div><p class="local-note">70%收費占比、50%本行取得比例與其他預設值均為示範假設，非已確認合作條件。前台若另填年導入收款，直接使用該金額，不再乘營收導入比例。放款以2%～2.5%為預設情境區間，兩端分別計算還款安排；不修改客戶原始試算。員工儲蓄持續累積，首年期初為0，假設不提領；離職不觸發既存儲蓄移出，離職後也不再新增該人的薪資。</p><button class="button" type="submit">儲存本案假設</button><p id="relationshipValueFeedback" role="status"></p></form></details></section>';
}
export function bindValue(lead,onSave){
 const form=document.getElementById('relationshipValueForm');if(!form)return;
 const feedback=document.getElementById('relationshipValueFeedback');
 const read=()=>normalizeValueAssumptions(Object.fromEntries(VALUE_FIELDS.map(([k])=>[k,form.elements[k].value])));
 form.addEventListener('input',()=>{try{document.getElementById('relationshipValueResult').innerHTML=resultMarkup({...lead,valueAssumptions:read()});feedback.textContent='預覽已更新；請儲存後再準備主管通知。';}catch(e){feedback.textContent=e.message;}});
 form.addEventListener('submit',e=>{e.preventDefault();try{onSave(read());feedback.textContent='本案假設已儲存，總覽與主管摘要已更新。';}catch(error){feedback.textContent=error.message;}});
}
