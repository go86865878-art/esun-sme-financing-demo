// Append-only events: stable IDs make retries and concurrent device uploads idempotent.
const validId = s => typeof s === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(s);
const ids = a => Array.isArray(a) && a.length <= 2000 && a.every(validId);
const count = n => Number.isSafeInteger(n) && n >= 0 && n <= 10000000;
export function validEvent(e) {
 if (!e || !validId(e.id) || !Number.isSafeInteger(e.at) || e.at < 0 || e.at > Date.now()+86400000) return false;
 if(e.type==='answer')return validId(e.q)&&typeof e.ok==='boolean';
 if(e.type==='saved')return validId(e.q)&&typeof e.value==='boolean';
 if(e.type==='history')return validHistory(e.value);
 if(e.type!=='baseline'||!e.value)return false;
 if(e.restore!==undefined&&(e.restore!==true||!Array.isArray(e.covered)||e.covered.length>20000||!e.covered.every(validId)||!ids(e.savedKnown)||!ids(e.wrongKnown)))return false;
 const s=e.value;
 return ['wrong','saved','seen'].every(k=>ids(s[k]))&&Array.isArray(s.history)&&s.history.length<=50&&s.history.every(validHistory)&&s.questionStats&&typeof s.questionStats==='object'&&!Array.isArray(s.questionStats)&&Object.keys(s.questionStats).length<=2000&&Object.entries(s.questionStats).every(([id,st])=>validId(id)&&st&&count(st.attempts)&&count(st.wrong)&&count(st.streak)&&st.wrong<=st.attempts&&st.streak<=st.attempts);
}
function validHistory(x){return x&&['exam','practice'].includes(x.mode)&&Number.isFinite(x.score)&&x.score>=0&&x.score<=100&&Number.isSafeInteger(x.count)&&x.count>0&&x.count<=2000&&typeof x.date==='string'&&Number.isFinite(Date.parse(x.date));}
export function mergeEvents(...groups){const m=new Map();for(const e of groups.flat())if(validEvent(e)&&!m.has(e.id))m.set(e.id,e);return [...m.values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));}
export function project(events){
 const wrong=new Set(),saved=new Set(),seen=new Set(),history=new Map(),questionStats={};
 const addHistory=(h)=>history.set(JSON.stringify(h),h);
 const ordered=mergeEvents(events),covered=new Set(ordered.filter(e=>e.type==='baseline'&&e.restore).flatMap(e=>e.covered)),wrongAt={};
 // Historical counters cannot be reliably added across devices. Keep their maximum,
 // then add every new answer exactly once using its event ID.
 for(const e of ordered.filter(e=>e.type==='baseline')){
  if(e.restore!==undefined&&(e.restore!==true||!Array.isArray(e.covered)||e.covered.length>20000||!e.covered.every(validId)||!ids(e.savedKnown)||!ids(e.wrongKnown)))return false;
 const s=e.value;for(const k of s.wrong)wrong.add(k);for(const k of s.saved)saved.add(k);for(const k of s.seen)seen.add(k);
  for(const h of s.history)addHistory(h,JSON.stringify(h));
  for(const [id,st] of Object.entries(s.questionStats)){
   const old=questionStats[id]||{attempts:0,wrong:0,streak:0,lastAnswered:0};
   questionStats[id]={attempts:Math.max(old.attempts,st.attempts),wrong:Math.max(old.wrong,st.wrong),streak:(st.lastAnswered||0)>(old.lastAnswered||0)?st.streak:old.streak,lastAnswered:Math.max(old.lastAnswered||0,st.lastAnswered||0),legacy:!!old.legacy||!!st.legacy};
  }
 }
 for(const id of wrong){questionStats[id]??={attempts:0,wrong:0,streak:0,lastAnswered:0};questionStats[id].legacy=true;}
 for(const e of ordered){
  if(e.type==='answer'){
   if(!covered.has(e.id)){
    const st=questionStats[e.q]||{attempts:0,wrong:0,streak:0,legacy:false,lastAnswered:0};
    const newer=e.at>=(st.lastAnswered||0);
    questionStats[e.q]={...st,attempts:st.attempts+1,wrong:st.wrong+(e.ok?0:1),streak:newer?(e.ok?st.streak+1:0):st.streak,lastAnswered:Math.max(st.lastAnswered||0,e.at)};
   }
   seen.add(e.q);if(e.at>=(wrongAt[e.q]||0)){wrongAt[e.q]=e.at;if(e.ok)wrong.delete(e.q);else wrong.add(e.q);}
  }else if(e.type==='saved'){if(e.value)saved.add(e.q);else saved.delete(e.q);}
  else if(e.type==='history')addHistory(e.value);
  else if(e.type==='baseline'&&e.restore){
   for(const id of e.savedKnown){if(e.value.saved.includes(id))saved.add(id);else saved.delete(id);}
   for(const id of e.wrongKnown){const at=e.value.questionStats[id]?.lastAnswered||e.at;if(at>=(wrongAt[id]||0)){wrongAt[id]=at;if(e.value.wrong.includes(id))wrong.add(id);else wrong.delete(id);}}
  }
 }
 return {wrong:[...wrong],saved:[...saved],seen:[...seen],questionStats,history:[...history.values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,50)};
}
