// Mobile-only navigation; scroll state remains entirely in this page.
const sections=[['top','首頁'],['models','規劃'],['simulator','試算'],['health','健檢'],['documents','準備']].map(([id,label])=>({id,label,node:document.getElementById(id)})).filter(x=>x.node);
if(sections.length){
 const rail=document.createElement('nav');rail.className='scroll-rail';rail.hidden=true;rail.setAttribute('aria-label','手機快速導覽');
 rail.innerHTML=`<output aria-hidden="true">0%</output><div class="rail-controls"><div class="rail-links">${sections.map(s=>`<a href="#${s.id}" data-rail-section="${s.id}">${s.label}</a>`).join('')}</div><div class="rail-track" role="slider" tabindex="0" aria-label="拖曳調整頁面捲動位置" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="首頁，已捲動0%"><span class="rail-fill" aria-hidden="true"></span><span class="rail-thumb" aria-hidden="true"></span></div></div>`;
 document.body.append(rail);
 const track=rail.querySelector('.rail-track'),links=[...rail.querySelectorAll('[data-rail-section]')],mobile=matchMedia('(max-width:860px)');
 let frame=0,dragging=false,previousScrollBehavior='';
 const maxScroll=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const reduceMotion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 const headerBottom=()=>Math.max(0,document.querySelector('header')?.getBoundingClientRect().bottom||0);
 function geometry(){const top=Math.max(84,headerBottom()+12);const launcher=document.querySelector('#esun-assistant-toggle');const bottom=Math.max(top+78,Math.min(innerHeight-18,launcher?.getBoundingClientRect().top-16||innerHeight-98));const space=bottom-top;rail.classList.toggle('is-short',space<330);rail.style.setProperty('--rail-top',`${(top+bottom)/2}px`);rail.style.setProperty('--rail-max-height',`${Math.max(90,space)}px`);}
 function updateVisibility(){const focused=document.activeElement;const editing=focused&&!rail.contains(focused)&&focused.matches('input,textarea,select,[contenteditable="true"]');const chatting=document.getElementById('esun-assistant-toggle')?.getAttribute('aria-expanded')==='true';rail.hidden=!mobile.matches||!!editing||chatting;if(rail.hidden&&dragging)endDrag();geometry();}
 function update(){frame=0;updateVisibility();if(rail.hidden)return;const maximum=maxScroll(),ratio=maximum?Math.max(0,Math.min(1,scrollY/maximum)):0,percent=Math.round(ratio*100),line=headerBottom()+34;let current=sections[0];for(const s of sections){if(s.node.getBoundingClientRect().top<=line)current=s;}
   if(ratio>=.995)current=sections.at(-1);
   rail.style.setProperty('--rail-progress',String(ratio));rail.querySelector('output').textContent=`${percent}%`;track.setAttribute('aria-valuenow',String(percent));track.setAttribute('aria-valuetext',`${current.label}，已捲動${percent}%`);
   for(const a of links){if(a.dataset.railSection===current.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 function moveTo(ratio){const desired=Math.max(0,Math.min(1,ratio));window.scrollTo({top:desired*maxScroll(),behavior:'auto'});schedule();}
 function fromPointer(event){const rect=track.getBoundingClientRect();moveTo((event.clientY-rect.top-12)/Math.max(1,rect.height-24));}
 function beginDrag(event){if(event.pointerType==='mouse'&&event.button!==0)return;event.preventDefault();dragging=true;previousScrollBehavior=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';rail.classList.add('is-dragging');track.focus({preventScroll:true});track.setPointerCapture(event.pointerId);fromPointer(event);}
 function endDrag(){if(!dragging)return;dragging=false;document.documentElement.style.scrollBehavior=previousScrollBehavior;rail.classList.remove('is-dragging');schedule();}
 for(const a of links)a.addEventListener('click',event=>{event.preventDefault();const target=sections.find(s=>s.id===a.dataset.railSection);const top=target.node.getBoundingClientRect().top+scrollY-headerBottom()-16;window.scrollTo({top:Math.max(0,top),behavior:reduceMotion()?'auto':'smooth'});});
 track.addEventListener('pointerdown',beginDrag);track.addEventListener('pointermove',event=>{if(dragging)fromPointer(event)});track.addEventListener('pointerup',endDrag);track.addEventListener('pointercancel',endDrag);track.addEventListener('lostpointercapture',endDrag);
 track.addEventListener('keydown',event=>{const maximum=maxScroll(),current=scrollY;let next;switch(event.key){case 'ArrowDown':next=current+Math.max(60,maximum*.02);break;case 'ArrowUp':next=current-Math.max(60,maximum*.02);break;case 'PageDown':next=current+innerHeight*.8;break;case 'PageUp':next=current-innerHeight*.8;break;case 'Home':next=0;break;case 'End':next=maximum;break;default:return}event.preventDefault();window.scrollTo({top:Math.max(0,Math.min(maximum,next)),behavior:reduceMotion()?'auto':'smooth'});schedule();});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('blur',endDrag);document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);mobile.addEventListener('change',schedule);
 if(window.visualViewport)visualViewport.addEventListener('resize',schedule,{passive:true});
 if(window.ResizeObserver)new ResizeObserver(schedule).observe(document.body);
 function watchChat(){const chat=document.getElementById('esun-assistant-toggle');if(!chat)return false;new MutationObserver(schedule).observe(chat,{attributes:true,attributeFilter:['aria-expanded']});return true;}
 if(!watchChat()){const observer=new MutationObserver(()=>{if(watchChat()){observer.disconnect();schedule()}});observer.observe(document.body,{childList:true,subtree:true});}
 update();
}

