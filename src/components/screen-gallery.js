import {icon} from './icons';

// Native dialog owns modal focus and Escape; touch gestures operate only on the image.
export function initScreenGallery(screens){
 const openers=[...document.querySelectorAll('.screen-panel a')];
 const dialog=document.createElement('dialog');
 dialog.className='screen-gallery';dialog.setAttribute('data-lenis-prevent','');
 dialog.setAttribute('aria-labelledby','gallery-title');dialog.setAttribute('aria-describedby','gallery-description');
 dialog.innerHTML=`<div class="gallery-toolbar"><span class="gallery-counter" aria-label="Номер экрана"></span><div><button type="button" class="gallery-tool gallery-zoom" aria-label="Увеличить изображение" aria-pressed="false">${icon('plus')}</button><button type="button" class="gallery-tool gallery-close" aria-label="Закрыть просмотр" autofocus>${icon('close')}</button></div></div><div class="gallery-stage"><img class="gallery-image" src="./images/cabinet-${screens[0][0]}.webp" width="900" height="720" alt="Экран личного кабинета. Личные данные скрыты." draggable="false"></div><div class="gallery-footer"><div class="gallery-info" aria-live="polite" aria-atomic="true"><h3 id="gallery-title"></h3><p id="gallery-description"></p><p class="gallery-note">Реальный экран сервиса. Личные данные скрыты.</p></div><div class="gallery-navigation"><button type="button" class="gallery-tool gallery-prev" aria-label="Предыдущий экран">${icon('arrow')}</button><button type="button" class="gallery-tool gallery-next" aria-label="Следующий экран">${icon('arrow')}</button></div></div><p class="gallery-hint">Листайте стрелками или свайпом. Кнопка «+» увеличивает изображение.</p>`;
 document.body.append(dialog);
 const stage=dialog.querySelector('.gallery-stage'),image=dialog.querySelector('.gallery-image'),zoom=dialog.querySelector('.gallery-zoom');
 let index=0,opener=null,zoomed=false,swipe=null,backdropDown=false;
 const touches=new Set();
 function setZoom(value){
  zoomed=value;stage.classList.toggle('is-zoomed',value);zoom.setAttribute('aria-pressed',String(value));zoom.setAttribute('aria-label',value?'Уменьшить изображение':'Увеличить изображение');zoom.innerHTML=icon(value?'minus':'plus');
  if(value){stage.scrollLeft=(stage.scrollWidth-stage.clientWidth)/2;stage.scrollTop=(stage.scrollHeight-stage.clientHeight)/2;}else{stage.scrollLeft=stage.scrollTop=0;}
 }
 function show(next){
  index=(next+screens.length)%screens.length;setZoom(false);
  const [id,title,description]=screens[index];
  image.src=`./images/cabinet-${id}.webp`;image.alt=`Экран личного кабинета: ${title}. Личные данные скрыты.`;
  dialog.querySelector('#gallery-title').textContent=title;dialog.querySelector('#gallery-description').textContent=description;
  dialog.querySelector('.gallery-counter').textContent=`${index+1} / ${screens.length}`;
  // Keep the underlying workspace synchronized without moving keyboard focus out of the dialog.
  document.querySelector(`[data-screen="${id}"]`).click();
 }
 function open(next,trigger){
  opener=trigger;show(next);document.documentElement.classList.add('gallery-open');
  document.dispatchEvent(new CustomEvent('screen-gallery-toggle',{detail:{open:true}}));
  dialog.showModal();
 }
 openers.forEach((link,i)=>{link.setAttribute('aria-haspopup','dialog');link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();open(i,link);});});
 dialog.querySelector('.gallery-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('.gallery-prev').addEventListener('click',()=>show(index-1));
 dialog.querySelector('.gallery-next').addEventListener('click',()=>show(index+1));
 zoom.addEventListener('click',()=>setZoom(!zoomed));
 dialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}
 });
 dialog.addEventListener('pointerdown',event=>{const rect=dialog.getBoundingClientRect();backdropDown=event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);});
 dialog.addEventListener('pointerup',event=>{const rect=dialog.getBoundingClientRect();if(backdropDown&&event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();backdropDown=false;});
 stage.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='touch')return;touches.add(event.pointerId);
  if(touches.size!==1||zoomed||(window.visualViewport?.scale||1)>1.02){swipe=null;return;}
  swipe={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
 });
 stage.addEventListener('pointerup',event=>{
  touches.delete(event.pointerId);const start=swipe;swipe=null;
  if(!start||start.id!==event.pointerId||touches.size||zoomed)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y,elapsed=performance.now()-start.time;
  if(Math.abs(dx)>=50&&Math.abs(dx)>Math.abs(dy)*1.4&&elapsed<900)show(index+(dx<0?1:-1));
 });
 stage.addEventListener('pointercancel',event=>{touches.delete(event.pointerId);swipe=null;});
 dialog.addEventListener('close',()=>{
  document.documentElement.classList.remove('gallery-open');setZoom(false);swipe=null;touches.clear();
  document.dispatchEvent(new CustomEvent('screen-gallery-toggle',{detail:{open:false}}));
  const target=opener?.getClientRects().length?opener:document.querySelector('.screen-panel:not([hidden]) a');target?.focus({preventScroll:true});
 });
}
