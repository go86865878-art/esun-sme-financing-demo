import {DEMO_CASES,getDemoCase,caseConsultation} from './demo-cases.js?v=cases1';
import {financingNeed} from './financing-need.js';
import {baseDocs,extraDocs,readDocumentChecks,DOCUMENT_STORAGE_KEY} from './document-data.js';
import {mountConsultation} from './consultation-form.js?v=services1';
import {planningCard} from './planning-cards.js?v=services1';
import {PLAN_EXAMPLES,HEALTH_EXAMPLES,PURPOSE_TITLES,profitabilityMarkup} from './franchise-scenarios.js';
import {mountTiming} from './timing.js';
import {buildConsultationSummary,consultationPrintHTML} from './consultation.js';
import {calculate,diagnose} from './engine.js';
import {downloadText} from './report.js';
import {buildPlanPdf,buildHealthPdf,downloadPdf} from './pdf-report.js?v=pdf1';
import {pairedHealth,sharedHealthPatch,readFinanceDraft,writeFinanceDraft} from './finance-state.js?v=pdf1';
const $=id=>document.getElementById(id);
const icons={route:'M5 5h5v5H5zM14 14h5v5h-5zM10 7h7v4M7 10v7h4',edit:'m15 4 5 5-11 11H4v-5ZM13 6l5 5M4 4h6M4 8h3',chart:'M4 3v17h17M8 15v-4m5 4V7m5 8V4',chat:'M4 4h16v12H9l-5 4ZM8 8h8M8 12h5',cycle:'M20 10a8 8 0 0 0-14-5L3 8m0-5v5h5M4 14a8 8 0 0 0 14 5l3-3m0 5v-5h-5',factory:'M3 21V9l6 4V7l6 4V3h5l1 18ZM7 17h1m4 0h1m4 0h1',store:'M3 10 5 3h14l2 7M4 10v11h16V10M8 21v-7h5v7M3 10c0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 3 3 3 0',globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z',scan:'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M3 12h18M8 8v1m4-1v1m4-1v1M8 15v1m4-1v1m4-1v1',wallet:'M20 7H4V4h15M3 7v13h18V7ZM17 11h4v5h-4z',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',file:'M14 3H5v18h14V8Zm0 0v5h5M8 12h8m-8 4h6',shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6',box:'m3 7 9-4 9 4v10l-9 4-9-4Zm0 0 9 4 9-4M12 11v10M7 5l9 4',truck:'M3 5h11v12H3Zm11 5h4l3 4v3h-7M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z'};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]||icons.chart}"/></svg>`}
function decorate(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const f=(id,label,value,unit,help,min=0,max=undefined)=>({id,label,value,unit,help,min,max});
const models={
working:{title:'營運週轉金',en:'WORKING CAPITAL',icon:'cycle',desc:'先備貨、再出貨、最後收錢。用今年與明年的營收金額，估算週轉資金的變化。',fields:[f('sales','今年預估全年營收',12000,'萬元','用已實現營收，加上今年剩餘月份的預估。'),f('nextSales','明年預估全年營收',13800,'萬元','例如今年 1.2 億、明年估 1.38 億，填 13,800。'),f('cost','每 100 元營收的進貨／製造成本',75,'%','例如賣 100 元，商品或製造成本約 75 元，就填 75。可超過 100，代表成本高於營收。',0,200),f('dso','出貨後，大約多久收到錢？',60,'天','現金交易填 0；月結 30 天可先填 30，再考量結帳等待。',0,730),f('dio','進貨後，大約多久賣掉？',75,'天','包含原料備料、製造到賣出。無庫存的服務業可填 0。',0,730),f('dpo','進貨貨款，大多什麼時候付？',45,'天','從收到貨到付款的平均時間；現金進貨填 0。',0,730),f('own','明年可投入的自有週轉資金',500,'萬元','可用於這個營運規模的現金，避免把受限制或專款專用資金算進來。'),f('existing','明年可用的既有週轉融資',2000,'萬元','只填已確認可使用的額度，不重複計入自有資金。')],explain:'<b>為什麼訂單增加，錢反而不夠用？</b>收款前，可能已先付了貨款。這個模型分別估算應收貨款、庫存與應付貨款的占用，再比較今年與明年。自有資金與既有融資是拿來支應「明年總需求」，不是只扣在新增需求上。<br>季節性備貨、工程進度請款、保留款與長期專案，請另與專員討論。'},
equipment:{title:'廠房與設備',en:'FACTORY & EQUIPMENT',icon:'factory',desc:'先看總投入與自有資金，再把外部資金需求展開成每年的本金與利息。',fields:[f('invest','購置／興建與設備總預算',5000,'萬元','包含土地、工程、設備等本次專案支出；依實際計畫填寫。'),f('equity','預計投入自有資金',1500,'萬元','已備妥、可用於這個專案的資金。'),f('interest','假設貸款年利率',3,'%','只用於情境試算，並非銀行報價。',0,30),f('tenor','預計貸款總年數',7,'年','包含本金寬限期；採年繳等額本金估算。',1,30),f('grace','前幾年先付息、不還本金？',1,'年','寬限期仍須付息；期滿後，每年本金負擔會提高。',0,29),f('annualBudget','每年預計可支付的還款本息',950,'萬元','用來和「每年預計還款金額」比較；請另保留既有債務與營運所需資金。')],explain:'<b>每年預計還款金額，拆開給您看。</b>本模型以年繳等額本金估算，利息隨本金餘額下降。右方列出每一年的本金、利息與合計，也會對照您預計能負擔的金額。<br>興建期間若採分次撥款，或有追加工程、建設期利息與投產延遲，需要另外估算。本次先假設一次撥足。'},
expansion:{title:'展店與擴張',en:'NEW STORE & EXPANSION',icon:'store',desc:'一家新店不會第一天就滿座。把初期投入、爬坡期間與成熟期的營運餘額一起看。',fields:[f('setup','裝修、設備與開辦總投入',1200,'萬元','包含押金與裝修等一次性支出，避免和營運預備金重複。'),f('reserve','預留給新店的營運預備金',150,'萬元','用來支應爬坡期虧損、本息與意外支出；右方會檢查這筆錢夠不夠。'),f('equity','預計投入自有資金',450,'萬元','可投入本次展店的資金。'),f('revenue','生意穩定後，每月預估營收',200,'萬元','成熟期平均值，請一起考量平假日與淡旺季。'),f('margin','每賣 100 元，扣變動成本後剩多少？',45,'%','扣商品、食材、包材、平台抽成等，留下來付租金、人事與貸款的比例。',0,100),f('fixed','每月固定支出',70,'萬元','例如租金、固定人事、水電基本支出；勿重複計入上面的變動成本。'),f('ramp','新店需要幾個月才穩定？',6,'月','前期先以成熟期營收的 50% 估算，另外估算爬坡營運與本息不足額，檢查預備金是否充足。',0,60),f('interest','假設貸款年利率',3,'%','情境假設，並非銀行報價；採月繳本息平均攤還。',0,30),f('tenor','預計還款年數',5,'年','不設定寬限期；可在右方查看年度還款。',1,30),f('annualBudget','每年預計可支付的還款本息',300,'萬元','除了新店，也請考量公司其他店面的金流與既有還款。')],explain:'<b>先顧新店能不能活，再談多久回本。</b>資金需求包含開辦投入與營運預備金，另檢查預備金是否足以支應爬坡營運不足額。右方另呈現成熟期的還款後餘額與損益平衡營收。<br>此處的營運餘額未扣稅、折舊與後續資本支出，不等於會計淨利；爬坡期間的貸款本息已列入預備金檢查，仍需依實際付款時點調度。'},
overseas:{title:'海外投資',en:'OVERSEAS INVESTMENT',icon:'globe',desc:'依實際支付幣別編列預算：只付台幣、只付美元，或兩種幣別同時使用。',fields:[f('investTwd','台幣支出預算',3000,'萬元','以台幣支付的設備、工程或其他投資支出。'),f('equityTwd','可投入的台幣自有資金',1000,'萬元','限對應台幣預算；本次不自動跨幣別抵用。'),f('investUsd','美元支出預算',500,'萬美元','請填實際以美元支付的預算，不把台幣支出再次換算加入。'),f('equityUsd','可投入的美元自有資金',150,'萬美元','限對應美元預算；若要換匯支應其他幣別，需另行規劃。'),f('fx','假設 1 美元兌多少台幣？',32,'元','手動輸入規劃匯率，非即時牌告或成交匯率。',.01,1000),f('swing','美元升值壓力情境',10,'%','例如填 10，表示美元兌台幣比基準貴 10%。',0,100),f('buffer','另外保留的資金緩衝',10,'%','按各幣別尚不足的金額加計，預留成本追加空間。',0,100),f('months','距離投產／開業還有多久？',18,'月','作為計畫提醒；本版未按月份自動估算利息或營運虧損。',1,120)],explain:'<b>先分幣別看缺口，再看匯率。</b>雙幣別指「投資預算」同時有台幣與美元，不等於推薦雙幣借款。每個幣別的自有資金只抵同幣預算，超額不跨幣抵用。<br>美元升值只增加美元部分的台幣等值；不會讓既有美元本金本身變多。海外借款主體、還款收入幣別、稅務與分期撥付，請再與專員討論。'}
};
const healthFields=[f('cash','現在可動用的現金與銀行存款',1200,'萬元','同一月底餘額；扣除受限制、質押或不能動用的存款。'),f('receipts','一年內預計收得到的客戶貨款',1800,'萬元','同一月底尚未收回的貨款；扣除預計收不回的部分。'),f('stock','手上可賣的存貨，成本約多少？',1500,'萬元','同一月底的成本金額；扣除過期、呆滯或無法出售部分。'),f('shortDebt','一年內必須付出的款項合計',3000,'萬元','同一月底的短期借款、到期本金、應付貨款、稅款等；不要重複。'),f('totalDebt','公司還欠外面多少錢？',6000,'萬元','同一月底全部借款與應付款，包含上面一年內須支付的款項。'),f('assets','公司擁有的資產帳面總值',10000,'萬元','同一月底現金、貨款、存貨、土地廠房設備等合計；可請會計協助。'),f('sales','一年賣出多少錢？',12000,'萬元','取同一年度營收金額。'),f('profit','一年做生意賺或賠多少？',720,'萬元','同一年度扣成本與營業費用後、未扣利息和稅的營業利益；虧損填負數。',null),f('annualAvailable','未來一年可拿來還款的現金',1200,'萬元','先扣維持營運、稅款、必要投資及週轉需求；不足可填負數，不把新借款當成還款來源。',null),f('annualDebt','未來一年所有借款要還多少本息？',900,'萬元','包括全部銀行及其他借款本金與利息；無借款還款則填 0。')];


Object.entries(PURPOSE_TITLES).forEach(([key,title])=>{models[key].title=title;models[key].fields.forEach(field=>field.value='');});
healthFields.forEach(field=>field.value='');
models.working.desc='從備料、平台撥款到供應商帳期，先估算日常營運需要多少週轉金。';
models.expansion.desc='把加盟金、裝修、設備與開店爬坡期一起規劃，先看資金，再看店能不能撐過起步期。';
models.equipment.desc='從中央廚房、冷鏈、製程到門市設備，將大筆投入拆成可掌握的還款安排。';
models.overseas.desc='海外拓店先分清台幣與美元支出，再看匯率變動會增加多少台幣資金壓力。';
let consultationFlow=null,activeTeachingCase=null;
let financeReady=false,financeTouched=false,salesLinked=true,restoringFinance=false,applyingFinance=false,healthLink={kind:'manual',name:'自行填寫的財務資料',note:'未填欄位不作推估。'};
let current='working',mode='dual',lastPlan=null,lastHealth=null,planDirty=false,healthDirty=false;
const drafts={},checkedDocs=readDocumentChecks();
let timing=null,timingState={ready:false,stale:false},healthStep=0;
const healthGroups=[{title:'付款能力',desc:'先盤點手邊資金、待收貨款與近期要付的款項。',ids:['cash','receipts','stock','shortDebt']},{title:'獲利情況',desc:'用同一年度的營收與營業利益，看本業賺不賺錢。',ids:['sales','profit']},{title:'負債與還款',desc:'再看整體負債與未來一年的還款安排。',ids:['totalDebt','assets','annualAvailable','annualDebt']}];
const healthSources={cash:'銀行存款餘額、公司現金日報或出納紀錄。',receipts:'應收帳款明細；請會計扣除預估收不回的貨款。',stock:'存貨明細或盤點表，以成本金額填寫。',shortDebt:'應付帳款與借款到期明細；可請會計協助合計。',totalDebt:'資產負債表的負債總額，或全部借款、應付款明細。',assets:'同一月底資產負債表的資產總額。',sales:'同一年度損益表營業收入；申報資料可供核對。',profit:'同一年度損益表的營業利益（尚未扣利息與稅）。',annualAvailable:'未來一年資金收支預估；請先保留營運、稅款與必要投資。',annualDebt:'全部借款的還款表，合計未來一年本金與利息。'};
const fmt=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:d}):'不適用';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,3500)}
function fieldsMarkup(fields,values,prefix){return fields.map(x=>`<div class="field" data-field="${x.id}"><label for="${prefix}${x.id}">${x.label}</label><div class="input-wrap"><input id="${prefix}${x.id}" name="${x.id}" type="number" inputmode="decimal" step="any" value="${escape(values?.[x.id]??x.value)}" ${x.min!=null?`min="${x.min}"`:''} ${x.max!==undefined?`max="${x.max}"`:''} ${prefix==='h_'?'':'required'} aria-describedby="${prefix}${x.id}_help"><span>${x.unit}</span></div><small id="${prefix}${x.id}_help">${x.help}</small>${prefix==='h_'?`<small class="source-hint"><b>資料可從這裡找：</b>${healthSources[x.id]}</small>`:''}</div>`).join('')}
function capture(){drafts[current]=Object.fromEntries(models[current].fields.map(x=>[x.id,$('p_'+x.id).value]));}
function values(fields,prefix){const v={};for(const f of fields){const el=$(prefix+f.id);if(prefix==='p_'&&el.closest('[hidden]')){v[f.id]=0;continue}if(prefix==='h_'&&el.value.trim()===''){v[f.id]=null;continue}const focus=()=>{if(prefix==='h_')setHealthStep(healthGroups.findIndex(g=>g.ids.includes(f.id)));el.focus()};if(el.value.trim()===''||!Number.isFinite(Number(el.value))){focus();throw Error('請完整填寫「'+f.label+'」。')}const n=Number(el.value);if(f.min!=null&&n<f.min||f.max!==undefined&&n>f.max){focus();throw Error('請確認「'+f.label+'」的數值範圍。')}v[f.id]=n;}if(prefix==='h_'&&Object.values(v).every(x=>x===null))throw Error('請先填寫至少一項金額，或帶入示範值體驗。');return v}
function clearResult(){lastPlan=null;planDirty=false;$('emptyResult').hidden=false;$('resultContent').hidden=true;$('resultStatus').textContent='等待試算';$('resultStatus').classList.remove('dirty');$('resultContent').classList.remove('plan-stale');$('planStaleWarning').hidden=true;timing?.setPlan(null);updateHandoffState()}
function renderModel(){const m=models[current];$('modelTitle').textContent=m.title;$('modelKicker').textContent=m.en;$('modelDesc').textContent=m.desc;$('modelIcon').innerHTML=icon(m.icon);$('modelFields').innerHTML=fieldsMarkup(m.fields,drafts[current],'p_');$('explanation').innerHTML=m.explain;$('industryRow').hidden=current!=='working';$('currencyModes').hidden=current!=='overseas';$('cashServices').hidden=current!=='expansion';$('validation').textContent='';$('planDataNote').innerHTML=drafts[current]?'已保留本次編輯內容；請確認所有金額與單位。':'請自行填入資料；金額單位為萬元。也可展開參考案例，選擇後再帶入。';document.querySelectorAll('[data-model]').forEach(b=>{b.classList.toggle('active',b.dataset.model===current);b.setAttribute('aria-pressed',b.dataset.model===current)});applyMode();clearResult();renderDocs();renderExampleOptions();}
function applyMode(){if(current!=='overseas')return;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',b.dataset.mode===mode)});['investTwd','equityTwd'].forEach(id=>{const node=$('p_'+id).closest('.field');node.hidden=mode==='usd';$('p_'+id).disabled=node.hidden});['investUsd','equityUsd'].forEach(id=>{const node=$('p_'+id).closest('.field');node.hidden=mode==='twd';$('p_'+id).disabled=node.hidden});['fx','swing'].forEach(id=>{$('p_'+id).closest('.field').hidden=mode==='twd';$('p_'+id).disabled=mode==='twd'});}
function markPlanDirty(){financeTouched=true;$('planDataNote').textContent='已編輯資料；請確認所有金額與單位，再按更新。';if(lastPlan){planDirty=true;$('resultStatus').textContent='舊結果，請重新計算';$('resultStatus').classList.add('dirty');$('downloadPlan').disabled=true;$('resultContent').classList.add('plan-stale');$('planStaleWarning').hidden=false;timing?.markStale('年度試算資料已變更，請先更新試算。')}updateHandoffState()}
function barMarkup(items,unit){const max=Math.max(1,...items.map(x=>Math.abs(x.value)));return items.map(x=>`<div class="bar ${x.value<0?'negative':''}"><div><span>${escape(x.label)}</span><b>${fmt(x.value)} ${escape(unit)}</b></div><div class="track"><span style="width:${Math.max(0,Math.min(100,Math.abs(x.value)/max*100))}%"></span></div></div>`).join('')}
function renderPlan(out,v){$('emptyResult').hidden=true;$('resultContent').hidden=false;$('resultLabel').textContent=out.label;$('resultValue').textContent=fmt(out.value);$('resultUnit').textContent=out.unit;$('resultSub').textContent=out.sub;$('resultMetrics').innerHTML=out.metrics.map(x=>`<div class="metric"><small>${escape(x.label)}</small><b>${escape(x.value)}</b></div>`).join('');$('resultBars').innerHTML=barMarkup(out.breakdown,'萬元');$('resultFormula').textContent=out.formula;$('resultNote').textContent=out.note;$('resultStatus').textContent='已更新';$('resultStatus').classList.remove('dirty');$('downloadPlan').disabled=false;const at=new Date().toLocaleString('zh-TW',{hour12:false});lastPlan={model:current,mode,inputs:v,out,at};planDirty=false;$('resultTime').textContent='本次試算：'+at;$('resultContent').classList.remove('plan-stale');$('planStaleWarning').hidden=true;timing?.setPlan(lastPlan);updateHandoffState();
$('cycleGraphic').hidden=current!=='working';if(current==='working'){$('cycleGraphic').innerHTML=`<b>您的生意，錢怎麼走？</b><div class="cycle-flow"><div class="cycle-node"><i>${icon('box')}</i><span>進貨備料</span></div><div class="cycle-link"></div><div class="cycle-node"><i>${icon('truck')}</i><span>約 ${fmt(v.dio,0)} 天後賣出</span></div><div class="cycle-link"></div><div class="cycle-node"><i>${icon('wallet')}</i><span>再 ${fmt(v.dso,0)} 天收款</span></div></div><p>進貨後約 ${fmt(v.dpo,0)} 天付供應商。示意等待時間：${fmt(v.dio+v.dso-v.dpo,0)} 天。實際資金金額仍依營收及成本分別計算。</p>`}
$('schedule').hidden=!out.schedule?.length;if(out.schedule?.length)$('schedule').innerHTML='<b class="tiny">每年預計還款金額｜新臺幣萬元</b><table><thead><tr><th>年度</th><th>本金</th><th>利息</th><th>本息合計</th></tr></thead><tbody>'+out.schedule.map(r=>`<tr><td>第 ${r.year} 年</td><td>${fmt(r.principal)}</td><td>${fmt(r.interest)}</td><td>${fmt(r.total)}</td></tr>`).join('')+'</tbody></table>';
}
function doCalculate(){try{const v=values(models[current].fields,'p_');if(current==='overseas'){v.mode=mode;if(mode==='twd'){v.fx=32;v.swing=0;}}const out=calculate(current,v);capture();$('validation').textContent='';renderPlan(out,v);syncHealthFromPlan()}catch(e){$('validation').textContent=e.message;markPlanDirty();}}
function renderDocs(){
 document.querySelectorAll('[data-document-link]').forEach(link=>{
   const anchor=link.dataset.documentLink||'documents';
   link.href='documents.html?model='+encodeURIComponent(current)+'#'+anchor;
 });
 refreshDocumentStatus();
}
function refreshDocumentStatus(){
 const saved=readDocumentChecks();checkedDocs.clear();saved.forEach(key=>checkedDocs.add(key));
 const docs=[...baseDocs,...extraDocs[current]],count=docs.filter(x=>checkedDocs.has(x[1])).length;
 const message='目前用途：'+models[current].title+'；文件已準備 '+count+' / '+docs.length+' 項，勾選狀態會帶入本次諮詢摘要。';
 if($('documentsContext'))$('documentsContext').textContent=message;
 if($('consultationDocsState'))$('consultationDocsState').textContent=message;
 updateHandoffState();
}
addEventListener('storage',event=>{if(event.key===DOCUMENT_STORAGE_KEY||event.key===null)refreshDocumentStatus()});
addEventListener('focus',refreshDocumentStatus);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDocumentStatus()});

const statusNames={green:'健康',yellow:'注意',red:'警示',na:'不適用'};
function healthDefinitions(items){$('definitionContent').innerHTML=items.map(x=>`<div class="definition"><b>${escape(x.label)}</b><p>${escape(x.definition)}</p></div>`).join('');}
function doHealth(){try{const v=values(healthFields,'h_');const r=diagnose(v);$('healthError').textContent='';const at=new Date().toLocaleString('zh-TW',{hour12:false});lastHealth={inputs:v,out:r,at};healthDirty=false;$('healthStatus').textContent='整體：'+(statusNames[r.overall]||r.overall);$('healthStatus').classList.remove('dirty');$('healthResults').classList.remove('stale-results');$('healthStaleWarning').hidden=true;$('healthResults').innerHTML=r.items.map(x=>`<div class="health-item ${x.status}"><div class="health-item-top"><b>${escape(x.label)}</b><span class="badge ${x.status}">${statusNames[x.status]}</span></div><div class="score">${escape(x.value)}</div><p>${escape(x.advice)}</p></div>`).join('')+`<p class="tiny">資料更新時間：${at}</p>`;$('profitChart').innerHTML=profitabilityMarkup(v);$('profitChart').classList.remove('stale-results');healthDefinitions(r.items);$('downloadHealth').disabled=false;$('printHealth').disabled=false;updateHandoffState();}catch(e){$('healthError').textContent=e.message;markHealthDirty();}}
function markHealthDirty(){financeTouched=true;healthDirty=true;$('profitChart').classList.add('stale-results');$('healthDataNote').textContent='已編輯資料；不確定的金額可留白，請更新後查看新結果。';if(lastHealth){healthDirty=true;$('healthStatus').textContent='舊結果，請重新計算';$('healthStatus').classList.add('dirty');$('healthResults').classList.add('stale-results');$('healthStaleWarning').hidden=false;$('downloadHealth').disabled=true;$('printHealth').disabled=true;}updateHandoffState()}
function pdfData(){const form=$('consultationForm')?.elements;return {plan:lastPlan,health:healthDirty?null:lastHealth,company:form?.company?.value||activeTeachingCase?.company||'',address:form?.address?.value||activeTeachingCase?.address||'',month:$('plannedUseMonth').value,sourceNote:healthLink.name+'。'+healthLink.note,fields:models[current].fields,documents:[...baseDocs,...extraDocs[current]].map(x=>({title:x[1],ready:checkedDocs.has(x[1])}))};}
async function downloadPlan(){if(!lastPlan||planDirty)return toast('請先更新試算結果。');const button=$('downloadPlan');button.disabled=true;try{const data=pdfData();const pdf=await buildPlanPdf(data);downloadPdf('企業財務規劃_'+models[data.plan.model].title+'.pdf',pdf);toast('已產生財務規劃 PDF。');}catch(error){toast('PDF 產生失敗：'+error.message)}finally{button.disabled=planDirty||!lastPlan;}}
async function downloadHealth(){if(!lastHealth||healthDirty)return toast('請先更新健檢結果。');const button=$('downloadHealth');button.disabled=true;try{const data=pdfData();if(planDirty)data.plan=null;const pdf=await buildHealthPdf(data);downloadPdf('企業財務健檢報告.pdf',pdf);toast('已產生財務健檢 PDF。');}catch(error){toast('PDF 產生失敗：'+error.message)}finally{button.disabled=healthDirty||!lastHealth;}}
document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>{capture();current=b.dataset.model;renderModel();$('simulator').scrollIntoView({behavior:'smooth'});}));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;applyMode();clearResult();}));
$('modelForm').addEventListener('submit',e=>{e.preventDefault();doCalculate()});$('modelForm').addEventListener('input',markPlanDirty);$('reset').addEventListener('click',()=>{financeTouched=true;activeTeachingCase=null;$('activeCaseSummary').hidden=true;delete drafts[current];renderModel()});$('loadExample').addEventListener('click',()=>{const presets={trade:{cost:75,dso:60,dio:75,dpo:45},manufacture:{cost:75,dso:90,dio:90,dpo:60},retail:{cost:65,dso:7,dio:45,dpo:30},service:{cost:50,dso:45,dio:0,dpo:30}};for(const [k,v]of Object.entries(presets[$('industry').value]))$('p_'+k).value=v;markPlanDirty();toast('已帶入操作範例，請按更新試算。')});$('downloadPlan').addEventListener('click',downloadPlan);
renderHealthSteps();$('healthForm').addEventListener('submit',e=>{e.preventDefault();doHealth()});$('healthForm').addEventListener('input',event=>{if(event.target.id==='h_sales')salesLinked=false;healthLink={kind:'manual',name:'自行填寫的財務資料',note:'請確認期間與公司主體一致；新增規劃另列於下方。'};markHealthDirty();saveFinanceProgress();});$('downloadHealth').addEventListener('click',downloadHealth);$('printHealth').addEventListener('click',downloadHealth);
decorate();renderModel();


function renderHealthSteps(){
 $('healthSteps').innerHTML=healthGroups.map((g,i)=>`<button type="button" class="health-step" data-health-step="${i}" aria-controls="healthGroup${i}"><span>STEP ${i+1}</span>${g.title}</button>`).join('');
 $('healthFields').classList.remove('fields');
 $('healthFields').innerHTML=healthGroups.map((g,i)=>`<section class="health-step-panel" id="healthGroup${i}"><p>${g.desc}</p><div class="fields">${fieldsMarkup(g.ids.map(id=>healthFields.find(f=>f.id===id)),null,'h_')}</div></section>`).join('');
 $('healthSteps').addEventListener('click',e=>{const b=e.target.closest('[data-health-step]');if(b)setHealthStep(Number(b.dataset.healthStep))});
 $('healthPrev').addEventListener('click',()=>setHealthStep(healthStep-1));$('healthNext').addEventListener('click',()=>setHealthStep(healthStep+1));setHealthStep(0);
}
function setHealthStep(i){healthStep=Math.max(0,Math.min(2,i));document.querySelectorAll('.health-step-panel').forEach((e,j)=>e.hidden=j!==healthStep);document.querySelectorAll('[data-health-step]').forEach((e,j)=>{if(j===healthStep)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current')});$('healthPrev').hidden=healthStep===0;$('healthNext').hidden=healthStep===2;$('healthSubmit').hidden=healthStep!==2;$('healthStepNote').textContent='第 '+(healthStep+1)+'／3 步。可切換步驟；最後按更新才產生結果。'}
function updateHandoffState(){refreshHealthLink();saveFinanceProgress();if(!$('copyConsultation'))return;let message='摘要已備妥；可在下方諮詢表單附上這份規劃，建立後台示範需求。';let blocked=false;if(!lastPlan||planDirty){message='請先更新上方試算，才可產生本次摘要。';blocked=true}else if(healthDirty){message='健檢資料已變更，請先更新健檢，再產生合併摘要。';blocked=true}else if(timingState.stale){message='月度資料已變更，請先更新月度資金規劃，或清除月度資料。';blocked=true}$('copyConsultation').disabled=blocked;$('printConsultation').disabled=blocked;$('handoffState').textContent=message;$('consultationPreview').value=blocked?'':getConsultation();$('planningCard').innerHTML=planningCard(getPlanningContext());consultationFlow?.refresh();}
function getConsultation(){return buildConsultationSummary({plan:lastPlan,health:healthDirty?null:lastHealth,title:models[current].title,desiredMonth:$('plannedUseMonth').value,timing:timing?.getSummary(),documents:[...baseDocs,...extraDocs[current]].map(x=>({title:x[1],ready:checkedDocs.has(x[1])}))});}
$('clearHealth').addEventListener('click',()=>{financeTouched=true;salesLinked=false;healthLink={kind:'manual',name:'自行填寫的財務資料',note:'未填欄位不作推估。'};healthFields.forEach(f=>$('h_'+f.id).value='');lastHealth=null;healthDirty=false;$('healthResults').innerHTML='<div class="empty-result"><p>填入至少一項金額，按下更新再查看結果。</p></div>';$('healthResults').classList.remove('stale-results');$('healthStaleWarning').hidden=true;$('healthStatus').textContent='等待健檢';$('healthStatus').classList.remove('dirty');$('definitionContent').innerHTML='';$('profitChart').innerHTML=profitabilityMarkup({});$('profitChart').classList.remove('stale-results');$('healthError').textContent='';$('downloadHealth').disabled=true;$('printHealth').disabled=true;$('healthDataNote').textContent='目前為空白欄位；不確定可留白，資料不足的指標不判為健康。';setHealthStep(0);updateHandoffState()});
$('healthExample').addEventListener('click',()=>{if($('healthScenario').value==='linked'){if(activeTeachingCase)setLinkedHealth({values:activeTeachingCase.health,name:activeTeachingCase.company,note:'完整案例投資前資料，尚未加入本案新增借款。'},'case');else setLinkedHealth(pairedHealth(current,Number($('businessExample').value)||0));}else{const preset=HEALTH_EXAMPLES.find(x=>x.id===$('healthScenario').value)||HEALTH_EXAMPLES[0];setLinkedHealth({...preset,note:'獨立健檢情境，與本次投資規劃分開判讀。'},'independent');}setHealthStep(1);doHealth();});
$('plannedUseMonth').addEventListener('input',updateHandoffState);
$('copyConsultation').addEventListener('click',async()=>{if($('copyConsultation').disabled)return;const text=getConsultation();$('consultationPreview').value=text;try{await navigator.clipboard.writeText(text);toast('已複製本次諮詢摘要，可留存或帶去討論。')}catch{$('consultationPreview').closest('details').open=true;$('consultationPreview').focus();$('consultationPreview').select();toast('請在摘要欄位選取複製。')}});
$('printConsultation').addEventListener('click',()=>{if($('printConsultation').disabled)return;const w=window.open('','_blank');if(!w)return toast('請允許開啟摘要視窗，或使用複製摘要。');w.document.write(consultationPrintHTML(getConsultation()));w.document.close();w.focus();});
timing=mountTiming({target:'#monthlyPlanner',getPlan:()=>planDirty?null:lastPlan,onChange:state=>{timingState=state;updateHandoffState()}});
updateHandoffState();

function getPlanningContext(){
 return {plan:planDirty?null:lastPlan,health:healthDirty?null:lastHealth,currentModel:current,desiredMonth:$('plannedUseMonth').value,documents:[...baseDocs,...extraDocs[current]].map(x=>({title:x[1],ready:checkedDocs.has(x[1])})),summary:lastPlan&&!planDirty&&!healthDirty&&!timingState.stale?getConsultation():'',planDirty,healthDirty,timingStale:timingState.stale};
}
function renderExampleOptions(){$('businessExample').innerHTML=PLAN_EXAMPLES[current].map((x,i)=>'<option value="'+i+'">'+escape(x.name)+'</option>').join('');}
$('loadBusinessExample').addEventListener('click',()=>{const i=Number($('businessExample').value)||0,p=PLAN_EXAMPLES[current][i];activeTeachingCase=null;$('activeCaseSummary').hidden=true;const url=new URL(location.href);url.searchParams.delete('case');history.replaceState(null,'',url);for(const [key,value]of Object.entries(p.values)){if($('p_'+key))$('p_'+key).value=value;}setLinkedHealth(pairedHealth(current,i));markPlanDirty();doCalculate();doHealth();$('planDataNote').textContent='示範情境：'+p.name+'；已同步配對健檢，兩邊可分別修改。';toast('同一情境的試算與健檢已一起更新。');});
$('healthScenario').innerHTML='<option value="linked">與本次規劃相同的情境</option>'+HEALTH_EXAMPLES.map(p=>'<option value="'+p.id+'">'+escape(p.name)+'</option>').join('');
$('healthScenarioNote').textContent='選擇後按帶入才會填值；帶入後每一欄都可以修改。全部範例為教學假設。';
$('healthScenario').addEventListener('change',()=>{const p=HEALTH_EXAMPLES.find(p=>p.id===$('healthScenario').value);$('healthScenarioNote').textContent=p?p.note+' 按下帶入情境並更新，即可比較獲利圖表。':'帶入與本次規劃配對的完整健檢數字。';});
$('profitChart').innerHTML=profitabilityMarkup({});
consultationFlow=mountConsultation({target:'#consultation',getContext:getPlanningContext});
updateHandoffState();
// The full case workflow fills the real calculators and consultation form.
function applyTeachingCase(id){
 const item=getDemoCase(id);if(!item)return;
 document.querySelector('#monthlyPlanner .timing-reset')?.click();
 financeTouched=true;applyingFinance=true;activeTeachingCase=item;current=item.model;mode=item.input.mode||'dual';drafts[current]={...item.input};renderModel();
 $('plannedUseMonth').value=item.month;
 setLinkedHealth({values:item.health,name:item.company,note:'完整案例投資前資料，尚未加入本案新增借款。'},'case');
 doCalculate();doHealth();applyingFinance=false;
 consultationFlow.fillCase({...caseConsultation(item,lastPlan),city:item.city,district:item.district,services:item.services});
 $('planDataNote').textContent='完整案例：'+item.shortName+'｜RM '+item.rm+'。數值已計算；可修改後重新試算。';
 $('healthDataNote').textContent='案例健檢：'+item.company+'。為投資前資料，尚未計入本案新增借款。';
 $('casePicker').value=item.id;
 $('activeCaseSummary').hidden=false;
 $('activeCaseName').textContent=item.shortName+' · RM '+item.rm;
 $('activeCaseStory').textContent=item.story;
 $('activeCaseAddress').textContent=item.address;
 $('activeCaseNote').textContent=item.insight;
 $('activeCaseReport').href='case-guide.html#case-'+item.id;
 const url=new URL(location.href);url.searchParams.set('case',item.id);url.hash='simulator';history.replaceState(null,'',url);
 window.dispatchEvent(new CustomEvent('esun-case-loaded',{detail:{model:item.model}}));
 updateHandoffState();$('simulator').scrollIntoView({block:'start',behavior:'instant'});
 toast('已帶入'+item.shortName+'的試算、健檢、地址及諮詢內容。');
}
$('casePicker').innerHTML=DEMO_CASES.map(item=>'<option value="'+item.id+'">'+item.shortName+' · '+item.rm+'</option>').join('');
$('casePicker').value='02';
$('applyTeachingCase').addEventListener('click',()=>applyTeachingCase($('casePicker').value));
function setLinkedHealth(preset,kind='paired'){
 financeTouched=true;salesLinked=kind!=='independent';healthLink={kind,name:preset.name,note:preset.note};healthFields.forEach(f=>$('h_'+f.id).value=preset.values[f.id]??'');
 $('healthScenario').value=(kind==='independent'?(preset.id||''):'linked');$('healthDataNote').textContent='已帶入：'+preset.name+'。'+preset.note;markHealthDirty();
}
function syncHealthFromPlan(){
 if(applyingFinance||restoringFinance||!lastPlan)return;
 const wasReady=!!lastHealth&&!healthDirty,patch=sharedHealthPatch(lastPlan);
 if(salesLinked&&Number.isFinite(patch.sales)&&$('h_sales').value!==String(patch.sales)){
  $('h_sales').value=patch.sales;markHealthDirty();
  $('healthDataNote').textContent='全年營收已連結週轉金試算；其餘財務金額請自行填寫。營收也可直接修改，改後以您填寫的健檢值為準。';
  if(wasReady)doHealth();
 }
 refreshHealthLink();saveFinanceProgress();
}
function refreshHealthLink(){const box=$('healthPlanLink');if(!box)return;if(!lastPlan||planDirty){box.textContent='先更新資金試算，這裡會顯示同一份規劃。';return;}const need=financingNeed(lastPlan),e=lastPlan.out.extra||{};let repayment=Number.isFinite(e.monthlyPayment)?'；本案每月本息 '+fmt(e.monthlyPayment,2)+' 萬元':Number.isFinite(e.peakAnnual)?'；本案最高年度本息 '+fmt(e.peakAnnual,2)+' 萬元':'';box.innerHTML='<b>已連結：'+escape(models[lastPlan.model].title)+'</b><p>融資規劃需求 '+fmt(need.amount,2)+' 萬元'+repayment+'</p><small>新增需求另列，未直接計入公司負債與原有本息。展店營運餘額不等於會計營業利益。</small>';}
function saveFinanceProgress(){if(!financeReady||!financeTouched||restoringFinance||applyingFinance||!$('h_cash')||!$('p_'+models[current].fields[0].id))return;writeFinanceDraft({current,mode,planInputs:Object.fromEntries(models[current].fields.map(f=>[f.id,$('p_'+f.id).value])),healthInputs:Object.fromEntries(healthFields.map(f=>[f.id,$('h_'+f.id).value])),planReady:!!lastPlan&&!planDirty,healthReady:!!lastHealth&&!healthDirty,healthLink,salesLinked,caseId:activeTeachingCase?.id||null,month:$('plannedUseMonth').value,example:$('businessExample').value});}
function restoreFinanceProgress(saved){
 restoringFinance=true;financeTouched=true;
 try{
  current=saved.current;mode=['twd','usd','dual'].includes(saved.mode)?saved.mode:'dual';
  drafts[current]=saved.planInputs;renderModel();
  healthFields.forEach(f=>$('h_'+f.id).value=saved.healthInputs[f.id]??'');
  healthLink={kind:'manual',name:'上次填寫的財務資料',note:'所有欄位都能修改，送出前請重新確認。'};
  salesLinked=saved.salesLinked===true;activeTeachingCase=null;$('activeCaseSummary').hidden=true;
  $('plannedUseMonth').value=saved.month||'';$('businessExample').value=saved.example||'0';
  healthDirty=Object.values(saved.healthInputs).some(v=>v!==''&&v!==null);
  if(saved.planReady)doCalculate();if(saved.healthReady)doHealth();
  $('healthDataNote').textContent='已恢復上次填寫的數字；所有欄位都可修改。';
  $('planDataNote').textContent='已恢復上次填寫的數字；修改後請更新試算。';
 }finally{restoringFinance=false;}updateHandoffState();
}
function initializeFinance(){
 const saved=readFinanceDraft();$('restoreFinanceDraft').hidden=!saved;
 $('restoreFinanceDraft').addEventListener('click',()=>{const draft=readFinanceDraft();if(draft)restoreFinanceProgress(draft);});
 // A URL may suggest a case, but only a deliberate click fills it.
 const requestedCase=new URLSearchParams(location.search).get('case');
 if(getDemoCase(requestedCase))$('casePicker').value=requestedCase;
 financeReady=true;refreshHealthLink();
}
if(document.readyState==='complete')initializeFinance();else window.addEventListener('load',initializeFinance,{once:true});
window.addEventListener('pagehide',saveFinanceProgress);

