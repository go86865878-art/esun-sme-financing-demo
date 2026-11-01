// Presentation and navigation only; financial calculations remain in engine.js.
const main=document.querySelector('main');
if(document.body.classList.contains('mobile-experience')&&main){
 const hero=main.querySelector('.hero'),banner=main.querySelector('.baseball-banner');
 if(hero&&banner)hero.after(banner);
 const progress=document.createElement('nav');progress.className='experience-progress wrap';progress.setAttribute('aria-label','資金規劃流程');
 const steps=[['models','選擇用途'],['simulator','資金試算'],['health','財務健檢'],['consultation','留下需求']];
 for(const [i,[id,title]]of steps.entries()){const a=document.createElement('a');a.href='#'+id;const n=document.createElement('span');n.textContent=String(i+1);a.append(n,document.createTextNode(title));progress.append(a);}
 if(hero)hero.after(progress);
 function next(owner,title,href,cta){
  if(!owner)return;const section=document.createElement('div');section.className='experience-next';
  const p=document.createElement('p');p.textContent=title;const a=document.createElement('a');a.className='button';a.href=href;a.textContent=cta;section.append(p,a);owner.append(section);
 }
 next(document.querySelector('#resultContent'),'資金需求算好了，再看看付款與還款能力。','#health','接著做財務健檢 →');
 next(document.querySelector('.health-result'),'把這份規劃帶給專人，一起討論適合的安排。','#consultation','帶著規劃留下需求 →');
 for(const id of ['modelForm','healthForm','consultationForm']){
  const form=document.getElementById(id);if(!form)continue;
  form.addEventListener('submit',()=>requestAnimationFrame(()=>{
   const error=form.querySelector('.error');if(!error?.textContent.trim())return;
   error.setAttribute('tabindex','-1');error.focus({preventScroll:true});error.scrollIntoView({block:'center',behavior:'smooth'});
  }));
 }
 // A hidden destination must become visible before native hash scrolling occurs.
 document.addEventListener('click',e=>{
  const a=e.target.closest('.experience-next a');if(!a||!matchMedia('(max-width:760px)').matches)return;
  const target=document.querySelector(a.hash);if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'smooth'}));
 });
}
