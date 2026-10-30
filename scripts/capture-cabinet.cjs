const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('@playwright/test');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'info/Личный кабинет.txt'),'utf8');
const field=n=>raw.match(new RegExp(n+':\\s*(.*)'))?.[1]?.trim();
(async()=>{
 const {Client,access}=require('./remote.cjs'),http=require('node:http');
 const conn=new Client();await new Promise((resolve,reject)=>conn.once('ready',resolve).once('error',reject).connect(access()));
 const proxy=http.createServer();proxy.on('connect',(request,socket,head)=>{const [host,port]=request.url.split(':');conn.forwardOut('127.0.0.1',0,host,Number(port)||443,(error,stream)=>{if(error){socket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');return;}socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)stream.write(head);stream.on('error',()=>socket.destroy());socket.on('error',()=>stream.destroy());stream.pipe(socket);socket.pipe(stream);});});
 await new Promise(resolve=>proxy.listen(4319,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:false,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',proxy:{server:'http://127.0.0.1:4319'}});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1080}}),page=await context.newPage();page.setDefaultTimeout(12000);
 await page.goto('https://space.cdek-ozon.ru/login',{waitUntil:'domcontentloaded'});console.log('Форма входа загружена');await page.locator('input[type=email]').fill(field('Почта'));await page.locator('input[type=password]').fill(field('Пароль'));await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL(u=>!u.pathname.includes('login'),{waitUntil:'domcontentloaded'});
 console.log('Вход выполнен');
 for(const [id,route] of [['ozon','/integration/OZON'],['cdek','/integration/CDEK'],['tariffs','/tariff'],['products','/products']]){
 console.log('Загружаю '+route);await page.goto('https://space.cdek-ozon.ru'+route,{waitUntil:'domcontentloaded'});await page.locator('a[href="/products"]').waitFor();
 if(id==='ozon')await page.getByRole('button',{name:'Сохранить параметры OZON'}).waitFor();
 if(id==='cdek')await page.getByText('Отправка отдельными местами',{exact:true}).waitFor();
 if(id==='products')await page.getByText('Список товаров',{exact:true}).waitFor();
 await page.locator('body').evaluate(()=>document.fonts.ready);
 // No values are logged. Mask controls, account identifiers, and long literal keys before pixels exist.
 await page.evaluate(()=>{
  document.querySelectorAll('input,textarea').forEach(e=>{if(!['checkbox','radio','button','submit'].includes(e.type)){e.value='';e.setAttribute('value','');e.placeholder='Скрыто';e.style.color='#9099a6';}});
  document.querySelectorAll('[class*=avatar],[class*=user-name]').forEach(e=>e.style.visibility='hidden');
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes){if(['SCRIPT','STYLE'].includes(n.parentElement?.tagName))continue;let t=n.textContent;n.textContent=t.replace(/[\w.+-]+@[\w.-]+/g,'Данные скрыты').replace(/[A-Za-z0-9_-]*\*{3,}[A-Za-z0-9_-]*/g,'••••••••').replace(/\b[A-Za-z0-9_-]{16,}\b/g,'••••••••').replace(/(?:\d[\s()-]*){7,}/g,'••••••••');}
 });
 const bytes=await page.screenshot();await sharp(bytes).resize(1200,960,{fit:'contain',background:'#ffffff'}).webp({quality:88}).toFile(path.join(root,'public/images/cabinet-'+id+'.webp'));
 console.log('Безопасный снимок: '+id+'; маршрут: '+new URL(page.url()).pathname);
 }
 }finally{await browser.close();proxy.close();conn.end();}
})().catch(e=>{console.error('Снимки не созданы: '+e.name);process.exitCode=1;});
