import {entryLotus} from './entry-lotus';
import {flagUrl,languages,preferredLocale,selectLocale,t} from './locales';
import type {Locale} from './locales/languages';
import './language.css';

const prompts:Record<Locale,string>={
 ko:'탭하여 입장',ja:'タップして入場',en:'Tap to enter','zh-Hans':'轻触进入',
 'pt-PT':'Toque para entrar',es:'Toca para entrar',fr:'Touchez pour entrer',
 it:'Tocca per entrare','pt-BR':'Toque para entrar',ms:'Ketik untuk masuk',
 de:'Zum Eintreten tippen',vi:'Chạm để vào',ru:'Нажмите, чтобы войти',tr:'Girmek için dokunun'
};
const game=document.getElementById('app')!;
game.inert=true;
const root=document.createElement('div');root.className='entry-overlay';game.after(root);
root.innerHTML=`<main class="language-entry"><div class="language-panel">
 <header><h1>사사</h1><span lang="en">SASA</span></header>
 <button class="enter-temple" type="button"><span class="lotus-medallion" aria-hidden="true">${entryLotus}</span><span class="entry-prompt"></span></button>
 <div class="flag-strip" role="group" aria-label="언어 선택 · Language"></div>
 <output class="selected-language" aria-live="polite"></output>
 </div></main>`;
const strip=root.querySelector<HTMLElement>('.flag-strip')!;
const enter=root.querySelector<HTMLButtonElement>('.enter-temple')!;
const prompt=root.querySelector<HTMLElement>('.entry-prompt')!;
const language=root.querySelector<HTMLElement>('.selected-language')!;
let selected=preferredLocale();
function choose(id:Locale){
 selected=id;
 for(const button of strip.querySelectorAll<HTMLButtonElement>('button')){
  const active=button.dataset.locale===id;
  button.setAttribute('aria-pressed',String(active));
  if(active){
   language.textContent=button.title;language.lang=id;
   strip.scrollLeft+=button.getBoundingClientRect().left-strip.getBoundingClientRect().left+(button.offsetWidth-strip.clientWidth)/2;
  }
 }
 prompt.lang=id;prompt.textContent=prompts[id];
}
for(const [id,flag,name] of languages){
 const button=document.createElement('button');button.type='button';button.lang=id;button.title=name;
 button.setAttribute('aria-label',name);button.dataset.locale=id;
 const icon=document.createElement('img');icon.alt='';icon.src=flagUrl(flag);button.append(icon);
 strip.append(button);button.onclick=()=>choose(id);
}
choose(selected);
// Let the entry artwork paint before constructing the scene behind it.
const prepared=new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))
 .then(()=>import('./main'));
void prepared.catch(()=>{});
enter.onclick=async()=>{
 enter.disabled=true;
 for(const button of strip.querySelectorAll('button'))button.disabled=true;
 root.setAttribute('aria-busy','true');
 try{
  root.classList.add('opening-lotus');
  await Promise.all([selectLocale(selected),new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:820))]);
  const temple=await prepared;
  await temple.start();
  game.inert=false;
  root.classList.add('revealing-temple');
  await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:450));
  root.remove();if(!loginReturn)window.dispatchEvent(new Event('sasa:lotus-entry'));document.querySelector<HTMLCanvasElement>('#world')?.focus();
 }catch{
  if(root.contains(enter)){
   prompt.textContent=t('다시 불러오기');enter.disabled=false;enter.onclick=()=>location.reload();
  }
 }finally{root.classList.remove('opening-lotus');root.removeAttribute('aria-busy');}
};

// A login link returns to the language already selected for the visit.
const loginReturn=import.meta.env.MODE==='service'&&new URLSearchParams(location.hash.slice(1)).has('login');
if(loginReturn){
 enter.click();
}
