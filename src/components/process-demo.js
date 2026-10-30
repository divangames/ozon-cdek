import {icon} from './icons';

// Illustrative workflow only: no real customer, order or tracking identifiers.
export const processDemo=`<div class="order-receipt" data-ui data-demo-state="0">
 <div class="receipt-top"><span>${icon('box')} Путь заказа</span><span>Демонстрация</span></div>
 <div class="demo-stage">
  <div class="demo-panel" data-demo-panel="0"><div class="demo-brand">OZON <span>Заказ собран</span></div><div class="demo-package">${icon('box')}<span>Отправление<br><strong>Готово к передаче</strong></span></div><div class="demo-checks"><span>${icon('check')} Товары собраны</span><span>${icon('check')} Данные получателя готовы</span></div></div>
  <div class="demo-panel" data-demo-panel="1" hidden><div class="demo-waybill"><div class="waybill-heading"><strong>CDEK</strong>${icon('document')}</div><p>Накладная создана</p><div class="waybill-route"><span>Отправитель</span>${icon('arrow')}<span>Получатель</span></div><div class="demo-barcode" aria-hidden="true"></div><span class="waybill-caption">Образец документа · ваш договор CDEK</span></div></div>
  <div class="demo-panel" data-demo-panel="2" hidden><div class="demo-return"><strong>CDEK</strong><span>${icon('arrow')}</span><strong>OZON</strong></div><div class="demo-tracking">${icon('check')}<span>Трек-номер<br><strong>прикреплён к заказу</strong></span></div><div class="demo-checks"><span>${icon('check')} Накладная в CDEK</span><span>${icon('check')} Трек-номер в OZON</span></div></div>
  <div class="demo-panel" data-demo-panel="3" hidden><div class="demo-status-card"><div class="demo-status-heading"><span>Обновление в OZON</span>${icon('clock')}</div><div class="demo-status-success">${icon('check')}<div><strong>Заказ обновлён</strong><span>В кабинете OZON</span></div></div><ol class="demo-status-timeline"><li><span class="demo-status-dot"></span><div><strong>CDEK</strong><span>Накладная создана</span></div></li><li><span class="demo-status-dot"></span><div><strong>OZON</strong><span>Трек-номер прикреплён к заказу</span></div></li></ol></div></div>
 </div>
 <div class="demo-switcher" role="group" aria-label="Демонстрация этапов">${['Заказ','Накладная','Трек','Статус'].map((label,i)=>`<button type="button" data-demo-step="${i}" aria-pressed="${i===0}" class="${i===0?'active':''}">${label}</button>`).join('')}</div>
 <div class="receipt-status"><span class="live-dot"></span><span id="demo-status" aria-live="polite">Заказ готов к отгрузке</span>${icon('check')}</div>
 <div class="demo-playback"><span>Автопоказ этапов</span><button type="button" class="demo-pause" aria-label="Приостановить автопоказ">Пауза</button></div>
</div>`;

export function selectDemo(index,reduced){
 const card=document.querySelector('.order-receipt');
 if(card.dataset.demoState===String(index))return;
 card.dataset.demoState=String(index);
 card.querySelectorAll('[data-demo-panel]').forEach(panel=>{panel.getAnimations().forEach(a=>a.cancel());panel.hidden=panel.dataset.demoPanel!==String(index);if(!panel.hidden&&!reduced)panel.animate([{opacity:.3,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:240,easing:'cubic-bezier(.23,1,.32,1)'});});
 card.querySelectorAll('[data-demo-step]').forEach(button=>{const active=button.dataset.demoStep===String(index);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}

// A single timer prevents double advancement; explicit pause survives scrolling.
export function initDemoPlayback(select,reduced){
 const readingInterval=6000,manualReadingInterval=10000;
 const card=document.querySelector('.order-receipt'),button=card.querySelector('.demo-pause');
 const stageCount=card.querySelectorAll('[data-demo-panel]').length;
 const caption=card.querySelector('.demo-playback>span');
 let visible=false,paused=false,timer=0,manualUntil=0;
 function schedule(){
  clearTimeout(timer);
  const keyboardFocus=document.querySelector('#how :focus-visible');
  if(!visible||paused||reduced.matches||document.hidden||keyboardFocus)return;
  timer=setTimeout(()=>{select((Number(card.dataset.demoState)+1)%stageCount,false);schedule();},Math.max(readingInterval,manualUntil-Date.now()));
 }
 function refresh(){
  button.disabled=reduced.matches;
  button.textContent=reduced.matches?'Выключен':paused?'Продолжить':'Пауза';
  button.setAttribute('aria-label',paused?'Продолжить автопоказ':'Приостановить автопоказ');
  caption.textContent=reduced.matches?'Ручной режим':'Автопоказ этапов';
  schedule();
 }
 button.addEventListener('click',()=>{paused=!paused;refresh();});
 new IntersectionObserver(entries=>{visible=entries[0].intersectionRatio>=.35; schedule();},{threshold:[0,.35]}).observe(card);
 document.addEventListener('visibilitychange',schedule);
 document.querySelector('#how').addEventListener('focusin',schedule);
 document.querySelector('#how').addEventListener('focusout',()=>queueMicrotask(schedule));
 reduced.addEventListener('change',refresh);
 document.querySelector('#demo-status').setAttribute('aria-live','off');
 refresh();
 return index=>{manualUntil=Date.now()+manualReadingInterval;select(index,true);schedule();};
}
