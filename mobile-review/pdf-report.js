import {financingNeed} from './financing-need.js';
import {PURPOSE_TITLES} from './franchise-scenarios.js';
export const HEALTH_LABELS={cash:'可動用現金與銀行存款',receipts:'一年內可收回的貨款',stock:'可售庫存成本',shortDebt:'一年內全部應付款',totalDebt:'負債總額',assets:'資產帳面總額',sales:'全年營業收入',profit:'全年營業利益',annualAvailable:'未來一年可還款現金',annualDebt:'原有借款全年本息'};
const C={green:'#009b8f',ink:'#214b60',muted:'#76909a',pale:'#edf7f4',line:'#d8e8e8',red:'#b74350',amber:'#956a23',white:'#ffffff'};
const status={green:'健康',yellow:'注意',red:'警示',na:'資料不足／不適用'};
const fmt=n=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:2}):'待補資料';
const W=595.28,H=841.89,M=36,CW=W-M*2;
const enc=new TextEncoder();
function bytes(s){return enc.encode(s)}
function join(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let pos=0;for(const p of parts){out.set(p,pos);pos+=p.length}return out}
function decode64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
function hexText(s){return 'FEFF'+Array.from(String(s)).map(c=>{const n=c.codePointAt(0);return n<=65535?n.toString(16).padStart(4,'0'):String.fromCodePoint(n).split('').map(v=>v.charCodeAt(0).toString(16)).join('')}).join('')}
export function imagePagesPdf(pages,title='企業財務報告'){
 const objects=[],put=o=>{objects.push(typeof o==='string'?bytes(o):o);return objects.length};
 put('<< /Type /Catalog /Pages 2 0 R >>');put('');const kids=[];
 for(const page of pages){const image=decode64(page.url.split(',')[1]);const imageId=put(join([bytes('<< /Type /XObject /Subtype /Image /Width '+page.width+' /Height '+page.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+image.length+' >>\nstream\n'),image,bytes('\nendstream')]));
  const commands='q '+W+' 0 0 '+H+' 0 0 cm /Img Do Q';const contentId=put('<< /Length '+commands.length+' >>\nstream\n'+commands+'\nendstream');
  kids.push(put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /XObject << /Img '+imageId+' 0 R >> >> /Contents '+contentId+' 0 R >>'));
 }
 objects[1]=bytes('<< /Type /Pages /Count '+kids.length+' /Kids ['+kids.map(id=>id+' 0 R').join(' ')+'] >>');
 const info=put('<< /Title <'+hexText(title)+'> /Creator (SME Financing Demo) >>');
 const parts=[bytes('%PDF-1.4\n% generated report\n')],offsets=[0];let offset=parts[0].length;
 objects.forEach((o,i)=>{const part=join([bytes((i+1)+' 0 obj\n'),o,bytes('\nendobj\n')]);offsets.push(offset);offset+=part.length;parts.push(part)});
 const xref=offset;parts.push(bytes('xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R /Info '+info+' 0 R >>\nstartxref\n'+xref+'\n%%EOF\n'));
 return join(parts);
}
class Report{
 constructor(title,subtitle,options){this.title=title;this.subtitle=subtitle;this.options=options;this.pages=[];this.scale=options.scale||2;this.newPage();}
 font(size=10,bold=false){this.ctx.font=(bold?'700 ':'400 ')+size+'px "Microsoft JhengHei", "Noto Sans TC", sans-serif';}
 text(t,x,y,size=10,color=C.ink,bold=false){this.font(size,bold);this.ctx.fillStyle=color;this.ctx.fillText(String(t??''),x,y);}
 lines(t,width,size=10,bold=false){this.font(size,bold);const lines=[];for(const p of String(t??'').split('\n')){let line='';for(const ch of p){if(line&&this.ctx.measureText(line+ch).width>width){lines.push(line);line=''}line+=ch}lines.push(line)}return lines}
 para(t,{x=M,width=CW,size=10,color=C.ink,bold=false,gap=6}={}){const lines=this.lines(t,width,size,bold),lineH=size*1.55;this.ensure(lines.length*lineH+gap);for(const l of lines){this.text(l,x,this.y,size,color,bold);this.y+=lineH}this.y+=gap;}
 box(x,y,w,h,color=C.pale,r=5){this.ctx.fillStyle=color;this.ctx.beginPath();this.ctx.roundRect(x,y,w,h,r);this.ctx.fill();}
 line(x,y,w=CW){this.ctx.strokeStyle=C.line;this.ctx.lineWidth=.7;this.ctx.beginPath();this.ctx.moveTo(x,y);this.ctx.lineTo(x+w,y);this.ctx.stroke();}
 newPage(){const create=this.options.createCanvas||((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c});this.canvas=create(Math.round(W*this.scale),Math.round(H*this.scale));this.ctx=this.canvas.getContext('2d');this.ctx.scale(this.scale,this.scale);this.ctx.textBaseline='top';this.ctx.fillStyle=C.white;this.ctx.fillRect(0,0,W,H);this.ctx.fillStyle=C.green;this.ctx.fillRect(0,0,W,11);if(this.options.logo)this.ctx.drawImage(this.options.logo,M,42,30,30);this.text(this.title,M+43,39,20,C.ink,true);this.text(this.subtitle,M+43,69,9,C.muted);if(this.options.meow){const im=this.options.meow,r=im.width/im.height;this.ctx.drawImage(im,W-M-72,22,72,72/r)}this.y=112;this.pages.push(this.canvas);}
 ensure(h){if(this.y+h>H-55)this.newPage();}
 section(t){this.ensure(39);this.box(M,this.y,CW,25);this.text(t,M+10,this.y+6,11,C.ink,true);this.y+=35;}
 metrics(items){this.ensure(74);const gap=10,w=(CW-gap*(items.length-1))/items.length,y=this.y;items.forEach(([label,value],i)=>{const x=M+i*(w+gap);this.box(x,y,w,65);this.text(label,x+10,y+9,8.5,C.muted);let sz=18;this.font(sz,true);while(this.ctx.measureText(String(value)).width>w-20&&sz>9){sz--;this.font(sz,true)}this.text(value,x+10,y+31,sz,C.green,true)});this.y+=78;}
 pairs(rows){for(let i=0;i<rows.length;i+=2){const cells=rows.slice(i,i+2),w=(CW-18)/2;const wrapped=cells.map(([l,v])=>({l:this.lines(l,w-18,9),v:this.lines(v,w-18,11,true)}));const height=Math.max(...wrapped.map(a=>a.l.length*14+a.v.length*16+15));this.ensure(height);const y=this.y;wrapped.forEach((a,j)=>{let yy=y;const x=M+j*(w+18);for(const l of a.l){this.text(l,x+7,yy,9,C.muted);yy+=14}for(const v of a.v){this.text(v,x+7,yy,11,C.ink,true);yy+=16}this.line(x,y+height-7,w)});this.y+=height;}this.y+=6;}
 compactPairs(rows){for(let i=0;i<rows.length;i+=2){const row=rows.slice(i,i+2).flat();while(row.length<4)row.push('');this.row(row,[150,111,150,CW-411],{fill:i%4===0})}this.y+=10;}
 bars(rows,unit='萬元'){const max=Math.max(1,...rows.map(r=>Math.abs(r[1])));this.ensure(rows.length*39+7);for(const [label,value,color]of rows){this.text(label,M,this.y,9.5,C.ink);this.font(10,true);const v=fmt(value)+' '+unit;this.text(v,W-M-this.ctx.measureText(v).width,this.y,10,color||C.ink,true);this.box(M,this.y+17,CW,8,C.pale,3);this.box(M,this.y+17,Math.max(1,Math.abs(value)/max*CW),8,color||(value<0?C.red:C.green),3);this.y+=39}this.y+=5;}
 row(cells,widths,{bold=false,fill=false}={}){const lines=cells.map((c,i)=>this.lines(c,widths[i]-14,9,bold));const h=Math.max(...lines.map(l=>l.length))*14+13;this.ensure(h);if(fill)this.box(M,this.y,CW,h,C.pale,0);let x=M;lines.forEach((ls,i)=>{ls.forEach((t,j)=>this.text(t,x+7,this.y+6+j*14,9,C.ink,bold));x+=widths[i]});this.line(M,this.y+h);this.y+=h;}
 footer(){this.pages.forEach((canvas,i)=>{const ctx=canvas.getContext('2d');ctx.save();ctx.setTransform(this.scale,0,0,this.scale,0,0);ctx.fillStyle=C.white;ctx.fillRect(0,H-45,W,45);ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(M,H-43);ctx.lineTo(W-M,H-43);ctx.stroke();ctx.font='8px "Microsoft JhengHei", "Noto Sans TC", sans-serif';ctx.fillStyle=C.muted;ctx.textBaseline='top';ctx.fillText(this.options.footerText||'測試網・情境規劃參考，非核貸承諾或銀行授信評等。',M,H-32);ctx.fillText((i+1)+' / '+this.pages.length,W-M-30,H-32);ctx.restore()})}
 finish(){this.footer();return imagePagesPdf(this.pages.map(c=>({url:c.toDataURL('image/jpeg',.94),width:c.width,height:c.height})),this.title);}
}
async function assets(options={}){const load=options.loadImage||((src)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src}));const [logo,meow]=await Promise.all([load('esun-icon.png').catch(()=>null),load('esun-meow.png').catch(()=>null)]);return {...options,logo,meow}}
function meta(r,data){r.para(data.company||'企業名稱：________________________',{size:12,bold:true});if(data.address)r.para('營業地址：'+data.address,{size:9,color:C.muted});r.para('資料時間：'+(data.at||data.plan?.at||data.health?.at||'—')+'　｜　金額單位：新臺幣萬元（美元另註）',{size:8.5,color:C.muted});}
export async function buildPlanPdf(data,options={}){
 const p=data.plan,o=p.out,r=new Report('企業財務規劃報告','先看資金缺口，再安排還款與用款時點。',await assets(options));meta(r,data);r.section('01  本次資金規劃｜'+(PURPOSE_TITLES[p.model]||p.model));
 const need=financingNeed(p).amount;r.metrics([['融資規劃需求',fmt(need)+' 萬元'],['預計用款',data.month||'待確認'],['規劃用途',PURPOSE_TITLES[p.model]||p.model]]);
 r.para(o.label+'：'+fmt(o.value)+' '+o.unit,{size:12,bold:true});r.para(o.sub,{size:10,color:C.muted});r.pairs(o.metrics.map(x=>[x.label,x.value]));
 if(o.breakdown?.length){r.section('02  資金組成與情境比較');r.bars(o.breakdown.map(x=>[x.label,x.value]));}
 const noteOnSecond=r.y+35+r.lines(o.note,CW,10).length*15.5+40>H-55;if(noteOnSecond)r.newPage();r.section('03  規劃提醒');r.para(o.note,{size:10});r.para('資金缺口不等於可核貸額度；利率、年期與還款方式皆為本次試算假設。',{size:9,color:C.muted});
 if(!noteOnSecond)r.newPage();r.section('04  本次輸入與假設');r.compactPairs(data.fields.filter(f=>p.inputs[f.id]!==undefined&&f.id!=='mode'&&!(p.model==='overseas'&&((p.mode==='usd'&&['investTwd','equityTwd'].includes(f.id))||(p.mode==='twd'&&['investUsd','equityUsd','fx','swing'].includes(f.id))))).map(f=>[f.label,fmt(p.inputs[f.id])+' '+f.unit]));r.para('計算方式：'+o.formula,{size:8.5,color:C.muted});
 if(o.schedule?.length){r.section('05  年度本息安排');const widths=[60,150,150,CW-360];r.row(['年度','本金','利息','本息合計'],widths,{bold:true,fill:true});for(const x of o.schedule)r.row([String(x.year),fmt(x.principal),fmt(x.interest),fmt(x.total)],widths);r.y+=12;}
 r.section('下一步｜整理申貸資料');const docs=data.documents||[];for(let i=0;i<docs.length;i+=2){const row=docs.slice(i,i+2).map(d=>(d.ready?'☑ ':'□ ')+d.title);while(row.length<2)row.push('');r.row(row,[CW/2,CW/2]);}r.y+=8;r.para('實際徵提資料請與服務單位確認；勾選不代表已送件。',{size:8.5,color:C.muted});
 return r.finish();
}
export async function buildHealthPdf(data,options={}){
 const h=data.health,r=new Report('企業財務健檢報告','看懂付款、獲利與還款能力，讓數字說清楚。',await assets(options));meta(r,data);r.para(data.sourceNote||'請以同一家公司、相同期間的財務資料判讀。',{size:9,color:C.muted});r.section('01  五項財務指標｜整體：'+(status[h.out.overall]||'待確認'));
 for(const item of h.out.items){const lines=r.lines(item.advice,CW-24,9),height=57+lines.length*14;r.ensure(height+8);const y=r.y;r.box(M,y,CW,height);r.text(item.label,M+12,y+9,11,C.ink,true);const color=item.status==='red'?C.red:item.status==='yellow'?C.amber:item.status==='green'?C.green:C.muted;r.text(item.value,M+12,y+29,17,color,true);r.font(9,true);const tag=status[item.status];r.text(tag,W-M-r.ctx.measureText(tag).width-12,y+12,9,color,true);lines.forEach((t,i)=>r.text(t,M+12,y+54+i*14,9,C.ink));r.y+=height+8;}
 if(Number.isFinite(h.inputs.sales)&&Number.isFinite(h.inputs.profit)){r.section('02  獲利結構');r.bars([['營業收入',h.inputs.sales],['成本與營業費用',h.inputs.sales-h.inputs.profit,'#93bfb6'],['營業利益／虧損',h.inputs.profit,h.inputs.profit<0?C.red:'#d6a346']]);}
 r.newPage();r.section('03  本次健檢數字');r.pairs(Object.entries(HEALTH_LABELS).map(([k,label])=>[label,fmt(h.inputs[k])+' 萬元']));
 if(data.plan){r.section('04  已連結的資金規劃');r.para((PURPOSE_TITLES[data.plan.model]||'本次規劃')+'｜融資需求 '+fmt(financingNeed(data.plan).amount)+' 萬元',{bold:true});r.para('此需求為新增規劃，不直接併入上方負債、資產或全年本息。需另依撥款與還款時點評估投資後財務。',{size:9,color:C.muted});}
 r.section('指標定義與判讀標準');for(const item of h.out.items){r.para(item.label,{size:9.5,bold:true,gap:2});r.para(item.definition,{size:8.5,color:C.muted,gap:9})}r.para(h.out.note,{size:8.5,color:C.muted});return r.finish();
}
export async function buildCasesPdf(cases,options={}){
 const r=new Report('企業融資情境案例','第10組｜完整數值、財務健檢與主管通知示範。',await assets({...options,footerText:'虛構案例・600萬元非銀行內規・通知僅產生郵件草稿。'}));
 for(let i=0;i<cases.length;i++){if(i)r.newPage();const a=cases[i];r.para(a.title,{size:16,bold:true});meta(r,{company:a.company,address:a.address,at:'2026.10.31'});r.para('案例角色：'+a.rm+'　｜　用款：'+a.month+'　｜　方便聯繫：'+a.time,{size:9,color:C.muted});r.para(a.story,{size:9.5});
  r.section('01  規劃輸入｜同一情境帶入網站');const fields=a.fields.filter(f=>!f[0].includes('拆分'));for(let j=0;j<fields.length;j+=2){const row=fields.slice(j,j+2).flat();while(row.length<4)row.push('');r.row(row,[115,146,115,CW-376],{fill:j%4===0})}r.y+=8;
  r.metrics([['融資規劃需求',fmt(financingNeed(a.plan).amount)+' 萬元'],['營業利益率',fmt(a.health.profit/a.health.sales*100)+'%'],['原有本息覆蓋',fmt(a.health.annualAvailable/a.health.annualDebt)+' 倍']]);r.para(a.insight,{size:9});
  r.section('02  配對財務健檢｜投資前教學資料');const h=a.health;const rows=Object.entries(HEALTH_LABELS).map(([k,l])=>l+' '+fmt(h[k]));for(let j=0;j<rows.length;j+=2)r.para(rows.slice(j,j+2).join('　／　'),{size:8.8,gap:2});r.para('資產負債為2026/09月底、損益為2026全年預估；本息未計入本案新增借款。',{size:8,color:C.muted});
  r.section('03  推薦單位 → 通知主管');r.para(a.notification,{size:9,bold:true});r.para(a.ask.split('？')[0]+'？',{size:8.8});r.para('帶入案例 → 查看試算／健檢 → 建立諮詢需求 → 後台通知主管。',{size:8.5,color:C.muted});
 }return r.finish();
}
export function downloadPdf(filename,pdf){const blob=new Blob([pdf],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return blob;}
