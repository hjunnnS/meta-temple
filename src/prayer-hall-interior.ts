import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder as B} from '@babylonjs/core/Meshes/meshBuilder';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Vector3,Quaternion} from '@babylonjs/core/Maths/math.vector';
import {seatedFigure} from './gilt-figure';
import {prayerAisleX,prayerHallFloor,prayerHallPoint,type RearPrayerHall} from './prayer-halls';

/** Reuse the approved sculpted face, curled hair and continuous drapery, with a separate altar per hall. */
export function furnishPrayerHall(scene:Scene,parts:Mesh[],hall:RearPrayerHall,wood:StandardMaterial,cloth:StandardMaterial){
 const first=parts.length,x=prayerAisleX,z=2.65,floor=prayerHallFloor;
 const material=(name:string,hex:string,fill=.13)=>{
  const m=new StandardMaterial(hall.id+'-'+name,scene);m.diffuseColor=Color3.FromHexString(hex);m.emissiveColor=m.diffuseColor.scale(fill);m.specularColor=new Color3(.28,.20,.10);m.specularPower=32;return m;
 };
 const gold=material('gilded-bronze','#c99c48'),skin=material('satin-gilt-face','#ddbd7c'),hair=material('coiffure','#2c302a',.08),red=material('altar-lacquer','#763a32'),jade=material('shrine-jade','#2d5950'),ivory=material('beeswax','#f4e6c7'),fire=material('candle-flame','#ffbf68',1.8);
 const add=(m:Mesh,px:number,py:number,pz:number,mat:StandardMaterial)=>{m.position.set(px,py,pz);m.material=mat;m.receiveShadows=true;parts.push(m);return m;};
 const box=(name:string,px:number,py:number,pz:number,w:number,h:number,d:number,mat:StandardMaterial)=>add(B.CreateBox(name,{width:w,height:h,depth:d},scene),px,py,pz,mat);
 const oval=(name:string,px:number,py:number,pz:number,w:number,h:number,d:number,mat=gold)=>{const m=add(B.CreateSphere(name,{diameter:1,segments:20},scene),px,py,pz,mat);m.scaling.set(w,h,d);return m;};
 const lathe=(name:string,px:number,py:number,pz:number,profile:number[][],mat=gold)=>add(B.CreateLathe(name,{shape:profile.map(([r,y])=>new Vector3(r,y,0)),tessellation:40,sideOrientation:Mesh.DOUBLESIDE},scene),px,py,pz,mat);
 const line=(name:string,points:number[][],radius:number,mat=gold)=>add(B.CreateTube(name,{path:points.map(p=>Vector3.FromArray(p)),radius,tessellation:8},scene),0,0,0,mat);
 box('altar-cabinet',x,floor+.29,z,4.6,.58,1.35,wood);
 box('altar-lacquer-top',x,floor+.62,z,4.76,.10,1.48,red);
 box('altar-gilt-lip',x,floor+.575,z-.75,4.75,.037,.055,gold);
 for(let i=-2;i<=2;i++){
  box('altar-carved-panel',x+i*.86,floor+.29,z-.686,.75,.40,.045,jade);
  for(const side of [-1,1])box('altar-panel-border',x+i*.86,floor+.29+side*.187,z-.715,.75,.023,.018,gold);
  for(let j=-2;j<=2;j++){const petal=oval('altar-lotus-relief',x+i*.86+j*.045,floor+.29,z-.73,.057,.18,.02);petal.rotation.z=-j*.28;}
 }
 box('shrine-back-panel',x,2.63,z+.69,3.1,3.0,.09,jade);
 const statueY=floor+.68,scale=.78;
 lathe('lotus-dais',x,statueY,z,[[0,0],[.87,0],[.91,.07],[.8,.14],[.83,.20],[.8,.24],[0,.24]],red);
 for(let i=0;i<18;i++){const a=i*Math.PI/9;const p=oval('lotus-dais-petal',x+.73*Math.cos(a),statueY+.18,z+.38*Math.sin(a),.20,.25,.16);p.rotation.z=-.4*Math.cos(a);}
 seatedFigure(scene,parts,x,statueY,z,scale,gold,hair,skin,hall.id!=='geukrak');
 for(const r of [1,1.055])line('aureole-rim',Array.from({length:81},(_,i)=>{const a=i*Math.PI/40;return[x+.92*r*Math.sin(a),statueY+1.33+1.32*r*Math.cos(a),z+.56];}),.012);
 // Modest jewellery distinguishes the two bodhisattvas without changing the accepted facial sculpt.
 if(hall.id==='munsu'||hall.id==='bohyeon'){
  for(let i=0;i<7;i++){
   const a=(i-3)*.30;
   oval('bodhisattva-crown',x+.22*Math.sin(a),statueY+2.59*scale,z-.19*Math.cos(a),.055,.16,.045);
  }
  for(let i=0;i<11;i++){const a=(i-5)*.13;oval('bodhisattva-necklace',x+.26*Math.sin(a),statueY+1.62*scale-.14*Math.cos(a),z-.25,.026,.026,.026);}
 }
 if(hall.id==='yaksa')lathe('medicine-bowl',x+.05,statueY+.87*scale,z-.45*scale,[[.04,0],[.12,.02],[.155,.105],[.155,.125],[.13,.125],[.105,.05],[.04,.03]],gold);
 if(hall.id==='munsu'){
  line('wisdom-lotus-stem',[[x+.34,statueY+.9,z-.27],[x+.66,statueY+1.20,z-.22],[x+.70,statueY+1.55,z-.18]],.012,jade);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;oval('wisdom-lotus',x+.7+.1*Math.cos(a),statueY+1.55,z-.18+.08*Math.sin(a),.11,.13,.08);}
  box('wisdom-scripture',x+.70,statueY+1.64,z-.18,.33,.065,.23,ivory);
 }
 if(hall.id==='bohyeon'){
  line('vow-lotus-stem',[[x+.34,statueY+.9,z-.27],[x+.66,statueY+1.30,z-.22],[x+.70,statueY+1.58,z-.18]],.012,jade);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;oval('vow-lotus',x+.7+.10*Math.cos(a),statueY+1.58,z-.18+.08*Math.sin(a),.09,.20,.075);}
 }
 for(const side of [-1,1]){
  const px=x+side*1.8,pz=z-.36;
  lathe('brass-candlestick',px,floor+.68,pz,[[.13,0],[.14,.045],[.045,.10],[.035,.28],[.12,.32],[.12,.36]]);
  lathe('altar-candle',px,floor+1.04,pz,[[.045,0],[.047,.25],[.02,.28],[0,.27]],ivory);
  oval('altar-flame',px,floor+1.39,pz,.048,.15,.048,fire);
  for(const dz of [-2.5,-.7]){
   const pad=oval('prayer-cushion',x+side*1.35,floor+.065,dz,1.04,.13,.86,cloth);pad.receiveShadows=true;
  }
 }
 // Material sharing and batching remain in the main scene, including all altar geometry.
 const rotation=Quaternion.RotationAxis(Vector3.Up(),hall.yaw);
 for(const mesh of parts.slice(first)){
  const [px,pz]=prayerHallPoint(hall,mesh.position.x,mesh.position.z);
  mesh.position.x=px;mesh.position.z=pz;
  mesh.rotationQuaternion=rotation.multiply(mesh.rotationQuaternion??Quaternion.FromEulerVector(mesh.rotation));
  mesh.name=hall.id+'-'+mesh.name;
 }
}
