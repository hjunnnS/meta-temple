import{walkingPose}from'./locomotion';
import{BOW_SECONDS}from'./motion-timing';
import {privateMeditationPose} from './private-practice';
import {bellPose} from './bell-ringing';
import {BELL_DURATION} from './bell-cycle';
import {teaGesture,teaCup} from './tea-break';
import {validFace,type Face} from './face-types';
import {visitorRobe} from './visitor-robe';
import {locale,t} from './locales';
import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { visitorMesh } from './walking.ts';
import { layoutDraft } from './contracts.ts';

interface Motion {meditating?:boolean;bellProgress?:number;bellHit?:number;drinkLift?:number;beverage?:string;bowProgress?:number;face?:Face;wearingRobe?:boolean;position:number[];yaw:number;animation:string}
interface Peer extends Motion {sessionId:string;sequence:number}
interface Snapshot {self:string;key?:string;layoutVersion:string;schemaVersion:number;channelId:string;count?:number;participants:Peer[]}

export function reviewPresence(scene:Scene,pose:()=>Motion,box:HTMLElement,channel?:HTMLSelectElement){
 const avatars=new Map<string,{body:ReturnType<typeof visitorMesh>;robe:ReturnType<typeof visitorRobe>;target:Vector3;peer:Peer;bowTime:number;bellTime:number;cup:ReturnType<typeof teaCup>}>();
 let session:{id:string;key:string}|null=null,sequence=0,epoch=0,timer=0,paused=false;
 let pending:AbortController|undefined;
 function clearPeer(id:string){
  const remote=avatars.get(id);if(!remote)return;
  remote.cup.dispose();remote.body.root.dispose(false,true);avatars.delete(id);
 }
 function reconcile(s:Snapshot){
  if(s.layoutVersion!==layoutDraft.version||s.schemaVersion!==1||s.channelId!==(channel?.value??'sample:channel:1'))throw Error('세션 버전 오류');
  for(const id of avatars.keys())if(!s.participants.some(p=>p.sessionId===id))clearPeer(id);
  for(const peer of s.participants){
   let remote=avatars.get(peer.sessionId);
   if(!remote){
    const body=visitorMesh(scene,peer.sessionId);body.root.position.set(...peer.position as [number,number,number]);
    remote={body,cup:teaCup(scene,body),robe:visitorRobe(scene,body),peer,bowTime:0,bellTime:(peer.bellProgress??0)*BELL_DURATION,target:body.root.position.clone()};avatars.set(peer.sessionId,remote);
   }
   if(peer.sequence>=remote.peer.sequence){
    if(peer.bowProgress!==undefined&&(peer.sequence!==remote.peer.sequence||remote.bowTime===0))remote.bowTime=peer.bowProgress*BOW_SECONDS;
    if(peer.sequence!==remote.peer.sequence){
     remote.bellTime=(peer.bellProgress??0)*BELL_DURATION;
     window.dispatchEvent(new CustomEvent('sasa:bell-remote',{detail:{id:peer.sessionId,hit:peer.bellHit??0,progress:peer.animation==='bell'?peer.bellProgress:undefined}}));
    }
    remote.peer=peer;
    remote.body.setFace(validFace(peer.face)?peer.face:"human");
    if(remote.robe.wearing!==!!peer.wearingRobe)remote.robe.setWearing(!!peer.wearingRobe);
    remote.target.set(...peer.position as [number,number,number]);}
  }
  window.dispatchEvent(new CustomEvent('sasa:population',{detail:{count:s.count??1+s.participants.length,channelId:s.channelId}}));
  box.textContent=t('같은 공간 방문자')+' '+(s.count??1+avatars.size)+(locale==='ko'?'명':'');
 }
 scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
  for(const remote of avatars.values()){
   const {body,target,peer}=remote;
   Vector3.LerpToRef(body.root.position,target,1-Math.exp(-18*dt),body.root.position);
   body.root.rotation.y=peer.yaw;
   remote.bowTime=peer.animation==='worship'?Math.min(BOW_SECONDS,remote.bowTime+dt):0;
   if(!peer.meditating){for(const leg of [...body.legs,...body.shins])leg.rotationQuaternion=null;body.chest.scaling.y=1;}body.bow(remote.bowTime/BOW_SECONDS);
   if(peer.animation==='bell'){remote.bellTime=Math.min(BELL_DURATION,remote.bellTime+dt);bellPose(body,remote.bellTime/BELL_DURATION);}
   if(peer.animation==='sit'){if(peer.meditating)privateMeditationPose(body,1,performance.now()/1000);else teaGesture(body,peer.drinkLift??0);}else{for(const leg of [...body.legs,...body.shins])leg.rotationQuaternion=null;body.chest.scaling.y=1;}
   remote.cup.update(peer.animation==='sit'&&!peer.meditating,peer.drinkLift??0,peer.beverage==='coffee');
   if(peer.animation==='walk')walkingPose(body,performance.now()*.007,1);
  }
 });
 async function sync(generation:number){
  if(paused)return;
  pending=new AbortController();
  const signal=AbortSignal.any([pending.signal,AbortSignal.timeout(3000)]);
  try{
   const current=session;
   const response=channel?await fetch('/api/service/channel/'+(current?'move':'join'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(current?{...pose(),sequence:++sequence,self:current.id}:{channel:Number(channel.value)}),signal}):await fetch('/api/review/sessions'+(current?'/'+current.id:''),{
    method:current?'PUT':'POST',headers:current?{'Content-Type':'application/json',Authorization:'Bearer '+current.key}:{},
    body:current?JSON.stringify({...pose(),sequence:++sequence}):undefined,signal
   });
   if(generation!==epoch)return;
   if(channel&&response.status===409){
    const problem=await response.json();
    if(problem.error==='private_space_active'){
     session=null;sequence=0;for(const id of avatars.keys())clearPeer(id);box.textContent='이전 접속을 정리하고 있습니다.';return;
    }
    epoch++;session=null;for(const id of avatars.keys())clearPeer(id);
    box.textContent=t('만석입니다. 다른 채널을 선택하세요.');return;
   }
   if(response.status===401||response.status===410){session=null;sequence=0;}
   if(!response.ok)throw Error('세션 연결 실패');
   const s:Snapshot=await response.json();
   if(generation!==epoch)return;
   if(!current){if(!s.key&&!channel)throw Error('세션 키 누락');session={id:s.self,key:s.key??''};}
   reconcile(s);
  }catch{if(generation===epoch){for(const id of avatars.keys())clearPeer(id);box.textContent=t('방문자 연결 재시도 중');}}
  finally{if(!paused&&generation===epoch)timer=window.setTimeout(()=>void sync(generation),session?160:650);}
 }
 window.addEventListener('pagehide',()=>{
  epoch++;clearTimeout(timer);
  if(channel&&session)void fetch('/api/service/channel/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({self:session.id}),keepalive:true}).catch(()=>{});
  else if(session)void fetch('/api/review/sessions/'+session.id,{method:'DELETE',headers:{Authorization:'Bearer '+session.key},keepalive:true}).catch(()=>{});
  session=null;sequence=0;
 });
 window.addEventListener('pageshow',e=>{if(e.persisted&&!paused)void sync(++epoch);});
 window.addEventListener('sasa:space',event=>{
  const next=(event as CustomEvent<string>).detail==='private';if(next===paused)return;
  paused=next;epoch++;clearTimeout(timer);pending?.abort();
  const old=session;session=null;sequence=0;for(const id of avatars.keys())clearPeer(id);
  if(old){
   if(channel)void fetch('/api/service/channel/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({self:old.id}),keepalive:true}).catch(()=>{});
   else void fetch('/api/review/sessions/'+old.id,{method:'DELETE',headers:{Authorization:'Bearer '+old.key},keepalive:true}).catch(()=>{});
  }
  box.textContent=paused?'개인 공간 · 나만 입장':t('방문자 연결 재시도 중');
  if(!paused)void sync(epoch);
 });
 let relocation=Promise.resolve();
 window.addEventListener('sasa:relocate',()=>{
  if(paused)return;const generation=++epoch;clearTimeout(timer);pending?.abort();const old=session;session=null;sequence=0;for(const id of avatars.keys())clearPeer(id);
  relocation=relocation.then(async()=>{
   if(old)try{if(channel)await fetch('/api/service/channel/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({self:old.id}),signal:AbortSignal.timeout(3000)});else await fetch('/api/review/sessions/'+old.id,{method:'DELETE',headers:{Authorization:'Bearer '+old.key},signal:AbortSignal.timeout(3000)});}catch{/* Join still revalidates the session. */}
   if(generation===epoch&&!paused)void sync(generation);
  });
 });
 if(channel){
  const restart=()=>{if(paused)return;epoch++;clearTimeout(timer);session=null;sequence=0;for(const id of avatars.keys())clearPeer(id);void sync(epoch);};
  channel.onchange=restart;window.addEventListener('sasa:account',restart);
 }
 void sync(epoch);
}
