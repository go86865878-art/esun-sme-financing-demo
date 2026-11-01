import test from 'node:test';
import assert from 'node:assert/strict';
import {baseDocs,extraDocs,documentsFor,normalizeModel,readDocumentChecks,saveDocumentChecks,DOCUMENT_STORAGE_KEY} from './document-data.js';
import {buildConsultationSummary} from './consultation.js';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
test('checklist progress survives reload and purpose changes without leaking purpose-specific documents',()=>{
 const storage=memory(),common=baseDocs[0][1],equipment=extraDocs.equipment[0][1];
 assert.equal(saveDocumentChecks(new Set([common,equipment]),storage),true);
 const reloaded=readDocumentChecks(storage);
 assert.equal(reloaded.has(common),true);assert.equal(reloaded.has(equipment),true);
 assert.equal(documentsFor('working').some(x=>x[1]===equipment),false);
 assert.equal(documentsFor('equipment').filter(x=>reloaded.has(x[1])).length,2);
 assert.equal(documentsFor('working').filter(x=>reloaded.has(x[1])).length,1);
 reloaded.delete(common);saveDocumentChecks(reloaded,storage);
 assert.equal(readDocumentChecks(storage).has(common),false);
});
test('unknown stored content and invalid purpose cannot become checklist entries',()=>{
 const storage=memory(),title=baseDocs[0][1];
 storage.setItem(DOCUMENT_STORAGE_KEY,JSON.stringify([title,title,'<script>unknown</script>',123,null]));
 assert.deepEqual([...readDocumentChecks(storage)],[title]);
 storage.setItem(DOCUMENT_STORAGE_KEY,'{invalid json');
 assert.equal(readDocumentChecks(storage).size,0);
 storage.setItem(DOCUMENT_STORAGE_KEY,JSON.stringify({unexpected:true}));
 assert.equal(readDocumentChecks(storage).size,0);
 assert.equal(normalizeModel('__proto__'),'working');
 assert.deepEqual(documentsFor('unknown'),documentsFor('working'));
});
test('blocked browser storage remains usable and reports write failure',()=>{
 const storage={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
 assert.equal(readDocumentChecks(storage).size,0);
 assert.equal(saveDocumentChecks(new Set([baseDocs[0][1]]),storage),false);
});
test('the consultation summary uses the document page preparation state',()=>{
 const storage=memory(),title=baseDocs[0][1];saveDocumentChecks(new Set([title]),storage);
 const checked=readDocumentChecks(storage);
 const summary=buildConsultationSummary({
  plan:{model:'working',at:'demo',out:{label:'資金缺口',value:619.2,unit:'萬元',metrics:[]}},
  title:'營運週轉金',documents:documentsFor('working').map(x=>({title:x[1],ready:checked.has(x[1])}))
 });
 assert.ok(summary.includes('☑ '+title));assert.ok(summary.includes('☐ '+baseDocs[1][1]));
 assert.ok(summary.includes('619.2'));assert.ok(summary.includes('不會自動傳送給銀行'));
});

