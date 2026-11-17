import {t} from './locales';
import './online-visitors.css';

/** Read the authoritative channel snapshot; never count ambient visitors or guess 1. */
export function onlineVisitors(source:HTMLElement){
 const badge=document.createElement('output');badge.id='online-visitors';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');badge.setAttribute('aria-atomic','true');
 const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');const label=document.createElement('span');badge.append(dot,label);
 let connectedBefore=false;
 function render(){
  const count=Number(source.dataset.count),connected=!!source.dataset.self&&Number.isSafeInteger(count)&&count>0;
  const text=connected?t('{count}명 접속 중').replace('{count}',String(count)):t(connectedBefore?'재연결 중':'접속 확인 중');
  connectedBefore||=connected;
  if(label.textContent!==text)label.textContent=text;
  const state=connected?'online':'connecting';if(badge.dataset.state!==state)badge.dataset.state=state;
  badge.title=t('같은 채널 · 본인 포함 · 가상 방문객 제외');
 }
 document.querySelector('.brand')?.after(badge);render();
 const observer=new MutationObserver(render);observer.observe(source,{attributes:true,attributeFilter:['data-count','data-self']});
 window.addEventListener('sasa:locale-ready',render);
 return()=>{observer.disconnect();window.removeEventListener('sasa:locale-ready',render);badge.remove();};
}
