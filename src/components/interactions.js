// Доступные действия: этапы обработки, реальные экраны и навигация.
import {icon} from './icons';
import {steps} from './content';
import {selectDemo,initDemoPlayback} from './process-demo';
// Инициализирует состояния презентации, не меняя данные внешнего сервиса.
export function initInteractions(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const menuButton=document.querySelector('.menu-toggle'),menu=document.querySelector('#mobile-nav');
 // Синхронизирует видимость меню и доступное название кнопки.
 function setMenu(open){menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');menuButton.innerHTML=icon(open?'close':'menu');menu.hidden=!open;}
 menuButton.addEventListener('click',()=>setMenu(menu.hidden));
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false);});
 function setStep(index,manual){
  const selected=document.querySelector(`[data-step="${index}"]`);
  document.querySelectorAll('[data-step]').forEach(item=>{const active=item===selected;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
  selectDemo(index,reduced.matches);
  const status=document.querySelector('#demo-status');
  status.setAttribute('aria-live',manual?'polite':'off');
  status.textContent=steps[index][3];
 }
 const manualStep=initDemoPlayback(setStep,reduced);
 document.querySelectorAll('[data-step],[data-demo-step]').forEach(button=>button.addEventListener('click',()=>{manualStep(Number(button.dataset.step??button.dataset.demoStep));if(button.hasAttribute('data-step'))document.querySelectorAll('[data-step]').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});}));
 const tabs=[...document.querySelectorAll('[data-screen]')];
 // Меняет настоящий скриншот и обеспечивает управление вкладками с клавиатуры.
 function selectScreen(button){tabs.forEach(tab=>{const active=tab===button;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.querySelector(`#screen-${tab.dataset.screen}`).hidden=!active;});}
 tabs.forEach((button,index)=>{
  button.addEventListener('click',()=>selectScreen(button));
  button.addEventListener('keydown',event=>{const move={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];if(move||event.key==='Home'||event.key==='End'){event.preventDefault();const next=tabs[event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+move+tabs.length)%tabs.length];selectScreen(next);next.focus();}});
 });
}
