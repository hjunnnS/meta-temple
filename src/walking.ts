import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { templePlaces } from './temple-layout.ts';
import { insideGround } from './temple-terrain.ts';

export const visitorSize={height:1.7,width:.65} as const;

/** Snapshot the walk surfaces and solids before the scene batches them by material. */
export function pedestrianWorld(parts:Mesh[]){
 type Rect={x0:number;x1:number;z0:number;z1:number;top:number;bottom:number};
 const surfaces:Rect[]=[],solids:Rect[]=[],ceilings:Rect[]=[];
 for(const part of parts){
  const surface=/(^|-)(step|plinth|hall-floor|floorboard|court|paving|base|stone)$/.test(part.name);
  const solid=/(^|-)(back-wall|side-wall|door-frame|column|pillar|gallery-rail|gallery-back|reception-counter|reception-front|altar-cabinet|memorial-altar|scripture-desk|rack-post|rack-footing|lamp-stand-plinth|bell-shell|meditation-tree)$/.test(part.name);
  const roof=/(curved-roof|cheonwang-roof|ilju-roof|bell-roof)$/.test(part.name);
  if(!surface&&!solid&&!roof)continue;
  part.computeWorldMatrix(true);
  const b=part.getBoundingInfo().boundingBox;
  const rect={x0:b.minimumWorld.x,x1:b.maximumWorld.x,z0:b.minimumWorld.z,z1:b.maximumWorld.z,top:b.maximumWorld.y,bottom:b.minimumWorld.y};
  if(roof)ceilings.push(rect);
  else if(solid)solids.push(rect);
  else if(rect.top<2.1)surfaces.push(rect);
 }
 const radius=visitorSize.width/2;
 function floor(x:number,z:number){
  let y=.01;
  for(const r of surfaces)if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)y=Math.max(y,r.top);
  return y;
 }
 function blocked(x:number,y:number,z:number){
  return !insideGround(x,z,radius)||solids.some(r=>x>r.x0-radius&&x<r.x1+radius&&z>r.z0-radius&&z<r.z1+radius&&y<r.top&&y+visitorSize.height>r.bottom);
 }
 function cameraLimit(target:Vector3,alpha:number,beta:number,length:number){
  const dx=Math.cos(alpha)*Math.sin(beta),dy=Math.cos(beta),dz=Math.sin(alpha)*Math.sin(beta);
  for(let d=.12;d<=length+.001;d+=.12){
   const x=target.x+dx*d,y=target.y+dy*d,z=target.z+dz*d;
   const intersects=(r:Rect)=>x>=r.x0-.1&&x<=r.x1+.1&&z>=r.z0-.1&&z<=r.z1+.1&&y>=r.bottom-.1&&y<=r.top+.1;
   if(y<floor(x,z)+.12||solids.some(intersects)||ceilings.some(intersects)||!insideGround(x,z,.1))return Math.max(.08,d-.14);
  }
  return length;
 }
 return {floor,blocked,cameraLimit};
}

export function visitorMesh(scene:Scene,name:string){
 const root=new TransformNode(name,scene);
 const fabric=new StandardMaterial(name+'-fabric',scene);fabric.diffuseColor=Color3.FromHexString('#57756b');fabric.specularColor=Color3.Black();
 const skin=new StandardMaterial(name+'-skin',scene);skin.diffuseColor=Color3.FromHexString('#bc866a');
 function capsule(label:string,height:number,radius:number,x:number,y:number,material:StandardMaterial){
  const mesh=MeshBuilder.CreateCapsule(name+label,{height,radius,tessellation:10},scene);
  mesh.position.set(x,y,0);mesh.parent=root;mesh.material=material;mesh.isPickable=false;return mesh;
 }
 capsule('head',.28,.125,0,1.56,skin);
 capsule('coat',.78,.221,0,1.04,fabric);
 for(const side of [-1,1])capsule('sleeve',.55,.082,side*.24,1.02,fabric);
 const legs=[-1,1].map(side=>capsule('leg',.78,.096,side*.11,.39,fabric));
 return {root,legs};
}

export function walkingController(scene:Scene,camera:ArcRotateCamera,canvas:HTMLCanvasElement,world:ReturnType<typeof pedestrianWorld>){
 const avatar=visitorMesh(scene,'visitor');
 avatar.root.position.set(0,world.floor(0,-65),-65);
 avatar.root.setEnabled(false);
 const keys=new Set<string>();
 const pad=document.querySelector<HTMLElement>('#walk-pad')!;
 const directions=new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
 let active=false,first=false,step=0,moving=false;
 const prayerButton=document.querySelector<HTMLButtonElement>('#prayer-point')!;
 const worshipHalls=templePlaces.filter(p=>p.id==='daeung'||p.id==='gwaneum'||p.id==='jijang');
 const prayerSites=worshipHalls.map(hall=>{
  const side=hall.id==='gwaneum'?-1:1;
  if(hall.id==='daeung')return {name:hall.name,x:hall.x,z:hall.z,radius:2.8,alpha:-Math.PI/2};
  return {name:hall.name,x:hall.x,z:hall.z-(side>0?1.125:0),radius:1.75,alpha:side>0?Math.PI:0};
 });
 let prayer:typeof prayerSites[number]|undefined;
 prayerButton.onclick=()=>{if(!prayer)return;camera.alpha=prayer.alpha;camera.beta=1.62;
  avatar.root.rotation.y=-Math.PI/2-prayer.alpha;canvas.focus();};
 const visitButton=document.querySelector<HTMLButtonElement>('#visit-point')!;
 const visitorSites=[
  {place:'office',dx:-1.4,dz:-1,radius:2.0,view:'officeReception',title:'종무소 접수 안내'},
  {place:'bell',dx:2.4,dz:0,radius:2.6,view:'bellDetail',title:'범종과 당목 살펴보기'},
  {place:'forest',dx:0,dz:0,radius:5,view:'forest',title:'명상숲에서 머무르기'},
 ].map(site=>{const place=templePlaces.find(p=>p.id===site.place)!;return {...site,x:place.x+site.dx,z:place.z+site.dz};});
 const switchView=document.querySelector<HTMLButtonElement>('#walk-camera')!;
 function changePerspective(on:boolean){
  first=on;avatar.root.setEnabled(active&&!first);
  switchView.textContent=first?'3인칭 보기':'1인칭 보기';switchView.setAttribute('aria-pressed',String(first));
  if(!first&&document.pointerLockElement===canvas)document.exitPointerLock();
 }
 switchView.onclick=()=>{
  changePerspective(!first);canvas.focus();
  if(first&&matchMedia('(pointer:fine)').matches&&canvas.requestPointerLock){
   Promise.resolve(canvas.requestPointerLock()).catch(()=>{/* Drag look remains available. */});
  }
 };
 document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&first)changePerspective(false);});
 canvas.addEventListener('keydown',e=>{if(e.key==='Escape'&&first)changePerspective(false);});
 function clear(){keys.clear();moving=false;}
 canvas.addEventListener('keydown',e=>{if(active&&directions.has(e.code)){e.preventDefault();keys.add(e.code);}});
 window.addEventListener('keyup',e=>keys.delete(e.code));
 canvas.addEventListener('blur',clear);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 for(const button of pad.querySelectorAll<HTMLButtonElement>('[data-key]')){
  const code=button.dataset.key!;
  button.onpointerdown=e=>{e.preventDefault();canvas.focus();button.setPointerCapture(e.pointerId);keys.add(code);};
  button.onlostpointercapture=()=>keys.delete(code);
 }
 const orbitKeys=camera.inputs.attached.keyboard;
 function mode(on:boolean){
  if(active===on)return;
  if(orbitKeys){if(on)camera.inputs.remove(orbitKeys);else camera.inputs.add(orbitKeys);}
  clear();active=on;pad.hidden=!on;changePerspective(false);
  camera.lowerRadiusLimit=on?.04:2.5;camera.upperBetaLimit=on?Math.PI-.06:2.15;camera.lowerBetaLimit=on?.06:.15;
  if(on){
   camera.setTarget(avatar.root.position.add(new Vector3(0,1.2,0)));
   camera.fov=.92;camera.alpha=-Math.PI/2;camera.beta=1.26;camera.radius=3.2;
   canvas.focus();
  }
 }
 function update(dt:number){
  moving=false;
  if(!active)return;
  const p=avatar.root.position;
  const nearby=visitorSites.find(site=>Math.hypot(p.x-site.x,p.z-site.z)<=site.radius);
  if(visitButton.dataset.view!==(nearby?.view??'')){
   visitButton.hidden=!nearby;visitButton.textContent=nearby?.title??'';visitButton.dataset.view=nearby?.view??'';
  }
  const nextPrayer=prayerSites.find(site=>Math.hypot(p.x-site.x,p.z-site.z)<=site.radius&&p.y>.8);
  if(prayer!==nextPrayer){
   prayer=nextPrayer;prayerButton.hidden=!prayer;prayerButton.textContent=prayer?prayer.name+' · 불단 바라보기':'';
  }
  const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const z=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  const length=Math.hypot(x,z);
  if(length && document.activeElement===canvas && !document.querySelector('dialog[open]')){
   const a=camera.alpha,scale=3.3*Math.min(.05,dt)/length;
   const dx=(x*-Math.sin(a)-z*Math.cos(a))*scale,dz=(x*Math.cos(a)-z*Math.sin(a))*scale;
   const ox=p.x,oz=p.z;
   function move(nx:number,nz:number){
    const y=world.floor(nx,nz);
    if(Math.abs(y-p.y)<=.50&&!world.blocked(nx,y,nz))p.set(nx,y,nz);
   }
   move(p.x+dx,p.z);move(p.x,p.z+dz);
   const distance=Math.hypot(p.x-ox,p.z-oz);
   moving=distance>.00001;
   if(moving){avatar.root.rotation.y=Math.atan2(p.x-ox,p.z-oz);step+=distance*4.8;}
   avatar.legs.forEach((leg,i)=>leg.rotation.x=distance>.00001?.35*Math.sin(step+i*Math.PI):0);
  }else avatar.legs.forEach(leg=>leg.rotation.x=0);
  camera.target.copyFromFloats(p.x,p.y+(first?1.56:1.2),p.z);
  camera.radius=first?.045:world.cameraLimit(camera.target,camera.alpha,camera.beta,3.2);
 }
 return {mode,update,get pose(){return {position:avatar.root.position.asArray(),yaw:avatar.root.rotation.y,animation:active&&moving?'walk':'idle'};},get position(){return active?avatar.root.position.asArray():null;}};
}
