import {icon} from './icons';

export const deviceSection=`<section class="settings-devices shell section" id="settings" aria-labelledby="settings-title">
 <div class="devices-scene" role="group" aria-label="Настройки сервиса на MacBook и iPhone">
  <div class="macbook"><div class="macbook-display"><span class="macbook-camera" aria-hidden="true"></span><picture><source media="(prefers-reduced-motion: reduce)" srcset="./images/desctop-poster.webp"><img src="./images/desctop.gif" width="736" height="414" loading="lazy" alt="Настройки интеграции CDEK × OZON на экране MacBook"></picture></div><div class="macbook-base" aria-hidden="true"><span></span></div></div>
  <div class="iphone"><span class="iphone-island" aria-hidden="true"></span><picture><source media="(prefers-reduced-motion: reduce)" srcset="./images/mobile-poster.webp"><img src="./images/mobile.gif" width="199" height="442" loading="lazy" alt="Настройки интеграции CDEK × OZON на экране iPhone"></picture><span class="iphone-home" aria-hidden="true"></span></div>
 </div>
 <div class="settings-copy"><h2 id="settings-title">О базовых<br>настройках</h2><p>В нашем сервисе представлено более 15 настроек, которые помогают максимально гибко настроить сервис под Ваши требования</p><a class="button primary" href="https://disk.yandex.ru/i/D-viL1HN9ihL3g" target="_blank" rel="noopener">Подробнее об настройках<span class="button-arrow">${icon('arrow')}</span></a></div>
</section>`;
