import {mergeEvents,project} from './cloud-model.mjs';
const CLOUD_KEY='steven-cloud-v2';
let cloud={events:[],pending:[],seeded:false,userId:null},busy=false,timer,lastSync=null;
try{const old=JSON.parse(localStorage.getItem(CLOUD_KEY)||'null');if(old)cloud=old;else{const legacy=JSON.parse(localStorage.getItem('steven-cloud-v1')||'null');if(legacy)cloud={...legacy,seeded:false};}}catch{}
const eventId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
function saveCloud(){try{localStorage.setItem(CLOUD_KEY,JSON.stringify(cloud));return true}catch{setStatus('儲存空間不足，請先匯出進度');return false}}
function setStatus(text){const el=document.getElementById('cloudStatus');if(el)el.textContent=text;}
function snapshot(s){return {wrong:s.wrong||[],saved:s.saved||[],seen:s.seen||[],history:(s.history||[]).slice(0,50),questionStats:s.questionStats||{}};}
function enqueue(type,value){
 if(type!=='baseline')ensureSeed();
 const at=cloud.events.reduce((a,e)=>Math.max(a,e.at+1),Date.now());
 const e=JSON.parse(JSON.stringify({id:eventId(),at,type,...value}));
 cloud.events=mergeEvents(cloud.events,[e]);cloud.pending=mergeEvents(cloud.pending,[e]);saveCloud();schedule();
}
function checkpoint(s){
 const old=project(cloud.events),value=snapshot(s);
 // A checkpoint includes the local-only period. Covered events already contribute
 // to its counters and must not be counted again when historical cloud data arrives.
 enqueue('baseline',{value,restore:true,covered:cloud.events.map(e=>e.id),savedKnown:[...new Set([...old.saved,...value.saved])],wrongKnown:[...new Set([...value.seen,...value.wrong])]});
}
function ensureSeed(){if(cloud.seeded)return;cloud.seeded=true;checkpoint(state);saveCloud();}
globalThis.studyCloudQueue=(type,value)=>enqueue(type,value);
globalThis.studyCloudExport=()=>({events:cloud.events});
globalThis.studyCloudImport=data=>{
 ensureSeed();
 if(data.cloudSync?.events){cloud.events=mergeEvents(cloud.events,data.cloudSync.events);cloud.pending=mergeEvents(cloud.pending,data.cloudSync.events);}
 // The app has already merged the imported local snapshot; retain its local-only
 // records too, even if this backup also contains older cloud events.
 checkpoint(state);saveCloud();schedule();
};
function schedule(){clearTimeout(timer);timer=setTimeout(sync,800);}
function apply(){
 const merged=project(cloud.events),valid=new Set(BANK.map(q=>q.id));
 for(const k of ['wrong','saved','seen'])state[k]=merged[k].filter(id=>valid.has(id));
 state.questionStats=merged.questionStats;state.history=merged.history;
 persist();if(!['quiz','result'].includes(view))render();
}
async function sync(){
 if(busy)return;ensureSeed();busy=true;setStatus('雲端同步中…');
 try{
  if(!navigator.onLine)throw Error('offline');
  const res=await fetch('/api/progress',{cache:'no-store',credentials:'same-origin',redirect:'error'});
  if(!res.ok)throw Error(res.status===401?'login':'network');
  const remote=await res.json();
  if(cloud.userId&&cloud.userId!==remote.userId)throw Error('account');
  cloud.userId=remote.userId;
  cloud.events=mergeEvents(remote.events,cloud.events);
  if(!saveCloud())throw Error('quota');
  while(cloud.pending.length){
   let batch=cloud.pending.slice(0,100);
   while(batch.length>1&&new TextEncoder().encode(JSON.stringify({events:batch})).length>900000)batch=batch.slice(0,Math.ceil(batch.length/2));
   const ids=new Set(batch.map(e=>e.id));
   const posted=await fetch('/api/progress',{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch})});
   if(!posted.ok)throw Error(posted.status===401?'login':'network');
   cloud.pending=cloud.pending.filter(e=>!ids.has(e.id));saveCloud();
  }
  const fresh=await fetch('/api/progress',{cache:'no-store',credentials:'same-origin',redirect:'error'});if(!fresh.ok)throw Error('network');
  const latest=await fresh.json();if(latest.userId!==cloud.userId)throw Error('account');
  cloud.events=mergeEvents(latest.events,cloud.events);saveCloud();apply();
  lastSync=new Date();setStatus(`已同步 ${lastSync.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}${cloud.pending.length?' · 尚有待上傳紀錄':''}`);
 }catch(e){
  setStatus(e.message==='account'?'帳號已變更，請先匯出進度，使用原帳號登入':e.message==='login'?'請重新登入以同步':e.message==='quota'?'儲存空間不足，請先匯出備份':'離線或連線失敗 · 紀錄留在此裝置，連線後重試');
 }finally{busy=false;}
}
async function start(){
 ensureSeed();
 if(!BANK.length){setTimeout(start,100);return;}
 const button=document.getElementById('syncNow');if(button)button.onclick=sync;
 await sync();setInterval(sync,20000);
}
window.addEventListener('storage',e=>{if(e.key!==CLOUD_KEY||!e.newValue)return;try{const other=JSON.parse(e.newValue);if(cloud.userId&&other.userId&&cloud.userId!==other.userId)return;cloud.events=mergeEvents(cloud.events,other.events||[]);cloud.pending=mergeEvents(cloud.pending,other.pending||[]);schedule();}catch{}});
window.addEventListener('online',sync);window.addEventListener('focus',sync);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
start();
