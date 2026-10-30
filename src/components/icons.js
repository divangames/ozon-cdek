// Единый набор контурных пиктограмм для схемы и интерфейса.
const paths = {
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  box:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/>',
  link:'<path d="m10 13 4-4m-6 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 0)"/>',
  document:'<path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h6"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  play:'<path d="m9 5 10 7-10 7V5Z"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  telegram:'<path d="m21 3-4 18-6-6-4 3 1-7 13-8Z"/><path d="m3 10 18-7-10 12M3 10l5 1"/>',
  whatsapp:'<path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="m8.5 7.5-1 1c-.6.7.2 2.7 1.8 4.3s3.6 2.4 4.3 1.8l1-1-2-1.3-.8.7c-1.2-.6-2.2-1.6-2.8-2.8l.7-.8-1.2-1.9Z"/>',
};
// Возвращает SVG с неизменным размером и доступностью, заданной внешним контролом.
export const icon = (name, cls='') => `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
