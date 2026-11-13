import {practiceExperience} from './practice-experience';
import {personalGateEffects} from './personal-gate-effects';
import {t} from './locales';
import {walkingPath,type WalkPoint} from './point-navigation';
import {pointInput} from './point-input';
import {privatePractice} from './private-practice';
import {privateDisplays} from './private-display';
import {furnishPrivateRetreat} from './private-room-furnishings';
import {canWalkPrivateRoom} from './private-room-layout';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import {privateCameraRadius} from './private-room-camera';
import {Scene} from '@babylonjs/core/scene';
import type {Engine} from '@babylonjs/core/Engines/engine';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {PointLight} from '@babylonjs/core/Lights/pointLight';
import {visitorMesh} from './walking';
import {visitorRobe} from './visitor-robe';
import type {Face} from './face-types';

export function privateRoomScene(engine:Engine,canvas:HTMLCanvasElement,face:Face,wearingRobe:boolean,onExit:()=>void,roomId:string){
 const scene=new Scene(engine);scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=1;scene.imageProcessingConfiguration.exposure=1.0;scene.imageProcessingConfiguration.contrast=1.05;scene.clearColor=new Color4(.77,.86,.84,1);
 const camera=new ArcRotateCamera('private-room-camera',-Math.PI/2,1.24,3.2,new Vector3(0,1.3,-4.5),scene);
 camera.attachControl(canvas,true);camera.lowerRadiusLimit=.08;camera.minZ=.025;camera.maxZ=60;camera.upperRadiusLimit=7;camera.lowerBetaLimit=.35;camera.upperBetaLimit=1.6;camera.wheelDeltaPercentage=.012;camera.panningSensibility=0;
 const keyboard=camera.inputs.attached.keyboard;if(keyboard)camera.inputs.remove(keyboard);
 const sky=new HemisphericLight('private-room-daylight',new Vector3(0,1,.3),scene);sky.intensity=.78;sky.groundColor=new Color3(.35,.28,.20);
 const light=new PointLight('private-room-warm-light',new Vector3(0,3.5,3),scene);light.diffuse=Color3.FromHexString('#ffe2aa');light.intensity=.7;light.range=14;
 const furnishings=furnishPrivateRetreat(scene);personalGateEffects(scene,{x:0,z:-7.7,yaw:Math.PI/2});
 const returnDoor=document.createElement('button');returnDoor.id='private-return-door';returnDoor.textContent=t('사찰로 돌아가기');returnDoor.hidden=true;returnDoor.onclick=onExit;document.querySelector('#private-room-actions')!.append(returnDoor);
 const sun=new DirectionalLight('private-garden-sun',new Vector3(-.85,-1.3,-.35),scene);sun.position.set(15,16,8);sun.intensity=1.2;sun.diffuse=Color3.FromHexString('#fff0d1');
 const shadows=new ShadowGenerator(1024,sun);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=ShadowGenerator.QUALITY_LOW;shadows.bias=.001;shadows.normalBias=.025;
 for(const mesh of furnishings)shadows.addShadowCaster(mesh);
 const avatar=visitorMesh(scene,'private-visitor');avatar.setFace(face);visitorRobe(scene,avatar).setWearing(wearingRobe);avatar.root.position.set(0,.12,-4.5);
 for(const mesh of avatar.root.getChildMeshes())shadows.addShadowCaster(mesh);
 let view:'walk'|'overview'|'garden'|'display'='walk';
 // Retain the requested zoom while temporarily shortening the camera arm at walls.
 let requestedRadius=3.2,lastSafeRadius=3.2;
 const mouseWheel=camera.inputs.attached.mousewheel;if(mouseWheel)camera.inputs.remove(mouseWheel);
 const zoom=(event:WheelEvent)=>{
  event.preventDefault();event.stopImmediatePropagation();
  const unit=event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1;
  const factor=Math.exp(Math.max(-.45,Math.min(.45,event.deltaY*unit*.002)));
  requestedRadius=Math.max(1.2,Math.min(7,requestedRadius*factor));
 };
 canvas.addEventListener('wheel',zoom,{capture:true,passive:false});
 camera.onAfterCheckInputsObservable.add(()=>{
  const delta=camera.radius-lastSafeRadius;
  if(Math.abs(delta)>.00001)requestedRadius=Math.max(1.2,Math.min(7,requestedRadius+delta));
  camera.radius=privateCameraRadius(camera.target.asArray(),camera.alpha,camera.beta,requestedRadius);
  lastSafeRadius=camera.radius;
  // Avoid looking through the avatar's head when a wall pushes the camera very close.
  avatar.root.setEnabled(view==='walk'&&camera.radius>=.75);
 });
 const keys=new Set<string>();let stride=0,stuck=0;let route:WalkPoint[]=[];
 const directions=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
 const down=(event:KeyboardEvent)=>{if(document.activeElement===canvas&&directions.has(event.code)){event.preventDefault();route=[];keys.add(event.code);}};
 const up=(event:KeyboardEvent)=>keys.delete(event.code),clear=()=>{keys.clear();route=[];canvas.dataset.pointWalk='idle';};
 canvas.addEventListener('keydown',down);window.addEventListener('keyup',up);canvas.addEventListener('blur',clear);window.addEventListener('blur',clear);
 let practice:ReturnType<typeof privatePractice>|undefined;let practiceCameraHeight=1.2;
 const panel=document.querySelector('#private-room-controls')!;
 function changeView(next:'walk'|'overview'|'garden'|'display'){
  route=[];if(next!=='walk')practice?.stop();
  view=next;keys.clear();camera.fov=next==='walk'?.8:next==='overview'?1.02:.9;
  if(next==='walk'){camera.alpha=-Math.PI/2;camera.beta=1.24;requestedRadius=3.2;camera.radius=lastSafeRadius=3.2;}
  else if(next==='overview'){camera.setTarget(new Vector3(1,1.35,1.2));camera.setPosition(new Vector3(-2.5,2.5,-4.5));requestedRadius=lastSafeRadius=camera.radius;}
  else if(next==='display'){camera.setTarget(new Vector3(-4.2,1.35,0));camera.setPosition(new Vector3(1.8,2,-2.4));requestedRadius=lastSafeRadius=camera.radius;}
  else{camera.setTarget(new Vector3(12,1.1,3));camera.setPosition(new Vector3(6.6,1.9,-.1));requestedRadius=lastSafeRadius=camera.radius;}
  canvas.focus();
 }
 for(const next of ['walk','overview','garden','display'] as const)panel.querySelector<HTMLButtonElement>('[data-room-view='+next+']')!.onclick=()=>changeView(next);
 for(const button of panel.querySelectorAll<HTMLButtonElement>('[data-room-key]')){
  button.onpointerdown=event=>{event.preventDefault();canvas.focus();button.setPointerCapture(event.pointerId);keys.add(button.dataset.roomKey!);};button.onlostpointercapture=()=>keys.delete(button.dataset.roomKey!);
 }
 practice=privatePractice(avatar,canvas,()=>{changeView('walk');camera.alpha=.12;camera.beta=1.35;requestedRadius=camera.radius=lastSafeRadius=4.3;});
 practiceExperience(scene,()=>({position:avatar.root.position.asArray(),bowProgress:practice?.active?Number(document.querySelector('#private-practice')?.getAttribute('data-bow-progress')??0):0}),()=>document.querySelector<HTMLInputElement>('#master-mute')?.checked?0:Number(document.querySelector<HTMLInputElement>('#audio-volume')?.value??35)/100,'private');
 const disposePoint=pointInput(scene,canvas,()=>view==='walk',point=>{
  if(point[1]>.5||!canWalkPrivateRoom(point[0],point[2]))return;
  route=walkingPath([avatar.root.position.x,avatar.root.position.z],[point[0],point[2]],(a,b)=>canWalkPrivateRoom(b[0],b[1]));stuck=0;canvas.dataset.pointWalk=route.length?'moving':'idle';
 });
 let displayReturn:{alpha:number;beta:number;radius:number}|null=null,returnBlend:{alpha:number;beta:number;radius:number;target:Vector3;time:number}|null=null;
 const display=privateDisplays(scene,roomId,position=>{
  changeView('display');
  if(position.id.startsWith('right')){camera.setTarget(new Vector3(4.2,1.35,-4.65));camera.setPosition(new Vector3(-1.4,2.1,-6.2));requestedRadius=lastSafeRadius=camera.radius;}
 },mesh=>shadows.addShadowCaster(mesh),mesh=>shadows.removeShadowCaster(mesh),{begin(){displayReturn={alpha:view==='walk'?camera.alpha:-Math.PI/2,beta:view==='walk'?camera.beta:1.24,radius:view==='walk'?requestedRadius:3.2};returnBlend=null;},finish(){view='walk';keys.clear();route=[];if(displayReturn){returnBlend={alpha:camera.alpha,beta:camera.beta,radius:camera.radius,target:camera.target.clone(),time:0};}}});
 return {scene,render(dt:number){
  display.update(dt);
  const p=avatar.root.position;returnDoor.hidden=view!=='walk'||Math.hypot(p.x,p.z+7.7)>3.5;
  let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),z=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));if(x||z)route=[];while(route.length&&Math.hypot(p.x-route[0][0],p.z-route[0][1])<.18)route.shift();const auto=route[0]?[route[0][0]-p.x,route[0][1]-p.z]:null,length=auto?Math.hypot(...auto):Math.hypot(x,z);if(!route.length)canvas.dataset.pointWalk='idle';
  let distance=0;
  if(length&&view!=='walk')changeView('walk');
  const practicing=practice!.update(dt,!!length);
  if(length&&!practicing&&!document.querySelector('dialog[open]')){
   const speed=3.0*Math.min(.05,dt)/length,a=camera.alpha,dx=auto?auto[0]*speed:(x*-Math.sin(a)-z*Math.cos(a))*speed,dz=auto?auto[1]*speed:(x*Math.cos(a)-z*Math.sin(a))*speed;
   const ox=p.x,oz=p.z;
   const blocked=(nx:number,nz:number)=>!canWalkPrivateRoom(nx,nz);
   if(!blocked(p.x+dx,p.z))p.x+=dx;if(!blocked(p.x,p.z+dz))p.z+=dz;
   distance=Math.hypot(p.x-ox,p.z-oz);if(auto){stuck=distance?0:stuck+dt;if(stuck>.5)route=[];}if(distance){p.y=.12;avatar.root.rotation.y=Math.atan2(p.x-ox,p.z-oz);stride+=distance*4.8;}
   if(p.z< -7.1&&Math.abs(p.x)<1.1){onExit();return;}
  }
  if(!practicing)avatar.legs.forEach((leg,i)=>leg.rotation.x=distance?.35*Math.sin(stride+i*Math.PI):0);
  practiceCameraHeight+=(practice!.cameraHeight-practiceCameraHeight)*(1-Math.exp(-9*Math.min(.1,dt)));
  if(returnBlend&&displayReturn){const b=returnBlend;b.time+=Math.min(.1,dt);const q=Math.min(1,b.time/.65),e=q*q*(3-2*q);const delta=Math.atan2(Math.sin(displayReturn.alpha-b.alpha),Math.cos(displayReturn.alpha-b.alpha));camera.alpha=b.alpha+delta*e;camera.beta=b.beta+(displayReturn.beta-b.beta)*e;requestedRadius=b.radius+(displayReturn.radius-b.radius)*e;camera.target.copyFrom(Vector3.Lerp(b.target,new Vector3(p.x,p.y+practiceCameraHeight,p.z),e));if(q===1||length)returnBlend=null;}else if(view==='walk')camera.target.copyFromFloats(p.x,p.y+practiceCameraHeight,p.z);scene.render();
 },dispose(){returnDoor.remove();disposePoint();route=[];canvas.dataset.pointWalk='idle';practice?.dispose();display.dispose();canvas.removeEventListener('wheel',zoom,true);canvas.removeEventListener('keydown',down);window.removeEventListener('keyup',up);canvas.removeEventListener('blur',clear);window.removeEventListener('blur',clear);camera.detachControl();scene.dispose();}};
}
