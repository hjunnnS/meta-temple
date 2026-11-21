import './trial-entry';
import {mobileDevice} from './mobile-profile';
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
 <div class="entry-preparation" hidden><p role="status" aria-live="polite"></p><progress max="100"></progress><span class="entry-elapsed" aria-hidden="true"></span></div>
 </div></main>`;
const strip=root.querySelector<HTMLElement>('.flag-strip')!;
const enter=root.querySelector<HTMLButtonElement>('.enter-temple')!;
const prompt=root.querySelector<HTMLElement>('.entry-prompt')!;
const language=root.querySelector<HTMLElement>('.selected-language')!;
const preparation=root.querySelector<HTMLElement>('.entry-preparation')!;
const status=preparation.querySelector<HTMLElement>('[role=status]')!;
const progress=preparation.querySelector<HTMLProgressElement>('progress')!;
const elapsed=preparation.querySelector<HTMLElement>('.entry-elapsed')!;
let progressValue=0,failed=false,opening=false;
window.addEventListener('sasa:preparation',event=>{
 progressValue=(event as CustomEvent<number>).detail;
 if(progressValue<85)progress.value=progressValue;else progress.removeAttribute('value');
});
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
 if(failed)void selectLocale(id).then(()=>{if(selected===id){prompt.textContent=t('다시 불러오기');status.textContent=t('연결 상태를 확인해 주세요.');}}).catch(()=>{});
}
for(const [id,flag,name] of languages){
 const button=document.createElement('button');button.type='button';button.lang=id;button.title=name;
 button.setAttribute('aria-label',name);button.dataset.locale=id;
 const icon=document.createElement('img');icon.alt='';icon.src=flagUrl(flag);button.append(icon);
 strip.append(button);button.onclick=()=>choose(id);
}
choose(selected);
// Let the entry artwork paint before constructing the scene behind it.
let prepared:Promise<typeof import('./main')>|undefined;
function prepare(){return prepared??=new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))).then(()=>import('./main'));}
// A phone must not allocate the whole 3D scene while choosing a language.
if(!mobileDevice())void prepare().catch(()=>{});
enter.onclick=async()=>{
 if(opening)return;
 if(failed){try{localStorage.setItem('sasa:language',selected);if(mobileDevice())localStorage.setItem('sasa:display:mobile-quality','low');}catch{}location.reload();return;}
 opening=true;
 // Safari may terminate a memory-heavy page without delivering a catchable error.
 if(mobileDevice())try{if(localStorage.getItem('sasa:entry:mobile-pending')==='1')localStorage.setItem('sasa:display:mobile-quality','low');localStorage.setItem('sasa:entry:mobile-pending','1');}catch{}
 enter.disabled=true;
 for(const button of strip.querySelectorAll('button'))button.disabled=true;
 root.setAttribute('aria-busy','true');
 preparation.hidden=false;progress.value=progressValue;
 const began=performance.now();
 const clock=window.setInterval(()=>{elapsed.textContent=Math.floor((performance.now()-began)/1000)+'s';},1000);
 const deadline=began+45000;
 async function withinDeadline<T>(work:Promise<T>):Promise<T>{
  let timer=0;
  try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=window.setTimeout(()=>reject(Error('entry timeout')),Math.max(0,deadline-performance.now()));})]);}
  finally{clearTimeout(timer);}
 }
 try{
  root.classList.add('opening-lotus');
  await withinDeadline(Promise.all([selectLocale(selected).then(()=>{status.textContent=t('사찰을 준비하고 있어요…');prompt.textContent=t('준비 중');}),new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:820))]));
  const temple=await withinDeadline(prepare());
  await withinDeadline(temple.start());
  if(mobileDevice())try{localStorage.removeItem('sasa:entry:mobile-pending');}catch{}
  game.inert=false;
  root.classList.add('revealing-temple');
  await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:450));
  root.remove();if(!loginReturn)window.dispatchEvent(new Event('sasa:lotus-entry'));document.querySelector<HTMLCanvasElement>('#world')?.focus();
 }catch(error){
  console.error('Temple entry failed',error);
  if(root.contains(enter)){
   failed=true;status.textContent=t(error instanceof Error&&/graphics|webgl/i.test(error.message)?'그래픽 연결이 중단되었습니다. 다시 불러와 주세요.':'연결 상태를 확인해 주세요.');progress.hidden=true;
   prompt.textContent=t('다시 불러오기');enter.disabled=false;
   for(const button of strip.querySelectorAll('button'))button.disabled=false;
  }
 }finally{window.clearInterval(clock);opening=false;root.classList.remove('opening-lotus');root.removeAttribute('aria-busy');}
};

// A login link returns to the language already selected for the visit.
const loginReturn=import.meta.env.MODE==='service'&&new URLSearchParams(location.hash.slice(1)).has('login');
if(loginReturn){
 enter.click();
}
