import {sanitizeConsultation,enquiryPlan} from './consultation-context.js?v=value2';
// Shared local-only demo handoff. No network request or bank system integration.
export const LEADS_KEY = 'esun_mobile_review_demo_leads_v1';
export const ROUTES_KEY = 'esun_mobile_review_demo_routes_v1';
export const SETTINGS_KEY = 'esun_mobile_review_demo_settings_v1';
export const CONSENT_VERSION = 'franchise-consultation-v1-20261031';
export const SERVICES = Object.freeze({loan:'融資規劃',deposit:'活存與資金管理',collateral:'廠房／店面抵押',payment:'收付通與收款整合',ebank:'企業網路銀行',cardAcquiring:'信用卡收單',payroll:'員工薪轉',accountOpening:'公司戶開立'});
export const MODELS = Object.freeze({working:'營運週轉金',equipment:'中央廚房與設備',expansion:'展店與開張',overseas:'海外投資／拓店'});
export const DEFAULT_SETTINGS = Object.freeze({depositSpread:1,loanSpread:2,paymentRate:0.3});
export const DEFAULT_ROUTES = Object.freeze([
  {city:'臺北市',district:'*',team:'北區示範服務組',rm:'小宇（示範）'},
  {city:'新北市',district:'*',team:'新北示範服務組',rm:'小愷（示範）'},
  {city:'桃園市',district:'*',team:'桃園示範服務組',rm:'大鈞（示範）'},
  {city:'臺中市',district:'*',team:'中區示範服務組',rm:'小玉（示範）'},
  {city:'高雄市',district:'*',team:'南區示範服務組',rm:'示範 RM E'}
]);
export const AREAS = Object.freeze({
  '臺北市':'中正區 大同區 中山區 松山區 大安區 萬華區 信義區 士林區 北投區 內湖區 南港區 文山區',
  '新北市':'板橋區 三重區 中和區 永和區 新莊區 新店區 土城區 蘆洲區 汐止區 樹林區 鶯歌區 三峽區 淡水區 瑞芳區 五股區 泰山區 林口區 八里區 深坑區 石碇區 坪林區 三芝區 石門區 金山區 萬里區 平溪區 雙溪區 貢寮區 烏來區',
  '桃園市':'桃園區 中壢區 平鎮區 八德區 楊梅區 蘆竹區 大溪區 龍潭區 龜山區 大園區 觀音區 新屋區 復興區',
  '臺中市':'中區 東區 南區 西區 北區 西屯區 南屯區 北屯區 豐原區 大里區 太平區 清水區 沙鹿區 梧棲區 后里區 神岡區 潭子區 大雅區 新社區 石岡區 東勢區 和平區 大肚區 大甲區 外埔區 大安區 烏日區 霧峰區 龍井區',
  '臺南市':'中西區 東區 南區 北區 安平區 安南區 永康區 仁德區 歸仁區 關廟區 龍崎區 新化區 左鎮區 玉井區 楠西區 南化區 山上區 新市區 善化區 大內區 官田區 六甲區 麻豆區 下營區 佳里區 學甲區 西港區 七股區 將軍區 北門區 新營區 後壁區 白河區 東山區 鹽水區 柳營區',
  '高雄市':'新興區 前金區 苓雅區 鹽埕區 鼓山區 旗津區 前鎮區 三民區 楠梓區 小港區 左營區 仁武區 大社區 岡山區 路竹區 阿蓮區 田寮區 燕巢區 橋頭區 梓官區 彌陀區 永安區 湖內區 鳳山區 大寮區 林園區 鳥松區 大樹區 旗山區 美濃區 六龜區 內門區 杉林區 甲仙區 桃源區 那瑪夏區 茂林區 茄萣區',
  '基隆市':'仁愛區 信義區 中正區 中山區 安樂區 暖暖區 七堵區',
  '新竹市':'東區 北區 香山區', '新竹縣':'竹北市 竹東鎮 新埔鎮 關西鎮 湖口鄉 新豐鄉 芎林鄉 橫山鄉 北埔鄉 寶山鄉 峨眉鄉 尖石鄉 五峰鄉',
  '苗栗縣':'苗栗市 頭份市 竹南鎮 後龍鎮 通霄鎮 苑裡鎮 卓蘭鎮 造橋鄉 西湖鄉 頭屋鄉 公館鄉 銅鑼鄉 三義鄉 大湖鄉 獅潭鄉 三灣鄉 南庄鄉 泰安鄉',
  '彰化縣':'彰化市 員林市 和美鎮 鹿港鎮 溪湖鎮 二林鎮 田中鎮 北斗鎮 花壇鄉 芬園鄉 大村鄉 永靖鄉 伸港鄉 線西鄉 福興鄉 秀水鄉 埔心鄉 埔鹽鄉 大城鄉 芳苑鄉 竹塘鄉 社頭鄉 二水鄉 田尾鄉 埤頭鄉 溪州鄉',
  '南投縣':'南投市 埔里鎮 草屯鎮 竹山鎮 集集鎮 名間鄉 鹿谷鄉 中寮鄉 魚池鄉 國姓鄉 水里鄉 信義鄉 仁愛鄉',
  '雲林縣':'斗六市 斗南鎮 虎尾鎮 西螺鎮 土庫鎮 北港鎮 莿桐鄉 林內鄉 二崙鄉 崙背鄉 麥寮鄉 東勢鄉 褒忠鄉 臺西鄉 元長鄉 四湖鄉 口湖鄉 水林鄉 古坑鄉 大埤鄉',
  '嘉義市':'東區 西區', '嘉義縣':'太保市 朴子市 布袋鎮 大林鎮 民雄鄉 溪口鄉 新港鄉 六腳鄉 東石鄉 義竹鄉 鹿草鄉 水上鄉 中埔鄉 竹崎鄉 梅山鄉 番路鄉 大埔鄉 阿里山鄉',
  '屏東縣':'屏東市 潮州鎮 東港鎮 恆春鎮 萬丹鄉 長治鄉 麟洛鄉 九如鄉 里港鄉 鹽埔鄉 高樹鄉 萬巒鄉 內埔鄉 竹田鄉 新埤鄉 枋寮鄉 新園鄉 崁頂鄉 林邊鄉 南州鄉 佳冬鄉 琉球鄉 車城鄉 滿州鄉 枋山鄉 霧臺鄉 瑪家鄉 泰武鄉 來義鄉 春日鄉 獅子鄉 牡丹鄉 三地門鄉',
  '宜蘭縣':'宜蘭市 羅東鎮 蘇澳鎮 頭城鎮 礁溪鄉 壯圍鄉 員山鄉 冬山鄉 五結鄉 三星鄉 大同鄉 南澳鄉',
  '花蓮縣':'花蓮市 鳳林鎮 玉里鎮 新城鄉 吉安鄉 壽豐鄉 光復鄉 豐濱鄉 瑞穗鄉 富里鄉 秀林鄉 萬榮鄉 卓溪鄉',
  '臺東縣':'臺東市 成功鎮 關山鎮 卑南鄉 大武鄉 太麻里鄉 東河鄉 長濱鄉 鹿野鄉 池上鄉 綠島鄉 延平鄉 海端鄉 達仁鄉 金峰鄉 蘭嶼鄉',
  '澎湖縣':'馬公市 湖西鄉 白沙鄉 西嶼鄉 望安鄉 七美鄉',
  '金門縣':'金城鎮 金湖鎮 金沙鎮 金寧鄉 烈嶼鄉 烏坵鄉', '連江縣':'南竿鄉 北竿鄉 莒光鄉 東引鄉'
});
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function readLocal(key,fallback){try{let raw=localStorage.getItem(key);if(raw===null&&key.startsWith('esun_mobile_review_')){const old=localStorage.getItem(key.replace('esun_mobile_review_','esun_franchise_'));if(old!==null){JSON.parse(old);localStorage.setItem(key,old);raw=old;}}return raw?JSON.parse(raw):structuredClone(fallback);}catch{return structuredClone(fallback);}}
export function writeLocal(key,value){localStorage.setItem(key,JSON.stringify(value));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('esun-demo-update'));}
export function loadDemoLeads(){const rows=readLocal(LEADS_KEY,[]);return Array.isArray(rows)?rows.filter(x=>x&&typeof x.id==='string'&&Array.isArray(x.services)&&!isBuiltInDemoSample(x)).slice(0,200):[];}
export function saveDemoLeads(rows){writeLocal(LEADS_KEY,rows.slice(0,200));}
export function loadRoutes(){const rows=readLocal(ROUTES_KEY,DEFAULT_ROUTES);return Array.isArray(rows)?rows.map(r=>({...r,rm:({"示範 RM A":"小宇（示範）","示範 RM B":"小愷（示範）","示範 RM C":"大鈞（示範）","示範 RM D":"小玉（示範）"})[r.rm]||r.rm})):structuredClone(DEFAULT_ROUTES);}
export function loadSettings(){const s=readLocal(SETTINGS_KEY,DEFAULT_SETTINGS);return {...DEFAULT_SETTINGS,...s};}
export function routeFor(city,district,routes=loadRoutes()){return routes.find(r=>r.city===city&&r.district===district)||routes.find(r=>r.city===city&&r.district==='*')||null;}
export function emptyFinance(){return {depositBalance:null,loanBalance:null,monthlyVolume:null,annualEbankFee:null,operatingCost:0,creditCost:0,capitalCost:0};}
// Purpose-derived discussion leads are separate from explicitly selected services
// and from financial estimates. They never create an assumed fee or loan balance.
export function deriveOpportunitySignals(lead){
  if(lead?.plan?.model!=='overseas')return [];
  return [{key:'overseas',label:'海外投資潛在商機',origin:'依海外投資用途衍生，待確認服務意願',value:null,items:[
    {label:'外匯收付',detail:'確認付款國別、收付款幣別、金額、頻率與交易背景。'},
    {label:'換匯',detail:'確認所需幣別、換匯金額與時點，再依實際定價估算。'},
    {label:'海外融資',detail:'確認借款主體、所在地、資金用途、幣別與還款來源。'}
  ],note:'尚未確認交易金額、交易量與定價，不計入年度潛在貢獻數字；也不把投資預算當成可核貸額度。'}];
}
export const FOLLOWUP_STATUSES=Object.freeze(['待確認','待補資料','跟進中','完成示範','暫不跟進']);
export function getOpportunityFollowup(lead,key){
  const saved=lead?.followups?.[key];
  return {status:FOLLOWUP_STATUSES.includes(saved?.status)?saved.status:'待確認',note:typeof saved?.note==='string'?saved.note.slice(0,500):'',at:typeof saved?.at==='string'?saved.at:null};
}
// This explanation layer never changes financial inputs, consent, routing,
// selected services or contribution formulas. Purpose alone is not consent.
export function deriveOpportunityDetails(lead){
  const selected=new Set(Array.isArray(lead?.services)?lead.services:[]),model=lead?.plan?.model,purpose=MODELS[model]||'目前規劃';
  const amount=lead?.plan?.out?.value,unit=lead?.plan?.out?.unit||'萬元';
  const need=typeof amount==='number'&&Number.isFinite(amount)?`本次規劃顯示 ${new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(amount)} ${unit}，僅作討論背景，不是核貸額度。`:'實際金額、用途與時間尚待確認。';
  const definitions=[
    {key:'deposit',label:'活存與資金管理',trigger:'使用者勾選活存與資金管理服務，表示願意討論資金留存；尚不能由營收或自有資金推定可留存餘額。',questions:['每月平均有多少資金可留存？最低營運水位與付款高峰落在何時？','主要收款與付款帳戶在哪裡？是否需要整合薪轉、供應商付款與對帳？','所填月平均活存餘額是否有實際往來資料支持，且未重複計入其他用途？']},
    {key:'loan',label:model==='working'?'週轉融資':'融資規劃',trigger:`使用者勾選融資服務，規劃用途為「${purpose}」。${need}`,questions:[model==='working'?'新增訂單或營收需要先墊付多久？收款、備貨及付款時間是否符合實際交易？':'實際支出時點、資金用途與還款來源是什麼？是否需要分期動用？','目前可用授信與實際動用餘額多少？預估日平均貸款餘額如何推導？','是否有其他借款、到期集中還款、季節性高峰或尚未揭露的資金需求？']},
    {key:'collateral',label:'廠房／店面抵押',trigger:`使用者勾選廠房／店面抵押討論，${model==='equipment'?'目前亦選擇廠房與設備用途。':'可進一步確認是否有適合本次用途的不動產。'}尚未查證產權、估價或抵押設定，不推定擔保價值。`,questions:['不動產屬誰所有，實際用途及所在地為何？是否涉及興建或購置？','目前有無抵押設定、其他權利、租約或使用限制？應備何種權利文件？','擬議融資與工程／購置款如何銜接？抵押品評估與額度仍需正式審查。']},
    {key:'payment',label:model==='expansion'?'展店收款／收付通':'收付通與收款整合',trigger:`使用者勾選收款整合服務${model==='expansion'?'，並選擇展店與擴張，具門市收款及對帳整合的討論情境。':'，願意討論收付款及對帳流程。'}收付通與收單的計價方式仍應分別確認。`,questions:['有幾個門市或收款通路？目前使用現金、刷卡、轉帳或其他收款方式？','每月可導入的實際交易量、退款、撥款時間與對帳方式為何？','需要收付通、商店收單或兩者整合？實際費率、淨收入與導入成本如何計算？']},
    {key:'cardAcquiring',label:'信用卡收單',trigger:'顧客勾選信用卡收單需求；先確認通路、交易量與導入條件。',questions:['需要實體門市刷卡、線上收單，或兩者都有？','預計每月刷卡交易量、客單價與撥款週期為何？','現有收單銀行、約定費率與對帳方式為何？']},
    {key:'payroll',label:'員工薪轉',trigger:'顧客勾選員工薪轉需求；不代表已完成薪轉合作。',questions:['預計薪轉人數、每月薪資總額與發薪日為何？','員工帳戶、批次轉帳與覆核權限如何安排？','預計何時導入，是否需協助員工開戶？']},
    {key:'accountOpening',label:'公司戶開立',trigger:'顧客勾選公司戶開立需求；開戶與實際金流往來條件仍待確認。',questions:['公司已設立，或仍在籌備？帳戶預計用途為何？','主要收付款、留存餘額與跨境交易需求為何？','預計開戶時間及辦理地區為何？']},
    {key:'ebank',label:'企業網路銀行',trigger:'使用者勾選企業網路銀行服務，願意討論操作權限與付款流程；尚未確認是否開通或有收費收入。',questions:['目前誰經辦、誰覆核？需要多少操作人員及分層授權？','是否有批次付款、薪資、跨境匯款或 ERP 對接需求？','現有網銀功能是否足夠？導入、教育訓練及年度淨手續費需如何確認？']}
  ];
  const details=definitions.filter(d=>selected.has(d.key)).map(d=>({...d,origin:'使用者明確勾選，待進一步確認需求',derived:false}));
  for(const signal of deriveOpportunitySignals(lead))details.push({key:signal.key,label:signal.label,trigger:'本次用途選擇「海外投資」，因此顯示外匯收付、換匯與海外融資的潛在線索。這不代表使用者已同意申辦其中任何服務。',questions:signal.items.map(item=>`${item.label}：${item.detail}`),origin:signal.origin,derived:true,note:signal.note});
  return details;
}
export function updateOpportunityFollowup(lead,key,{status,note},{at=new Date().toISOString()}={}){
  if(!deriveOpportunityDetails(lead).some(signal=>signal.key===key))throw new Error('此案例沒有相符的商機線索，無法儲存跟進紀錄。');
  if(!FOLLOWUP_STATUSES.includes(status))throw new Error('請選擇有效的線索跟進狀態。');
  if(typeof note!=='string'||note.length>500)throw new Error('跟進備註最多 500 字，請只填示範內容。');
  if(!Number.isFinite(new Date(at).getTime()))throw new Error('跟進紀錄時間無效。');
  return {...lead,followups:{...(lead.followups||{}),[key]:{status,note:note.trim(),at}}};
}
export const DEMO_SAMPLE_SET='esun-sme-built-in-samples-v2';
const legacySampleKeys=new Set(['假案例 A｜擴充產線','假案例 B｜第二間門市','假案例 C｜批發備貨']);
export function isBuiltInDemoSample(lead){return lead?.sampleSet==='mobile-complete-cases-20261031'||lead?.sampleSet===DEMO_SAMPLE_SET||(lead?.source==='手動載入假資料'&&legacySampleKeys.has(lead.sampleKey));}
export function resetDemoSamples(existing,{at=new Date().toISOString()}={}){
  const retained=existing.filter(lead=>!isBuiltInDemoSample(lead));
  if(retained.length>196)throw new Error('保留的非樣本資料超過 196 筆，請先刪除不需要的案例，才能重設 4 筆樣本。');
  const cases=[
    {key:'A',label:'假案例 A｜擴充產線',city:'新北市',district:'新莊區',model:'equipment',need:3500,services:['loan','deposit','collateral','ebank'],finance:{depositBalance:600,loanBalance:2500,annualEbankFee:0,operatingCost:1.5,creditCost:2,capitalCost:1}},
    {key:'B',label:'假案例 B｜第二間門市',city:'臺北市',district:'中山區',model:'expansion',need:900,services:['deposit','payment','ebank'],finance:{depositBalance:200,monthlyVolume:180,annualEbankFee:0,operatingCost:3,creditCost:0,capitalCost:0}},
    {key:'C',label:'假案例 C｜批發備貨',city:'臺中市',district:'西屯區',model:'working',need:800,services:['loan','deposit'],finance:{depositBalance:150,loanBalance:450,operatingCost:1,creditCost:0.4,capitalCost:0.2}},
    {key:'D',label:'假案例 D｜海外投資',city:'桃園市',district:'龜山區',model:'overseas',mode:'dual',need:3000,services:[],inputs:{investTwd:3000,equityTwd:1000,investUsd:150,equityUsd:50,fx:32},finance:{}}
  ];
  const samples=cases.map(c=>{
    const lead=createLead({plan:{model:c.model,mode:c.mode||'twd',inputs:c.inputs||{},out:{label:c.model==='overseas'?'台幣支出預算（假資料；另有美元支出）':'假資料規劃需求',value:c.need,unit:'萬元'},at:stampDemoTime(at)},city:c.city,district:c.district,services:c.services,label:c.label,source:'按鈕載入假資料'});
    lead.id='builtin-demo-'+c.key;lead.sampleSet=DEMO_SAMPLE_SET;lead.sampleKey=c.key;lead.finance={...emptyFinance(),...c.finance};lead.at=at;lead.consent.at=at;lead.consent.scope='按鈕建立的內建假資料，可重設供重複測試；未實際轉交銀行。';return lead;
  });
  return [...samples,...retained];
}
function stampDemoTime(at){const d=new Date(at);if(!Number.isFinite(d.getTime()))throw new Error('樣本時間格式無效。');return d.toLocaleString('zh-TW',{hour12:false});}
function finiteOrNull(value){if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null;}
export function calculatePotential(lead,settings=DEFAULT_SETTINGS){
  const f=lead.finance||{}, interested=lead.services||[];
  const rows=[
    {key:'deposit',label:'活存',field:'depositBalance',formula:'月平均活存餘額 × 年淨利差',rate:'depositSpread',factor:1},
    {key:'loan',label:'放款',field:'loanBalance',formula:'日平均貸款餘額 × 年淨利差',rate:'loanSpread',factor:1},
    {key:'payment',label:'收款／收單',field:'monthlyVolume',formula:'每月交易金額 × 費率 × 12',rate:'paymentRate',factor:12},
    {key:'ebank',label:'企業網銀',field:'annualEbankFee',formula:'自行填寫年度淨手續費',factor:1}
  ].map(r=>{
    const active=interested.includes(r.key),amount=finiteOrNull(f[r.field]);
    const rawRate=r.rate?Number(settings[r.rate]):100,rate=Number.isFinite(rawRate)?rawRate:0;
    return {...r,active,amount,value:active&&amount!==null?amount*rate/100*r.factor:null};
  });
  const active=rows.filter(r=>r.active),known=active.filter(r=>r.value!==null),missing=active.filter(r=>r.value===null);
  const gross=known.reduce((s,r)=>s+r.value,0);
  const costs=['operatingCost','creditCost','capitalCost'].reduce((s,k)=>s+(finiteOrNull(f[k])||0),0);
  return {rows,gross,costs,net:known.length?gross-costs:null,complete:active.length>0&&missing.length===0,missing:missing.map(r=>r.label)};
}
export function planSnapshot(plan){
  if(!plan||!Object.hasOwn(MODELS,plan.model)||!plan.out||!Number.isFinite(Number(plan.out.value)))throw new Error('請先完成或更新試算，再轉交這份規劃。');
  const allowed=new Set('sales nextSales cost dso dio dpo own existing invest equity interest tenor grace annualBudget setup reserve revenue margin fixed ramp investTwd equityTwd investUsd equityUsd fx swing buffer months'.split(' '));
  const inputs={};for(const [k,v]of Object.entries(plan.inputs||{})){if(allowed.has(k)&&typeof v==='number'&&Number.isFinite(v))inputs[k]=v;}
  return {model:plan.model,mode:['twd','usd','dual'].includes(plan.mode)?plan.mode:'twd',inputs,out:{label:String(plan.out.label||'試算需求'),value:Number(plan.out.value),unit:String(plan.out.unit||'萬元')},at:String(plan.at||new Date().toLocaleString('zh-TW'))};
}
export function createLead({plan,city,district,services=[],label,source='網站試算（使用者同意）',consent=true,consultation=null}){
  if(!AREAS[city]||!AREAS[city].split(' ').includes(district))throw new Error('請選擇縣市與行政區。');
  const request=consultation?sanitizeConsultation(consultation):null;
  if(request&&(!request.company||!request.note))throw Error('請填寫門市稱呼與諮詢內容。');
  const snapshot=plan?planSnapshot(plan):request?enquiryPlan(request):planSnapshot(plan);
  const selected=[...new Set(services)].filter(k=>Object.hasOwn(SERVICES,k));if(!selected.length&&snapshot.model!=='overseas')throw new Error('請勾選至少一項想討論的服務。');
  if(!consent)throw new Error('請先勾選同意本次示範轉交。');
  const now=new Date().toISOString(),id=globalThis.crypto?.randomUUID?.()||('demo-'+Date.now()+'-'+Math.random().toString(16).slice(2));
  return {id,label:label||'網站規劃 '+new Date().toLocaleTimeString('zh-TW',{hour12:false}),city,district,services:selected,source,plan:snapshot,consultation:request,at:now,status:'未分派',assignment:null,finance:emptyFinance(),followups:{},consent:{version:CONSENT_VERSION,at:now,scope:'僅於同一瀏覽器儲存本次諮詢、選擇附上的規劃、地區與服務意願；未正式送件或通知銀行。'}};
}
export function fillCities(select){select.innerHTML='<option value="">請選擇縣市</option>'+Object.keys(AREAS).map(c=>`<option>${esc(c)}</option>`).join('');}
export function fillDistricts(select,city){select.innerHTML='<option value="">請選擇行政區</option>'+[...new Set((AREAS[city]||'').split(' ').filter(Boolean))].map(d=>`<option>${esc(d)}</option>`).join('');}
export function serviceChecks(prefix='handoff',keys=Object.keys(SERVICES)){return keys.filter(key=>Object.hasOwn(SERVICES,key)).map(key=>[key,SERVICES[key]]).map(([key,label])=>`<label class="op-check"><input type="checkbox" name="${prefix}Service" value="${key}"><span>${label}</span></label>`).join('');}

export function mountOpportunity({getPlan,target='#resultContent'}={}){
  const host=typeof target==='string'?document.querySelector(target):target;if(!host||typeof getPlan!=='function')return null;
  if(host.querySelector('.opportunity-handoff'))return host.querySelector('.opportunity-handoff');
  if(!document.getElementById('opportunityStyle')){
    const style=document.createElement('style');style.id='opportunityStyle';style.textContent=`.opportunity-handoff{font-size:16px;line-height:1.7;margin-top:26px;padding:24px 0 0;border-top:1px solid #d9e5e8;color:#173548}.opportunity-handoff summary{font-size:20px;font-weight:800;cursor:pointer;color:#006e69}.opportunity-handoff p,.opportunity-handoff label,.opportunity-handoff select,.opportunity-handoff button,.opportunity-handoff a,.opportunity-handoff small{font-size:16px}.opportunity-handoff .op-note{padding:14px;background:#f0f7f7;border-radius:10px}.opportunity-handoff .op-areas{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}.opportunity-handoff .op-areas label{display:grid;gap:6px;font-weight:700}.opportunity-handoff select{border:1px solid #aabec5;border-radius:8px;padding:10px;width:100%;background:white;color:#173548}.opportunity-handoff fieldset{border:0;padding:0;margin:18px 0}.opportunity-handoff legend{font-weight:800;margin-bottom:8px}.opportunity-handoff .op-check{display:flex;align-items:flex-start;gap:10px;margin:10px 0;font-weight:500}.opportunity-handoff .op-check input{margin-top:7px;width:18px;height:18px;flex:none;accent-color:#007d78}.opportunity-handoff .op-consent{background:#f6f8fa;border-radius:10px;padding:14px}.opportunity-handoff .op-submit{padding:12px 20px;border:0;border-radius:8px;background:#007d78;color:#fff;font-weight:800;cursor:pointer}.opportunity-handoff .op-submit:disabled{opacity:.6;cursor:default}.opportunity-handoff .op-feedback{margin:12px 0;color:#006e69;font-weight:700}.opportunity-handoff a{color:#006d77;text-decoration:underline}.opportunity-handoff .op-error{color:#b52c3c}.opportunity-handoff :focus-visible{outline:3px solid #d4a84b;outline-offset:3px}@media(max-width:480px){.opportunity-handoff .op-areas{grid-template-columns:1fr}}`;
    style.textContent+='.opportunity-handoff .op-areas>div{display:grid;gap:6px}';document.head.append(style);
  }
  const box=document.createElement('details');box.className='opportunity-handoff';box.innerHTML=`<summary>與 RM 討論這份規劃</summary><p>選擇您的營業地區與有興趣的服務，看看規劃如何接續到服務團隊。</p><p class="op-note"><strong>本機示範：</strong>只將本次試算、行政區與服務意願儲存在這個瀏覽器，<strong>不會實際通知 RM</strong>。這裡不填姓名、電話或統一編號；正式諮詢請使用下方玉山官方入口。</p><form class="op-form"><div class="op-areas"><div><label for="opHandoffCity">營業縣市</label><select id="opHandoffCity" name="city" required></select></div><div><label for="opHandoffDistrict">營業行政區</label><select id="opHandoffDistrict" name="district" required><option value="">請先選擇縣市</option></select></div></div><fieldset><legend>希望討論哪些服務？可複選</legend>${serviceChecks()}</fieldset><label class="op-check op-consent"><input type="checkbox" name="consent" required><span>我同意將<strong>本次試算、選擇的地區與服務意願</strong>，儲存至本機的服務團隊示範頁供檢視；我知道這不會實際傳送給銀行或通知 RM。</span></label><button type="submit" class="op-submit">同意並建立示範服務需求 →</button><p class="op-feedback" role="status" aria-live="polite"></p></form><p><a href="https://www.esunbank.com/zh-tw/about/services/customer/message-board" target="_blank" rel="noopener noreferrer">專人聯繫 ↗</a></p>`;
  host.append(box);const form=box.querySelector('form'),city=form.elements.city,district=form.elements.district,message=box.querySelector('.op-feedback');fillCities(city);city.addEventListener('change',()=>fillDistricts(district,city.value));
  form.addEventListener('submit',e=>{e.preventDefault();message.classList.remove('op-error');try{
    const plan=getPlan();const services=[...form.querySelectorAll('[name="handoffService"]:checked')].map(x=>x.value);
    const lead=createLead({plan,city:city.value,district:district.value,services,consent:form.elements.consent.checked});
    const leads=loadDemoLeads();if(leads.length>=200)throw new Error('示範資料已達 200 筆，請先到服務團隊示範頁清除舊資料。');saveDemoLeads([lead,...leads]);
    message.innerHTML='已建立本機示範需求，尚未通知 RM。<br><a href="internal.html" target="_blank" rel="noopener">開啟服務團隊示範工作台 →</a><br>僅同一瀏覽器、同一網站可檢視，不會跨裝置同步。';form.querySelector('[type="submit"]').disabled=true;
  }catch(error){message.classList.add('op-error');message.textContent=error.message||'無法儲存本機示範，請確認瀏覽器允許本機儲存。';}});
  let planKey='';
  function refreshPlan(){const plan=getPlan(),key=plan?JSON.stringify({model:plan.model,mode:plan.mode,inputs:plan.inputs,value:plan.out?.value,at:plan.at}):'';if(key===planKey)return;const hadPlan=Boolean(planKey);planKey=key;form.elements.consent.checked=false;form.querySelector('[type="submit"]').disabled=!plan;message.classList.toggle('op-error',!plan);message.textContent=!plan?'試算資料已變更，請先按「更新試算結果」，再確認這次轉交內容。':hadPlan?'規劃已更新，請重新確認服務意願並勾選同意。':'';}
  form.addEventListener('change',event=>{if(event.target.name!=='consent'){form.elements.consent.checked=false;message.textContent='轉交內容已變更，請重新勾選同意。';}form.querySelector('[type="submit"]').disabled=!getPlan();});
  const observer=new MutationObserver(refreshPlan);for(const id of ['resultStatus','resultTime']){const element=document.getElementById(id);if(element)observer.observe(element,{childList:true,subtree:true,characterData:true});}
  document.getElementById('modelForm')?.addEventListener('input',refreshPlan);window.addEventListener('esun-plan-updated',refreshPlan);refreshPlan();
  return box;
}

