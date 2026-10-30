import {icon} from './icons';

// Ролики предоставлены владельцем; файлы размещаются на том же сервере, что и сайт.
export const tutorials=[
 {id:'integration',title:'Настройка сервиса',duration:'3:22',description:'API-ключи OZON и CDEK, параметры интеграции.'},
 {id:'small-delivery',title:'Настройка метода доставки для мелкогабаритного товара',duration:'0:47',description:'Метод доставки OZON для небольших отправлений.'},
 {id:'large-delivery',title:'Настройка метода доставки для крупногабаритного товара',duration:'1:27',description:'Метод доставки для КГТ.'},
 {id:'products',title:'Модуль товаров',duration:'1:32',description:'Габариты товара и несколько грузомест.'},
];
const mediaPath=id=>`./tutorials/${id}`;

export const tutorialSection=`
<section class="tutorials shell section" id="tutorials" aria-labelledby="tutorials-title">
 <div class="tutorials-heading"><h2 id="tutorials-title">Настройка<br>сервиса</h2><div class="tutorial-copy"><p>Для настройки сервиса Вам понадобятся API-ключи OZON и CDEK. Интеграция настраивается в нашем личном кабинете <a href="https://space.cdek-ozon.ru" target="_blank" rel="noopener">space.cdek-ozon.ru</a></p><p>Так же Вы можете ознакомиться с инструкцией в виде презентации:</p><a class="text-link" href="https://disk.yandex.ru/i/3ltrtHSdAgiWRg" target="_blank" rel="noopener">Скачать инструкцию ${icon('arrow')}</a></div></div>
 <div class="tutorials-layout">
  <div class="tutorial-player">
   <video id="tutorial-video" controls playsinline preload="none" width="1536" height="960" poster="${mediaPath(tutorials[0].id)}.webp" src="${mediaPath(tutorials[0].id)}.mp4" aria-labelledby="tutorial-current-title"><a href="${mediaPath(tutorials[0].id)}.mp4">Открыть видео настройки интеграции</a></video>
   <div class="tutorial-caption"><h3 id="tutorial-current-title" aria-live="polite">${tutorials[0].title}</h3><a class="text-link tutorial-direct" href="${mediaPath(tutorials[0].id)}.mp4" target="_blank" rel="noopener">Открыть отдельно ${icon('arrow')}</a></div>
   <p class="tutorial-error" role="status" hidden>Не удалось загрузить видео. Попробуйте открыть его отдельно по ссылке выше.</p>
  </div>
  <div class="tutorial-lessons" role="group" aria-label="Выбор видеоинструкции">${tutorials.map((lesson,index)=>`<button class="tutorial-lesson${index===0?' active':''}" data-tutorial="${lesson.id}" aria-pressed="${index===0}" aria-controls="tutorial-video"><span class="tutorial-play">${icon('play')}</span><span class="tutorial-lesson-copy"><span class="tutorial-name">${lesson.title}</span><span class="tutorial-description">${lesson.description}</span><span class="tutorial-duration">${icon('clock')} ${lesson.duration}</span></span></button>`).join('')}</div>
 </div>
</section>`;

export function initTutorials(){
 const video=document.querySelector('#tutorial-video');
 if(!video)return;
 const buttons=[...document.querySelectorAll('[data-tutorial]')];
 const title=document.querySelector('#tutorial-current-title');
 const direct=document.querySelector('.tutorial-direct');
 const error=document.querySelector('.tutorial-error');
 buttons.forEach(button=>button.addEventListener('click',event=>{
  if(button.getAttribute('aria-pressed')==='true')return;
  const lesson=tutorials.find(item=>item.id===button.dataset.tutorial);
  video.pause();
  error.hidden=true;
  video.poster=`${mediaPath(lesson.id)}.webp`;
  video.src=`${mediaPath(lesson.id)}.mp4`;
  video.querySelector('a').href=video.src;
  video.querySelector('a').textContent=`Открыть видео: ${lesson.title}`;
  video.load();
  title.textContent=lesson.title;
  direct.href=video.src;
  buttons.forEach(item=>{const selected=item===button;item.classList.toggle('active',selected);item.setAttribute('aria-pressed',String(selected));});
  if(event.detail>0&&matchMedia('(max-width:900px)').matches)video.scrollIntoView({block:'nearest',behavior:'instant'});
 }));
 video.addEventListener('error',()=>{error.hidden=false;});
}
