import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

export function furnishBell(scene:Scene, meshes:Mesh[], x:number,z:number, wood:StandardMaterial){
 const finish=(name:string,color:string,lift:number)=>{
  const m=new StandardMaterial(name,scene);
  m.diffuseColor=Color3.FromHexString(color);m.emissiveColor=m.diffuseColor.scale(lift);
  m.specularColor=Color3.FromHexString('#908568');m.specularPower=38;return m;
 };
 const bronze=finish('cast-bronze','#ac9971',.10);
 const relief=finish('burnished-relief','#ad9562',.14);
 const rope=finish('hemp','#96774d',.10);
 rope.specularColor=Color3.Black();
 const skin=new DynamicTexture('bronze-patina',{width:512,height:256},scene,true);
 const ctx=skin.getContext() as CanvasRenderingContext2D;
 const pixels=ctx.createImageData(512,256);
 let seed=109;
 for(let v=0;v<256;v++)for(let u=0;u<512;u++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const a=u*Math.PI/256;
  const oxide=(1+Math.sin(5*a+v*.027)*Math.cos(3*a-v*.046)+.45*Math.sin(21*a+v*.08))/2.45;
  const grain=(seed/4294967296-.5)*27;
  pixels.data.set([157-75*oxide+grain,138-28*oxide+grain,105-7*oxide+grain,255],4*(v*512+u));
 }
 ctx.putImageData(pixels,0,0);skin.update();bronze.diffuseTexture=skin;
 function mount(mesh:Mesh,m:StandardMaterial,dx=0,y=0,dz=0){
  mesh.material=m;mesh.position.set(x+dx,y,z+dz);meshes.push(mesh);return mesh;
 }
 const axis=.92;
 const profile=[[1.14,.78],[1.16,.70],[1.09,.68],[1.02,.72],[.95,.88],[.88,1.35],[.80,2.30],[.73,2.90],[.67,3.24],[.55,3.42],[.36,3.54],[.14,3.59],[0,3.59]];
 mount(MeshBuilder.CreateLathe('bell-shell',{shape:profile.map(([r,h])=>new Vector3(r,h,0)),tessellation:96,sideOrientation:Mesh.DOUBLESIDE},scene),bronze,axis);
 function tube(name:string,path:Vector3[],radius:number,m=relief){
  return mount(MeshBuilder.CreateTube(name,{path,radius,tessellation:8,cap:Mesh.CAP_ALL},scene),m);
 }
 const polar=(a:number,r:number,h:number)=>new Vector3(axis+r*Math.cos(a),h,r*Math.sin(a));
 for(const [r,h] of [[1.12,.77],[.96,.89],[.95,.96],[.745,2.87],[.725,2.98],[.68,3.21]]){
  tube('raised-border',Array.from({length:97},(_,i)=>polar(i*Math.PI/48,r,h)),.018);
 }
 for(let panel=0;panel<4;panel++){
  const a=panel*Math.PI/2;
  for(let row=0;row<3;row++)for(let col=-1;col<=1;col++){
   const h=2.52+row*.12;const p=polar(a+col*.16,.80-(h-2.30)*.116,h);
   mount(MeshBuilder.CreateSphere('cast-boss',{diameter:.084,segments:10},scene),relief,p.x,p.y,p.z);
  }
  // Eight petals radiate from each circular striking medallion.
  for(const petalled of [false,true]){
   const points=Array.from({length:97},(_,i)=>{
    const t=i*Math.PI/48, size=petalled?.16+.06*Math.cos(8*t):.26;
    const h=1.53+size*Math.sin(t);
    return polar(a+size*Math.cos(t)/.87,.89-(h-1.35)*.085,h);
   });
   tube('lotus-strike-medallion',points,.024);
  }
 }
 tube('crown-loop',Array.from({length:33},(_,i)=>new Vector3(axis+.23*Math.cos(i*Math.PI/16),3.80+.28*Math.sin(i*Math.PI/16),0)),.083);
 tube('bell-hanger',[new Vector3(axis,4.02,0),new Vector3(axis,4.52,0)],.075);
 const log=mount(MeshBuilder.CreateCylinder('hanging-striker',{diameter:.38,height:2.45,tessellation:40},scene),wood,-1.52,1.53);
 log.rotation.z=Math.PI/2;
 for(const dx of [-2.36,-.68]){
  tube('striker-sling',[new Vector3(dx,4.48,-.53),new Vector3(dx,1.55,-.21),new Vector3(dx,1.31,0),new Vector3(dx,1.55,.21),new Vector3(dx,4.48,.53)],.033,rope);
 }
}
