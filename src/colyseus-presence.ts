import {Client,type Room} from 'colyseus.js';
import {trialColyseusEndpoint} from './colyseus-config';
import type {Motion,Snapshot} from './review-presence';
import {layoutDraft} from './contracts';
import {t} from './locales';

export const colyseusEndpoint=import.meta.env?.VITE_COLYSEUS_URL?.trim()||trialColyseusEndpoint;

/** Transport only: keep the existing visitor meshes, animation and interpolation. */
export function connectColyseus(endpoint:string,pose:()=>Motion,channel:HTMLSelectElement,receive:(snapshot:Snapshot)=>void,clear:()=>void,box:HTMLElement){
 // The direct temporary link remains usable if the tunnel gets a new hostname.
 if(location.hostname.endsWith('.trycloudflare.com'))endpoint=location.origin;
 const client=new Client(endpoint);let room:Room|undefined,epoch=0,sequence=0,paused=false,disposed=false,timer=0,sendTimer=0,pending:AbortController|undefined;
 let retryDelay=650;
 const empty=()=>{clear();box.dataset.self='';box.dataset.count=paused?'0':'1';box.dataset.peers='[]';window.dispatchEvent(new CustomEvent('sasa:population',{detail:{count:paused?0:1,channelId:channel.value}}));};
 const status=(full=false)=>{empty();box.textContent=t(full?'만석입니다. 다른 채널을 선택하세요.':'방문자 연결 재시도 중');};
 const stop=()=>{epoch++;clearTimeout(timer);clearInterval(sendTimer);pending?.abort();const previous=room;room=undefined;sequence=0;if(!previous)return;const leaving=previous.leave(true).catch(()=>{});return Promise.race([leaving,new Promise<void>(resolve=>setTimeout(resolve,1500))]).finally(()=>{if(previous.connection.isOpen)previous.connection.close();});};
 async function join(generation:number){
  if(disposed||paused||generation!==epoch)return;
  pending=new AbortController();
  try{
   const response=await fetch(new URL('/presence/join',endpoint),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',signal:AbortSignal.any([pending.signal,AbortSignal.timeout(8000)]),body:JSON.stringify({...pose(),channel:Number(channel.value),layoutVersion:layoutDraft.version})});
   if(!response.ok){const failure=await response.json().catch(()=>({}));throw Error(failure.error==='channel_full'?'full':'join');}
   const seat=await response.json();if(disposed||paused||generation!==epoch)return;
   let late=false;const connecting=client.consumeSeatReservation(seat);void connecting.then(r=>{if(late||disposed||paused||generation!==epoch)void r.leave();},()=>{});let timeout:ReturnType<typeof setTimeout>|undefined;
   const connected=await Promise.race([connecting,new Promise<never>((_resolve,reject)=>{timeout=setTimeout(()=>{late=true;reject(Error('timeout'));},8000);})]).finally(()=>clearTimeout(timeout));
   if(late||disposed||paused||generation!==epoch){await connected.leave();return;}
   room=connected;box.dataset.transport='colyseus';retryDelay=650;
   connected.onMessage('snapshot',(snapshot:Snapshot)=>{if(room!==connected||generation!==epoch)return;try{receive(snapshot);}catch{void restart();}});
   connected.onError(()=>{if(room===connected)void restart();});
   connected.onLeave(()=>{if(room!==connected||generation!==epoch)return;room=undefined;clearInterval(sendTimer);status();timer=window.setTimeout(()=>void join(epoch),retryDelay);});
   const send=()=>{if(room===connected&&generation===epoch)connected.send('move',{...pose(),sequence:++sequence});};
   send();connected.send('snapshot');sendTimer=window.setInterval(send,100);
  }catch(error){
   if(disposed||paused||generation!==epoch)return;
   status(error instanceof Error&&error.message==='full');timer=window.setTimeout(()=>void join(generation),retryDelay);retryDelay=Math.min(5000,retryDelay*2);
  }
 }
 async function restart(){const leaving=stop(),generation=epoch;empty();await leaving;if(!paused&&!disposed&&generation===epoch)void join(generation);}
 const relocate=()=>void restart();
 const space=(event:Event)=>{const next=(event as CustomEvent<string>).detail==='private';if(next===paused)return;paused=next;void restart();if(paused)box.textContent='개인 공간 · 나만 입장';};
 const hide=()=>{void stop();empty();};
 const show=(event:PageTransitionEvent)=>{if(event.persisted&&!paused)void restart();};
 channel.addEventListener('change',relocate);window.addEventListener('sasa:relocate',relocate);window.addEventListener('sasa:account',relocate);window.addEventListener('sasa:space',space);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
 void join(epoch);
 return()=>{disposed=true;void stop();empty();channel.removeEventListener('change',relocate);window.removeEventListener('sasa:relocate',relocate);window.removeEventListener('sasa:account',relocate);window.removeEventListener('sasa:space',space);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);};
}
