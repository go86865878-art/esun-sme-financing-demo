import {financingNeed} from './financing-need.js';
export const ROUTING_KEY='esun_franchise_routing_v1';
export const BRANCH_COORDS_KEY='esun_franchise_branch_coords_v1';
export function validThreshold(raw){
 if(raw===null||raw===undefined||String(raw).trim()==='')return null;
 const n=Number(raw);if(!Number.isFinite(n)||n<=0||n>100000000)throw Error('分派門檻請填大於 0 的有效萬元金額。');return n;
}
export function validPoint(p){return !!p&&typeof p.lat==='number'&&typeof p.lng==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;}
export function distanceKm(a,b){
 if(!validPoint(a)||!validPoint(b))return null;
 const radians=d=>d*Math.PI/180,dl=radians(b.lng-a.lng),dp=radians(b.lat-a.lat),s=Math.sin(dp/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dl/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(s),Math.sqrt(Math.max(0,1-s)));
}
export function needInTwd(lead){return financingNeed(lead?.plan);}
export function branchCandidates(lead,branches){
 branches=branches.filter(b=>!b.reviewRequired);
 const point=lead?.consultation?.position;
 if(validPoint(point)){
  const located=branches.filter(validPoint).map(b=>({...b,distance:distanceKm(point,b),match:'直線距離'})).sort((a,b)=>a.distance-b.distance);
  if(located.length)return {items:located.slice(0,5),basis:'僅在已有座標的載入據點中比較直線距離；不代表行車距離或全行最近。'};
 }
 const sameDistrict=branches.filter(b=>b.city===lead?.city&&b.district===lead?.district);
 const sameCity=branches.filter(b=>b.city===lead?.city&&b.district!==lead?.district);
 return {items:[...sameDistrict.map(b=>({...b,distance:null,match:'同一行政區'})),...sameCity.map(b=>({...b,distance:null,match:'同一縣市'}))].slice(0,5),basis:'依縣市／行政區列候選，未計算距離；需確認營業地址及據點座標。'};
}
export function suggestAssignment(lead,{threshold=null,branches=[],routes=[]}={}){
 const need=needInTwd(lead),candidates=branchCandidates(lead,branches),amount=need.amount;
 if(threshold===null)return {kind:'pending',label:'請先設定分派門檻',eligible:false,need,candidates};
 if(amount===null)return {kind:'pending',label:'金額待確認，先人工判斷',eligible:false,need,candidates};
 if(amount>=threshold){
  const route=routes.find(r=>r.city===lead.city&&r.district===lead.district)||routes.find(r=>r.city===lead.city&&r.district==='*');
  return {kind:'center',label:'建議由區域中心承接',team:route?.team||'區域中心待人工指定',rm:route?.rm||'待指定人員',eligible:!!route,need,candidates,note:'達設定門檻（含），區域中心仍依服務權責人工確認。'};
 }
 const branch=candidates.items[0];
 return {kind:'branch',label:'建議由分行承接',team:branch?.name||'分行待人工選擇',rm:'分行服務窗口（示範）',branch,eligible:!!branch,need,candidates,note:branch?.distance!==null&&branch?.distance!==undefined?'在已載入且有座標的據點中距離較近，仍需人工確認。':'暫以同區／同縣市候選優先；尚非最近距離判定。'};
}

