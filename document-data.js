// Shared checklist definitions and browser-local preparation status.
export const baseDocs=[['基本資料','公司／商業登記、章程與股東資料','公司型態不同，適用的登記與名冊略有差異。'],['身分證明','負責人及保證人雙證件','國民身分證及第二身分證明文件；種類、正本／影本與核驗方式，請先與銀行確認。'],['財務稅務','最近三年財報、稅務報表與最近期自結報表','有會計師查核或稅簽報告，請一併備妥。'],['營業資料','近一年 401／403／405／406 表','提供公司適用的營業稅申報資料，不需四種都準備。'],['經營說明','營運模式與前十大進銷貨明細','說明賣什麼、向誰買、賣給誰，以及收款與付款條件。'],['往來資料','主要往來存摺、銀行授信及借款明細','依案件準備公司、負責人、保證人等主要往來及資金調度資料。']];
export const extraDocs={working:[['用途補充','應收貨款、存貨與應付貨款明細','依案件補充餘額、帳齡與交易條件。'],['用途補充','明年營收規劃、主要訂單或合約','說明成長來源、備貨高峰與預估資金需求。']],equipment:[['用途補充','興建／購置計畫與工程時程','包括建廠進度、工程預算、估價或工程契約；購置設備附報價與交期。'],['用途補充','營運計畫與預估財務報表','預估損益、資產負債、現金流量及資金來源去路。'],['用途補充','土地建物、許可與自有資金資料','依個案提供權利文件、建照、工廠登記及資金來源證明。']],expansion:[['加盟資料','加盟草約／正式合約與相關費用明細','加盟店依方案準備；自主品牌不適用加盟合約，另補充品牌與開店計畫。'],['用途補充','展店計畫、租約與裝修設備預算','說明地點、店數、人力、開幕與裝修時程。'],['用途補充','既有店營運與新店營收、損益預估','分店比較、爬坡金流與還款安排。']],overseas:[['用途補充','集團架構與海外投資／拓店計畫','投資地點、子公司、股權與分工；核准文件依適用規定確認。'],['用途補充','分幣別預算、投產進度與預估財報','分列台幣與美元支出、收入、資金來源與還款規劃。']]};
export const modelNames={working:'營運週轉金',equipment:'中央廚房與設備',expansion:'展店與開張',overseas:'海外投資／拓店'};
export const DOCUMENT_STORAGE_KEY='esun_franchise_document_checks_v1';
export const normalizeModel=value=>Object.hasOwn(modelNames,value)?value:'working';
export const documentsFor=model=>[...baseDocs,...extraDocs[normalizeModel(model)]];
const allowed=new Set([...baseDocs,...Object.values(extraDocs).flat()].map(x=>x[1]));
export function readDocumentChecks(storage){
  try{
    const raw=(storage??globalThis.localStorage).getItem(DOCUMENT_STORAGE_KEY);
    const parsed=raw?JSON.parse(raw):[];
    return new Set((Array.isArray(parsed)?parsed:[]).filter(x=>typeof x==='string'&&allowed.has(x)));
  }catch{return new Set();}
}
export function saveDocumentChecks(checked,storage){
  try{
    (storage??globalThis.localStorage).setItem(DOCUMENT_STORAGE_KEY,JSON.stringify([...checked].filter(x=>allowed.has(x))));
    return true;
  }catch{return false;}
}

