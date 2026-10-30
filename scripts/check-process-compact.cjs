const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const url=process.env.CHECK_URL||'http://127.0.0.1:4174/';
(async()=>{const browser=await chromium.launch({headless:false,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});fs.mkdirSync('artifacts/compact',{recursive:true});try{
 for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1280,720],[1024,768],[820,1180],[768,1024],[390,844],[320,568]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
  let maxHeight=0;
  for(let index=0;index<7;index++){
   const button=page.locator(`[data-step="${index}"]`);if(await button.isVisible())await button.click();else await page.locator(`[data-demo-step="${index}"]`).click();
   await expect(page.locator(`[data-demo-panel="${index}"]`)).toBeVisible();await expect(button).toHaveAttribute('aria-pressed','true');
   const result=await page.evaluate(()=>{const section=document.querySelector('#how'),stage=section.querySelector('.demo-stage').getBoundingClientRect(),panel=section.querySelector('.demo-panel:not([hidden])').getBoundingClientRect();return{height:section.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,panelOverflow:panel.top<stage.top-1||panel.bottom>stage.bottom+1,labels:[...section.querySelectorAll('.demo-switcher button')].filter(e=>e.scrollWidth>e.clientWidth).map(e=>e.textContent)}});
   const factsOverflow=await page.locator('.process-facts p').evaluateAll(elements=>elements.some(e=>e.scrollWidth>e.clientWidth+1));maxHeight=Math.max(maxHeight,result.height);if(result.overflow||result.panelOverflow||result.labels.length||factsOverflow)errors.push({width,index,...result,factsOverflow});
  }
  if(width>=1001&&maxHeight>height)errors.push({width,maxHeight,viewportHeight:height});
  await page.locator('[data-demo-step="0"]').click();await page.locator('#how').screenshot({path:`artifacts/compact/process-${width}.png`});
  if(errors.length)throw Error(JSON.stringify(errors));console.log(JSON.stringify({width,viewport:height,sectionHeight:Math.round(maxHeight),stages:7,status:'OK'}));await page.close();
 }
}finally{await browser.close();}})().catch(error=>{console.error(error.message);process.exitCode=1;});
