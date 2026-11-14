import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {visitorMesh} from './walking';
import {privateMeditationPose} from './private-practice';
import {ambientPlaces,ambientBudget,ambientWalk,ambientActivity} from './ambient-layout';
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
  if(place.role==='meditation')privateMeditationPose(body,1,i);else body.bow(place.role==='prayer'?.07:0);
  body.root.computeWorldMatrix(true);
  const parts=body.root.getChildMeshes() as Mesh[];for(const m of parts)m.computeWorldMatrix(true);
  // A baked pose reduces distant actor draw calls while retaining the same model/materials.
  const distant=Mesh.MergeMeshes(parts,false,true,undefined,false,true)!;distant.name='ambient-distant-'+place.id;distant.setParent(body.root);distant.isPickable=false;distant.metadata={ambientVisitor:true};distant.setEnabled(false);
  const label=MeshBuilder.CreatePlane('ambient-label-'+place.id,{width:1.8,height:.34},scene);label.material=labelMaterial;label.parent=body.root;label.position.y=place.role==='meditation'?1.35:1.98;label.billboardMode=Mesh.BILLBOARDMODE_ALL;label.isPickable=false;label.setEnabled(false);
  return{body,parts,distant,label,place:site,fade:0,desired:i!==2,time:i*2.7,timeUpdated:0,until:0};
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
   const distance=Math.hypot(camera.globalPosition.x-a.body.root.position.x,camera.globalPosition.z-a.body.root.position.z),near=distance<65;
   for(const mesh of a.parts){mesh.isVisible=near;mesh.visibility=a.fade;}a.distant.setEnabled(!near);a.distant.visibility=a.fade;
   const labelNear=near&&distance<9&&!document.querySelector('dialog[open]');a.label.setEnabled(labelNear);a.label.visibility=a.fade;
   if(age<a.until)continue;
   const step=Math.min(.5,age-a.timeUpdated);a.timeUpdated=age;a.until=age+(distance<30?.05:.2);
   const yielding=!!p&&Math.hypot(p[0]-a.body.root.position.x,p[2]-a.body.root.position.z)<1.5;
   const previousTime=a.time;a.time+=step;let f=ambientWalk(a.place,a.time),stopped=false;
   if(a.place.role==='walk'){
    const y=world.floor(f.x,f.z);if(!yielding&&!world.blocked(f.x,y,f.z)&&!actors.some(other=>other!==a&&other.desired&&Math.hypot(f.x-other.body.root.position.x,f.z-other.body.root.position.z)<.75)){
     a.body.root.position.set(f.x,y,f.z);
     const delta=Math.atan2(Math.sin(f.yaw-a.body.root.rotation.y),Math.cos(f.yaw-a.body.root.rotation.y));a.body.root.rotation.y+=delta*(1-Math.exp(-step*5));
    }else{a.time=previousTime;f=ambientWalk(a.place,a.time);stopped=true;}
   }
   const activity=ambientActivity(a.place,a.time);
   a.body.root.metadata={...a.body.root.metadata,activity:stopped?'잠시 양보':activity.action,phase:a.time,walking:f.walking&&!stopped};
   if(!near)continue;
   a.body.bow(0);a.body.chest.scaling.y=1;a.body.chest.rotation.z=0;
   if(activity.pose==='bow')a.body.bow(activity.progress);
   else if(activity.pose==='meditation')privateMeditationPose(a.body,1,a.time);
   else if(activity.pose==='walk'&&!stopped){
    const stride=(reducedMotion()?.10:.25)*Math.sin(a.time*3.8);
    for(let i=0;i<2;i++){a.body.legs[i].rotation.x=(i?1:-1)*stride;a.body.shins[i].rotation.x=Math.max(0,(i?-1:1)*stride)*.7;a.body.arms[i].rotation.x=(i?-1:1)*stride*.6;}
    a.body.hips.position.y+=reducedMotion()?0:.006*Math.sin(a.time*7.6);
   }else if(activity.pose==='stretch'){
    const amount=reducedMotion()?.3:1;for(let i=0;i<2;i++){a.body.arms[i].rotation.z=(i?-1:1)*(.15+activity.gesture*.75)*amount;a.body.forearms[i].rotation.x=-.2*activity.gesture;}
    a.body.chest.rotation.z=(reducedMotion()?0:.055)*Math.sin(a.time*.35)*activity.gesture;
   }else{
    a.body.chest.rotation.x=activity.gesture*.055;
    if(activity.action==='연등 감상'){a.body.arms[1].rotation.x=-.65*activity.gesture;a.body.forearms[1].rotation.x=-.65*activity.gesture;}
   }
   a.body.head.rotation.x+=activity.pitch*(reducedMotion()?.4:1);a.body.head.rotation.y=reducedMotion()?0:.15*Math.sin(a.time*.32);

  }
 });
 scene.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(observer);window.removeEventListener('sasa:population',population);window.removeEventListener('sasa:space',space);});
 return{get count(){return actors.filter(a=>a.desired).length;},obstacles(){return actors.filter(a=>a.desired&&a.fade>.5).map(a=>({x:a.body.root.position.x,z:a.body.root.position.z,radius:.30}));}};
}
