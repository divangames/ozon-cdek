import {icon} from './icons';
import {fullProcess} from './content';

export const demoStages=[
 {label:'Заказ',status:'Покупатель оформил заказ',body:`<div class="demo-brand">OZON <span>Покупка</span></div><div class="demo-checkout"><span class="demo-product-icon">${icon('box')}</span><div><strong>Заказ оформлен</strong><span>Товар выбран покупателем</span></div></div><div class="demo-delivery-choice"><span>Способ доставки</span><strong>CDEK ${icon('check')}</strong></div>`},
 {label:'В ЛК',status:'Новый заказ в кабинете OZON',body:`<div class="demo-brand">OZON <span>Личный кабинет</span></div><div class="demo-inbox"><div class="demo-inbox-heading">${icon('document')}<strong>Новый заказ</strong></div><span class="demo-order-status">Ожидает сборки</span><p>Продавец видит заказ<br>в личном кабинете</p></div>`},
 {label:'Сборка',status:'Заказ готов к отгрузке',body:`<div class="demo-brand">OZON <span>Сборка заказа</span></div><div class="demo-package">${icon('box')}<span>Отправление<br><strong>Ожидает отгрузки</strong></span></div><div class="demo-checks"><span>${icon('check')} Товары собраны</span><span>${icon('check')} Кнопка «Собрать» нажата</span></div>`},
 {label:'Сервис',status:'Сервис получил заказ без трек-номера',body:`<div class="demo-brand">Сервис <span>Обработка</span></div><div class="demo-polling">${icon('clock')}<strong>Каждые 2 минуты</strong><span>Проверяем заказы OZON</span></div><div class="demo-filters"><span>${icon('check')} Ожидает отгрузки</span><span>${icon('check')} Без трек-номера</span></div>`},
 {label:'CDEK',status:'Накладная создана в CDEK',body:`<div class="demo-waybill"><div class="waybill-heading"><strong>CDEK</strong>${icon('document')}</div><p>Накладная создана</p><div class="waybill-route"><span>Отправитель</span>${icon('arrow')}<span>Получатель</span></div><div class="demo-barcode" aria-hidden="true"></div><span class="waybill-caption">Образец документа · ваш договор CDEK</span></div>`},
 {label:'Трек',status:'Трек-номер получен от API CDEK',body:`<div class="demo-brand demo-brand-cdek">CDEK <span>Ответ API</span></div><div class="demo-api-response">${icon('document')}<strong>Трек-номер получен</strong><span>Готов к передаче в OZON</span></div><div class="demo-checks"><span>${icon('check')} Накладная зарегистрирована</span><span>${icon('check')} API CDEK вернул трек-номер</span></div>`},
 {label:'OZON',status:'Трек-номер прикреплён к заказу OZON',body:`<div class="demo-return"><strong>CDEK</strong><span>${icon('arrow')}</span><strong>OZON</strong></div><div class="demo-status-card"><div class="demo-status-success">${icon('check')}<div><strong>Заказ обновлён</strong><span>Трек-номер прикреплён</span></div></div><p class="demo-final-note">Теперь трек-номер доступен<br>в заказе OZON</p></div>`},
];

// Illustrative workflow only: no real customer, order or tracking identifiers.
export const processDemo=`<div class="order-receipt" data-ui data-demo-state="0">
 <div class="receipt-top"><span>${icon('box')} Путь заказа</span><span>Демонстрация</span></div>
 <div class="demo-stage">${demoStages.map((stage,i)=>`<div class="demo-panel" id="demo-panel-${i}" data-demo-panel="${i}" role="group" aria-label="${fullProcess[i][0]}" ${i===0?'':'hidden'}>${stage.body}</div>`).join('')}</div>
 <div class="demo-switcher" role="group" aria-label="Демонстрация этапов">${demoStages.map((stage,i)=>`<button type="button" data-demo-step="${i}" aria-label="Шаг ${i+1}: ${fullProcess[i][0]}" aria-controls="demo-panel-${i}" aria-pressed="${i===0}" class="${i===0?'active':''}">${stage.label}</button>`).join('')}</div>
 <div class="receipt-status"><span class="live-dot"></span><span id="demo-status" aria-live="polite">${demoStages[0].status}</span>${icon('check')}</div>
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
  return (index,instant=false)=>{manualUntil=Date.now()+manualReadingInterval;select(index,true,instant);schedule();};
}
