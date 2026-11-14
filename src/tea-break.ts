import{smoothMotion,turnTowards}from'./motion-timing';
import{walkingPose}from'./locomotion';
import{walkingPath,type WalkPoint}from'./point-navigation';
import {t,translateMarkup} from './locales';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector';
import type {Scene} from '@babylonjs/core/scene';
import type {visitorMesh} from './walking';
import {teaSeats,teaRestArea} from './temple-terrain';

export function teaGesture(body:ReturnType<typeof visitorMesh>,lift:number,seated=1){
 body.bow(0);
 for(let i=0;i<2;i++){body.legs[i].rotation.x=-Math.PI/2*seated;body.shins[i].rotation.x=Math.PI/2*seated;}
 // Aim the hand at the lip, rather than merely raising an arm beside the face.
 body.chest.rotation.x=.16*Math.sin(Math.PI*seated);body.plantFeet();
 const arm=body.arms[1],elbow=body.forearms[1];
 const target=Vector3.Lerp(new Vector3(.24,.15,.26),new Vector3(.015,.465,.23),lift);
 const axis=target.subtract(arm.position),length=Math.min(.504,axis.length());axis.normalize();
 const hint=new Vector3(.8,-1,0),bend=hint.subtract(axis.scale(Vector3.Dot(hint,axis))).normalize();
 const along=(.255*.255-.25*.25+length*length)/(2*length);
 const upper=axis.scale(along).add(bend.scale(Math.sqrt(Math.max(0,.255*.255-along*along))));
 const lower=axis.scale(length).subtract(upper),a=Quaternion.Identity(),b=Quaternion.Identity();
 Quaternion.FromUnitVectorsToRef(Vector3.Down(),upper.normalize(),a);
 Quaternion.FromUnitVectorsToRef(Vector3.Down(),lower.normalize(),b);
 arm.rotationQuaternion=a;elbow.rotationQuaternion=a.conjugate().multiply(b);
}

export function teaCup(scene:Scene,body:ReturnType<typeof visitorMesh>,name='visitor-drink'){
 const root=new TransformNode(name,scene);
 const porcelain=new StandardMaterial('tea-cup-porcelain',scene);porcelain.diffuseColor=Color3.FromHexString('#e9e2cb');porcelain.specularColor=new Color3(.24,.22,.17);
 const liquid=new StandardMaterial('tea-cup-liquid',scene);liquid.specularColor=new Color3(.3,.27,.16);
 const wall=MeshBuilder.CreateLathe('tea-cup',{shape:[new Vector3(.032,0,0),new Vector3(.055,.005,0),new Vector3(.065,.105,0),new Vector3(.058,.105,0),new Vector3(.05,.012,0),new Vector3(0,.012,0)],tessellation:24},scene);wall.parent=root;wall.material=porcelain;
 const top=MeshBuilder.CreateCylinder('tea-surface',{diameter:.109,height:.002,tessellation:24},scene);top.parent=root;top.position.y=.086;top.material=liquid;
 const handle=MeshBuilder.CreateTorus('tea-cup-handle',{diameter:.065,thickness:.012,tessellation:16},scene);handle.parent=root;handle.position.set(.075,.055,0);handle.rotation.x=Math.PI/2;handle.material=porcelain;
 root.setEnabled(false);
 return {root,update(on:boolean,lift:number,coffee:boolean){
  root.setEnabled(on);if(!on)return;
  body.hands[1].computeWorldMatrix(true);
  root.position.copyFrom(body.hands[1].getAbsolutePosition());root.position.y+=.035;
  root.rotation.set(-.28*lift,body.root.rotation.y,0);
  liquid.diffuseColor=Color3.FromHexString(coffee?'#3b2113':'#9b6b25');
 },dispose(){root.dispose(false,true);}};
}

export function teaBreak(scene:Scene,body:ReturnType<typeof visitorMesh>,canvas:HTMLCanvasElement,world?:{floor:(x:number,z:number)=>number;blocked:(x:number,y:number,z:number)=>boolean}){
 const panel=document.createElement('section');panel.id='tea-break';panel.hidden=true;
 panel.setAttribute('aria-label',t('차·커피 쉼터'));
 panel.innerHTML=`<style>#tea-break{position:fixed;left:50%;bottom:105px;transform:translateX(-50%);z-index:45;padding:14px 18px;background:#19392feF;color:#fff4d9;border:1px solid #bfa26c;border-radius:16px;width:min(490px,90vw);font:15px sans-serif;box-sizing:border-box}#tea-break[hidden]{display:none}#tea-break label{display:inline-block;margin:8px 12px 8px 0}#tea-break select,#tea-break button{font:inherit;padding:8px;border-radius:8px;margin:3px;border:1px solid #bfa26c;background:#efe6cf;color:#253c30}#tea-break button:disabled{opacity:.6}#tea-break p{margin:8px 0 0;font-size:13px}</style><strong>연못과 탑을 바라보는 쉼터</strong><div><label>음료 <select id="tea-beverage"><option value="tea">차</option><option value="coffee">커피</option></select></label><label>좌석 <select id="tea-seat">${teaSeats.map((_,i)=>`<option value="${i}">${t(teaSeats[i].area)} ${i<12?i%6+1:i-11}</option>`).join('')}</select></label></div><button id="tea-sit">앉기</button><button id="tea-sip" hidden>마시기</button><button id="tea-stand" hidden>일어나기</button><p id="tea-status" role="status">음료와 자리를 골라 잠시 쉬어 가세요.</p>`;
 translateMarkup(panel);document.body.append(panel);
 const beverage=panel.querySelector<HTMLSelectElement>('#tea-beverage')!,seat=panel.querySelector<HTMLSelectElement>('#tea-seat')!;
 // The preview scene is prepared before the visitor selects a language.
 window.addEventListener('sasa:locale-ready',()=>{translateMarkup(panel);for(const [i,option] of Array.from(seat.options).entries())option.textContent=t(teaSeats[i].area)+' '+(i<12?i%6+1:i-11);});
 const sit=panel.querySelector<HTMLButtonElement>('#tea-sit')!,sip=panel.querySelector<HTMLButtonElement>('#tea-sip')!,stand=panel.querySelector<HTMLButtonElement>('#tea-stand')!,status=panel.querySelector<HTMLElement>('#tea-status')!;
 const cup=teaCup(scene,body);let phase:'idle'|'approaching'|'turning'|'lowering'|'seated'|'rising'='idle',elapsed=0,time=-1,lift=0,currentSeat=0,pendingSeat:number|null=null,stride=0,seatAmount=0,riseFrom=1,route:WalkPoint[]=[],from=body.root.position.clone();
 const front=()=>{const s=teaSeats[currentSeat];return new Vector3(s.x+Math.sin(s.yaw)*.62,s.ground,s.z+Math.cos(s.yaw)*.62);};
 function reset(){time=-1;lift=0;sip.disabled=true;beverage.disabled=false;}
 function hardStop(){phase='idle';pendingSeat=null;route=[];reset();cup.update(false,0,false);body.bow(0);}
 function sitAt(index:number,arrive=false){
  if(!Number.isInteger(index)||!teaSeats[index])return;
  if(phase!=='idle'){stop();pendingSeat=index;return;}
  reset();currentSeat=index;const s=teaSeats[index];seat.value=String(index);const goal=front();
  if(arrive&&Vector3.Distance(body.root.position,goal)>12)body.root.position.copyFrom(goal.add(new Vector3(0,0,-1.2)));
  const p=body.root.position;route=walkingPath([p.x,p.z],[goal.x,goal.z],(a,b)=>!world||Math.abs(world.floor(a[0],a[1])-world.floor(b[0],b[1]))<=.5&&!world.blocked(b[0],world.floor(b[0],b[1]),b[1]));
  if(!route.length&&Vector3.Distance(p,goal)>.25){status.textContent=t('다시 시도해 주세요.');return;}
  phase='approaching';elapsed=0;panel.hidden=false;sit.textContent=t('자리 옮기기');sip.hidden=stand.hidden=false;status.textContent=t('앉기')+'…';canvas.focus();
 }
 function stop(immediate=false){
  if(immediate){hardStop();return;}
  if(phase==='seated'||phase==='lowering'){from=body.root.position.clone();riseFrom=seatAmount;elapsed=0;phase='rising';cup.update(false,0,false);reset();}
  else if(phase==='approaching'||phase==='turning')hardStop();
 }
 sit.onclick=()=>sitAt(Number(seat.value));stand.onclick=()=>{stop();canvas.focus();};
 sip.onclick=()=>{if(phase!=='seated'||time>=0)return;time=0;sip.disabled=true;beverage.disabled=true;status.textContent=t(beverage.value==='coffee'?'커피':'차')+' · '+t('마시기');canvas.focus();};
 return {sitAt,stop,get seated(){return phase!=='idle';},get travelling(){return phase==='approaching';},get lift(){return lift;},get beverage(){return beverage.value;},hide(){hardStop();panel.hidden=true;},update(active:boolean,dt:number,moving:boolean){
  if(!active){hardStop();panel.hidden=true;return false;}
  if(moving&&(phase==='seated'||phase==='lowering'||phase==='approaching'))stop();
  const p=body.root.position;panel.hidden=phase==='idle'&&(p.x<teaRestArea.west||p.x>teaRestArea.east||p.z<teaRestArea.south||p.z>teaRestArea.north);panel.dataset.phase=phase;body.root.metadata={...body.root.metadata,chairPhase:phase};
  if(phase==='idle'){if(pendingSeat!==null){const next=pendingSeat;pendingSeat=null;sitAt(next);return true;}return false;}
  const step=Math.min(.1,dt),s=teaSeats[currentSeat];elapsed+=step;let amount=0;
  if(phase==='approaching'){
   const next=route[0],dx=(next?.[0]??p.x)-p.x,dz=(next?.[1]??p.z)-p.z,length=Math.hypot(dx,dz),distance=Math.min(length,1.6*step);
   if(length>.01){p.x+=dx/length*distance;p.z+=dz/length*distance;p.y=world?.floor(p.x,p.z)??s.ground;body.root.rotation.y=turnTowards(body.root.rotation.y,Math.atan2(dx,dz),step);stride+=distance*5.6;walkingPose(body,stride,Math.min(1,length/.35));}
   if(length<=distance+.02)route.shift();if(!route.length){phase='turning';elapsed=0;}
  }else if(phase==='turning'){
   body.bow(0);body.root.rotation.y=turnTowards(body.root.rotation.y,s.yaw,step,10);if(elapsed>.5){phase='lowering';elapsed=0;from=p.clone();}
  }else if(phase==='lowering'){
   amount=smoothMotion(elapsed/1.35);p.copyFrom(Vector3.Lerp(from,new Vector3(s.x,s.y,s.z),amount));teaGesture(body,0,amount);if(amount===1){phase='seated';elapsed=0;sip.disabled=false;status.textContent=t('잠시 숨을 고르고 풍경을 즐겨 보세요.');}
  }else if(phase==='rising'){
   const u=smoothMotion(elapsed/1.15);amount=riseFrom*(1-u);p.copyFrom(Vector3.Lerp(from,front(),u));teaGesture(body,0,amount);if(u===1){const next=pendingSeat;hardStop();pendingSeat=next;sit.textContent=t('앉기');sip.hidden=stand.hidden=true;status.textContent=t('차·커피 쉼터');}
  }else{
   amount=1;if(time>=0){time+=step;const a=Math.min(1,time/.9),b=Math.min(1,Math.max(0,(time-2.1)/1.1));lift=smoothMotion(a)*(1-smoothMotion(b));if(time>=3.2){reset();sip.disabled=false;status.textContent=t('잠시 숨을 고르고 풍경을 즐겨 보세요.');}}
   teaGesture(body,lift);cup.update(true,lift,beverage.value==='coffee');
  }
  stand.disabled=phase==='rising';sip.disabled=phase!=='seated'||time>=0;seatAmount=amount;panel.dataset.amount=String(amount);return true;
 }};
}
