import {touchStick,touchPinch} from './touch-controls';
import {practiceEvent} from './practice-events';
import {rearPrayerHalls,prayerHallPoint,prayerAisleX} from './prayer-halls.ts';
import {walkingPath,type WalkPoint} from './point-navigation';
import {pointInput} from './point-input';
import {privateMeditationPose} from './private-practice';
import {bellRinging} from './bell-ringing';
import type {furnishBell} from './temple-bell';
import {teaBreak} from './tea-break';
import {visitorFace} from './visitor-face';
import type {Face} from './face-types';
import {practiceSeat} from './hall-seats';
import {visitorRobe} from './visitor-robe';
import {bowPractice} from './bow-practice';
import {t} from './locales';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { templePlaces,courtPathLift } from './temple-layout.ts';
import {sweepingMonkSite} from './temple-terrain';
import { insideGround, insideBoundary, paving, eastCourts, personalGate } from './temple-terrain.ts';

export const visitorSize={height:1.7,width:.65} as const;

/** Snapshot the walk surfaces and solids before the scene batches them by material. */
export function pedestrianWorld(parts:Mesh[],npcObstacles:()=>readonly{x:number;z:number;radius:number}[]=()=>[]){
 type Rect={x0:number;x1:number;z0:number;z1:number;top:number;bottom:number;path?:boolean};
 // Walk on one plane per path, including the joints between decorative slabs.
 const surfaces:Rect[]=paving.map(({from,to,lanes})=>{
  const halfWidth=(lanes===1?1.54:3.8)/2;
  const acrossX=from[0]===to[0]?halfWidth:0;
  const acrossZ=from[1]===to[1]?halfWidth:0;
  return {x0:Math.min(from[0],to[0])-acrossX,x1:Math.max(from[0],to[0])+acrossX,
   z0:Math.min(from[1],to[1])-acrossZ,z1:Math.max(from[1],to[1])+acrossZ,top:.09,bottom:0,path:true};
 });
 const solids:Rect[]=[],ceilings:Rect[]=[],cameraSolids:Rect[]=[];
 for(const part of parts){
  const surface=part.name==='wish-garden-ground'||/(^|-)(step|plinth|hall-floor|floorboard|court|base)$/.test(part.name);
  const solid=/(^|-)(back-wall|side-wall|side-infill|door-frame|column|pillar|gallery-rail|gallery-back|reception-counter|reception-front|altar-cabinet|memorial-altar|scripture-desk|rack-post|rack-footing|lamp-stand-plinth|bell-shell|water-edge-stone|meditation-tree)$/.test(part.name);
  const roof=/(curved-roof|cheonwang-roof|ilju-roof|bell-roof|tea-pavilion-roof|personal-gate-roof|ceiling-inset|ceiling-runner|ceiling-crossbeam|ceiling-painted-beam)$/.test(part.name);
  const cameraOnly=/(^name-|sign|bracket|painted-beam|purlin|lintel|rafter|place-name)/.test(part.name);
  if(!surface&&!solid&&!roof&&!cameraOnly)continue;
  part.computeWorldMatrix(true);
  const b=part.getBoundingInfo().boundingBox;
  const rect={x0:b.minimumWorld.x,x1:b.maximumWorld.x,z0:b.minimumWorld.z,z1:b.maximumWorld.z,top:b.maximumWorld.y,bottom:b.minimumWorld.y};
  if(cameraOnly)cameraSolids.push(rect);
  if(roof)ceilings.push(rect);
  else if(solid)solids.push(rect);
  else if(surface&&rect.top<2.1)surfaces.push(rect);
 }
 const radius=visitorSize.width/2;
 // The large lotus pedestal is solid throughout, including gaps between its petals.
 const statue=eastCourts.buddha;
 const statueRadius=4.1;
 function withinStatue(x:number,y:number,z:number,padding:number){
  return y<16.5&&Math.hypot(x-statue.x,z-statue.z)<statueRadius+padding;
 }
 function floor(x:number,z:number){
  let y=.01;
  for(const r of surfaces)if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)y=Math.max(y,r.top+(r.path?courtPathLift(x,z):0));
  return y;
 }
 function blocked(x:number,y:number,z:number){
  return !insideGround(x,z,radius)||npcObstacles().some(n=>Math.hypot(x-n.x,z-n.z)<n.radius+radius)||Math.hypot(x-sweepingMonkSite.x,z-sweepingMonkSite.z)<.42+radius||withinStatue(x,y,z,radius)||solids.some(r=>x>r.x0-radius&&x<r.x1+radius&&z>r.z0-radius&&z<r.z1+radius&&y<r.top&&y+visitorSize.height>r.bottom);
 }
 function cameraLimit(target:Vector3,alpha:number,beta:number,length:number){
  const dx=Math.cos(alpha)*Math.sin(beta),dy=Math.cos(beta),dz=Math.sin(alpha)*Math.sin(beta);
  for(let d=.12;d<=length+.001;d+=.12){
   const x=target.x+dx*d,y=target.y+dy*d,z=target.z+dz*d;
   const intersects=(r:Rect)=>x>=r.x0-.1&&x<=r.x1+.1&&z>=r.z0-.1&&z<=r.z1+.1&&y>=r.bottom-.1&&y<=r.top+.1;
   if(y<floor(x,z)+.12||withinStatue(x,y,z,.1)||solids.some(intersects)||ceilings.some(intersects)||cameraSolids.some(intersects)||!insideBoundary(x,z,.1))return Math.max(.08,d-.14);
  }
  return length;
 }
 return {floor,blocked,cameraLimit};
}

export function visitorMesh(scene:Scene,name:string,monk=false){
 const root=new TransformNode(name,scene);
 const fabric=new StandardMaterial(name+'-fabric',scene);fabric.diffuseColor=Color3.FromHexString('#57756b');fabric.specularColor=Color3.Black();
 const skin=new StandardMaterial(name+'-skin',scene);skin.diffuseColor=Color3.FromHexString('#e6bd8b');
 function capsule(label:string,height:number,radius:number,x:number,y:number,material:StandardMaterial){
  const mesh=MeshBuilder.CreateCapsule(name+label,{height,radius,tessellation:10},scene);
  mesh.position.set(x,y,0);mesh.parent=root;mesh.material=material;mesh.isPickable=false;return mesh;
 }
 function joint(label:string,parent:TransformNode,x:number,y:number,z=0){
  const node=new TransformNode(name+label,scene);node.parent=parent;node.position.set(x,y,z);return node;
 }
 const hips=joint('hips',root,0,.63),chest=joint('chest',hips,0,0);
 function part(label:string,parent:TransformNode,height:number,radius:number,y:number,material:StandardMaterial){
  const mesh=capsule(label,height,radius,0,y,material);mesh.parent=parent;return mesh;
 }
 let face:Face="human";
 const head=new TransformNode("visitor face joint",scene);head.parent=chest;
 let model=visitorFace(scene,head,face,monk);
 function setFace(next:Face){
  if(next===face)return;
  const replacement=visitorFace(scene,head,next,monk);model.dispose(false,true);model=replacement;face=next;
 }
 head.position.y=.73;head.scaling.setAll(1.18);
 hips.scaling.set(1,.9,1);
 const coat=MeshBuilder.CreateLathe('everyday jacket',{shape:[[0,-.07],[.23,-.07],[.235,-.04],[.205,.27],[.22,.40],[.185,.47],[.12,.51],[0,.51]].map(([r,y])=>new Vector3(r,y,0)),tessellation:32},scene);
 coat.parent=chest;coat.scaling.z=.79;coat.material=fabric;coat.isPickable=false;
 const binding=new StandardMaterial(name+'-coat-trim',scene);binding.diffuseColor=Color3.FromHexString('#c8bc98');binding.specularColor=Color3.Black();
 for(const side of [-1,1]){
  const lapel=MeshBuilder.CreateTube('jacket collar',{path:[new Vector3(side*.106,.486,.087),new Vector3(side*.071,.44,.182),new Vector3(.015,.381,.208)],radius:.012,tessellation:8},scene);
  lapel.parent=coat;lapel.material=binding;lapel.isPickable=false;
 }
 for(const height of [.30,.20,.10]){
  const knot=capsule('cloth button',.025,.012,.015,height,binding);
  knot.parent=coat;knot.position.z=.217;knot.scaling.x=1.6;
 }
 const trousers=new StandardMaterial(name+'-trousers',scene);trousers.diffuseColor=Color3.FromHexString('#474e50');trousers.specularColor=Color3.Black();
 const hands:Mesh[]=[];
 const legs:TransformNode[]=[],shins:TransformNode[]=[],arms:TransformNode[]=[],forearms:TransformNode[]=[],sleeves:Mesh[]=[];
 for(const side of [-1,1]){
  const hip=joint('hip',hips,side*.11,0),knee=joint('knee',hip,0,-.35);
  part('thigh',hip,.42,.099,-.175,trousers);part('shin',knee,.43,.089,-.175,trousers);
  const foot=part('shoe',knee,.16,.084,-.45,trousers);foot.scaling.set(1.13,.9,1.58);foot.position.z=.034;
  hip.scaling.y=hip.scaling.z=.79;
  legs.push(hip);shins.push(knee);
  const shoulder=joint('shoulder',chest,side*.203,.41),elbow=joint('elbow',shoulder,0,-.255);
  sleeves.push(part('sleeve',shoulder,.32,.087,-.125,fabric));
  sleeves.push(part('cuff',elbow,.28,.071,-.11,fabric));
  hands.push(part('hand',elbow,.14,.056,-.25,skin));
  arms.push(shoulder);forearms.push(elbow);
 }
 function ease(phase:number,start:number,end:number){
  const u=Math.min(1,Math.max(0,(phase-start)/(end-start)));return u*u*(3-2*u);
 }
 function bow(phase:number){
  // Give the hands time to take weight before lowering the forehead.
  const joined=ease(phase,0,.105)*(1-ease(phase,.89,1));
  const kneel=ease(phase,.13,.36)*(1-ease(phase,.76,.90));
  const fold=ease(phase,.33,.51)*(1-ease(phase,.59,.75));
  const planted=ease(phase,.29,.42)*(1-ease(phase,.70,.79));
  const thigh=-1.48*kneel,shin=1.59*kneel;
  // Keep the shoe centre over its standing contact as the two leg segments fold.
  hips.position.y=.63+.9*.79*(.35*(Math.cos(thigh)-1)+.45*(Math.cos(shin)-1)+.034*Math.sin(shin));
  hips.position.z=.79*(.35*Math.sin(thigh)+.45*Math.sin(shin)+.034*(1-Math.cos(shin)));
  chest.rotation.x=.20*kneel+1.15*fold;
  head.rotation.x=.09*joined+.66*fold;
  for(let i=0;i<2;i++){
   legs[i].rotation.x=thigh;shins[i].rotation.x=shin-thigh;
   const side=i===0?-1:1,arm=arms[i],elbow=forearms[i];
   if(!joined){
    arm.rotationQuaternion=null;elbow.rotationQuaternion=null;
    arm.rotation.setAll(0);elbow.rotation.setAll(0);hands[i].scaling.setAll(1);continue;
   }
   const shoulder=arm.position;
   const target=Vector3.Lerp(new Vector3(shoulder.x,shoulder.y-.502,0),new Vector3(side*.047,.38,.245),joined);
   // Convert the stationary cushion contact into the rotating chest frame.
   const pitch=chest.rotation.x,dy=(.052-hips.position.y)/hips.scaling.y,dz=.76-hips.position.z;
   const ground=new Vector3(side*.235,dy*Math.cos(pitch)+dz*Math.sin(pitch),dz*Math.cos(pitch)-dy*Math.sin(pitch));
   Vector3.LerpToRef(target,ground,planted,target);
   const axis=target.subtract(shoulder),length=Math.min(.504,axis.length());
   axis.normalize();
   const hint=new Vector3(side*.70,-.85,-.12);
   const bend=hint.subtract(axis.scale(Vector3.Dot(hint,axis))).normalize();
   const upper=.255,lower=.25,along=(upper*upper-lower*lower+length*length)/(2*length);
   const elbowOffset=axis.scale(along).add(bend.scale(Math.sqrt(Math.max(0,upper*upper-along*along))));
   const forearm=axis.scale(length).subtract(elbowOffset);
   const upperQ=Quaternion.Identity(),lowerQ=Quaternion.Identity();
   Quaternion.FromUnitVectorsToRef(Vector3.Down(),elbowOffset.normalize(),upperQ);
   Quaternion.FromUnitVectorsToRef(Vector3.Down(),forearm.normalize(),lowerQ);
   arm.rotationQuaternion=upperQ;elbow.rotationQuaternion=upperQ.conjugate().multiply(lowerQ);
   hands[i].scaling.set(1,1-.19*planted,1+.15*planted);
  }
 }
 return {root,hips,head,legs,shins,arms,forearms,hands,chest,coat,sleeves,bow,setFace,get face(){return face;}};
}

export function walkingController(scene:Scene,camera:ArcRotateCamera,canvas:HTMLCanvasElement,world:ReturnType<typeof pedestrianWorld>,bellVisual:ReturnType<typeof furnishBell>){
 const avatar=visitorMesh(scene,'visitor');
 avatar.root.position.set(0,world.floor(0,-65),-65);
 avatar.root.setEnabled(false);
 const keys=new Set<string>();let route:WalkPoint[]=[];let stuck=0;
 const pad=document.querySelector<HTMLElement>('#walk-pad')!;
 const directions=new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
 let active=false,first=false,step=0,moving=false;
 let followDistance=3.2,firstPersonFov=.92;
 const stick=touchStick(canvas,'public-touch-stick');
 const pointers=camera.inputs.attached.pointers as unknown as {onMultiTouch:()=>void;onTouch:(...args:unknown[])=>void};pointers.onMultiTouch=()=>{};const orbitTouch=pointers.onTouch.bind(pointers);pointers.onTouch=(...args)=>{if(canvas.dataset.touchPinch!=='true')orbitTouch(...args);};
 touchPinch(canvas,factor=>{camera.inertialAlphaOffset=0;camera.inertialBetaOffset=0;if(!active){camera.radius=Math.max(2.5,Math.min(420,camera.radius*factor));return;}if(first){firstPersonFov=Math.max(.42,Math.min(1.15,firstPersonFov*factor));camera.fov=firstPersonFov;}else followDistance=Math.max(.85,Math.min(11,followDistance*factor));},()=>!document.body.classList.contains('in-private-room'));

 canvas.addEventListener('wheel',event=>{
  if(!active)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const unit=event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1;
  const factor=Math.exp(Math.max(-.45,Math.min(.45,event.deltaY*unit*.002)));
  if(first){
   firstPersonFov=Math.max(.42,Math.min(1.15,firstPersonFov*factor));
   camera.fov=firstPersonFov;
  }else{
   followDistance=Math.max(.85,Math.min(11,followDistance*factor));
  }
 },{capture:true,passive:false});
 const prayerButton=document.querySelector<HTMLButtonElement>('#prayer-point')!;
 const worshipHalls=templePlaces.filter(p=>p.id==='daeung'||p.id==='gwaneum'||p.id==='jijang');
 const prayerSites=[...worshipHalls.map(hall=>{
  const side=hall.id==='gwaneum'?-1:1;
  if(hall.id==='daeung')return {name:hall.name,x:hall.x,z:hall.z,radius:2.8,alpha:-Math.PI/2};
  return {name:hall.name,x:hall.x,z:hall.z-(side>0?1.125:0),radius:1.75,alpha:side>0?Math.PI:0};
 }),...rearPrayerHalls.map(hall=>{const [x,z]=prayerHallPoint(hall,prayerAisleX,-1.1);return {name:hall.name,x,z,radius:1.6,alpha:-Math.PI/2-hall.yaw};})];
 let prayer:typeof prayerSites[number]|undefined;
 const practicing=import.meta.env.MODE==='service';
 let worship=false,elapsed=0,meditating=false,meditationTime=0,practiceSerial=0,worshipRun='',meditationRun='';
 const meditationStop=document.createElement('button'),meditationStatus=document.createElement('output');meditationStop.id='meditation-stop';meditationStop.hidden=true;meditationStop.textContent=t('수행 마치기');meditationStatus.id='meditation-status';meditationStatus.hidden=true;meditationStatus.setAttribute('aria-live','off');pad.append(meditationStatus,meditationStop);
 function finishMeditation(){const old=meditationRun;meditationRun='';const completed=meditationTime>=10;meditating=false;meditationStop.hidden=true;meditationStatus.hidden=true;for(const leg of [...avatar.legs,...avatar.shins]){leg.rotationQuaternion=null;leg.rotation.setAll(0);}avatar.chest.scaling.y=1;avatar.bow(0);if(old)practiceEvent({kind:'meditation',status:completed?'completed':'cancelled',id:old});}
 meditationStop.onclick=()=>{finishMeditation();canvas.focus();};
 function finishWorship(){
  const old=worshipRun;worshipRun='';if(old)practiceEvent({kind:'bow',status:'cancelled',id:old});
  finishMeditation();worship=false;elapsed=0;avatar.bow(0);avatar.root.rotation.x=0;
  for(const arm of avatar.arms)arm.rotation.set(0,0,0);
  prayerButton.textContent=prayer?t(prayer.name)+' · '+t(practicing?'참배 시작':'불단'):'';
 }
 const bows=bowPractice(scene,avatar.root.position,()=>{
  if(!prayer)return;
  if(prayer.name==='대웅전')avatar.root.position.set(practiceSeat.x,world.floor(practiceSeat.x,practiceSeat.z)+.088,practiceSeat.z);
  finishWorship();camera.alpha=prayer.alpha;camera.beta=1.48;
  avatar.root.rotation.y=-Math.PI/2-prayer.alpha;canvas.focus();
 },avatar.bow);
 prayerButton.onclick=()=>{
  if(!prayer)return;
  if(bows.active)bows.cancel();
  if(worship){finishWorship();canvas.focus();return;}
  if(practicing&&prayer.name==='대웅전')avatar.root.position.set(practiceSeat.x,world.floor(practiceSeat.x,practiceSeat.z)+.088,practiceSeat.z);
  camera.alpha=prayer.alpha;camera.beta=1.62;avatar.root.rotation.y=-Math.PI/2-prayer.alpha;
  if(practicing){worship=true;elapsed=0;worshipRun='guide-bow-'+(++practiceSerial);prayerButton.textContent=t('참배 마치기');practiceEvent({kind:'bow',status:'started',id:worshipRun,place:prayer.name});}
  canvas.focus();
 };
 const visitButton=document.querySelector<HTMLButtonElement>('#visit-point')!;
 const visitorSites=[
  {place:'office',dx:0,dz:3,radius:2.7,view:'officeReception',title:'종무소 접수 안내'},
  {place:'bell',dx:0,dz:0,radius:5,view:'bellDetail',title:'범종과 당목 살펴보기'},
  {place:'forest',dx:0,dz:0,radius:5,view:'forest',title:'명상숲에서 머무르기'},
 ].map(site=>{const place=templePlaces.find(p=>p.id===site.place)!;return {...site,x:place.x+site.dx,z:place.z+site.dz};});
 const switchView=document.querySelector<HTMLButtonElement>('#walk-camera')!;
 function changePerspective(on:boolean){
  first=on;if(active)camera.fov=on?firstPersonFov:.92;avatar.root.setEnabled(active&&!first);
  switchView.textContent=t(first?'3인칭 보기':'1인칭 보기');switchView.setAttribute('aria-pressed',String(first));
  if(!first&&document.pointerLockElement===canvas)document.exitPointerLock();
 }
 const robe=visitorRobe(scene,avatar);
 const robeButton=document.querySelector<HTMLButtonElement>('#walk-robe')!;
 robeButton.onclick=()=>{
  if(first)changePerspective(false);
  robeButton.disabled=true;
  robe.change(!robe.wearing,()=>{
   robeButton.textContent=t(robe.wearing?'평상복 입기':'법복 입기');
   robeButton.setAttribute('aria-pressed',String(robe.wearing));robeButton.disabled=false;
  });
  canvas.focus();
 };
 switchView.onclick=()=>{
  changePerspective(!first);canvas.focus();
  if(first&&!tea.seated&&matchMedia('(pointer:fine)').matches&&canvas.requestPointerLock){
   Promise.resolve(canvas.requestPointerLock()).catch(()=>{/* Drag look remains available. */});
  }
 };
 document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&first)changePerspective(false);});
 canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){route=[];canvas.dataset.pointWalk='idle';}if(e.key==='Escape'&&bows.active)bows.cancel();if(e.key==='Escape'&&worship)finishWorship();if(e.key==='Escape'&&meditating)finishMeditation();if(e.key==='Escape'&&first)changePerspective(false);if(e.key==='Escape'&&tea.seated)tea.stop();if(e.key==='Escape'&&bell.active)bell.cancel();});
 function clear(){stick.reset();keys.clear();moving=false;route=[];canvas.dataset.pointWalk='idle';}
 canvas.addEventListener('keydown',e=>{if(active&&directions.has(e.code)){e.preventDefault();route=[];keys.add(e.code);}});
 window.addEventListener('keyup',e=>keys.delete(e.code));
 canvas.addEventListener('blur',clear);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 for(const button of pad.querySelectorAll<HTMLButtonElement>('[data-key]')){
  const code=button.dataset.key!;
  button.onpointerdown=e=>{e.preventDefault();canvas.focus();button.setPointerCapture(e.pointerId);keys.add(code);};
  button.onlostpointercapture=()=>keys.delete(code);
 }
 const tea=teaBreak(scene,avatar,canvas);
 const bell=bellRinging(scene,avatar,canvas,bellVisual,()=>{
  if(bows.active)bows.cancel();finishWorship();tea.stop();changePerspective(false);camera.alpha=.2;camera.beta=1.35;
 });
 pointInput(scene,canvas,()=>active,point=>{
  const p=avatar.root.position;if(Math.abs(point[1]-world.floor(point[0],point[2]))>.35||world.blocked(point[0],world.floor(point[0],point[2]),point[2]))return;
  route=walkingPath([p.x,p.z],[point[0],point[2]],(a,b)=>Math.abs(world.floor(a[0],a[1])-world.floor(b[0],b[1]))<=.5&&!world.blocked(b[0],world.floor(b[0],b[1]),b[1]));stuck=0;canvas.dataset.pointWalk=route.length?'moving':'idle';
 });
 const orbitKeys=camera.inputs.attached.keyboard;
 function mode(on:boolean){
  if(!on){bows.show(false);tea.hide();bell.cancel();}
  if(!on&&worship)finishWorship();if(!on&&meditating)finishMeditation();
  if(active===on)return;
  if(orbitKeys){if(on)camera.inputs.remove(orbitKeys);else camera.inputs.add(orbitKeys);}
  clear();active=on;pad.hidden=!on;changePerspective(false);
  camera.lowerRadiusLimit=on?.04:2.5;camera.upperBetaLimit=on?Math.PI-.06:2.15;camera.lowerBetaLimit=on?.06:.15;
  if(on){
   camera.setTarget(avatar.root.position.add(new Vector3(0,1.2,0)));
   camera.fov=.92;camera.alpha=-Math.PI/2;camera.beta=1.26;camera.radius=followDistance;
   canvas.focus();
  }
 }
 function frameBellCamera(){
  const p=avatar.root.position,yaw=avatar.root.rotation.y;
  camera.target.copyFromFloats(p.x+1.8*Math.sin(yaw),p.y+1.65,p.z+1.8*Math.cos(yaw));
  camera.radius=world.cameraLimit(camera.target,camera.alpha,camera.beta,6.6);
 }
 function update(dt:number){
  stick.show(active&&!document.body.classList.contains('in-private-room')&&!document.querySelector('#private-room-controls:not([hidden])'));
  moving=false;
  if(!active){bell.update(false,dt,false);return;}
  const practiceMode=bows.active?'108':meditating?'meditation':worship?'bow':'idle';if(pad.dataset.practice!==practiceMode)pad.dataset.practice=practiceMode;
  const p=avatar.root.position;
  const nearby=visitorSites.find(site=>Math.hypot(p.x-site.x,p.z-site.z)<=site.radius);
  if(visitButton.dataset.view!==(nearby?.view??'')){
   visitButton.hidden=!nearby;visitButton.textContent=t(nearby?.title??'');visitButton.dataset.view=nearby?.view??'';
  }
  const nextPrayer=prayerSites.find(site=>Math.hypot(p.x-site.x,p.z-site.z)<=site.radius&&p.y>.8);
  if(prayer!==nextPrayer){
   prayer=nextPrayer;prayerButton.hidden=!prayer;finishWorship();
  }
  bows.show(practicing&&!!prayer);
  let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.vector.x;
  let z=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))+stick.vector.z;
  if(x||z)route=[];while(route.length&&Math.hypot(p.x-route[0][0],p.z-route[0][1])<.18)route.shift();
  const auto=route[0]?[route[0][0]-p.x,route[0][1]-p.z]:null;
  const length=auto?Math.hypot(...auto):Math.hypot(x,z);if(!route.length)canvas.dataset.pointWalk='idle';
  if(length&&bows.active)bows.cancel();
  if(length&&meditating)finishMeditation();
  if(meditating){meditationTime+=Math.min(.1,dt);privateMeditationPose(avatar,Math.min(1,meditationTime),meditationTime);const time=String(Math.floor(meditationTime/60)).padStart(2,'0')+':'+String(Math.floor(meditationTime%60)).padStart(2,'0');if(meditationStatus.textContent!==time)meditationStatus.textContent=time;}
  bows.update(dt);
  if(bell.update(active,dt,!!length)){
   frameBellCamera();return;
  }
  if(tea.update(active,dt,!!length)){
   camera.target.copyFromFloats(p.x,p.y+(first?1.48:1.35),p.z);
   camera.radius=first?.045:world.cameraLimit(camera.target,camera.alpha,camera.beta,followDistance);
   return;
  }
  if(worship){
   if(length){finishWorship();}
   else{
    elapsed+=Math.min(.1,dt);
    avatar.bow(Math.min(1,elapsed/4.8));
    if(elapsed>=4.8&&worshipRun){const id=worshipRun;worshipRun='';practiceEvent({kind:'bow',status:'completed',id,place:prayer?.name});finishWorship();}
   }
  }
  if(length && document.activeElement===canvas && !document.querySelector('dialog[open]')){
   const a=camera.alpha,scale=3.3*Math.min(.05,dt)*(auto?1:Math.min(1,length))/length;
   const dx=auto?auto[0]*scale:(x*-Math.sin(a)-z*Math.cos(a))*scale,dz=auto?auto[1]*scale:(x*Math.cos(a)-z*Math.sin(a))*scale;
   const ox=p.x,oz=p.z;
   function move(nx:number,nz:number){
    const y=world.floor(nx,nz);
    if(Math.abs(y-p.y)<=.50&&!world.blocked(nx,y,nz))p.set(nx,y,nz);
   }
   move(p.x+dx,p.z);move(p.x,p.z+dz);
   const distance=Math.hypot(p.x-ox,p.z-oz);
   moving=distance>.00001;if(auto){stuck=moving?0:stuck+dt;if(stuck>.5){route=[];canvas.dataset.pointWalk='idle';}}
   if(moving){avatar.root.rotation.y=Math.atan2(p.x-ox,p.z-oz);step+=distance*4.8;}
   avatar.legs.forEach((leg,i)=>leg.rotation.x=distance>.00001?.35*Math.sin(step+i*Math.PI):0);
  }else if(!bows.bowing&&!worship&&!meditating)avatar.legs.forEach((leg,i)=>leg.rotation.x=moving?.35*Math.sin(step+i*Math.PI):0);
  if(bell.framed&&!first){frameBellCamera();return;}
  camera.target.copyFromFloats(p.x,p.y+(first?1.56:1.2),p.z);
  camera.radius=first?.045:world.cameraLimit(camera.target,camera.alpha,camera.beta,followDistance);
 }
 function visit(x:number,z:number){
  const candidates=[[x,z],...Array.from({length:32},(_,i)=>{const a=(i%8)*Math.PI/4,r=1+Math.floor(i/8);return [x+r*Math.cos(a),z+r*Math.sin(a)];})];
  const next=candidates.find(([cx,cz])=>!world.blocked(cx,world.floor(cx,cz),cz));if(!next)return false;
  if(bows.active)bows.cancel();finishWorship();tea.stop();bell.cancel();mode(true);clear();avatar.root.position.set(next[0],world.floor(next[0],next[1]),next[1]);const office=templePlaces.find(p=>p.id==='office')!;
  const officeArrival=Math.abs(x-office.x)<.5&&Math.abs(z-(office.z+6.1))<.5;
  camera.alpha=officeArrival?Math.PI/2:-Math.PI/2;camera.beta=1.26;
  if(officeArrival)avatar.root.rotation.y=Math.PI;
  window.dispatchEvent(new Event('sasa:relocate'));return true;
 }
 function startPractice(kind:'bow'|'meditation'|'108'){
  if(!active||!prayer)visit(practiceSeat.x,practiceSeat.z);
  const p=avatar.root.position;prayer=prayerSites.find(site=>Math.hypot(p.x-site.x,p.z-site.z)<=site.radius&&p.y>.8);
  if(!prayer)return;prayerButton.hidden=false;bows.show(practicing);
  if(kind==='108'){finishMeditation();document.querySelector<HTMLButtonElement>('#bow-start')!.click();return;}
  if(bows.active)bows.cancel();finishWorship();
  if(kind==='bow'){prayerButton.click();return;}
  meditating=true;meditationTime=0;meditationRun='guide-meditation-'+(++practiceSerial);practiceEvent({kind:'meditation',status:'started',id:meditationRun,place:prayer.name});meditationStop.hidden=false;meditationStatus.hidden=false;camera.alpha=prayer.alpha;avatar.root.rotation.y=-Math.PI/2-prayer.alpha;canvas.focus();
 }
 function captureView(){return {position:avatar.root.position.asArray(),yaw:avatar.root.rotation.y,alpha:camera.alpha,beta:camera.beta,followDistance,first,firstPersonFov,bellFramed:bell.framed};}
 function restoreView(saved:ReturnType<typeof captureView>){
  mode(true);clear();finishWorship();bell.cancel();tea.stop();if(saved.bellFramed)bell.approach();avatar.root.position.set(...saved.position as [number,number,number]);avatar.root.rotation.y=saved.yaw;
  followDistance=saved.followDistance;firstPersonFov=saved.firstPersonFov;changePerspective(saved.first);camera.alpha=saved.alpha;camera.beta=saved.beta;update(0);canvas.focus();
 }
 return {get practiceDestination(){return active&&prayer?prayer.name:"대웅전";},stopPractice(){bows.cancel();finishWorship();},captureView,restoreView,mode,update,visit,startPractice,returnFromPrivateRoom(){mode(true);clear();avatar.root.position.set(personalGate.x-2.5,world.floor(personalGate.x-2.5,personalGate.z),personalGate.z);avatar.root.rotation.y=-Math.PI/2;camera.alpha=0;camera.beta=1.26;},approachPersonalGate(){mode(true);clear();avatar.root.position.set(personalGate.x-2.5,world.floor(personalGate.x-2.5,personalGate.z),personalGate.z);avatar.root.rotation.y=Math.PI/2;camera.alpha=Math.PI;camera.beta=1.26;},approachBell(){mode(true);bell.approach();},sitAtTea(index=0){bell.cancel();mode(true);if(bows.active)bows.cancel();finishWorship();tea.sitAt(index);camera.alpha=-Math.PI/2;camera.beta=1.42;},setFace:avatar.setFace,get pose(){return {meditating,face:avatar.face,wearingRobe:robe.wearing,position:avatar.root.position.asArray(),yaw:avatar.root.rotation.y,bowProgress:worship?Math.min(1,elapsed/4.8):bows.progress,bellProgress:bell.progress,bellHit:bell.hit,drinkLift:tea.lift,beverage:tea.beverage,animation:bell.active?'bell':tea.seated||meditating?'sit':worship||bows.bowing?'worship':active&&moving?'walk':'idle'};},get position(){return active?avatar.root.position.asArray():null;}};
}
