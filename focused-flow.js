import {calculate} from './engine.js';
import {mountOpportunity} from './opportunity.js?v=20261030';
import {snapshotContext,planningSummary} from './handoff-context.js';
const $=id=>document.getElementById(id),fmt=n=>n.toLocaleString('zh-TW',{maximumFractionDigits:1});
const fields=[
 ['sales','今年預估全年營收','萬元','已實現營收加上今年剩餘月份的預估。',0,100000000],
 ['nextSales','明年預估全年營收','萬元','依訂單與成長規劃估計，並非實際已收款。',0,100000000],
 ['cost','每 100 元營收的進貨／製造成本','%','例如賣 100 元、成本 75 元，就填 75。',0,200],
 ['dso','出貨後多久收到客戶貨款？','天','從出貨到實際收到錢的平均天數。',0,730],
 ['dio','進貨備料後多久賣出？','天','包含備料、製造與存貨等待時間。',0,730],
 ['dpo','進貨後多久付供應商？','天','現金進貨填 0，有帳期則填平均天數。',0,730],
 ['own','明年可投入的自有週轉資金','萬元','扣除受限制或專款專用資金。',0,100000000],
 ['existing','明年可用的既有週轉融資','萬元','已動用加上尚未動用、且確認明年可用的額度。',0,100000000],
 ['annualAvailable','未來一年可用來還款的現金','萬元','先扣營運、稅款及必要投資；不含新借款。',-100000000,100000000],
 ['annualDebt','未來一年全部借款本息','萬元','含既有與本次預估新增融資。不確定可留白。',0,100000000]
];
function fieldHTML([id,label,unit,help,min,max]){return `<div class="field"><label for="f_${id}">${label}</label><div class="input-unit"><input id="f_${id}" type="number" inputmode="decimal" step="any" min="${min}" max="${max}" aria-describedby="help_${id}"><span>${unit}</span></div><small id="help_${id}">${help}</small></div>`;}
$('operatingFields').innerHTML=fields.slice(0,6).map(fieldHTML).join('');$('fundingFields').innerHTML=fields.slice(6,8).map(fieldHTML).join('');$('repaymentFields').innerHTML=fields.slice(8).map(fieldHTML).join('');
let plan=null,context=null,dirty=true,baselineDso=null;
function setStage(n){if(n>1&&(!plan||dirty))n=1;document.querySelectorAll('[data-stage]').forEach(el=>el.hidden=Number(el.dataset.stage)!==n);document.querySelectorAll('[data-step]').forEach(el=>{if(Number(el.dataset.step)===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});$('simulator').scrollIntoView({behavior:'smooth'});document.querySelector(`[data-stage="${n}"] h2`)?.focus({preventScroll:true});}
function invalidated(){dirty=true;baselineDso=null;$('copySummary').disabled=true;$('toHandoff').disabled=true;$('formStatus').textContent='數字已變更，請重新計算。';window.dispatchEvent(new Event('esun-plan-updated'));}
function readInput(){const v={};for(const [id,label,,help,min,max]of fields){const raw=$('f_'+id).value.trim();if(raw===''&&id.startsWith('annual')){v[id]=null;continue}const value=Number(raw);if(raw===''||!Number.isFinite(value)||value<min||value>max){$('f_'+id).closest('details')?.setAttribute('open','');$('f_'+id).focus();throw new Error('請確認「'+label+'」的金額或天數。')}v[id]=value;}return v;}
function calculateCurrent(){const v=readInput(),out=calculate('working',v);context=snapshotContext({desiredMonth:$('desiredMonth').value,annualAvailable:v.annualAvailable,annualDebt:v.annualDebt});const inputs=Object.fromEntries(fields.slice(0,8).map(([key])=>[key,v[key]]));plan={model:'working',mode:'twd',inputs,out,at:new Date().toLocaleString('zh-TW',{hour12:false})};dirty=false;render();window.dispatchEvent(new Event('esun-plan-updated'));}
function render(){
 $('gapValue').textContent=fmt(plan.out.value);$('monthValue').textContent=context.desiredMonth?context.desiredMonth.replace('-',' 年 ')+' 月':'待確認';
 $('repaymentValue').textContent=context.repayment.status==='na'?'待確認':context.repayment.value;$('repaymentValue').className='status-'+context.repayment.status;
 $('repaymentAdvice').textContent=context.repayment.status==='na'?'資料未齊，或一年本息為 0；不判為健康。':context.repayment.advice;
 const d=plan.inputs;$('scenarioText').textContent=`這次以收款 ${d.dso} 天、備貨 ${d.dio} 天、付款 ${d.dpo} 天估算。`;
 if(baselineDso!==null){const base=calculate('working',{...d,dso:baselineDso});$('scenarioText').textContent=`收款由 ${baselineDso} 天變 ${d.dso} 天，缺口由 ${fmt(base.value)} 增至 ${fmt(plan.out.value)} 萬元，增加 ${fmt(plan.out.value-base.value)} 萬元。`;}
 $('slowCollection').hidden=baselineDso!==null||d.dso>700;$('restoreCollection').hidden=baselineDso===null;
 $('metrics').replaceChildren(...plan.out.metrics.map(m=>{const div=document.createElement('div'),label=document.createElement('span'),value=document.createElement('strong');label.textContent=m.label;value.textContent=m.value;div.append(label,value);return div}));
 $('formula').textContent=plan.out.formula;$('summaryText').value=planningSummary(plan,context);$('handoffSnapshot').textContent=`週轉缺口 ${fmt(plan.out.value)} 萬元 ／ 用款 ${context.desiredMonth||'待確認'} ／ 還款餘裕 ${context.repayment.value}`;
 $('copySummary').disabled=false;$('toHandoff').disabled=false;$('formError').textContent='';$('copyStatus').textContent='';
}
function loadDemo(){const sample={sales:12000,nextSales:13800,cost:75,dso:60,dio:75,dpo:45,own:500,existing:2000,annualAvailable:1200,annualDebt:900};for(const [key,value]of Object.entries(sample))$('f_'+key).value=value;$('desiredMonth').value=(new Date().getFullYear()+1)+'-01';document.querySelector('.optional').open=true;invalidated();$('formStatus').textContent='已帶入批發商的虛構示範值，含一年本息 900 萬元的情境假設，可自行調整。';setStage(1);}
$('loadDemo').addEventListener('click',loadDemo);$('loadDemoHero').addEventListener('click',loadDemo);
$('focusForm').addEventListener('input',invalidated);$('focusForm').addEventListener('submit',e=>{e.preventDefault();try{calculateCurrent();setStage(2)}catch(error){$('formError').textContent=error.message}});
$('clearForm').addEventListener('click',()=>{$('focusForm').reset();plan=null;context=null;invalidated();$('formError').textContent='';$('formStatus').textContent='已清空，可填入新的規劃條件。'});
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>setStage(Number(b.dataset.go))));$('toHandoff').addEventListener('click',()=>setStage(3));
$('slowCollection').addEventListener('click',()=>{if(!plan||dirty)return;baselineDso=plan.inputs.dso;$('f_dso').value=baselineDso+30;calculateCurrent();});
$('restoreCollection').addEventListener('click',()=>{if(baselineDso===null)return;$('f_dso').value=baselineDso;baselineDso=null;calculateCurrent();});
$('copySummary').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('summaryText').value);$('copyStatus').textContent='已複製本次摘要。'}catch{$('summaryText').closest('details').open=true;$('summaryText').focus();$('summaryText').select();$('copyStatus').textContent='請直接複製已選取的摘要文字。'}});
mountOpportunity({getPlan:()=>dirty?null:plan,getContext:()=>dirty?null:context,target:'#handoffMount',focused:true});
if(['#health','#documents','#models'].includes(location.hash))location.replace('tools.html'+location.hash);
