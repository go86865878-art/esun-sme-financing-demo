import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {mergeEvents,project,validEvent} from './public/cloud-model.mjs';
const t=Date.now()-10000;
const baseline=(id,wrong=2)=>({id,at:t,type:'baseline',value:{wrong:['q001'],saved:['q002'],seen:['q001'],history:[],questionStats:{q001:{attempts:3,wrong,streak:0}}}});
const a={id:'answer-a',at:t+1,type:'answer',q:'q001',ok:false};
const b={id:'answer-b',at:t+2,type:'answer',q:'q001',ok:true};
const c={id:'answer-c',at:t+3,type:'answer',q:'q001',ok:true};
const events=mergeEvents([baseline('old-phone'),a,b],[baseline('old-desktop'),a,c]);
assert.equal(events.length,5);const p=project(events);
assert.equal(p.questionStats.q001.attempts,6);assert.equal(p.questionStats.q001.wrong,3);assert.equal(p.questionStats.q001.streak,2);assert.deepEqual(p.wrong,[]);
assert.deepEqual(project(mergeEvents(events,events)),p);
assert.deepEqual(project([...events].reverse()),p);
assert.deepEqual(project([...events,{id:'unsave',at:t+4,type:'saved',q:'q002',value:false}]).saved,[]);
assert(!validEvent({...a,q:'<script>'}));assert(!validEvent({...baseline('bad'),value:{}}));
// Two isolated browser contexts and one event store exercise the actual client transport.
const remote=new Map();let online=true;
function client(initial={},cache=null,cacheKey='steven-cloud-v1'){
 const initialState={wrong:[],saved:[],seen:[],history:[],questionStats:{},session:{items:['local-only']},...initial};
 const storage=new Map();if(cache)storage.set(cacheKey,JSON.stringify(cache));const elements=new Map();
 const context={mergeEvents,project,crypto:{randomUUID},Date,TextEncoder,console,navigator:{onLine:true},BANK:[{id:'q001'},{id:'q002'}],state:initialState,view:'quiz',persist(){},render(){},setTimeout(){return 0},clearTimeout(){},setInterval(){},window:{addEventListener(){}},document:{hidden:false,addEventListener(){},getElementById(id){if(!elements.has(id))elements.set(id,{});return elements.get(id)}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},async fetch(url,options={}){
  if(!online)throw Error('offline');
  if(options.method==='POST'){for(const e of JSON.parse(options.body).events)if(!remote.has(e.id))remote.set(e.id,e);return {ok:true,json:async()=>({})};}
  return {ok:true,json:async()=>({userId:'test-user',events:[...remote.values()]})};
 }};
 vm.createContext(context);let source=fs.readFileSync('public/cloud.js','utf8').replace(/^import .*\n/,'').replace(/\nstart\(\);\s*$/,'');vm.runInContext(source,context);
 return {context,run:s=>vm.runInContext(s,context),storage,elements};
}
const phone=client({wrong:['q001']});const desktop=client();
await phone.run('sync()');await desktop.run('sync()');assert.deepEqual([...desktop.context.state.wrong],['q001']);
phone.run(`studyCloudQueue('answer',{q:'q001',ok:false})`);desktop.run(`studyCloudQueue('answer',{q:'q001',ok:false})`);
await Promise.all([phone.run('sync()'),desktop.run('sync()')]);await phone.run('sync()');await desktop.run('sync()');
assert.equal(phone.context.state.questionStats.q001.wrong,2);assert.equal(desktop.context.state.questionStats.q001.wrong,2);
assert.deepEqual(phone.context.state.session,{items:['local-only']});
online=false;phone.run(`studyCloudQueue('saved',{q:'q002',value:true})`);await phone.run('sync()');assert(phone.run('cloud.pending.length')>0);
online=true;await phone.run('sync()');await desktop.run('sync()');assert.deepEqual([...desktop.context.state.saved],['q002']);
desktop.run(`studyCloudQueue('saved',{q:'q002',value:false})`);await desktop.run('sync()');await phone.run('sync()');assert.deepEqual([...phone.context.state.saved],[]);
const before=remote.size;await desktop.run('sync()');assert.equal(remote.size,before);
// The first answer, before first connection, must not be counted twice in a baseline.
const cold=client();cold.run(`studyCloudQueue('answer',{q:'q001',ok:false});state.questionStats.q001={attempts:1,wrong:1,streak:0}`);assert.equal(cold.run('cloud.events.filter(e=>e.type==="baseline")[0].value.questionStats.q001'),undefined);
console.log('PASS: two-device convergence, concurrent answers, idempotent retries, offline recovery, bookmark removal, legacy maximum merge, two-correct streaks, preserved local exam, preconnection answer, validation');

// Resume after local-only practice with an existing v1 cache. Old cloud answers
// are included in the local snapshot and must not be counted for a second time.
remote.clear();
const oldEvents=mergeEvents([baseline('legacy-base'),a,b]);for(const e of oldEvents)remote.set(e.id,e);
const localState={wrong:[],saved:[],seen:['q001'],history:[],questionStats:{q001:{attempts:7,wrong:4,streak:1,lastAnswered:t+7}}};
const resumed=client(localState,{events:oldEvents,pending:[],seeded:true,userId:'test-user'});
await resumed.run('sync()');assert.equal(resumed.context.state.questionStats.q001.attempts,7);assert.equal(resumed.context.state.questionStats.q001.wrong,4);assert.deepEqual([...resumed.context.state.saved],[]);assert.deepEqual([...resumed.context.state.wrong],[]);
const reader=client();await reader.run('sync()');assert.equal(reader.context.state.questionStats.q001.attempts,7);assert.deepEqual([...reader.context.state.saved],[]);
resumed.run(`studyCloudQueue('answer',{q:'q001',ok:false})`);await resumed.run('sync()');await reader.run('sync()');assert.equal(reader.context.state.questionStats.q001.attempts,8);assert.equal(reader.context.state.questionStats.q001.wrong,5);
const reloaded=client(resumed.context.state,JSON.parse(resumed.storage.get('steven-cloud-v2')),'steven-cloud-v2');await reloaded.run('sync()');assert.equal(reloaded.context.state.questionStats.q001.attempts,8);
const h={mode:'exam',score:80,date:new Date(t).toISOString(),count:50};const snap={...snapshotForTest(),history:[h]};
function snapshotForTest(){return {wrong:[],saved:[],seen:[],history:[],questionStats:{}}}
assert.equal(project([{id:'hist-base',at:t,type:'baseline',value:snap},{id:'hist-event',at:t+1,type:'history',value:h}]).history.length,1);
const account=client({saved:['q002']},{events:[],pending:[],seeded:true,userId:'another-user'},'steven-cloud-v2');let writes=0;const oldFetch=account.context.fetch;account.context.fetch=async(url,options={})=>{if(options.method==='POST')writes++;return oldFetch(url,options)};await account.run('sync()');assert.equal(writes,0);assert.deepEqual([...account.context.state.saved],['q002']);
console.log('PASS: v1 + local-only checkpoint migration, no duplicate historical answers, saved removal, empty second device, new answers, reload idempotency, history dedupe and account guard');
