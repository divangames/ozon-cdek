import {icon} from './icons';
const channels={
 phone:{label:'Номер телефона',placeholder:'+7 999 123-45-67',hint:'Номер, по которому с вами можно связаться.',type:'tel',autocomplete:'tel',inputmode:'tel'},
 telegram:{label:'Telegram',placeholder:'@username или ссылка t.me',hint:'Укажите имя пользователя или ссылку на профиль.',type:'text',autocomplete:'off',inputmode:'text'},
 max:{label:'MAX',placeholder:'Телефон или ссылка max.ru',hint:'Укажите номер телефона в MAX или ссылку на профиль.',type:'text',autocomplete:'off',inputmode:'text'},
};
export const leadForm=`<form class="lead-form" id="lead-form" aria-labelledby="lead-form-title" action="./api/leads" method="post"><div class="lead-fields">
 <h3 id="lead-form-title">Помочь с подключением?</h3><p class="lead-intro">Оставьте имя и удобный способ связи.</p>
 <label class="lead-field" for="lead-name"><span>Ваше имя</span><input id="lead-name" name="name" autocomplete="name" placeholder="Как к вам обращаться" required maxlength="80"></label>
 <fieldset class="lead-channels"><legend>Как с вами связаться</legend><div>${[['phone','Телефон'],['telegram','Telegram'],['max','MAX']].map(([id,label],index)=>`<label><input type="radio" name="contactType" value="${id}" ${index===0?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset>
 <label class="lead-field" for="lead-contact"><span id="lead-contact-label">Номер телефона</span><input id="lead-contact" name="contact" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 999 123-45-67" required maxlength="200" aria-describedby="lead-contact-hint"></label>
 <p class="lead-hint" id="lead-contact-hint">${channels.phone.hint}</p>
 <label class="lead-plan" for="lead-plan"><span>Тариф</span><select id="lead-plan" name="plan"><option value="consultation">Нужна консультация</option><option value="300">До 300 отправлений — 3 800 руб.</option><option value="500">До 500 отправлений — 4 800 руб.</option><option value="1000">До 1 000 отправлений — 5 800 руб.</option></select></label>
 <div class="lead-trap" aria-hidden="true"><label>Сайт<input name="website" tabindex="-1" autocomplete="off"></label></div>
 <label class="lead-consent"><input type="checkbox" name="consent" required><span>Можно связаться со мной по указанному контакту.</span></label>
 <button class="button primary lead-submit" type="submit"><span>Отправить заявку</span><span class="button-arrow">${icon('arrow')}</span></button>
 <p class="lead-status" role="status" aria-live="polite" tabindex="-1" hidden></p></div>
 <div class="lead-success" role="status" aria-live="polite" tabindex="-1" hidden><div class="lead-success-symbol" aria-hidden="true"><svg width="54" height="54" viewBox="0 0 54 54" fill="none"><path d="m13 28 9 9 20-21" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg></div><h3>Заявка отправлена</h3><p>Свяжемся с вами по указанному контакту.</p><span class="lead-success-contact"></span><button type="button" class="text-link lead-another">Отправить ещё заявку ${icon('arrow')}</button></div>
</form>`;
export function initLeadForm(){
 const form=document.querySelector('#lead-form'),contact=form.querySelector('[name=contact]'),status=form.querySelector('.lead-status'),submit=form.querySelector('[type=submit]');
 const fields=form.querySelector('.lead-fields'),success=form.querySelector('.lead-success');
 form.querySelector('.lead-another').addEventListener('click',()=>{success.hidden=true;fields.hidden=false;form.classList.remove('is-success');form.style.minHeight='';form.elements.name.focus({preventScroll:true});});
 let pending=false,submissionId=crypto.randomUUID(),lastPayload='',current='phone';
 const values={phone:'',telegram:'',max:''};
 form.querySelectorAll('[name=contactType]').forEach(radio=>radio.addEventListener('change',()=>{
  values[current]=contact.value;current=radio.value;const channel=channels[current];
  document.querySelector('#lead-contact-label').textContent=channel.label;document.querySelector('#lead-contact-hint').textContent=channel.hint;
  for(const key of ['type','placeholder','autocomplete','inputmode'])contact.setAttribute(key,channel[key]);
  contact.value=values[current];contact.setCustomValidity('');
 }));
 contact.addEventListener('input',()=>contact.setCustomValidity(''));
 form.elements.name.addEventListener('input',()=>form.elements.name.setCustomValidity(''));
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending)return;const data=new FormData(form),value=contact.value.trim(),digits=value.replace(/\D/g,'');
  const phone=/^[+\d\s()\-]+$/.test(value)&&digits.length>=10&&digits.length<=15;
  if(current==='phone'&&!phone){contact.setCustomValidity('Введите номер телефона с кодом страны.');contact.reportValidity();return;}
  if(current==='telegram'&&!/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value)&&!/^https?:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}\/?$/.test(value)){contact.setCustomValidity('Укажите @username или ссылку на профиль Telegram.');contact.reportValidity();return;}
  if(current==='max'&&!phone&&!/^https?:\/\/max\.ru\/[A-Za-z0-9_\-/]+$/.test(value)){contact.setCustomValidity('Укажите номер телефона или ссылку max.ru на профиль.');contact.reportValidity();return;}
  contact.setCustomValidity('');if(!form.reportValidity())return;
  const payload={name:String(data.get('name')).trim(),contactType:current,contact:value,consent:data.get('consent')==='on',plan:String(data.get('plan')||'consultation'),website:String(data.get('website')||'')};
  if(!payload.name){form.elements.name.setCustomValidity('Введите ваше имя.');form.elements.name.reportValidity();return;}
  const fingerprint=JSON.stringify(payload);if(lastPayload&&fingerprint!==lastPayload)submissionId=crypto.randomUUID();lastPayload=fingerprint;
  pending=true;submit.disabled=true;form.setAttribute('aria-busy','true');submit.firstElementChild.textContent='Отправляем…';status.hidden=true;
  try{
   const response=await fetch(import.meta.env.VITE_LEADS_URL||'./api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,submissionId}),signal:AbortSignal.timeout(18000)});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||result.ok!==true)throw new Error(response.status===429?'Слишком много попыток. Попробуйте через несколько минут.':'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.');
   form.style.minHeight=`${form.getBoundingClientRect().height}px`;status.classList.remove('is-error');status.hidden=true;
   success.querySelector('.lead-success-contact').textContent=`${{phone:'Телефон',telegram:'Telegram',max:'MAX'}[payload.contactType]} · ${payload.contact}`;
   fields.hidden=true;success.hidden=false;form.classList.add('is-success');success.focus({preventScroll:true});
   form.reset();for(const key in values)values[key]='';form.querySelector('[value=phone]').dispatchEvent(new Event('change'));contact.value='';submissionId=crypto.randomUUID();lastPayload='';
  }catch(error){status.textContent=error.name==='TimeoutError'?'Ответ задерживается. Попробуйте отправить заявку ещё раз.':error instanceof TypeError?'Нет связи с сервером. Попробуйте ещё раз или напишите нам в Telegram.':error.message;status.classList.add('is-error');status.hidden=false;status.focus({preventScroll:true});}
  finally{pending=false;submit.disabled=false;form.removeAttribute('aria-busy');submit.firstElementChild.textContent='Отправить заявку';}
 });
}
