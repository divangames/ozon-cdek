// Vanta is loaded only near its standalone field; offscreen instances are destroyed.
export async function initNetwork(){
 const element=document.querySelector('#network-art'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let visible=false,effect=null,loading=false;
 async function sync(){
  if(!visible||document.hidden||reduced.matches){effect?.destroy();effect=null;return;}
  if(effect||loading)return;loading=true;
  try{const [module,THREE]=await Promise.all([import('vanta/dist/vanta.net.min.js'),import('three')]);const NET=typeof module.default==='function'?module.default:window.VANTA?.NET;if(visible&&!document.hidden&&!reduced.matches)effect=NET({el:element,THREE:{...THREE,VertexColors:true},mouseControls:false,touchControls:false,gyroControls:false,color:0x007d2a,backgroundColor:0xedf3f0,points:6,maxDistance:18,spacing:18,showDots:true,minHeight:100,minWidth:100,scale:1.5,scaleMobile:2});}catch(error){if(import.meta.env.DEV)console.warn('Vanta:',error.message);element.classList.add('network-unavailable');}finally{loading=false;}
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{rootMargin:'80px'}).observe(element);
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
}
