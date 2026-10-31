import {financingNeed} from './financing-need.js';
import {BUSINESS_TYPES,PURPOSE_TITLES} from './franchise-scenarios.js';
import {createLead,loadDemoLeads,saveDemoLeads,fillCities,fillDistricts,serviceChecks,esc} from './opportunity.js?v=value2';
export function mountConsultation({target,getContext}){
 const host=document.querySelector(target);if(!host)return null;
 host.innerHTML='<div class="consultation-heading"><div><div class="eyebrow green">LET US UNDERSTAND YOUR NEXT STEP</div><h2>留下一份需求，接上下一次討論。</h2><p>正在準備開店、擴店或調度資金？讓服務團隊先了解您的經營型態與想談的事。</p></div><img src="esun-meow.png" alt="玉山喵喵"></div><p class="demo-form-note"><strong>展示版諮詢：</strong>本頁僅在同一瀏覽器建立後台示範案件，不會通知銀行或跨裝置收件。請使用假資料體驗。</p><p class="optional-help">選填資料越完整，銀行越能協助資金規劃與整合；金額或時間尚未確定也可以先留白。</p><form id="consultationForm"><div class="consultation-fields"><label>企業／門市稱呼（示範）<input name="company" maxlength="60" placeholder="例如：巷口茶飲示範店" required></label><label>經營型態<select name="businessType">'+BUSINESS_TYPES.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label><label>這次主要需求<select name="purpose">'+Object.entries(PURPOSE_TITLES).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label><label>預計融資需求（萬元，選填）<input name="amount" type="number" min="0" max="100000000" step="0.01" placeholder="不確定可先留白"></label><label>營業縣市<select name="city" required></select></label><label>營業行政區<select name="district" required><option value="">請先選縣市</option></select></label><label>方便聯繫時段<select name="preferredTime"><option>再與我確認</option><option>平日上午</option><option>平日下午</option><option>平日傍晚</option></select></label><label>預計用款月份（選填）<input name="desiredMonth" type="month"></label></div><label class="consultation-wide">預約諮詢內容<textarea name="note" maxlength="1500" rows="4" placeholder="例如：預計加盟飲料店，想了解加盟金、裝修設備和開店前半年週轉金怎麼安排。" required></textarea></label><fieldset class="consultation-product-needs" id="productNeeds"><legend>除了資金規劃，還需要哪些協助？</legend><p>選填，可複選；先告訴我們需求，方便專人一起討論。</p><div class="product-need-options"><label class="product-need"><input type="checkbox" name="consultService" value="cardAcquiring"><span><strong>信用卡收單</strong><small>門市刷卡、線上刷卡收款</small></span></label><label class="product-need"><input type="checkbox" name="consultService" value="payroll"><span><strong>員工薪轉</strong><small>員工薪資發放、批次轉帳</small></span></label><label class="product-need"><input type="checkbox" name="consultService" value="accountOpening"><span><strong>公司戶開立</strong><small>公司營運帳戶、開戶諮詢</small></span></label></div><div class="consultation-value-fields"><label id="payrollPeopleField" hidden>預計薪轉人數（選填）<input name="payrollEmployees" type="number" min="0" max="100000" step="1" placeholder="例如：10"><small>提供人數，讓專人評估薪轉與員工帳戶服務。</small></label><label id="collectionAmountField" hidden>預計導入本行的年收款額（萬元，選填）<input name="annualReceipts" type="number" min="0" max="100000000" step="any" placeholder="不確定可留白，專人會依本次營收資料討論"><small>請填這次預計導入的範圍，避免把既有店與新店重複計入。</small></label></div></fieldset><details class="consultation-more"><summary>補充經營與聯絡資料（選填）</summary><p class="optional-help">提供越完整，銀行越能協助評估資金規劃與整合；不確定的內容可以先留白。</p><div class="consultation-fields"><label>加盟／自有品牌<input name="brand" maxlength="60" placeholder="示範品牌名稱"></label><label>目前店數<input name="storeCount" type="number" min="0" max="100000" step="1"></label><label>聯絡稱呼（示範）<input name="contact" maxlength="40" placeholder="請使用假名"></label><label>聯絡電話（示範）<input name="phone" maxlength="40" inputmode="tel" placeholder="請使用示範電話"></label><label class="full-field">營業地址（選填）<input name="address" maxlength="160" placeholder="可先填主要道路，方便討論服務據點"></label></div><div class="position-row"><button type="button" class="outline" id="useBusinessPosition">使用目前位置找附近據點</button><button type="button" class="text-button" id="clearBusinessPosition" hidden>移除定位</button><span id="positionMessage" role="status">請在營業地點附近使用；不定位仍可依行政區提供候選據點。</span></div><fieldset><legend>還想了解哪些服務？</legend>'+serviceChecks('consult',['loan','deposit','collateral','payment','ebank'])+'</fieldset></details><label class="consultation-attach"><input type="checkbox" name="includePlan" checked>一併附上這次已更新的試算與財務健檢</label><p id="consultationAttachment" class="tiny" role="status"></p><label class="consultation-consent"><input type="checkbox" name="consent" required><span>我同意將本次填寫內容與選擇附上的規劃，保存至此瀏覽器的後台示範工作台；我知道尚未正式送件，也不會收到銀行回覆。</span></label><div class="actions"><button class="button" type="submit">建立諮詢需求 →</button><button class="outline" type="button" id="loadConsultationExample">帶入示範需求</button></div><p id="consultationFeedback" role="status"></p></form>';
 const form=host.querySelector('form'),f=form.elements,message=document.getElementById('consultationFeedback');
 function syncServiceFields(){const selected=[...form.querySelectorAll('[name=consultService]:checked')].map(x=>x.value);const payroll=selected.includes('payroll'),collections=selected.some(x=>['payment','cardAcquiring','deposit'].includes(x));document.getElementById('payrollPeopleField').hidden=!payroll;f.payrollEmployees.disabled=!payroll;document.getElementById('collectionAmountField').hidden=!collections;f.annualReceipts.disabled=!collections;}
 form.addEventListener('input',syncServiceFields);syncServiceFields();
 fillCities(f.city);f.city.addEventListener('change',()=>fillDistricts(f.district,f.city.value));
 let position=null,signature='',saved=false,previousPurpose=null,hadPlan=false;
 const button=form.querySelector('[type=submit]');
 function refresh(){
  const ctx=getContext(),plan=ctx.plan;
  const key=JSON.stringify({plan,health:ctx.health,desiredMonth:ctx.desiredMonth,documents:ctx.documents,planDirty:ctx.planDirty,healthDirty:ctx.healthDirty,timingStale:ctx.timingStale});
  if(key!==signature){signature=key;f.consent.checked=false;saved=false;button.disabled=false;message.textContent='';}
  if(previousPurpose!==ctx.currentModel){f.purpose.value=ctx.currentModel;previousPurpose=ctx.currentModel;}
  if(!f.desiredMonth.value&&ctx.desiredMonth)f.desiredMonth.value=ctx.desiredMonth;
  if(plan){if(!hadPlan)f.includePlan.checked=true;f.includePlan.disabled=false;document.getElementById('consultationAttachment').textContent='可附上：'+PURPOSE_TITLES[plan.model]+' · '+'融資需求 '+(financingNeed(plan).amount?.toLocaleString('zh-TW',{maximumFractionDigits:1})??'待確認')+' 萬元'+'；附上'+(ctx.health?'已更新的財務健檢與原始數字':ctx.healthDirty?'健檢尚待更新，送出前請完成':'尚未填寫健檢')+'。';}
  else{f.includePlan.checked=false;f.includePlan.disabled=true;document.getElementById('consultationAttachment').textContent=ctx.planDirty?'試算已修改，更新後才可附上；也可以先提交不含試算的諮詢需求。':'尚未完成試算；可先填寫需求，後續再討論金額。';}
  hadPlan=!!plan;
 }
 form.addEventListener('input',e=>{if(e.target.name==='consent')return;f.consent.checked=false;saved=false;button.disabled=false;message.textContent='';});
 document.getElementById('loadConsultationExample').addEventListener('click',()=>{
  f.company.value='巷口茶飲示範店';f.businessType.value='加盟飲料';f.city.value='新北市';fillDistricts(f.district,f.city.value);f.district.value='新莊區';f.brand.value='示範茶飲品牌';f.storeCount.value='1';f.contact.value='示範店主';f.phone.value='0900-000-000';f.preferredTime.value='平日下午';f.note.value='預計開設第二間加盟飲料店，想討論加盟金、裝修設備、開店前半年週轉金及收款整合。';f.consent.checked=false;saved=false;button.disabled=false;message.textContent='已帶入假資料，請確認需求並勾選同意。';
 });
 document.getElementById('useBusinessPosition').addEventListener('click',()=>{
  const node=document.getElementById('positionMessage');
  if(!navigator.geolocation){node.textContent='此瀏覽器不支援定位；可依縣市行政區查找。';return;}
  node.textContent='等待定位授權…';
  navigator.geolocation.getCurrentPosition(result=>{position={lat:result.coords.latitude,lng:result.coords.longitude,accuracy:result.coords.accuracy};node.textContent='已取得位置，精確度約 '+Math.round(position.accuracy)+' 公尺；仍需確認是否為營業地址。';document.getElementById('clearBusinessPosition').hidden=false;f.consent.checked=false;saved=false;button.disabled=false;},()=>{node.textContent='未取得定位；仍可依營業縣市及行政區提供候選據點。';},{timeout:10000,maximumAge:300000});
 });
 document.getElementById('clearBusinessPosition').addEventListener('click',()=>{position=null;document.getElementById('positionMessage').textContent='已移除定位，改依行政區提供候選據點。';document.getElementById('clearBusinessPosition').hidden=true;f.consent.checked=false;saved=false;button.disabled=false;});
 form.addEventListener('submit',e=>{e.preventDefault();if(saved)return;message.className='';try{
  const ctx=getContext(),include=f.includePlan.checked;
  if(include&&(!ctx.plan||ctx.planDirty||ctx.healthDirty||ctx.timingStale))throw Error('規劃內容已變更，請更新試算／健檢後再附上，或取消附上規劃。');
  const data=Object.fromEntries(new FormData(form).entries());
  if(include)data.amount=financingNeed(ctx.plan).amount;
  const services=['loan',...Array.from(form.querySelectorAll('[name=consultService]:checked'),x=>x.value)];
  const consultation={...data,payrollEmployees:services.includes('payroll')?data.payrollEmployees:null,annualReceipts:services.some(x=>['payment','cardAcquiring','deposit'].includes(x))?data.annualReceipts:null,purpose:include?ctx.plan.model:data.purpose,position,summary:include?ctx.summary:'未附試算，請依客戶自述需求進一步確認。',health:include?ctx.health?.out:null,healthInputs:include?ctx.health?.inputs:null,healthAt:include?ctx.health?.at:'',documents:ctx.documents};
  const lead=createLead({plan:include?ctx.plan:null,city:f.city.value,district:f.district.value,services,consultation,label:f.company.value,source:'預約諮詢表單（本機示範）',consent:f.consent.checked});
  const rows=loadDemoLeads();if(rows.length>=200)throw Error('本機需求已達 200 筆，請先整理後台案例。');
  saveDemoLeads([lead,...rows]);saved=true;button.disabled=true;
  message.innerHTML='<div class="consultation-success"><b>已建立這筆示範諮詢</b><span>案件編號：'+esc(lead.id)+'</span><a class="button" href="internal.html#lead='+encodeURIComponent(lead.id)+'" target="_blank" rel="noopener">查看後台這筆需求 ↗</a><small>僅同一瀏覽器可見；未通知銀行或預約實際時段。</small></div>';
 }catch(error){message.textContent=error.message||'無法儲存，請確認瀏覽器允許本機儲存。';message.className='error';}});
 function fillCase(data){
  form.reset();position=null;signature='';hadPlan=false;saved=false;previousPurpose=null;
  f.city.value=data.city;fillDistricts(f.district,data.city);f.district.value=data.district;
  for(const key of ['company','businessType','purpose','amount','brand','storeCount','contact','phone','preferredTime','desiredMonth','note','address','payrollEmployees','annualReceipts'])if(f[key])f[key].value=data[key]??'';
  form.querySelectorAll('[name=consultService]').forEach(el=>el.checked=data.services.includes(el.value));
  f.consent.checked=false;button.disabled=false;message.textContent='已填入案例資料；確認後勾選同意，再建立諮詢需求。';
  document.getElementById('positionMessage').textContent='案例使用虛構門牌；依縣市與行政區列候選據點，不使用目前裝置位置。';
  document.getElementById('clearBusinessPosition').hidden=true;
  syncServiceFields();refresh();f.includePlan.checked=!!getContext().plan;f.consent.checked=false;
 }
 refresh();return {refresh,fillCase};
}

