import {visualBriefSvg,MASCOT_URL} from './visual-brief.js?v=visualbrief20261101';
import {imagePagesPdf} from './pdf-report.js?v=visualbrief20261101';
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('圖表影像載入失敗'));i.src=src;});
export async function buildVisualReport(data){
 const mascot=await image(MASCOT_URL).catch(()=>null),pages=[];
 for(const page of [1,2]){
  const url=URL.createObjectURL(new Blob([visualBriefSvg(data,page)],{type:'image/svg+xml;charset=utf-8'}));
  let graphic;try{graphic=await image(url);}finally{URL.revokeObjectURL(url);}
  const canvas=document.createElement('canvas');canvas.width=1395;canvas.height=1973;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(graphic,0,0,canvas.width,canvas.height);
  if(mascot)ctx.drawImage(mascot,1143,35,180,177);
  pages.push({url:canvas.toDataURL('image/jpeg',.91),width:canvas.width,height:canvas.height});
 }
 return {pdf:imagePagesPdf(pages,'企業資金規劃｜圖表摘要'),image:{mime:'image/jpeg',base64:pages[0].url.split(',')[1]}};
}
