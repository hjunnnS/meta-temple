import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {visitorMesh} from './walking';
import {privateMeditationPose} from './private-practice';
import {ambientPlaces,ambientBudget} from './ambient-layout';
import{visitorJourney,visitorWalkSpeed,stopPose}from'./ambient-journeys';
import{walkingPath,type WalkPoint}from'./point-navigation';
import {reducedMotion} from './practice-light';
import {t} from './locales';
interface World{floor:(x:number,z:number)=>number;blocked:(x:number,y:number,z:number)=>boolean}
/** Ambient actors are never network members, buyers or counted as human visitors. */
export function ambientVisitors(scene:Scene,visitor:()=>readonly number[]|null,world:World){
 let privateSpace=false,realCount=1,target=ambientBudget(1),age=0,revision=0;
 const texture=new DynamicTexture('virtual-visitor-label',{width:512,height:96},scene,false);texture.hasAlpha=true;
 let labelText='';function paintLabel(){labelText=t('가상 방문객');const ctx=texture.getContext() as CanvasRenderingContext2D;ctx.clearRect(0,0,512,96);ctx.fillStyle='#183f34dd';ctx.fillRect(4,6,504,84);ctx.font='32px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f6efda';ctx.fillText(labelText,256,62,476);texture.update();}paintLabel();
 const labelMaterial=new StandardMaterial('virtual-visitor-label',scene);labelMaterial.diffuseTexture=texture;labelMaterial.emissiveTexture=texture;labelMaterial.disableLighting=true;labelMaterial.backFaceCulling=false;
 const actors=ambientPlaces.map((place,i)=>{
  const body=visitorMesh(scene,'ambient-visitor-'+place.id);body.root.metadata={...body.root.metadata,ambientVisitor:true,id:place.id,place:place.place,role:place.role};
  const cloth=body.coat.material as StandardMaterial;cloth.diffuseColor=Color3.FromHexString(['#658380','#9a826b','#6c7890','#83738a','#a18e6a'][i%5]).toLinearSpace();
  for(const mesh of body.root.getChildMeshes()){mesh.isPickable=false;mesh.metadata={ambientVisitor:true};mesh.receiveShadows=false;}
  let x=place.x,z=place.z;
  if(world.blocked(x,world.floor(x,z),z)){
   const alternative=[[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].map(([dx,dz])=>[x+dx,z+dz]).find(([a,b])=>!world.blocked(a,world.floor(a,b),b));
   if(alternative)[x,z]=alternative;
  }
  const site={...place,x,z};
  body.root.position.set(x,world.floor(x,z)+(place.seatLift??(['prayer','meditation'].includes(place.role)?.06:0)),z);body.root.rotation.y=place.yaw;
  body.bow(0);
  const parts=body.root.getChildMeshes() as Mesh[];
  const label=MeshBuilder.CreatePlane('ambient-label-'+place.id,{width:1.8,height:.34},scene);label.material=labelMaterial;label.parent=body.root;label.position.y=place.role==='meditation'?1.35:1.98;label.billboardMode=Mesh.BILLBOARDMODE_ALL;label.isPickable=false;label.setEnabled(false);
  return{body,parts,label,place:site,fade:0,desired:i!==2,time:i*2.7,timeUpdated:0,until:0,stops:visitorJourney(site),stop:0,elapsed:Math.min(7,i*.71),route:[] as WalkPoint[],next:0,travelling:false,wait:0,steps:0,skipped:0,completed:0,skipOffset:1};
 });
 function publish(){scene.metadata??={};scene.metadata.ambientPopulation={realCount,target,active:actors.filter(a=>a.desired).length,capacity:20,revision:++revision};}
 function population(event:Event){const value=(event as CustomEvent<{count:number}>).detail?.count;if(!Number.isSafeInteger(value)||value<1)return;realCount=value;const next=ambientBudget(value);if(next===target){publish();return;}target=next;
  const p=visitor();const sorted=[...actors].sort((a,b)=>Number(b.desired)-Number(a.desired)||(p?Math.hypot(a.body.root.position.x-p[0],a.body.root.position.z-p[2])-Math.hypot(b.body.root.position.x-p[0],b.body.root.position.z-p[2]):a.place.id.localeCompare(b.place.id)));
  for(const[aIndex,a]of sorted.entries())a.desired=aIndex<target;publish();
 }
 function space(event:Event){privateSpace=(event as CustomEvent).detail==='private';if(privateSpace)for(const a of actors)a.body.root.setEnabled(false);}
 window.addEventListener('sasa:population',population);window.addEventListener('sasa:space',space);publish();
 const observer=scene.onBeforeRenderObservable.add(()=>{
  if(privateSpace||document.hidden)return;if(labelText!==t('가상 방문객'))paintLabel();const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);age+=dt;const p=visitor(),camera=scene.activeCamera;if(!camera)return;
  for(const a of actors){
   a.fade=Math.max(0,Math.min(1,a.fade+(a.desired?dt:-dt)*.8));a.body.root.setEnabled(a.fade>0);if(!a.fade)continue;
   const distance=Math.hypot(camera.globalPosition.x-a.body.root.position.x,camera.globalPosition.z-a.body.root.position.z);
   for(const mesh of a.parts){mesh.isVisible=true;mesh.visibility=a.fade;}
   a.label.setEnabled(distance<7&&!document.querySelector('dialog[open]'));a.label.visibility=a.fade;
   if(age<a.until)continue;const step=Math.min(.3,age-a.timeUpdated);a.timeUpdated=age;a.until=age+(distance<35?.04:.12);a.time+=step;
   const stop=a.stops[a.stop],position=a.body.root.position;let moving=false,yielding=false;
   const canStep=(from:WalkPoint,to:WalkPoint)=>{const y=world.floor(to[0],to[1]);return Math.abs(y-world.floor(from[0],from[1]))<=.36&&!world.blocked(to[0],y,to[1]);};
   if(!a.travelling){
    a.elapsed+=step;const delta=Math.atan2(Math.sin(stop.yaw-a.body.root.rotation.y),Math.cos(stop.yaw-a.body.root.rotation.y));a.body.root.rotation.y+=delta*(1-Math.exp(-step*4));
    if(a.elapsed>=stop.seconds&&a.stops.length>1){
     a.next=(a.stop+a.skipOffset)%a.stops.length;const goal=a.stops[a.next];a.route=walkingPath([position.x,position.z],[goal.x,goal.z],canStep,.65,2500);a.elapsed=0;
     if(a.route.length){a.travelling=true;a.wait=0;a.skipOffset=1;}else{a.skipped++;a.skipOffset=a.skipOffset+1<a.stops.length?a.skipOffset+1:1;a.elapsed=Math.max(0,stop.seconds-2);/* Stay at the last safe stop; never pretend an unreachable destination was reached. */}
    }
   }
   if(a.travelling){
    const target=a.route[0],dx=target[0]-position.x,dz=target[1]-position.z,length=Math.hypot(dx,dz),travel=Math.min(length,visitorWalkSpeed*step),x=position.x+dx/Math.max(.0001,length)*travel,z=position.z+dz/Math.max(.0001,length)*travel;
    yielding=!!p&&Math.hypot(p[0]-x,p[2]-z)<.90||actors.some(other=>other!==a&&other.desired&&Math.hypot(x-other.body.root.position.x,z-other.body.root.position.z)<.70);
    if(!yielding&&canStep([position.x,position.z],[x,z])){
     position.set(x,world.floor(x,z),z);a.steps+=travel;a.wait=0;moving=travel>.0001;
     const yaw=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(yaw-a.body.root.rotation.y),Math.cos(yaw-a.body.root.rotation.y));a.body.root.rotation.y+=delta*(1-Math.exp(-step*7));
     if(length<=travel+.015)a.route.shift();
     if(!a.route.length){a.stop=a.next;a.elapsed=0;a.travelling=false;a.completed++;}
    }else{a.wait+=step;if(a.wait>2.5){
     const goal=a.stops[a.next],avoid=(from:WalkPoint,to:WalkPoint)=>canStep(from,to)&&(!p||Math.hypot(to[0]-p[0],to[1]-p[2])>.95)&&!actors.some(other=>other!==a&&other.desired&&Math.hypot(to[0]-other.body.root.position.x,to[1]-other.body.root.position.z)<.76);
     const detour=walkingPath([position.x,position.z],[goal.x,goal.z],avoid,.65,1500);if(detour.length)a.route=detour;a.wait=0;
    }}
   }
   const current=a.stops[a.stop],pose=stopPose(current,a.elapsed);
   a.body.bow(0);a.body.chest.scaling.y=1;a.body.chest.rotation.z=0;
   let activity='산책';
   if(moving){
    const stride=(reducedMotion()?.16:.38)*Math.sin(a.steps*6.4);
    for(let i=0;i<2;i++){a.body.legs[i].rotation.x=(i?1:-1)*stride;a.body.shins[i].rotation.x=Math.max(0,(i?-1:1)*stride)*.75;a.body.arms[i].rotation.x=(i?-1:1)*stride*.75;}
   }else if(a.travelling){activity='길을 양보하는 중';a.body.head.rotation.y=.18*Math.sin(a.time*.7);}
   else{
    activity={prayer:'참배',meditation:'명상',lantern:'연등 감상',wish:'소원 빌기',look:'주변 감상',rest:'휴식',stretch:'스트레칭'}[current.action];
    if(current.action==='meditation')privateMeditationPose(a.body,pose.seated,a.time);
    else if(current.action==='prayer'||current.action==='wish')a.body.bow(pose.bow);
    else if(current.action==='stretch')for(let i=0;i<2;i++){a.body.arms[i].rotation.z=(i?-1:1)*(.1+.85*pose.gesture);a.body.forearms[i].rotation.x=-.25*pose.gesture;}
    else if(current.action==='lantern'){
     a.body.head.rotation.x=-.36*pose.gesture;a.body.arms[1].rotation.x=-.95*pose.gesture;a.body.forearms[1].rotation.x=-.65*pose.gesture;
    }else{a.body.chest.rotation.x=.06*pose.gesture;a.body.head.rotation.x=current.action==='look'?.1:0;}
    a.body.head.rotation.y=reducedMotion()?0:.20*Math.sin(a.time*.65);
    position.y=world.floor(position.x,position.z)+(current.seatLift??0)*(current.action==='meditation'?pose.seated:1);
   }
   a.body.root.metadata={...a.body.root.metadata,activity,phase:a.time,walking:moving,destination:a.next,journeyStop:a.stop,metresWalked:a.steps,completedStops:a.completed,skippedStops:a.skipped};

  }
 });
 scene.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(observer);window.removeEventListener('sasa:population',population);window.removeEventListener('sasa:space',space);});
 return{get count(){return actors.filter(a=>a.desired).length;},obstacles(){return actors.filter(a=>a.desired&&a.fade>.5).map(a=>({x:a.body.root.position.x,z:a.body.root.position.z,radius:.30}));}};
}
