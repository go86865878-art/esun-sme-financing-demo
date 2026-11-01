const integerFormat=new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0});
export const integerAmount=n=>Number.isFinite(n)?integerFormat.format(n):'待補資料';
export function setIntegerField(el,value){
 delete el.dataset.exactAmount;delete el.dataset.roundedAmount;
 if(value==null||value===''){el.value='';return;}
 const n=Number(value);if(!Number.isFinite(n)){el.value='';return;}
 el.value=String(Math.round(n));el.dataset.exactAmount=String(n);el.dataset.roundedAmount=el.value;
}
export function exactFieldValue(el){return el.dataset.exactAmount!==undefined&&el.value===el.dataset.roundedAmount?el.dataset.exactAmount:el.value;}
export function markIntegerFieldEdited(el){delete el.dataset.exactAmount;delete el.dataset.roundedAmount;}
