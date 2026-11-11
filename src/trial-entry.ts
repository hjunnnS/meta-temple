import {createTrialApi} from './trial-api';
import {t} from './locales';
let storage:Pick<Storage,'getItem'|'setItem'>;let persistent=true;
try{localStorage.setItem('sasa:trial:probe','1');localStorage.removeItem('sasa:trial:probe');storage=localStorage;}catch{persistent=false;const memory=new Map<string,string>();storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>{memory.set(key,value);}};}
const request=createTrialApi(storage),original=window.fetch.bind(window);
window.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{
 const url=new URL(input instanceof Request?input.url:String(input),location.href);
 if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return original(input,init);
 if(init?.signal?.aborted)throw new DOMException('Aborted','AbortError');
 if(!url.pathname.startsWith('/api/service/'))return new Response(JSON.stringify({error:'trial_only'}),{status:404,headers:{'Content-Type':'application/json'}});
 const method=init?.method??(input instanceof Request?input.method:'GET'),raw=init?.body??(input instanceof Request?await input.clone().text():undefined);
 let body:Record<string,any>={};try{if(raw)body=JSON.parse(String(raw));}catch{return new Response('{}',{status:400});}
 try{return await request(url.pathname.slice('/api/service/'.length)+url.search,method,body);}catch{return new Response(JSON.stringify({error:'trial_storage_unavailable'}),{status:503,headers:{'Content-Type':'application/json'}});}
};
import './trial.css';
const note=document.createElement('aside');note.id='trial-notice';note.innerHTML='<button type="button">×</button><strong></strong><span></span><small></small>';
try{if(sessionStorage.getItem('sasa:trial:notice-dismissed')==='1')note.classList.add('compact');}catch{}
function translateNotice(){note.setAttribute('aria-label',t('체험판 안내'));note.querySelector('button')!.setAttribute('aria-label',t('체험판 안내 닫기'));note.querySelector('strong')!.textContent=t('사사 · 개인 체험판');note.querySelector('span')!.textContent=t('실제 결제 없음 · 각자 체험하는 공간');note.querySelector('small')!.textContent=t(persistent?'신청·배치는 이 브라우저에만 저장됩니다.':'브라우저 저장을 사용할 수 없어 창을 닫으면 기록이 사라집니다.');}
translateNotice();window.addEventListener('sasa:locale-ready',translateNotice);document.body.append(note);note.querySelector('button')!.onclick=()=>{note.classList.add('compact');try{sessionStorage.setItem('sasa:trial:notice-dismissed','1');}catch{}};
