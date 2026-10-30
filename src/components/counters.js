import gsap from 'gsap';

// Final values stay in the HTML and accessible text. Only the visual copy counts up.
export function initCounters(){
 const numbers=[...document.querySelectorAll('[data-count-target]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const tweens=new Map();
 const finish=element=>{tweens.get(element)?.kill();tweens.delete(element);element.textContent=element.dataset.countTarget;element.dataset.countState='complete';};
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;const element=entry.target;observer.unobserve(element);
   if(reduced.matches){finish(element);continue;}
   element.dataset.countState='running';element.textContent='0';
   const count={value:0},target=Number(element.dataset.countTarget);
   tweens.set(element,gsap.to(count,{value:target,duration:1.5,ease:'power3.out',onUpdate:()=>{element.textContent=String(Math.floor(count.value));},onComplete:()=>finish(element)}));
  }
 },{threshold:.75});
 for(const element of numbers){if(reduced.matches)finish(element);else observer.observe(element);}
 reduced.addEventListener('change',()=>{if(reduced.matches){observer.disconnect();numbers.forEach(finish);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const element of tweens.keys())finish(element);});
}
