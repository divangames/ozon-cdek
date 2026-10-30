import {icon} from './icons';

export function faqItems(faqs){
 return faqs.map(([question,answer],index)=>`<div class="faq-item${index===0?' is-open':''}"><h3><button type="button" class="faq-question" id="faq-question-${index}" aria-expanded="${index===0}" aria-controls="faq-answer-${index}">${question}<span>${icon('plus')}</span></button></h3><div class="faq-answer" id="faq-answer-${index}" role="region" aria-labelledby="faq-question-${index}" aria-hidden="${index!==0}" ${index===0?'':'inert'}><div class="faq-answer-inner"><p>${answer}</p></div></div></div>`).join('');
}

// Buttons preserve native keyboard behavior; only the chosen region is expanded.
export function initFaq(){
 const items=[...document.querySelectorAll('.faq-item')];
 items.forEach(item=>item.querySelector('.faq-question').addEventListener('click',()=>{
  const shouldOpen=!item.classList.contains('is-open');
  items.forEach(current=>{
   const open=current===item&&shouldOpen,panel=current.querySelector('.faq-answer');
   current.classList.toggle('is-open',open);current.querySelector('.faq-question').setAttribute('aria-expanded',String(open));
   panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;
  });
 }));
}
