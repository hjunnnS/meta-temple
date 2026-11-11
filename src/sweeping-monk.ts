import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Matrix,Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector';
import {PointerEventTypes} from '@babylonjs/core/Events/pointerEvents';
import type {Scene} from '@babylonjs/core/scene';
import type {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import {visitorMesh} from './walking';
import {visitorRobe} from './visitor-robe';
import {sweepingMonkSite} from './temple-terrain';
import {sweepingMonkCycle} from './sweeping-monk-cycle';
import {monkGreetingSound} from './monk-greeting-sound';
import {t} from './locales';
import './sweeping-monk.css';

export function sweepingMonk(scene:Scene,camera:ArcRotateCamera,canvas:HTMLCanvasElement,visitor:()=>readonly number[]|null){
 const site=sweepingMonkSite,body=visitorMesh(scene,'sweeping-monk',true);visitorRobe(scene,body).setWearing(true);body.root.position.set(site.x,.01,site.z);
 for(const material of new Set(body.root.getChildMeshes().map(mesh=>mesh.material)))if(material instanceof StandardMaterial)material.diffuseColor=material.diffuseColor.toLinearSpace();
 function material(name:string,colour:string){const m=new StandardMaterial('sweeper-'+name,scene);m.diffuseColor=Color3.FromHexString(colour).toLinearSpace();m.specularColor=Color3.Black();return m;}
 const bamboo=material('bamboo','#85613c'),straw=material('straw','#ac8c51'),thread=material('twine','#554332'),brown=material('leaf-brown','#906744'),gold=material('leaf-gold','#b6974e');
 const broom=new TransformNode('sweeper-broom',scene);
 const tuft=MeshBuilder.CreateLathe('broom-straw-bundle',{shape:[[0,-.08],[.14,-.08],[.16,.01],[.11,.13],[.025,.26],[0,.26]].map(([r,y])=>new Vector3(r,y,0)),tessellation:18},scene);tuft.parent=broom;tuft.scaling.z=.35;tuft.material=straw;
 const shaft=MeshBuilder.CreateCylinder('broom-handle',{diameter:.027,height:1.25,tessellation:8},scene);shaft.parent=broom;shaft.position.y=.71;shaft.material=bamboo;
 for(let i=0;i<15;i++){
  const bristle=MeshBuilder.CreateCylinder('broom-straw',{diameterTop:.01,diameterBottom:.019,height:.27,tessellation:5},scene);bristle.parent=broom;bristle.position.set((i-7)*.014,.055,Math.sin(i*2.1)*.018);bristle.rotation.z=-(i-7)*.037;bristle.material=straw;
 }
 for(const y of [.12,.16]){const binding=MeshBuilder.CreateTorus('broom-binding',{diameter:.065,thickness:.014,tessellation:10},scene);binding.parent=broom;binding.position.y=y;binding.material=thread;}
 const mouth=MeshBuilder.CreateSphere('sweeper-speaking-lips',{diameter:1,segments:8},scene);mouth.parent=body.head;mouth.position.set(0,-.106,.171);mouth.scaling.set(.063,.008,.015);mouth.material=material('lips','#86554b');
 for(const mesh of [...body.root.getChildMeshes(),...broom.getChildMeshes()]){mesh.isPickable=true;mesh.metadata={sweeperNpc:true,blocksOfferingPick:true};}
 const leaves=Array.from({length:34},(_,i)=>{
  const leaf=MeshBuilder.CreateDisc('swept-leaf',{radius:.065+(i%4)*.012,tessellation:5},scene);leaf.material=i%3?brown:gold;leaf.rotation.set(Math.PI/2,0,i*2.4);leaf.scaling.y=.55;leaf.isPickable=false;
  return {leaf,x:site.x+.24+Math.sin(i*2.4)*(.25+i%3*.13),z:site.z+.67+Math.cos(i*1.7)*.32};
 });
 const caption=document.createElement('div');caption.id='sweeper-caption';caption.hidden=true;caption.setAttribute('role','status');caption.setAttribute('aria-live','polite');document.body.append(caption);
 const button=document.createElement('button');button.id='sweeper-greet';button.hidden=true;button.type='button';document.body.append(button);
 const cycle=sweepingMonkCycle(),sound=monkGreetingSound();let turnTo=0,privateSpace=false,lastPhase='';
 function viewer(){const p=visitor();return p?new Vector3(...p):camera.position.clone();}
 function greet(){
  if(privateSpace||document.hidden||document.querySelector('dialog[open]')||Vector3.Distance(viewer(),body.root.position)>7||!cycle.greet())return;
  const p=viewer();turnTo=Math.atan2(p.x-site.x,p.z-site.z);button.disabled=true;void sound.prepare();canvas.focus();
 }
 button.onclick=greet;
 const pointer=scene.onPointerObservable.add(event=>{if(event.type===PointerEventTypes.POINTERTAP&&event.pickInfo?.pickedMesh?.metadata?.sweeperNpc)greet();});
 function cancel(){cycle.cancel();sound.stop();caption.hidden=true;button.disabled=false;}
 const hidden=()=>{if(document.hidden)cancel();};document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',cancel);
 const space=(event:Event)=>{privateSpace=(event as CustomEvent<string>).detail==='private';if(privateSpace){cancel();button.hidden=true;}};window.addEventListener('sasa:space',space);
 const upper=Quaternion.Identity(),lower=Quaternion.Identity(),inverse=Matrix.Identity();
 function holdingArm(index:number,target:Vector3,release:number){
  const arm=body.arms[index],elbow=body.forearms[index],restA=arm.rotationQuaternion?.clone()??Quaternion.Identity(),restB=elbow.rotationQuaternion?.clone()??Quaternion.Identity();
  body.chest.computeWorldMatrix(true);body.chest.getWorldMatrix().invertToRef(inverse);
  const local=Vector3.TransformCoordinates(target,inverse),axis=local.subtract(arm.position),length=Math.min(.504,axis.length());axis.normalize();
  const hint=new Vector3(index===0?-.7:.7,-.7,0),bend=hint.subtract(axis.scale(Vector3.Dot(hint,axis))).normalize(),along=(.255**2-.25**2+length**2)/(2*length);
  const a=axis.scale(along).add(bend.scale(Math.sqrt(Math.max(0,.255**2-along**2)))),b=axis.scale(length).subtract(a);
  Quaternion.FromUnitVectorsToRef(Vector3.Down(),a.normalize(),upper);Quaternion.FromUnitVectorsToRef(Vector3.Down(),b.normalize(),lower);
  arm.rotationQuaternion=Quaternion.Slerp(upper,restA,release);elbow.rotationQuaternion=Quaternion.Slerp(upper.conjugate().multiply(lower),restB,release);
 }
 const observer=scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000),utter=cycle.tick(dt),f=cycle.frame();
  const point=viewer(),distance=Vector3.Distance(point,body.root.position);sound.level(distance);
  button.textContent=t('스님께 인사하기');button.hidden=privateSpace||distance>7||!document.body.classList.contains('exploring');button.disabled=cycle.active;
  if(f.phase!==lastPhase){lastPhase=f.phase;button.dataset.phase=f.phase;}button.dataset.audio=sound.playing?'playing':'idle';
  if(utter)void sound.speak(()=>cycle.active&&cycle.frame().speech&&!privateSpace);
  body.root.rotation.y=turnTo*f.turn;body.bow(f.palms*.105);body.chest.rotation.x=.10*(1-f.release);body.head.rotation.x=.055*(1-f.release)+.07*f.palms;
  mouth.scaling.y=.008+(sound.playing?.014*Math.max(0,Math.sin(performance.now()*.009)):0);
  const bottom=new Vector3(.43+.30*f.stroke,.12,.79),top=new Vector3(.11,1.39,.22);
  body.root.computeWorldMatrix(true);const matrix=body.root.getWorldMatrix();
  const heldBottom=Vector3.TransformCoordinates(bottom,matrix),heldTop=Vector3.TransformCoordinates(top,matrix);
  const low=Vector3.Lerp(heldBottom,new Vector3(site.x+.72,.10,site.z-.06),f.release),high=Vector3.Lerp(heldTop,new Vector3(site.x+.64,1.41,site.z-.14),f.release),direction=high.subtract(low);
  broom.position.copyFrom(low);broom.scaling.y=direction.length()/1.32;const orientation=Quaternion.Identity();Quaternion.FromUnitVectorsToRef(Vector3.Up(),direction.normalize(),orientation);broom.rotationQuaternion=orientation;
  holdingArm(0,Vector3.Lerp(heldBottom,heldTop,.78),f.release);holdingArm(1,Vector3.Lerp(heldBottom,heldTop,.54),f.release);
  for(const {leaf,x,z} of leaves){leaf.position.set(x+(1-f.release)*f.stroke*.035,.025,z-.025*(1-f.release)*Math.max(0,f.stroke));}
  const head=body.root.position.add(new Vector3(0,1.93,0)),projected=Vector3.Project(head,Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(scene.getEngine().getRenderWidth(),scene.getEngine().getRenderHeight())),rect=canvas.getBoundingClientRect();
  const visible=f.speech&&!privateSpace&&distance<=9&&projected.z>0&&projected.z<1;
  caption.hidden=!visible;if(visible){caption.textContent=t('나무관세음보살~');const x=rect.left+projected.x*rect.width/scene.getEngine().getRenderWidth(),y=rect.top+projected.y*rect.height/scene.getEngine().getRenderHeight();caption.style.transform=`translate(${Math.max(16,Math.min(innerWidth-16,x))}px,${Math.max(60,y)}px) translate(-50%,-100%)`;}
 });
 scene.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(observer);scene.onPointerObservable.remove(pointer);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',cancel);window.removeEventListener('sasa:space',space);sound.dispose();button.remove();caption.remove();});
 return body.root;
}
