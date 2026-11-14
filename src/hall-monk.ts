import {refinedHumanFace} from './refined-visitor';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import type {Scene} from '@babylonjs/core/scene';

export function placeHallMonk(scene:Scene,x:number,y:number,z:number,previewTime?:()=>number){
 const root=new TransformNode('대웅전 스님',scene);
 root.position.set(x,y,z);root.rotation.y=Math.atan2(x,z-45.12);
 function material(name:string,hex:string){
  const m=new StandardMaterial('monk-'+name,scene);
  m.diffuseColor=Color3.FromHexString(hex).toLinearSpace();m.emissiveColor=m.diffuseColor.scale(.16);m.specularColor=Color3.Black();
  return m;
 }
 const cloth=material('ramie','#98958b'),collar=material('collar','#d7d3c5'),kasa=material('kasa','#a45b3b');
 const skin=material('skin','#d9ad90'),ink=material('features','#59443d'),wood=material('moktak','#834c2c');
 const torso=new TransformNode('monk-upper-body',scene);torso.parent=root;
 function oval(name:string,parent:TransformNode,m:StandardMaterial,px:number,py:number,pz:number,w:number,h:number,d:number){
  const mesh=MeshBuilder.CreateSphere(name,{diameter:1,segments:16},scene);
  mesh.parent=parent;mesh.position.set(px,py,pz);mesh.scaling.set(w,h,d);mesh.material=m;mesh.isPickable=false;return mesh;
 }
 function robe(name:string,parent:TransformNode,profile:number[][],depth:number,m:StandardMaterial){
  const mesh=MeshBuilder.CreateLathe(name,{shape:profile.map(([r,h])=>new Vector3(r,h,0)),tessellation:32},scene);
  mesh.parent=parent;mesh.scaling.z=depth;mesh.isPickable=false;mesh.material=m;return mesh;
 }
 const skirt=robe('monk-robe-hem',root,[[.27,0],[.32,.12],[.24,.63],[.19,.77]],.84,cloth);
 robe('monk-jacket',torso,[[.24,0],[.22,.24],[.245,.52],[.17,.61],[.09,.65]],.80,cloth);
 const lapel=oval('monk-lapel',torso,collar,0,.48,-.155,.08,.35,.045);lapel.rotation.z=-.48;
 // Wrap a broad cloth panel over the shoulder and down the opposite hip.
 const drape=MeshBuilder.CreateRibbon('monk-kasa',{pathArray:[-.085,0,.085].map(offset=>
  [[.13,.58,-.088],[.105,.50,-.183],[.06,.39,-.199],[-.015,.27,-.206],[-.09,.15,-.183],[-.13,.04,-.16]].map(([x,y,z])=>new Vector3(x+offset,y,z+.038*Math.abs(offset)/.085))),
  sideOrientation:Mesh.DOUBLESIDE},scene);
 drape.parent=torso;drape.material=kasa;drape.isPickable=false;
 oval('monk-neck',torso,skin,0,.655,0,.17,.18,.17);
 const head=refinedHumanFace(scene,torso,'hall-monk',true);head.position.y=.83;head.scaling.setAll(1.08);head.rotation.y=Math.PI;
 for(const material of new Set(head.getChildMeshes().map(m=>m.material)))if(material instanceof StandardMaterial)material.diffuseColor=material.diffuseColor.toLinearSpace();
 const legs=[-1,1].map(side=>{
  const thigh=oval('monk-thigh',root,cloth,0,0,0,.22,.42,.21);
  const shin=oval('monk-shin',root,cloth,0,0,0,.18,.42,.17);
  const shoe=oval('monk-cloth-shoe',root,collar,0,.055,0,.17,.11,.23);
  return {side,thigh,shin,shoe};
 });
 // The striking surface is the crown of the woodblock; both hands use the same local frame.
 const drumX=.065,drumY=.29,drumZ=-.35,drumRadiusY=.096,tipRadius=.032;
 oval('monk-woodblock',torso,wood,drumX,drumY,drumZ,.25,drumRadiusY*2,.20);
 oval('monk-sound-slit',torso,ink,drumX,drumY,drumZ-.097,.15,.014,.011);
 const handle=MeshBuilder.CreateTorus('moktak-handle',{diameter:.114,thickness:.022,tessellation:24},scene);
 handle.parent=torso;handle.material=wood;handle.rotation.x=Math.PI/2;handle.position.set(.175,drumY+.014,drumZ+.018);
 oval('monk-left-sleeve',torso,cloth,.202,.38,-.124,.188,.26,.30);
 const support=oval('monk-supporting-forearm',torso,cloth,.183,.30,-.226,.155,.16,.19);
 support.rotation.x=-.27;
 oval('monk-supporting-hand',torso,skin,.171,.296,-.302,.085,.105,.065);
 const pivot=new TransformNode('monk-striking-wrist',scene);pivot.parent=torso;
 const stickLength=.245,strikeYaw=.65;
 pivot.rotation.y=strikeYaw;
 pivot.position.set(drumX-stickLength*Math.cos(strikeYaw),drumY+drumRadiusY+tipRadius,drumZ+stickLength*Math.sin(strikeYaw));
 oval('monk-grip',pivot,skin,0,0,0,.085,.105,.065);
 oval('monk-mallet',pivot,wood,stickLength*.46,0,0,stickLength*1.16,.019,.021);
 oval('monk-mallet-tip',pivot,wood,stickLength,0,0,tipRadius*2,tipRadius*2,tipRadius*2);
 const upperSleeve=oval('monk-upper-sleeve',torso,cloth,0,0,0,.16,.24,.16);
 const lowerSleeve=oval('monk-forearm-sleeve',torso,cloth,0,0,0,.135,.22,.134);
 head.getChildMeshes().find(m=>m.name==='hall-monk-quiet-smile')?.setEnabled(false);
 const lips=oval('chanting-lips',head,ink,0,-.114,.204,.049,.007,.013);
 const cycle=19,firstBeat=8.2,interval=1.16;
 let time=0;
 function ease(t:number,a:number,b:number){
  const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);
 }
 function animate(){
  const prepare=ease(time,3.2,4.35)*(1-ease(time,16.4,18.25));
  const rise=ease(time,4.35,6.8)*(1-ease(time,14.6,16.65));
  const shift=.065*prepare*(1-rise);
  const lean=prepare*(1-rise);
  const hipY=.235+.53*rise,hipZ=-.105*lean-.095*rise;
  torso.position.set(shift,hipY,hipZ);torso.rotation.x=-.32*lean-.04*(1-rise);
  const hem=.025+.35*rise;
  skirt.position.set(shift,hem,hipZ-.055*rise);skirt.scaling.y=(hipY+.045-hem)/.77;skirt.scaling.z=.84+.17*rise;
  skirt.scaling.x=1.09-.14*rise;
  for(const {side,thigh,shin,shoe} of legs){
   const step=side<0?ease(time,3.25,4.1)*(1-ease(time,17.2,18.2)):ease(time,3.95,4.75)*(1-ease(time,16.4,17.35));
   const footX=side*(.045+.09*step),footZ=-.09-(side<0?.105:.025)*step;
   const footY=.055+.043*Math.sin(Math.PI*step);
   shoe.position.set(footX,footY,footZ);
   const hip=new Vector3(shift+side*.13,hipY,hipZ),ankle=new Vector3(footX,footY+.035,footZ);
   const axis=ankle.subtract(hip),span=axis.length();axis.normalize();
   const bend=new Vector3(side*(1-step+.10),.15,-.5-step);
   const out=bend.subtract(axis.scale(Vector3.Dot(bend,axis))).normalize();
   const knee=Vector3.Center(hip,ankle).add(out.scale(Math.sqrt(Math.max(0,.36**2-span**2/4))));
   const {x:kneeX,y:kneeY,z:kneeZ}=knee;
   // Lay each trouser segment between its joints, keeping the feet on the mat.
   for(const [part,ax,ay,az,bx,by,bz] of [
    [thigh,hip.x,hipY,hipZ,kneeX,kneeY,kneeZ],
    [shin,kneeX,kneeY,kneeZ,footX,ankle.y,footZ]
   ] as const){
    const dx=bx-ax,dy=by-ay,dz=bz-az;
    part.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);
    part.scaling.y=Math.hypot(dx,dy,dz)+.12;
    part.rotation.set(Math.atan2(dz,Math.hypot(dx,dy)),0,-Math.atan2(dx,dy));
   }
  }
  head.rotation.x=-.10*(1-rise)-.13*lean+.017*(1-prepare)*Math.sin(time*2.1);
  lips.scaling.y=.006+.018*(1-prepare)*(.5+.5*Math.sin(time*8));
  // Accelerate into contact, rebound quickly, then gather for the next beat.
  const beat=(time-firstBeat+interval*10)%interval/interval;
  const arc=.72*ease(beat,0,.18)+.24*ease(beat,.18,.73)-.96*ease(beat,.73,1);
  const playing=ease(time,6.8,7.7)*(1-ease(time,13.1,14.5));
  const angle=.45*(1-playing)+arc*playing;
  pivot.rotation.z=angle;
  pivot.position.y=drumY+drumRadiusY+tipRadius-.18*(1-playing)-.08*lean+.045*playing*Math.sin(angle);
  pivot.position.z=drumZ+stickLength*Math.sin(strikeYaw)+.065*(1-playing);
  const shoulder=new Vector3(-.195,.49,-.04);
  const elbow=new Vector3(-.25,.29+.06*playing*Math.sin(angle),-.15);
  for(const [sleeve,from,to] of [[upperSleeve,shoulder,elbow],[lowerSleeve,elbow,pivot.position]] as const){
   sleeve.position.copyFrom(from).addInPlace(to).scaleInPlace(.5);
   const offset=to.subtract(from);
   sleeve.scaling.y=offset.length()+.095;
   sleeve.rotation.set(Math.atan2(offset.z,Math.hypot(offset.x,offset.y)),0,-Math.atan2(offset.x,offset.y));
  }
 }
 animate();
 scene.onBeforeRenderObservable.add(()=>{time=previewTime?.()??(time+Math.min(.1,scene.getEngine().getDeltaTime()/1000))%cycle;animate();});
 return root;
}
