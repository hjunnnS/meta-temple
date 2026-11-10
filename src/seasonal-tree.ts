import type {Scene} from '@babylonjs/core/scene.js';
import type {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';

export function treeSeason(date=new Date()){
 const month=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',month:'numeric'}).format(date));
 return month>=3&&month<=5?'spring':month>=6&&month<=11?'autumn':'winter';
}
export function seasonalTrees(scene:Scene,meshes:Mesh[],bark:StandardMaterial,detail=1){
 const season=treeSeason();
 const palette=season==='spring'?['#f8c7d8','#ffe4e5','#eeb0c5']:
  season==='autumn'?['#a76638','#bd8b43','#98553a','#bf9a54']:['#f4f7f7','#dde7eb','#fffaf0'];
 const materials=palette.map((hex,i)=>{
  const m=new StandardMaterial('seasonal-'+season+'-'+i,scene);m.diffuseColor=Color3.FromHexString(hex);
  m.specularColor=Color3.Black();return m;
 });
 function branch(name:string,path:Vector3[],radius:number){
  const mesh=MeshBuilder.CreateTube(name,{path,radius,tessellation:7,cap:3},scene);
  mesh.material=bark;meshes.push(mesh);return mesh;
 }
 return (x:number,z:number,height:number,id=0)=>{
  branch('meditation-tree',[new Vector3(x,0,z),new Vector3(x-.12,height*.36,z+.11),new Vector3(x+.17,height*.68,z)],height*.024);
  for(let j=0;j<7;j++){
   const a=j*2.39996+id,layer=j/7;
   const spread=height*(.27-.10*layer);
   const end=new Vector3(x+Math.cos(a)*spread,height*(.52+.34*layer),z+Math.sin(a)*spread);
   branch('tree-branch',[new Vector3(x,height*(.32+.24*layer),z),
    new Vector3(x+(end.x-x)*.58,end.y-height*.07,z+(end.z-z)*.58),end],height*(.009-.004*layer));
   const crown=MeshBuilder.CreateSphere('seasonal-crown',{diameter:height*(.34+.035*Math.sin(j*2.7)),segments:detail===1?6:4},scene);
   crown.position.copyFrom(end);crown.scaling.set(1.14,season==='winter'?.22:.47+.10*Math.cos(j*1.7),.93);
   crown.rotation.y=j*.83;crown.rotation.z=.12*Math.sin(j*2.3);
   const positions=crown.getVerticesData('position')!;
   for(let k=0;k<positions.length;k+=3){
    const px=positions[k],py=positions[k+1],pz=positions[k+2];
    const scale=1+.14*Math.sin(px*9+py*5+pz*7+j);
    positions[k]=px*scale;positions[k+1]=py*(1+.13*Math.sin(px*11+pz*7));positions[k+2]=pz*scale;
   }
   crown.updateVerticesData('position',positions);crown.refreshBoundingInfo();
   if(season==='winter')crown.position.y+=height*.025;
   crown.material=materials[(id+j)%materials.length];crown.receiveShadows=true;meshes.push(crown);

  }
 };
}
