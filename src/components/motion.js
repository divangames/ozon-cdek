import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
// Touch and keyboard scroll stay native; decorative motion respects reduced motion.
export function initMotion(){
 gsap.registerPlugin(ScrollTrigger);
 const media=gsap.matchMedia();
 media.add({all:'all',reduce:'(prefers-reduced-motion: reduce)',desktop:'(min-width:1001px) and (pointer:fine)'},context=>{
  if(context.conditions.reduce)return;
  gsap.from('.hero-copy > *',{y:18,opacity:.65,duration:.65,stagger:.06,ease:'power3.out',clearProps:'transform,opacity'});
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;gsap.from(entry.target,{y:18,opacity:.65,duration:.55,ease:'power3.out',clearProps:'transform,opacity'});observer.unobserve(entry.target);}),{threshold:.12});
  document.querySelectorAll('.section h2,.workspace-visual,.capability-blue,.requirements ol,.tutorials-layout,.lead-form').forEach(element=>observer.observe(element));
  let lenis,tick,galleryToggle;const listeners=[];
  if(context.conditions.desktop){
   lenis=new Lenis({lerp:.12,smoothWheel:true,syncTouch:false,anchors:false});
   galleryToggle=event=>event.detail.open?lenis.stop():lenis.start();document.addEventListener('screen-gallery-toggle',galleryToggle);
   if(document.querySelector('.screen-gallery[open]'))lenis.stop();
   lenis.on('scroll',ScrollTrigger.update);tick=time=>lenis.raf(time*1000);gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);
   document.querySelectorAll('a[href^="#"]').forEach(link=>{const handler=event=>{const target=document.querySelector(link.hash);if(event.detail===0||!target)return;event.preventDefault();history.pushState(null,'',link.hash);lenis.scrollTo(target,{offset:-28});};link.addEventListener('click',handler);listeners.push([link,handler]);});
  }
  return()=>{observer.disconnect();if(tick)gsap.ticker.remove(tick);lenis?.destroy();if(galleryToggle)document.removeEventListener('screen-gallery-toggle',galleryToggle);listeners.forEach(([link,handler])=>link.removeEventListener('click',handler));};
 });
 const links=[...document.querySelectorAll('.desktop-nav a')];
 const spy=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>{if(link.hash===`#${entry.target.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}),{rootMargin:'-10% 0px -65% 0px'});
 links.forEach(link=>{const section=document.querySelector(link.hash);if(section)spy.observe(section);});
}
