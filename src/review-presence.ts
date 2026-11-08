import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { visitorMesh } from './walking.ts';
import { layoutDraft } from './contracts.ts';

interface Motion {position:number[];yaw:number;animation:string}
interface Peer extends Motion {sessionId:string;sequence:number}
interface Snapshot {self:string;key?:string;layoutVersion:string;schemaVersion:number;channelId:string;participants:Peer[]}

export function reviewPresence(scene:Scene,pose:()=>Motion,box:HTMLElement){
 const avatars=new Map<string,{body:ReturnType<typeof visitorMesh>;target:Vector3;peer:Peer}>();
 let session:{id:string;key:string}|null=null,sequence=0,epoch=0,timer=0;
 function clearPeer(id:string){
  const remote=avatars.get(id);if(!remote)return;
  remote.body.root.dispose(false,true);avatars.delete(id);
 }
 function reconcile(s:Snapshot){
  if(s.layoutVersion!==layoutDraft.version||s.schemaVersion!==1||s.channelId!=='sample:channel:1')throw Error('세션 버전 오류');
  for(const id of avatars.keys())if(!s.participants.some(p=>p.sessionId===id))clearPeer(id);
  for(const peer of s.participants){
   let remote=avatars.get(peer.sessionId);
   if(!remote){
    const body=visitorMesh(scene,peer.sessionId);body.root.position.set(...peer.position as [number,number,number]);
    remote={body,peer,target:body.root.position.clone()};avatars.set(peer.sessionId,remote);
   }
   if(peer.sequence>=remote.peer.sequence){remote.peer=peer;remote.target.set(...peer.position as [number,number,number]);}
  }
  box.textContent='같은 공간 방문자 '+(1+avatars.size)+'명';
 }
 scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
  for(const {body,target,peer} of avatars.values()){
   Vector3.LerpToRef(body.root.position,target,1-Math.exp(-18*dt),body.root.position);
   body.root.rotation.y=peer.yaw;
   body.legs.forEach((l,i)=>l.rotation.x=peer.animation==='walk'?.35*Math.sin(performance.now()*.01+i*Math.PI):0);
  }
 });
 async function sync(generation:number){
  try{
   const current=session;
   const response=await fetch('/api/review/sessions'+(current?'/'+current.id:''),{
    method:current?'PUT':'POST',headers:current?{'Content-Type':'application/json',Authorization:'Bearer '+current.key}:{},
    body:current?JSON.stringify({...pose(),sequence:++sequence}):undefined,signal:AbortSignal.timeout(3000)
   });
   if(generation!==epoch)return;
   if(response.status===401){session=null;sequence=0;}
   if(!response.ok)throw Error('세션 연결 실패');
   const s:Snapshot=await response.json();
   if(generation!==epoch)return;
   if(!current){if(!s.key)throw Error('세션 키 누락');session={id:s.self,key:s.key};}
   reconcile(s);
  }catch{if(generation===epoch){for(const id of avatars.keys())clearPeer(id);box.textContent='방문자 연결 재시도 중';}}
  finally{if(generation===epoch)timer=window.setTimeout(()=>void sync(generation),session?160:650);}
 }
 window.addEventListener('pagehide',()=>{
  epoch++;clearTimeout(timer);
  if(session)void fetch('/api/review/sessions/'+session.id,{method:'DELETE',headers:{Authorization:'Bearer '+session.key},keepalive:true}).catch(()=>{});
  session=null;sequence=0;
 });
 window.addEventListener('pageshow',e=>{if(e.persisted)void sync(++epoch);});
 void sync(epoch);
}
