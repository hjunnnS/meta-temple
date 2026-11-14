import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {visitorMesh} from './walking';
import {privateMeditationPose} from './private-practice';
import {ambientPlaces,ambientBudget,ambientWalk} from './ambient-layout';
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
  const body=visitorMesh(scene,'ambient-visitor-'+place.id);body.root.metadata={ambientVisitor:true,id:place.id,place:place.place,role:place.role};
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
  return{body,parts,distant,label,place:site,fade:0,desired:i!==2,time:i*2.7,until:0};
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
   const distance=Math.hypot(camera.globalPosition.x-a.body.root.position.x,camera.globalPosition.z-a.body.root.position.z),near=distance<38;
   for(const mesh of a.parts){mesh.isVisible=near;mesh.visibility=a.fade;}a.distant.setEnabled(!near);a.distant.visibility=a.fade;
   const labelNear=near&&distance<9&&!document.querySelector('dialog[open]');a.label.setEnabled(labelNear);a.label.visibility=a.fade;
   if(age<a.until)continue;a.until=age+(near?.05:.4);const step=near?.05:.4;
   const yielding=!!p&&Math.hypot(p[0]-a.body.root.position.x,p[2]-a.body.root.position.z)<1.5;
   const previousTime=a.time;if(!yielding)a.time+=step;const f=ambientWalk(a.place,a.time);
   if(a.place.role==='walk'){
    const y=world.floor(f.x,f.z);if(!yielding&&!world.blocked(f.x,y,f.z)&&!actors.some(other=>other!==a&&other.desired&&Math.hypot(f.x-other.body.root.position.x,f.z-other.body.root.position.z)<.7)){a.body.root.position.set(f.x,y,f.z);a.body.root.rotation.y=f.yaw;}else a.time=previousTime;
    if(near){a.body.bow(0);for(const[i,leg]of a.body.legs.entries())leg.rotation.x=f.walking&&!yielding?(reducedMotion()?.08:.24)*Math.sin(a.time*4+i*Math.PI):0;}
   }else if(near&&a.place.role==='prayer')a.body.bow(((a.time%18)>6&&(a.time%18)<13)?((a.time%18)-6)/7:.07);
   else if(near&&a.place.role==='meditation')privateMeditationPose(a.body,1,a.time);
   else if(near)a.body.head.rotation.y=reducedMotion()?0:.10*Math.sin(a.time*.4);
  }
 });
 scene.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(observer);window.removeEventListener('sasa:population',population);window.removeEventListener('sasa:space',space);});
 return{get count(){return actors.filter(a=>a.desired).length;},obstacles(){return actors.filter(a=>a.desired&&a.fade>.5).map(a=>({x:a.body.root.position.x,z:a.body.root.position.z,radius:.30}));}};
}
