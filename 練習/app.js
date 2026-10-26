'use strict';
let BANK=[], state={wrong:[],saved:[],seen:[],history:[],session:null,drawCounts:{},recentDraws:[],subjectExtraCounts:{},multiCounts:{},questionStats:{}},view='home',session=null,idx=0,filterCat='全部科目',query='',listLimit=30;
const KEY='steven-study-v1',app=document.getElementById('app');let storageOK=true;
try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{storageOK=false}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{storageOK=false;toast('瀏覽器無法儲存，請匯出進度備份')}document.getElementById('wrongCount').textContent=state.wrong.length;document.getElementById('storageMsg').textContent=storageOK?'':'目前無法儲存進度，請使用匯出備份。'}
function toast(s){let t=document.getElementById('toast');t.textContent=s;t.style.display='block';setTimeout(()=>t.style.display='none',2600)}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const cats=()=>[...new Set(BANK.map(q=>q.cat))];const multi=q=>q.answer.length>1;
function nav(v){if(view==='quiz'&&session){state.session=session;persist()}view=v;session=null;idx=0;render();scrollTo({top:0})}
function title(k,t,p=''){return `<span class="eyebrow">${k}</span><h1>${t}</h1>${p?`<p class="muted">${p}</p>`:''}`}
function render(){document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));if(view==='home')home();else if(view==='exam')setup();else if(view==='random')randomSetup();else if(view==='quiz')quiz();else if(view==='result')result();else if(view==='frequent')frequentPage();else listing();persist()}
function home(){const seen=new Set(state.seen).size,total=BANK.length;app.innerHTML=`${state.session?`<div class="resume"><span>你有一份未完成的${state.session.mode==='exam'?'模擬考':'練習'}，已作答 ${Object.keys(state.session.answers).length} / ${state.session.items.length} 題。</span><div class="row"><button class="btn primary" id="resume">繼續作答</button><button class="btn ghost" id="discard">捨棄</button></div></div>`:''}<section class="hero"><div><span class="eyebrow">A LITTLE PROGRESS, EVERY DAY</span><h1>把不確定，<br>練成有把握。</h1><p>Steven，從一科開始，或用一回模擬考找出盲點。<br>各科平均抽題；不只記答案，也把觀念弄懂。</p><div class="row"><button class="btn primary" id="goexam">開始模擬考　↗</button><button class="btn ghost" id="randompractice">全題庫隨機練習　↗</button><button class="btn ghost" id="gopractice">分科練習　↓</button><button class="btn ghost" id="fxpractice">匯率基礎專練　↗</button><button class="btn ghost" id="focuspractice">重點加強　↗</button><button class="btn ghost" id="frequentpractice">常錯題加強　↗</button></div></div><div class="heroart" aria-hidden="true"><div class="ring"><strong>50<small>QUESTIONS / ROUND</small></strong><span class="dot"></span></div></div></section><section class="stats"><div class="stat"><small>題庫總數</small><strong>${total}</strong><span>題</span></div><div class="stat"><small>已練習題目</small><strong>${seen}</strong><span>題</span></div><div class="stat"><small>待複習錯題</small><strong>${state.wrong.length}</strong><span>題</span></div><div class="stat"><small>最近模擬成績</small><strong>${state.history.find(x=>x.mode==='exam')?.score??'—'}</strong><span>/ 100</span></div></section><div class="sectiontitle" id="subjects"><div><span class="eyebrow">SUBJECT PRACTICE</span><h2>今天，先練哪一科？</h2></div><p>${cats().length} 個主題 · 單選與複選</p></div><section class="grid">${cats().map((c,i)=>{const qs=BANK.filter(q=>q.cat===c),n=qs.filter(multi).length;return `<article class="card"><div class="cardtop"><span class="number">${String(i+1).padStart(2,'0')}</span><span>${qs.length} 題</span></div><h3>${esc(c)}</h3><p>${n?`含 ${n} 題複選`:'單選題'}${c==='金融英文'?' · 中英解析':''}</p><button data-subject="${esc(c)}">進入練習　↗</button></article>`}).join('')}</section><div class="notice"><b>永續照片題庫已更新</b>　本次精選26題，只保留照片紅字與指定的ESG領導品牌、淨零承諾及報告書重點，可至「責任授信／ESG」選細項。<br><b>題庫內容</b>　${BANK.length}題，中文匯率已減為30題基礎版，以報價觀念、簡單換算與避險方向為主，交叉匯率僅保留基本公式；本次補強財金、票據法、臨櫃存匯117題及ESG2共41題，含14題圖片判讀、TCFD新增5題；既有重點保留。已提高指定重點的抽題機率。「重點加強」可集中練習，數字題使用假設匯率。分科練習可選細項主題；通路經營也可選本次臨櫃存匯跨科練習。國家／據點、併購與產品條件均依本次講義版本作答。<br><b>編製說明</b>　選項依講義與筆記改編。ESG漏拍題、未列全的7趨勢及年份不明的氣候事件題暫不計分；「esg2」與「風險管理」講義內容相同，合併為一科。<details><summary>查看來源與待補內容</summary><p>來源為9份PDF、責任授信文字考題、大個金顧客經營筆記及本次永續經營照片。照片題依投影片頁碼與講義時點作答；報告書查證補充附官方來源。每題解析均附來源位置。尚缺：ESG描述有誤的完整題目、顧客經營7趨勢其餘3項、2026氣候事件原題。英文題僅考金融名詞與基本觀念，計算題均以中文練習。</p></details></div><div class="panel mobilebackup" style="display:none"><h3>進度備份</h3><p class="muted small">此版本儲存於本機，可匯出備份。</p><button class="btn" id="mobileexport">匯出進度</button><label class="btn">匯入進度<input type="file" id="mobileimport" accept="application/json" hidden></label></div>`;app.querySelector('#goexam').onclick=()=>nav('exam');app.querySelector('#randompractice').onclick=()=>nav('random');app.querySelector('#fxpractice').onclick=()=>setup('財金與外匯','fx');app.querySelector('#focuspractice').onclick=startFocusPractice;app.querySelector('#frequentpractice').onclick=()=>nav('frequent');app.querySelector('#gopractice').onclick=()=>document.getElementById('subjects').scrollIntoView({behavior:'smooth'});app.querySelectorAll('[data-subject]').forEach(b=>b.onclick=()=>setup(b.dataset.subject));if(state.session){app.querySelector('#resume').onclick=()=>{session=state.session;idx=session.idx||0;view='quiz';render()};app.querySelector('#discard').onclick=()=>{state.session=null;render()}}app.querySelector('#mobileexport').onclick=exportData;app.querySelector('#mobileimport').onchange=importData}
// Draw across distinct concept families before allowing numeric variants.
function selectDiverse(pool,n,used=new Set()){
 const result=[],available=[...pool],recent=new Set((state.recentDraws||[]).flat()),counts=state.drawCounts||{},seen=new Set(state.seen);
 while(result.length<n&&available.length){
  let candidates=available.filter(q=>!used.has(q.family||q.id));
  if(!candidates.length)candidates=available;
  const emphasis=candidates.filter(q=>q.focus);if(emphasis.length&&Math.random()<0.75)candidates=emphasis;
  const fresh=candidates.filter(q=>!recent.has(q.id));if(fresh.length)candidates=fresh;
  const least=Math.min(...candidates.map(q=>counts[q.id]||0));candidates=candidates.filter(q=>(counts[q.id]||0)===least);
  const unseen=candidates.filter(q=>!seen.has(q.id));if(unseen.length)candidates=unseen;
  // Select the family first so a template with many number variants cannot dominate.
  const families=shuffle([...new Set(candidates.map(q=>q.family||q.id))]),family=families[0];
  const q=shuffle(candidates.filter(q=>(q.family||q.id)===family))[0];
  result.push(q);used.add(q.family||q.id);available.splice(available.indexOf(q),1);
 }
 return result;
}
function fairSubjects(subjects,n,counts){
 return shuffle(subjects).sort((a,b)=>(counts[a]||0)-(counts[b]||0)).slice(0,n);
}
function balancedExam(extra=false){
 const subjects=cats().filter(c=>c!=='金融英文'),total=extra?50:45,base=Math.floor(total/subjects.length),remainder=total%subjects.length;
 const bonus=fairSubjects(subjects,remainder,state.subjectExtraCounts||{}),eligible=subjects.filter(c=>BANK.some(q=>q.cat===c&&multi(q)&&q.lang==='zh'));
 const multis=fairSubjects(eligible,5,state.multiCounts||{}),used=new Set(),byCat={};
 for(const c of subjects){
  const quota=base+(bonus.includes(c)?1:0),selected=[];
  if(multis.includes(c))selected.push(...selectDiverse(BANK.filter(q=>q.cat===c&&multi(q)&&q.lang==='zh'),1,used));
  selected.push(...selectDiverse(BANK.filter(q=>q.cat===c&&!multi(q)&&q.lang==='zh'),quota-selected.length,used));
  if(selected.length!==quota)throw Error('科目題數不足：'+c);
  byCat[c]=shuffle(selected);
 }
 const zh=[];while(Object.values(byCat).some(q=>q.length)){for(const c of shuffle(subjects)){if(byCat[c].length)zh.push(byCat[c].shift())}}
 const en=selectDiverse(BANK.filter(q=>q.lang==='en'&&!multi(q)),5,used),items=[];
 // Spread the five English questions across five sections of the paper.
 for(let block=0;block<5;block++){
  const size=(extra?10:9),section=zh.slice(block*size,(block+1)*size);
  section.splice(Math.floor(Math.random()*(section.length+1)),0,en[block]);items.push(...section);
 }
 if(items.length!==(extra?55:50)||items.filter(multi).length!==5)throw Error('題型配額錯誤');
 return {items,blueprint:subjects.map(cat=>({cat,total:base+(bonus.includes(cat)?1:0),multi:multis.includes(cat)?1:0})),bonus,multis};
}
function startBalancedExam(extra){
 const draw=balancedExam(extra);state.subjectExtraCounts=state.subjectExtraCounts||{};state.multiCounts=state.multiCounts||{};
 for(const c of draw.bonus)state.subjectExtraCounts[c]=(state.subjectExtraCounts[c]||0)+1;
 for(const c of draw.multis)state.multiCounts[c]=(state.multiCounts[c]||0)+1;
 begin(draw.items,'exam',draw.blueprint);
}
function practiceDraw(pool,n,type='all'){
 n=Math.min(n,pool.length);if(type!=='all')return shuffle(selectDiverse(pool,n));
 const m=pool.filter(multi),single=pool.filter(q=>!multi(q)),multiN=Math.min(m.length,Math.max(n-single.length,Math.round(n*0.1))),used=new Set();
 return shuffle([...selectDiverse(m,multiN,used),...selectDiverse(single,n-multiN,used)]);
}
function startFocusPractice(){
 const subjects=shuffle(cats().filter(c=>BANK.some(q=>q.cat===c&&q.lang==='zh'&&q.focus))),selected=[],used=new Set(),totals={};
 // Two multi-select questions on distinct subjects, then even subject coverage.
 for(const c of shuffle(subjects.filter(c=>BANK.some(q=>q.cat===c&&q.focus&&multi(q)))).slice(0,2)){
  const qs=selectDiverse(BANK.filter(q=>q.cat===c&&q.focus&&multi(q)),1,used);selected.push(...qs);totals[c]=(totals[c]||0)+qs.length;
 }
 while(selected.length<20){
  const available=subjects.filter(c=>BANK.some(q=>q.cat===c&&q.lang==='zh'&&q.focus&&!multi(q)&&!selected.some(x=>x.id===q.id)));
  if(!available.length)break;
  const c=shuffle(available).sort((a,b)=>(totals[a]||0)-(totals[b]||0))[0];
  const qs=selectDiverse(BANK.filter(q=>q.cat===c&&q.lang==='zh'&&q.focus&&!multi(q)&&!selected.some(x=>x.id===q.id)),1,used);
  selected.push(...qs);totals[c]=(totals[c]||0)+qs.length;
 }
 begin(shuffle(selected),'practice');
}
const PRACTICE_TOPICS={
 '責任授信／ESG':[['all','責任授信與永續重點全部'],['newcourse','本次紅字與指定重點26題'],['esg-brand','ESG領導品牌：四領域與配對'],['netzero-pledge','玉山金控淨零承諾'],['esg-disclosure','氣候報告書、IFRS與防漂綠'],['esg-foundation','供應鏈紅字重點'],['nature-practice','生物多樣性連結貸款重點'],['inclusion-health','全齡金融重點'],['social-impact','議合重點'],['general','原有責任授信與ESG考題']],
 '氣候環境風險':[['all','ESG2全部內容'],['ghg','七類溫室氣體'],['ssp','SSP情境與8.5的意義'],['2050','2050年與海平面情境（已查證）'],['ecosystem','生態系統服務分類'],['health','健康與人類福祉'],['rio','里約三公約'],['tcfd','TCFD新增5題'],['general','原有氣候與環境風險題目']],
 '存匯':[['all','全部存匯內容'],['deposit-types','定存類型與資格'],['termination','中途解約計息與計算'],['tax-exemption','儲蓄免扣'],['remittance','匯兌手續費與單筆限額'],['cash-limits','過路客大額現金限制'],['cheque-writing','支票金額與書寫規定'],['micr','MICR交換區、次交與託收'],['opening-docs','外國人／非營利組織開戶文件'],['ubo','實質受益人與持股計算'],['transfer-limits','金融卡、約定轉帳與限額'],['images','圖片題專練'],['general','原有存匯題目']],
 '票據法':[['all','全部票據法內容'],['parties','當事人中英文：Drawer／Drawee／Payee／Holder'],['acts','票據行為方格'],['elements','票據組成與必要記載事項'],['images','圖片題專練'],['general','原有票據法題目']],
 '通路經營':[['all','分行經營與原有通路內容'],['counter','本次臨櫃存匯重點（跨科練習）']],
 '財金與外匯':[['all','財金策略＋匯率全部'],['strategy','財金策略細項（不含匯率計算）'],['units','單位職責：ALCO／IM／TMU'],['currencies','G7與其他幣別'],['product-map','財金產品地圖（新增15題）'],['principal','保本條件與產品風險'],['definition','外匯與匯率定義'],['sessions','三個盤、夜間交易與通路限額'],['earnings','銀行淨收益與財金獲利組成'],['fx','中文匯率基礎（30題）'],['cross','中文交叉匯率基本公式'],['conversion','金額換算與報價比較'],['movement','升貶值、損益與報酬率'],['concept','方向判讀與避險情境']],
 '經營與國際接軌':[['all','全部內容'],['modern','現代化：顧客導向與專業分工'],['international','國際化：海外布局、據點與5L'],['holding','金控化：併購與跨子公司整合'],['sbt','SBT科學基礎減碳目標'],['general','原有里程碑、文化與ARM']]
};
function practicePool(cat,topic='all',type='all'){
 if(cat==='通路經營'&&topic==='counter')return BANK.filter(q=>q.cat==='存匯'&&q.edition==='20261025-counter'&&(type==='all'||(type==='multi'?multi(q):!multi(q))));
 return BANK.filter(q=>q.cat===cat&&(topic==='all'||(topic==='newcourse'?q.edition==='20261027-photos':topic==='images'?!!q.image:topic==='fx'?q.scope==='fx':topic==='strategy'?q.scope==='strategy':q.topic===topic))&&(type==='all'||(type==='multi'?multi(q):!multi(q))));
}
function setup(cat,initialTopic='all'){
 if(cat)view='practice';else view='exam';const isExam=view==='exam',isFx=cat==='財金與外匯',topics=PRACTICE_TOPICS[cat];
 app.innerHTML=title(isExam?'MOCK EXAM':'FOCUSED PRACTICE',isExam?'一回模擬，找出盲點。':esc(cat),isExam?'45 題單選＋5 題複選，複選需全對才得分。':'逐題查看解析，先弄懂，再往下一題。')+`<section class="panel"><h2>${isExam?'模擬考設定':'練習設定'}</h2><div class="fields">${isExam?`<label>英文題配置<select id="english"><option value="included">50 題：5 題英文包含在45題單選內</option><option value="extra">55 題：45題中文單選＋5題複選＋5題英文</option></select></label>`:`<label>練習題數<select id="count"><option value="10">10 題</option><option value="20">20 題</option><option value="all">全部題目</option></select></label><label>題型<select id="type"><option value="all">全部題型</option><option value="single">只練單選</option><option value="multi">只練複選</option></select></label>${topics?`<label>練習主題<select id="fxTopic">${topics.map(([value,label])=>`<option value="${value}" ${value===initialTopic?'selected':''}>${label}</option>`).join('')}</select></label>`:''}`}</div>${isExam?'<div class="notice"><b>每科都有固定配額</b><br>50題：10個中文科目各4～5題＋英文5題。<br>55題：10個中文科目各5題＋英文5題。<br>每回5題複選分散於5個科目，額外題與複選科目輪替。各科內提高講義標記重點的抽題機率，同時輪替不同觀念與近期題目。</div>':''}<p class="muted">${isExam?'選項隨機排列；交卷後顯示各科表現與詳解。每題等分，換算百分制。':'一般混合練習約一成複選；提高講義重點的抽題機率，兼顧不同觀念與變化題。單選與複選都使用方框，單選只能勾選一項。'}</p><button class="btn primary" id="start">${isExam?'開始測驗':'開始練習'}　→</button><button class="btn ghost" id="backhome">返回總覽</button></section>`;
 app.querySelector('#backhome').onclick=()=>nav('home');app.querySelector('#start').onclick=()=>{
  if(isExam){startBalancedExam(app.querySelector('#english').value==='extra');return}
  const type=app.querySelector('#type').value,n=app.querySelector('#count').value,topic=topics?app.querySelector('#fxTopic').value:'all';
  const pool=practicePool(cat,topic,type);
  if(!pool.length){toast('這個主題沒有此題型，請調整篩選');return}
  begin(practiceDraw(pool,n==='all'?pool.length:Number(n),type),'practice');
 };
}
function randomSetup(){
 app.innerHTML=title('RANDOM PRACTICE','全題庫隨機練習','所有科目、單選與複選一起隨機；每題確認後立即顯示答案與解析。')+`<section class="panel"><label for="randomCount">本回題數</label><select id="randomCount"><option value="20">20題</option><option value="50">50題</option><option value="all">全部${BANK.length}題</option></select><p class="muted">不設科目、英文或複選配額，每題抽中機率相同，同一回不重複。選好答案後按「確認答案」，看完解析再按「下一題」。可隨時儲存離開。</p><button class="btn primary" id="startRandom">開始隨機練習 →</button></section>`;
 app.querySelector('#startRandom').onclick=()=>{const n=app.querySelector('#randomCount').value;begin(shuffle(BANK).slice(0,n==='all'?BANK.length:Number(n)),'practice');session.random=true;render()};
}
function begin(qs,mode,blueprint=null){if(!qs.length){toast('目前沒有題目');return}state.drawCounts=state.drawCounts||{};for(const q of qs)state.drawCounts[q.id]=(state.drawCounts[q.id]||0)+1;state.recentDraws=[qs.map(q=>q.id),...(state.recentDraws||[])].slice(0,3);session={mode,blueprint,items:qs.map(q=>({id:q.id,order:shuffle(q.options.map((_,i)=>i))})),answers:{},checked:[],idx:0,started:Date.now()};idx=0;state.session=session;view='quiz';render();scrollTo({top:0})}
function getq(item){return BANK.find(q=>q.id===item.id)}function correct(q,a=[]){return a.length===q.answer.length&&q.answer.every(x=>a.includes(x))}
function lectureSource(q){if(document.body.dataset.sourcePdfs==='omitted')return `${esc(q.src)} · ${esc(q.page)}（原始講義未附於此版本）`;let src=q.src;if(src.includes('.pdf')){const name=src.split('／')[0];const fn={'徵信.pdf':'credit','存匯.pdf':'deposit','票據法.pdf':'bills','總經理.pdf':'management','法人經營.pdf':'corporate','財經策略發展.pdf':'treasury','通路經營.pdf':'channels','esg2.pdf':'climate'}[name];if(fn)return `<a href="sources/${fn}.pdf#page=${Number(q.page)||1}" target="_blank" rel="noopener">${esc(src)} · PDF第${esc(q.page)}頁 ↗</a>`}return `${esc(src)} · ${esc(q.page)}`}
function source(q){
 const extra=(q.webSources||[]).filter(s=>/^https:\/\//.test(s.url)).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`).join(' · ');
 return lectureSource(q)+(extra?`<br>網路補充查證：${extra}（${esc(q.verifiedOn||'')}）`:'');
}
function questionImage(q){
 if(!q.image||!/^question-images\/[a-z0-9-]+\.svg$/.test(q.image))return '';
 return `<figure class="questionfigure"><a href="${esc(q.image)}" target="_blank" rel="noopener" aria-label="開啟題目圖片放大檢視"><img src="${esc(q.image)}" alt="${esc(q.imageAlt||'題目示意圖')}" loading="lazy"></a><figcaption>教學示意圖 · 點擊圖片可放大，放大頁關閉後可繼續作答。</figcaption></figure>`;
}
function feedback(q,a){const ok=correct(q,a);return `<div class="answer ${ok?'':'bad'}"><b>${ok?'✓ 答對了':'再看一次這個觀念'}</b><p>正確答案：${q.answer.map(i=>esc(q.options[i])).join('、')}</p><p>${esc(q.explanation)}</p><small>來源：${source(q)}${q.id.startsWith('q')?'':' · 依課程概念改編'}</small></div>`}
function quiz(){session.idx=idx;state.session=session;const item=session.items[idx],q=getq(item),a=session.answers[q.id]||[],checked=session.checked.includes(q.id);app.innerHTML=`<div class="examhead row between"><div><span class="eyebrow">${session.mode==='exam'?'MOCK EXAM':'PRACTICE'}</span><h2>${session.mode==='exam'?'全科模擬測驗':session.random?'全題庫隨機練習':esc(q.cat)}</h2></div><div class="row"><span class="small muted">${Object.keys(session.answers).filter(k=>session.answers[k].length).length} / ${session.items.length} 已作答</span><button class="btn ghost" id="leave">儲存離開</button></div></div><div class="progress"><i style="width:${(idx+1)/session.items.length*100}%"></i></div><div class="quizlayout"><section class="panel" style="margin:0"><div class="row between"><div class="row"><span class="pill">${multi(q)?'複選題':'單選題'}</span><span class="pill gold">${esc(q.cat)}</span></div><button class="btn ghost" id="bookmark" aria-pressed="${state.saved.includes(q.id)}">${state.saved.includes(q.id)?'★ 已收藏':'☆ 收藏'}</button></div><p class="question"><span class="muted">${String(idx+1).padStart(2,'0')}.</span> ${esc(q.q)}</p>${questionImage(q)}<p class="small muted">${multi(q)?'請選出所有正確選項；少選、多選皆不計分。':'請選擇一個最適當的答案。'}</p><div role="group" aria-label="答案選項">${item.order.map((original,i)=>`<label class="option ${checked?(q.answer.includes(original)?'good':a.includes(original)?'bad':''):''}"><input type="checkbox" data-opt="${original}" ${a.includes(original)?'checked':''} ${checked?'disabled':''}><span><span class="letter">${String.fromCharCode(65+i)}.</span> ${esc(q.options[original])}</span></label>`).join('')}</div>${checked?feedback(q,a):''}<div class="quizfoot"><button class="btn" id="prev" ${idx===0?'disabled':''}>← 上一題</button><div class="row">${session.mode==='practice'&&!checked?'<button class="btn primary" id="check">確認答案</button>':''}<button class="btn ${session.mode==='exam'||checked?'primary':''}" id="next" ${session.random&&!checked?'disabled':''}>${idx===session.items.length-1?'交卷看結果':'下一題 →'}</button></div></div></section><section class="panel navigator" style="margin:0"><h3>答題進度</h3><p class="muted small">點擊題號自由切換</p><div class="navgrid">${session.items.map((it,i)=>`<button data-jump="${i}" class="${i===idx?'current':session.answers[it.id]?.length?'done':''} ${state.saved.includes(it.id)?'flag':''}" aria-label="第${i+1}題${session.answers[it.id]?.length?'已作答':'未作答'}">${i+1}</button>`).join('')}</div><small class="muted">綠底：已作答 · 金框：收藏</small>${session.blueprint?`<details style="margin-top:14px"><summary class="small">本回各科配額</summary>${session.blueprint.map(b=>`<p class="small" style="margin:5px 0">${esc(b.cat)}：${b.total}題${b.multi?'（含1複選）':''}</p>`).join('')}<p class="small">金融英文：5題</p></details>`:''}<button class="btn" id="finish" style="width:100%;margin-top:18px">交卷</button></section></div>`;app.querySelectorAll('[data-opt]').forEach(el=>el.onchange=()=>{const n=Number(el.dataset.opt);let arr=session.answers[q.id]||[];if(!multi(q))arr=el.checked?[n]:[];else arr=el.checked?[...new Set([...arr,n])]:arr.filter(v=>v!==n);session.answers[q.id]=arr;if(!arr.length)delete session.answers[q.id];render()});app.querySelector('#bookmark').onclick=()=>{toggleSaved(q.id);quiz();persist()};app.querySelector('#leave').onclick=()=>nav('home');app.querySelector('#prev').onclick=()=>{idx--;render()};app.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{idx=Number(b.dataset.jump);render()});app.querySelector('#next').onclick=()=>{if(session.random&&!checked){toast('請先確認答案，再進入下一題');return}if(idx===session.items.length-1)askFinish();else{idx++;render();scrollTo({top:0,behavior:'smooth'})}};app.querySelector('#finish').onclick=askFinish;const cb=app.querySelector('#check');if(cb)cb.onclick=()=>{if(!a.length){toast('請先選擇答案');return}recordOnce(q,a);session.checked.push(q.id);render()}}
function toggleSaved(id){globalThis.studyCloudQueue?.("saved",{q:id,value:!state.saved.includes(id)});state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id]}
function statsFor(id){return state.questionStats?.[id]||{attempts:0,wrong:0,streak:0};}
function record(q,a){
 globalThis.studyCloudQueue?.("answer",{q:q.id,ok:correct(q,a)});
 state.questionStats=state.questionStats||{};
 const old=statsFor(q.id),ok=correct(q,a);
 state.questionStats[q.id]={attempts:old.attempts+1,wrong:old.wrong+(ok?0:1),streak:ok?old.streak+1:0,legacy:!!old.legacy||(!old.attempts&&state.wrong.includes(q.id)),lastAnswered:Date.now()};
 if(!state.seen.includes(q.id))state.seen.push(q.id);
 if(ok)state.wrong=state.wrong.filter(x=>x!==q.id);else if(!state.wrong.includes(q.id))state.wrong.push(q.id);
}
function recordOnce(q,a){
 session.recorded=session.recorded||[...session.checked];
 if(session.recorded.includes(q.id))return;
 record(q,a);session.recorded.push(q.id);
}
function frequentPool(){
 return BANK.filter(q=>(statsFor(q.id).wrong>0||statsFor(q.id).legacy||state.wrong.includes(q.id))&&statsFor(q.id).streak<2)
 .sort((a,b)=>statsFor(b.id).wrong-statsFor(a.id).wrong||statsFor(a.id).streak-statsFor(b.id).streak);
}
function frequentDraw(pool,n=20){
 // Keep the hardest questions at the head of each subject; rotate subjects for coverage.
 const groups={};for(const q of pool)(groups[q.cat]??=[]).push(q);
 const selected=[];while(selected.length<Math.min(n,pool.length)){
  const subjects=Object.keys(groups).filter(c=>groups[c].length).sort((a,b)=>statsFor(groups[b][0].id).wrong-statsFor(groups[a][0].id).wrong);
  for(const c of subjects){if(selected.length>=n)break;selected.push(groups[c].shift());}
 }
 return selected;
}
function frequentPage(){
 const pool=frequentPool(),repeated=pool.filter(q=>statsFor(q.id).wrong>=2),mastered=BANK.filter(q=>(statsFor(q.id).wrong>0||statsFor(q.id).legacy)&&statsFor(q.id).streak>=2).length;
 app.innerHTML=title('LEARN FROM YOUR MISTAKES','常錯的，練到有把握。','依這個瀏覽器的作答紀錄安排，答錯越多次，越優先練習。')+`<section class="panel"><div class="row between"><div><h2>${repeated.length} 題反覆答錯 · ${pool.length} 題待加強</h2><p class="muted">已連續答對 2 次：${mastered} 題。連續答對 2 次會暫時移出加強清單；再答錯就會回來。</p></div><button class="btn primary" id="startFrequent" ${pool.length?'':'disabled'}>開始常錯題加強（${Math.min(20,pool.length)}題）</button></div><p class="small muted">每回最多 20 題，優先抽各科答錯最多的題目，輪流涵蓋有錯題的科目。複選題會依你的錯題紀錄納入。</p><p class="small muted">從本次更新起累計答錯次數。舊錯題仍可練習，過去的答錯次數無法還原；進度可匯出備份。</p></section><section class="banklist">${pool.length?pool.map(q=>{const st=statsFor(q.id);return `<article class="panel"><div class="row between"><span class="pill">${esc(q.cat)} · ${multi(q)?'複選':'單選'}</span><span class="small">${st.attempts?`答錯 ${st.wrong} / 作答 ${st.attempts} 次`:'舊錯題 · 尚無次數紀錄'} · 連續答對 ${st.streak} / 2</span></div><p>${esc(q.q)}</p><button class="btn" data-frequent="${q.id}">單題加強 →</button></article>`}).join(''):'<div class="empty"><h2>目前沒有待加強題目</h2><p class="muted">先做一回模擬考或分科練習，答錯後就會自動整理到這裡。</p><button class="btn primary" id="frequentExam">開始模擬考</button></div>'}</section>`;
 app.querySelector('#startFrequent').onclick=()=>begin(frequentDraw(pool),'practice');
 app.querySelectorAll('[data-frequent]').forEach(b=>b.onclick=()=>begin([BANK.find(q=>q.id===b.dataset.frequent)],'practice'));
 if(!pool.length)app.querySelector('#frequentExam').onclick=()=>nav('exam');
}
function askFinish(){const missing=session.items.filter(it=>!session.answers[it.id]?.length).length;app.insertAdjacentHTML('afterbegin',`<section class="panel" id="confirmFinish" style="border:2px solid #b88232"><h3>${missing?`還有 ${missing} 題未作答`:'已完成所有作答'}</h3><p>${missing?'未作答題目會以答錯計分。':'交卷後可以查看所有答案與解析。'}</p><div class="row"><button class="btn primary" id="confirmYes">確定交卷</button><button class="btn" id="confirmNo">繼續作答</button></div></section>`);document.getElementById('confirmFinish').scrollIntoView({behavior:'smooth'});app.querySelector('#confirmYes').onclick=finish;app.querySelector('#confirmNo').onclick=()=>app.querySelector('#confirmFinish').remove()}
function finish(){session.finished=Date.now();session.items.forEach(it=>recordOnce(getq(it),session.answers[it.id]||[]));session.score=Math.round(session.items.filter(it=>correct(getq(it),session.answers[it.id]||[])).length/session.items.length*100);state.history.unshift({mode:session.mode,score:session.score,date:new Date().toISOString(),count:session.items.length});globalThis.studyCloudQueue?.("history",{value:state.history[0]});state.history=state.history.slice(0,50);state.session=null;view='result';render();scrollTo({top:0})}
function result(){const qs=session.items.map(getq),wrong=qs.filter(q=>!correct(q,session.answers[q.id]||[])),time=Math.max(1,Math.round((session.finished-session.started)/60000));app.innerHTML=title('YOUR LEARNING REPORT','這次的盲點，下次的得分。')+`<section class="panel"><div class="row between"><div><span class="pill">${session.mode==='exam'?'模擬考':'分科練習'}</span><div class="score">${session.score}<small> / 100</small></div><p class="muted">答對 ${qs.length-wrong.length} / ${qs.length} 題 · 約 ${time} 分鐘</p></div><div class="row"><button class="btn primary" id="retry" ${wrong.length?'':'disabled'}>重練本次錯題（${wrong.length}）</button><button class="btn" id="resultHome">返回總覽</button></div></div><div class="grid">${[...new Set(qs.map(q=>q.cat))].map(c=>{let p=qs.filter(q=>q.cat===c);return `<div><small class="muted">${esc(c)}</small><p><b>${p.filter(q=>correct(q,session.answers[q.id]||[])).length}</b> / ${p.length}</p></div>`}).join('')}</div></section><div class="sectiontitle"><h2>逐題檢討</h2><p>未作答與答錯題目已加入錯題本</p></div>${qs.map((q,i)=>{let a=session.answers[q.id]||[],ok=correct(q,a);return `<details class="review" ${ok?'':'open'}><summary><span class="${ok?'badgeok':'badgefail'}">${ok?'✓':'✕'}</span> ${i+1}. ${esc(q.q)}</summary>${questionImage(q)}<p>你的答案：${a.length?a.map(j=>esc(q.options[j])).join('、'):'未作答'}</p>${feedback(q,a)}</details>`}).join('')}`;app.querySelector('#resultHome').onclick=()=>nav('home');app.querySelector('#retry').onclick=()=>begin(shuffle(wrong),'practice')}
function listing(){let base=view==='wrong'?BANK.filter(q=>state.wrong.includes(q.id)):view==='saved'?BANK.filter(q=>state.saved.includes(q.id)):BANK;let shown=base.filter(q=>(filterCat==='全部科目'||q.cat===filterCat)&&(!query||(q.q+q.explanation+q.options.join(' ')).toLowerCase().includes(query.toLowerCase())));let tit=view==='wrong'?'錯過的，再練一次。':view==='saved'?'把重點，留在手邊。':'找到想釐清的觀念。';app.innerHTML=title('QUESTION LIBRARY',tit)+`<div class="row between"><p class="muted">${base.length} 題${view==='wrong'?' · 重練答對後會移出錯題本':''}</p><button class="btn primary" id="listpractice" ${shown.length?'':'disabled'}>練習目前篩選（${Math.min(20,shown.length)}題）</button></div><div class="searchbar"><input type="search" id="search" aria-label="搜尋題目或關鍵字" placeholder="搜尋題目或關鍵字…" value="${esc(query)}"><select id="filter" aria-label="篩選科目"><option>全部科目</option>${cats().map(c=>`<option ${filterCat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div><p class="small muted">顯示 ${shown.length} 題 · 點開題目查看解析</p><div class="banklist">${shown.length?shown.slice(0,listLimit).map(q=>`<article class="panel"><div class="row between"><span class="pill">${esc(q.cat)} · ${multi(q)?'複選':'單選'}</span><button class="btn ghost" data-save="${q.id}" aria-pressed="${state.saved.includes(q.id)}">${state.saved.includes(q.id)?'★ 已收藏':'☆ 收藏'}</button></div><details><summary style="margin-top:12px">${esc(q.q)}</summary>${questionImage(q)}<div>${q.options.map((o,i)=>`<p class="small">${String.fromCharCode(65+i)}. ${esc(o)}</p>`).join('')}</div><div class="answer"><b>答案：${q.answer.map(j=>String.fromCharCode(65+j)).join('、')}</b><p>${esc(q.explanation)}</p><small>來源：${source(q)}${q.id.startsWith('q')?'':' · 依課程概念改編'}</small></div></details></article>`).join(''):'<div class="empty"><h2>這裡目前沒有題目</h2><p class="muted">試試調整篩選，或先開始一回練習。</p></div>'}</div>${shown.length>listLimit?'<button class="btn" id="more">載入更多</button>':''}`;app.querySelector('#listpractice').onclick=()=>begin(practiceDraw(shown,20),'practice');app.querySelector('#search').oninput=e=>{query=e.target.value;const pos=e.target.selectionStart;listing();let s=app.querySelector('#search');s.focus();s.setSelectionRange(pos,pos)};app.querySelector('#filter').onchange=e=>{filterCat=e.target.value;listLimit=30;listing()};app.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{toggleSaved(b.dataset.save);persist();listing()});if(app.querySelector('#more'))app.querySelector('#more').onclick=()=>{listLimit+=30;listing()}}
function exportData(){const blob=new Blob([JSON.stringify({format:'steven-study-v1',...state,cloudSync:globalThis.studyCloudExport?.()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='steven-study-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('進度已匯出，可在另一裝置匯入')}
async function importData(e){try{let data=JSON.parse(await e.target.files[0].text());if(data.format!=='steven-study-v1'||!['wrong','saved','seen','history'].every(k=>Array.isArray(data[k])))throw Error();let ids=new Set(BANK.map(q=>q.id));for(let k of ['wrong','saved','seen'])state[k]=[...new Set([...state[k],...data[k].filter(id=>ids.has(id))])];state.questionStats=state.questionStats||{};for(const [id,st] of Object.entries(data.questionStats||{})){if(!ids.has(id)||!st||!Number.isSafeInteger(st.attempts)||!Number.isSafeInteger(st.wrong)||!Number.isSafeInteger(st.streak)||st.attempts<0||st.wrong<0||st.wrong>st.attempts||st.streak<0||st.streak>st.attempts)continue;const old=statsFor(id),latest=(Number(st.lastAnswered)||0)>(Number(old.lastAnswered)||0)?st:old;state.questionStats[id]={attempts:Math.max(old.attempts,st.attempts),wrong:Math.max(old.wrong,st.wrong),streak:latest.streak,legacy:!!old.legacy||!!st.legacy,lastAnswered:Math.max(Number(old.lastAnswered)||0,Number(st.lastAnswered)||0)};}state.history=[...state.history,...data.history.filter(x=>typeof x.score==='number'&&['exam','practice'].includes(x.mode))].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,50);globalThis.studyCloudImport?.(data);persist();nav('home');toast('已合併進度，連線後同步至雲端')}catch{toast('檔案格式不符，請選擇本站匯出的進度檔')}}
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{filterCat='全部科目';query='';listLimit=30;nav(b.dataset.nav)});document.querySelector('.brand').onclick=e=>{e.preventDefault();nav('home')};document.getElementById('export').onclick=exportData;document.getElementById('import').onchange=importData;
fetch('bank.json?v=20261027-esg-trim1',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{BANK=data;const ids=new Set(BANK.map(q=>q.id));for(const k of ['wrong','saved','seen'])state[k]=state[k].filter(id=>ids.has(id));if(state.session&&!state.session.items.every(it=>ids.has(it.id)))state.session=null;render()}).catch(()=>{app.innerHTML='<div class="panel"><h2>題庫暫時無法載入</h2><p>請重新整理頁面再試一次。</p><button class="btn" onclick="location.reload()">重新載入</button></div>'});
