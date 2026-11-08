import {visitorFace} from './visitor-face';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import type {Scene} from '@babylonjs/core/scene';

export function placeHallMonk(scene:Scene,x:number,y:number,z:number){
 const root=new TransformNode('대웅전 스님',scene);
 root.position.set(x,y,z);root.rotation.y=Math.atan2(x,z-45.12);
 function material(name:string,hex:string){
  const m=new StandardMaterial('monk-'+name,scene);
  m.diffuseColor=Color3.FromHexString(hex);m.emissiveColor=m.diffuseColor.scale(.16);m.specularColor=Color3.Black();
  return m;
 }
 const cloth=material('ramie','#98958b'),collar=material('collar','#d7d3c5'),kasa=material('kasa','#a45b3b');
 const skin=material('skin','#b5afa1'),ink=material('features','#59443d'),wood=material('moktak','#834c2c');
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
 const head=visitorFace(scene,torso,'human',true);head.position.y=.80;head.rotation.y=Math.PI;
 const legs=[-1,1].map(side=>{
  const thigh=oval('monk-thigh',root,cloth,0,0,0,.22,.42,.21);
  const shin=oval('monk-shin',root,cloth,0,0,0,.18,.42,.17);
  const shoe=oval('monk-cloth-shoe',root,collar,0,.055,0,.17,.11,.23);
  return {side,thigh,shin,shoe};
 });
 const drum=oval('monk-woodblock',torso,wood,.03,.20,-.32,.245,.185,.19);
 oval('monk-sound-slit',torso,ink,.03,.20,-.411,.149,.013,.012);
 oval('monk-left-sleeve',torso,cloth,.202,.34,-.115,.215,.34,.31);
 oval('monk-supporting-hand',torso,skin,.127,.18,-.284,.107,.105,.128);
 const elbow=new TransformNode('monk-striking-arm',scene);
 elbow.parent=torso;elbow.position.set(-.197,.38,-.06);
 oval('monk-right-sleeve',elbow,cloth,-.015,-.045,-.11,.204,.205,.315);
 oval('monk-mallet-hand',elbow,skin,.003,-.085,-.259,.105,.105,.112);
 const stick=oval('monk-mallet',elbow,wood,.069,-.085,-.272,.184,.023,.023);
 oval('monk-mallet-tip',elbow,wood,stick.position.x+.099,-.085,-.272,.059,.065,.058);
 let time=0;
 function smooth(v:number){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}
 function animate(){
  const transfer=smooth((time-8)/3.4)*(1-smooth((time-18)/3.4));
  const planted=smooth(transfer/.38),rise=smooth((transfer-.22)/.78);
  const lean=Math.sin(Math.PI*transfer);
  const stand=rise,beat=(time-11.4)*Math.PI*2/1.25;
  const hipY=.235+.51*rise,hipZ=-.115*lean;
  torso.position.set(0,hipY,hipZ);torso.rotation.x=-.42*lean;
  skirt.position.z=hipZ;skirt.scaling.y=(hipY+.045)/.77;
  skirt.scaling.x=1.09-.14*rise;
  for(const {side,thigh,shin,shoe} of legs){
   const footX=side*(.045+.085*planted),footZ=-.09-.095*lean;
   shoe.position.set(footX,.055,footZ);
   const kneeX=side*(.29-.16*planted);
   const kneeY=.16+.25*rise+.11*lean,kneeZ=-.10-.20*lean;
   // Lay each trouser segment between its joints, keeping the feet on the mat.
   for(const [part,ax,ay,az,bx,by,bz] of [
    [thigh,side*.13,hipY,hipZ,kneeX,kneeY,kneeZ],
    [shin,kneeX,kneeY,kneeZ,footX,.09,footZ]
   ] as const){
    const dx=bx-ax,dy=by-ay,dz=bz-az;
    part.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);
    part.scaling.y=Math.hypot(dx,dy,dz)+.12;
    part.rotation.set(Math.atan2(dz,Math.hypot(dx,dy)),0,-Math.atan2(dx,dy));
   }
  }
  head.rotation.x=-.10*(1-stand)-.13*lean+.018*Math.sin(time*2.1);
  head.position.y=.80+.004*(1-stand)*Math.sin(time*4);
  elbow.rotation.x=.24+stand*(.33-.61*Math.cos(beat));
  drum.rotation.z=.025*stand*Math.cos(beat);
 }
 animate();
 scene.onBeforeRenderObservable.add(()=>{time=(time+Math.min(.1,scene.getEngine().getDeltaTime()/1000))%22;animate();});
 return root;
}
