import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {Matrix,Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector';
import type {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import type {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import {treeSpecimen} from './tree-specimen';
import {inBambooGarden} from './temple-gardens';
import {interiorWoodland} from './temple-terrain';

export function distanceTrees(scene:Scene,shadows:ShadowGenerator){
 const tiers=[1,3,8].map(stride=>{
  const parts:Mesh[]=[];treeSpecimen(scene,parts,0,0,3.8,false,stride);
  const groups=new Map<StandardMaterial,Mesh[]>();
  for(const part of parts){
   const material=part.material as StandardMaterial;
   if(!groups.has(material))groups.set(material,[]);
   groups.get(material)!.push(part);
  }
  return [...groups.values()].map(parts=>{
   const mesh=Mesh.MergeMeshes(parts,true,true)!;
   mesh.name='interior-seasonal-tree-lod-'+stride;
   mesh.receiveShadows=true;mesh.isPickable=false;mesh.setEnabled(false);
   // Only nearby foliage casts detailed shadows.
   if(stride===1)shadows.addShadowCaster(mesh);
   return mesh;
  });
 });
 const trees=interiorWoodland.filter(p=>!inBambooGarden(p.x,p.z)).map(({x,z},i)=>{
  const size=1.48+.20*Math.sin(i*2.1);
  return {position:new Vector3(x,2.6,z),matrix:Matrix.Compose(new Vector3(size,size,size),Quaternion.RotationAxis(Vector3.Up(),i*2.4),new Vector3(x,0,z))};
 });
 let last=-Infinity,key='';
 return (camera:Vector3,now:number)=>{
  if(now-last<250)return;last=now;
  const levels=trees.map(t=>{
   const d=Vector3.Distance(camera,t.position);
   return d<28?0:d<70?1:2;
  });
  const next=levels.join(',');
  if(next===key)return;key=next;
  for(const [level,meshes] of tiers.entries()){
   const matrices=trees.filter((_,i)=>levels[i]===level).map(t=>t.matrix);
   for(const mesh of meshes){
    mesh.setEnabled(matrices.length>0);
    mesh.thinInstanceSetBuffer('matrix',null);
    if(matrices.length)mesh.thinInstanceAdd(matrices);
   }
  }
 };
}
