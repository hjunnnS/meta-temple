import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import type {Scene} from '@babylonjs/core/scene';
import {descendingLight,goldRing,reducedMotion} from './practice-light';

import type {visitorMesh} from './walking';

export function visitorRobe(scene:Scene,avatar:ReturnType<typeof visitorMesh>){
 const {root}=avatar;
 const outfit=new TransformNode('robe',scene);outfit.parent=avatar.chest;outfit.position.y=-.78;
 function cloth(name:string,color:string){
  const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();return m;
 }
const hemp=cloth('gray hemp','#99948a'),binding=cloth('collar binding','#666256'),belt=cloth('cloth sash','#756751');
function panel(name:string,profile:number[][],depth:number,material:StandardMaterial){
 const mesh=MeshBuilder.CreateLathe(name,{shape:profile.map(([r,y])=>new Vector3(r,y,0)),tessellation:48},scene);
 mesh.scaling.z=depth;mesh.material=material;mesh.parent=outfit;return mesh;
}
panel('overlapping coat',[[.32,.48],[.29,.7],[.225,.90],[.25,1.11],[.268,1.27],[.19,1.36],[.115,1.41]],.88,hemp);
panel('sash',[[.236,.87],[.237,.92],[.235,.95]],.91,belt);
const looseSleeves:Mesh[]=[];
for(const [i,side] of [-1,1].entries()){
 const sleeve=panel('loose sleeve',[[.126,-.26],[.115,.10],[.10,.24],[.066,.30]],.94,hemp);
 sleeve.parent=avatar.arms[i];sleeve.position.set(side*.02,-.23,0);sleeve.rotation.z=side*.10;sleeve.setEnabled(false);sleeve.isPickable=false;looseSleeves.push(sleeve);
}
for(const [start,end] of [[new Vector3(-.098,1.399,.073),new Vector3(.157,1.06,.178)],[new Vector3(.098,1.399,.073),new Vector3(-.028,1.235,.221)]]){
 const path=Array.from({length:17},(_,i)=>{
  const point=Vector3.Lerp(start,end,i/16);
  const profile=[[1.06,.25],[1.27,.268],[1.36,.19],[1.41,.115]];
  const next=profile.findIndex(([y])=>y>=point.y);
  const [y1,r1]=profile[Math.max(0,next-1)],[y2,r2]=profile[Math.max(0,next)];
  const r=y2===y1?r1:r1+(r2-r1)*(point.y-y1)/(y2-y1);
  point.z=.88*Math.sqrt(Math.max(0,r*r-point.x*point.x))+.015;return point;
 });
 const trim=MeshBuilder.CreateTube('crossed collar',{path,radius:.022,tessellation:8},scene);
 trim.material=binding;trim.parent=outfit;
}
const original=[avatar.coat,...avatar.sleeves];

 outfit.setEnabled(false);
 for(const m of outfit.getChildMeshes())m.isPickable=false;
 let wearing=false,transitioning=false;
 return {get wearing(){return wearing;},change(on:boolean,done:()=>void){
  if(transitioning||wearing===on)return;
  transitioning=true;
  const ring=goldRing(scene,1.25);ring.mesh.parent=root;ring.mesh.scaling.z=.82;
  const shaft=descendingLight(scene,5.8,1.95);shaft.mesh.parent=root;
  const aureole=MeshBuilder.CreatePlane('robe-shoulder-glow',{size:1.55},scene);
  aureole.parent=root;aureole.position.y=1.36;aureole.billboardMode=Mesh.BILLBOARDMODE_Y;aureole.isPickable=false;
  const texture=new DynamicTexture('robe-gold-dust',256,scene,false);
  const ctx=texture.getContext() as CanvasRenderingContext2D;
  const halo=ctx.createRadialGradient(128,128,4,128,128,125);
  halo.addColorStop(0,'rgba(255,239,184,.85)');halo.addColorStop(.43,'rgba(255,202,95,.67)');
  halo.addColorStop(.72,'rgba(255,184,70,.19)');halo.addColorStop(1,'rgba(255,192,90,0)');
  ctx.fillStyle=halo;ctx.fillRect(0,0,256,256);
  for(let i=0;i<96;i++){
   const a=i*2.39996,r=40+78*Math.sqrt(((i*37)%97)/97);
   ctx.fillStyle=i%4?'#ffe1a1':'#fff9e5';ctx.beginPath();
   ctx.arc(128+r*Math.cos(a),128+r*Math.sin(a),i%6===0?1.65:.85,0,2*Math.PI);ctx.fill();
  }
  texture.hasAlpha=true;texture.update();
  const dust=new StandardMaterial('robe-light-dust',scene);
  dust.disableLighting=true;dust.disableDepthWrite=true;dust.diffuseTexture=dust.emissiveTexture=texture;
  dust.useAlphaFromDiffuseTexture=true;dust.emissiveColor=Color3.White();dust.alpha=0;aureole.material=dust;
  const reduced=reducedMotion();
  let time=0;
  const observer=scene.onBeforeRenderObservable.add(()=>{
   time+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
   const p=Math.min(1,time/(reduced?.75:2.95));
   const sweep=Math.max(0,Math.min(1,(p-.53)/.34));
   const envelope=Math.min(1,p/.16,Math.max(0,(.83-p)/.22));
   const reach=reduced?1:on?Math.min(1,p/.21):Math.min(1,(1-p)/.24);
   shaft.draw(reach,envelope*.98,reduced);
   const sparks=Math.min(1,Math.max(0,(p-.12)/.23),(1-p)/.28);
   dust.alpha=sparks*.98;
   const spread=reduced?1:.73+.43*p;
   aureole.scaling.setAll(spread);aureole.position.y=1.36+(reduced?0:.18*p);
   ring.mesh.position.y=reduced?.95:on?1.45-.73*sweep:.72+.73*sweep;
   ring.mesh.scaling.x=reduced?1:.68+.58*sweep;ring.mesh.scaling.z=ring.mesh.scaling.x*.82;
   ring.material.alpha=reduced?.55*sparks:Math.sin(Math.PI*sweep)*.98;
   if(p>=.47&&wearing!==on){
    wearing=on;outfit.setEnabled(on);for(const sleeve of looseSleeves)sleeve.setEnabled(on);for(const mesh of original)mesh.setEnabled(!on);
   }
   if(p===1){
    scene.onBeforeRenderObservable.remove(observer);ring.mesh.dispose();ring.material.dispose(false,true);
    aureole.dispose();dust.dispose(false,true);shaft.dispose();
    transitioning=false;done();
   }
  });
 }};
}
