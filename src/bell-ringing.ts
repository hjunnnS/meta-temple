import type {Scene} from '@babylonjs/core/scene';
import {Vector3,Quaternion} from '@babylonjs/core/Maths/math.vector';
import type {visitorMesh} from './walking';
import type {furnishBell} from './temple-bell';
import {bellCycle,bellFrame,bellPoint,bellSite,BELL_DURATION} from './bell-cycle';
import {bellSound} from './bell-sound';

export function bellPose(body:ReturnType<typeof visitorMesh>,progress:number){
 body.bow(0);const frame=bellFrame(progress);
 for(let i=0;i<2;i++){
  const side=i===0?-1:1,arm=body.arms[i],elbow=body.forearms[i];
  const rest=new Vector3(arm.position.x,arm.position.y-.50,0);
  const grip=new Vector3(side*.12,(1.49+frame.lift-.245-.63)/.9,.305);
  const target=Vector3.Lerp(rest,grip,frame.holding);
  const axis=target.subtract(arm.position),length=Math.min(.504,axis.length());axis.normalize();
  const hint=new Vector3(side*.65,-.8,-.15),bend=hint.subtract(axis.scale(Vector3.Dot(hint,axis))).normalize();
  const along=(.255*.255-.25*.25+length*length)/(2*length);
  const upper=axis.scale(along).add(bend.scale(Math.sqrt(Math.max(0,.255*.255-along*along))));
  const lower=axis.scale(length).subtract(upper),a=Quaternion.Identity(),b=Quaternion.Identity();
  Quaternion.FromUnitVectorsToRef(Vector3.Down(),upper.normalize(),a);Quaternion.FromUnitVectorsToRef(Vector3.Down(),lower.normalize(),b);
  arm.rotationQuaternion=a;elbow.rotationQuaternion=a.conjugate().multiply(b);
  const steps=Math.sin(Math.min(frame.time,1.65)*Math.PI*2);
  body.legs[i].rotation.x=frame.holding*.13*steps*side;
 }
}

export function bellRinging(scene:Scene,body:ReturnType<typeof visitorMesh>,canvas:HTMLCanvasElement,visual:ReturnType<typeof furnishBell>,onStart:()=>void){
 const pad=document.querySelector<HTMLElement>('#walk-pad')!;
 const button=document.createElement('button');button.id='bell-strike';button.hidden=true;button.textContent='종치기';
 const status=document.createElement('output');status.id='bell-strike-status';status.setAttribute('aria-live','polite');status.hidden=true;pad.append(button,status);
 const sound=bellSound();let hit=0,pending=false,epoch=0,wasActive=false,framed=false;
 const startPoint=bellPoint(-3.05,.245);
 const cycle=bellCycle(()=>{hit++;const played=sound.strike();status.textContent=played?'범종의 여운을 들어 보세요.':'소리를 재생하지 못했습니다. 소리 설정을 확인해 주세요.';button.dataset.phase='impact';});
 function approach(){onStart();framed=true;body.root.position.set(...startPoint);body.root.rotation.y=Math.PI/2+('yaw' in bellSite?bellSite.yaw:0);canvas.focus();}
 function cancel(){if(cycle.active||pending)status.textContent='종치기를 멈췄습니다.';framed=false;epoch++;pending=false;cycle.cancel();body.bow(0);visual.frame(1);button.disabled=false;wasActive=false;button.dataset.phase='ready';}
 button.onclick=async()=>{
  if(cycle.active||pending)return;
  pending=true;button.disabled=true;const attempt=++epoch;
  const ready=await sound.prepare();if(attempt!==epoch)return;
  pending=false;approach();cycle.start();wasActive=true;status.hidden=false;status.textContent=ready?'당목을 뒤로 당겨 종을 칩니다.':'소리를 켜지 못했습니다. 동작을 마친 뒤 다시 시도해 주세요.';button.dataset.phase='pull';
 };
 const remotes=new Map<string,{hit:number;progress?:number;at:number}>();
 window.addEventListener('sasa:bell-remote',event=>{
  const peer=(event as CustomEvent<{id:string;hit:number;progress?:number}>).detail,old=remotes.get(peer.id);
  if(old&&peer.hit>old.hit&&Math.hypot(body.root.position.x-bellSite.x,body.root.position.z-bellSite.z)<35)sound.strike();
  remotes.set(peer.id,{hit:peer.hit,progress:peer.progress,at:performance.now()});
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();sound.stop();}});
 return {approach,cancel,get framed(){return framed;},get active(){return cycle.active;},get progress(){return cycle.active?cycle.progress:undefined;},get hit(){return hit;},
 update(active:boolean,dt:number,moving:boolean){
  if(moving)framed=false;
  const distance=Math.hypot(body.root.position.x-bellSite.x,body.root.position.z-bellSite.z);sound.level(distance);
  if((!active||moving)&&(cycle.active||pending))cancel();
  button.hidden=!active||distance>5.2;status.hidden=button.hidden;
  if(cycle.active){
   cycle.update(Math.min(.1,dt));
   const frame=bellFrame(cycle.progress),p=bellPoint(-3.05+frame.offset*frame.holding,.245);body.root.position.set(...p);
   bellPose(body,cycle.progress);visual.frame(cycle.progress);
   if(cycle.active)return true;
  }
  if(wasActive){wasActive=false;body.bow(0);visual.frame(1);button.disabled=false;button.dataset.phase='ready';status.textContent='종소리가 은은하게 잦아듭니다. 다시 칠 수 있어요.';}
  const remote=[...remotes.values()].filter(p=>p.progress!==undefined&&performance.now()-p.at<1500).sort((a,b)=>b.at-a.at)[0];
  visual.frame(remote?Math.min(1,remote.progress!+(performance.now()-remote.at)/1000/BELL_DURATION):1);
  return false;
 }};
}
