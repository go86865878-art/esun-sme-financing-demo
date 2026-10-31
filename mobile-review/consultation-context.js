export const CONSULTATION_TYPES=['加盟飲料','加盟餐飲','自主品牌餐飲','一般中小企業','中央廚房／食品製造','海外拓店'];
const clean=(v,max)=>String(v??'').trim().slice(0,max);
export function sanitizeConsultation(value={}){
 const purpose=['working','equipment','expansion','overseas'].includes(value.purpose)?value.purpose:'working';
 const businessType=CONSULTATION_TYPES.includes(value.businessType)?value.businessType:'一般中小企業';
 const optionalNumber=(raw,max)=>{if(raw===''||raw===null||raw===undefined)return null;const n=Number(raw);if(!Number.isFinite(n)||n<0||n>max)throw Error('請確認需求金額或店數範圍。');return n;};
 const payrollEmployees=optionalNumber(value.payrollEmployees,100000),annualReceipts=optionalNumber(value.annualReceipts,100000000);
 if(payrollEmployees!==null&&!Number.isInteger(payrollEmployees))throw Error('薪轉人數請填整數。');
 const amount=optionalNumber(value.amount,100000000),storeCount=optionalNumber(value.storeCount,100000);
 if(storeCount!==null&&!Number.isInteger(storeCount))throw Error('店數請填整數。');
 const month=clean(value.desiredMonth,7);if(month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('請確認預計用款月份。');
 let position=null;
 if(value.position&&Number.isFinite(value.position.lat)&&Number.isFinite(value.position.lng)&&Math.abs(value.position.lat)<=90&&Math.abs(value.position.lng)<=180){
 position={lat:value.position.lat,lng:value.position.lng,accuracy:Number.isFinite(value.position.accuracy)?Math.max(0,value.position.accuracy):null};
 }
 return {version:2,payrollEmployees,annualReceipts,purpose,businessType,company:clean(value.company,60),contact:clean(value.contact,40),phone:clean(value.phone,40),brand:clean(value.brand,60),storeCount,amount,desiredMonth:month,preferredTime:['平日上午','平日下午','平日傍晚','再與我確認'].includes(value.preferredTime)?value.preferredTime:'再與我確認',note:clean(value.note,1500),address:clean(value.address,160),position,summary:clean(value.summary,18000),health:value.health?{overall:clean(value.health.overall,10),items:Array.isArray(value.health.items)?value.health.items.slice(0,8).map(x=>({label:clean(x.label,80),value:clean(x.value,80),status:clean(x.status,12)})):[]}:null,healthInputs:sanitizeHealthInputs(value.healthInputs),healthAt:clean(value.healthAt,80),documents:Array.isArray(value.documents)?value.documents.slice(0,30).map(x=>({title:clean(x.title,150),ready:x.ready===true})):[]};
}
export function enquiryPlan(c){
 return {model:c.purpose,mode:'twd',inputs:{},out:{label:'客戶自述融資需求（非試算）',value:c.amount,unit:'萬元'},at:new Date().toLocaleString('zh-TW'),notCalculated:true};
}


const healthKeys=['cash','receipts','stock','shortDebt','totalDebt','assets','sales','profit','annualAvailable','annualDebt'];
export function sanitizeHealthInputs(value){
 if(!value||typeof value!=='object')return null;
 return Object.fromEntries(healthKeys.map(key=>{const v=value[key];return [key,typeof v==='number'&&Number.isFinite(v)?v:null]}));
}

