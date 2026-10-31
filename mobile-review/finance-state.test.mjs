import test from 'node:test';
import assert from 'node:assert/strict';
import {pairedHealth,sharedHealthPatch,writeFinanceDraft,readFinanceDraft} from './finance-state.js';
import {PLAN_EXAMPLES} from './franchise-scenarios.js';
import {diagnose} from './engine.js';
test('all planning examples have complete, valid matching health snapshots',()=>{for(const [model,rows] of Object.entries(PLAN_EXAMPLES))rows.forEach((example,i)=>{const h=pairedHealth(model,i);assert.equal(h.name,example.name);assert.equal(Object.keys(h.values).length,10);assert.equal(diagnose(h.values).items.length,5);if(model==='working')assert.equal(h.values.sales,example.values.sales)});});
test('only same-definition annual sales sync, never project credit or cash surplus into accounting balances',()=>{assert.deepEqual(sharedHealthPatch({model:'working',inputs:{sales:15000,own:50,existing:999}}),{sales:15000});for(const model of ['expansion','equipment','overseas'])assert.deepEqual(sharedHealthPatch({model,inputs:{revenue:100,annualBudget:950},out:{value:330}}),{});});
test('draft round trip retains blanks, edited financial values, case association and independent health selection',()=>{const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};const s={current:'working',caseId:'01',planInputs:{sales:'15000'},healthInputs:{cash:'555',profit:''},healthLink:{kind:'manual'},planReady:true,healthReady:false};assert.equal(writeFinanceDraft(s,storage),true);assert.deepEqual(readFinanceDraft(storage),{...s,version:1});assert.equal(readFinanceDraft({getItem:()=>'{bad'}),null);});
