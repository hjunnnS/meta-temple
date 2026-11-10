import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {treeSeason,seasonalTrees} from './seasonal-tree';
import {pond,shoreRadius} from './temple-terrain';

export function treeSpecimen(scene:Scene,parts:Mesh[],x:number,z:number,height:number,forestFloor=true,leafStride=1){
 let seed=7103;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const season=treeSeason();
 const bark=new StandardMaterial('specimen-bark',scene);bark.diffuseColor=Color3.FromHexString('#786750');
 bark.specularColor=Color3.Black();
 seasonalTrees(scene,parts,bark,leafStride)(x,z,height);
 if(!forestFloor)return;
 // A feathered mulch patch stays on the land side of the irregular shore.
 const ground=new DynamicTexture('specimen-soil-and-litter',512,scene,true),gc=ground.getContext() as CanvasRenderingContext2D;
 gc.fillStyle='#9b8e75';gc.fillRect(0,0,512,512);
 for(let i=0;i<28000;i++){
  gc.fillStyle=['#645c4c55','#e1d2ad77','#8d7d6266'][i%3];
  gc.fillRect(rnd()*512,rnd()*512,.5+rnd()*2,.5+rnd()*2);
 }
 for(let i=0;i<750;i++){
  gc.fillStyle=['#a66c39aa','#75593baa','#b39a6588','#78766d99'][i%4];
  gc.beginPath();gc.ellipse(rnd()*512,rnd()*512,1+rnd()*3,.5+rnd()*1.4,rnd()*6.28,0,6.28);gc.fill();
 }
 const image=gc.getImageData(0,0,512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const r=Math.hypot((x-256)/256,(y-256)/256);
  image.data[(y*512+x)*4+3]=Math.round(255*Math.min(1,Math.max(0,(1-r)/.23)));
 }
 gc.putImageData(image,0,0);ground.hasAlpha=true;ground.update();
 const m=new StandardMaterial('specimen-forest-floor',scene);m.diffuseTexture=ground;m.useAlphaFromDiffuseTexture=true;m.specularColor=Color3.Black();m.backFaceCulling=false;
 const data=new VertexData(),positions:number[]=[],indices:number[]=[],uvs:number[]=[],normals:number[]=[];
 const angle=Math.atan2((z-pond.z)/pond.depth,(x-pond.x)/pond.width),cx=x+Math.cos(angle)*1.5,cz=z+Math.sin(angle)*1.5;
 const n=32;
 for(let row=0;row<=n;row++)for(let col=0;col<=n;col++){
  positions.push(cx+(col/n-.5)*11,.026,cz+(row/n-.5)*9);uvs.push(col/n,row/n);normals.push(0,1,0);
  if(row===n||col===n)continue;
  const px=cx+((col+.5)/n-.5)*11,pz=cz+((row+.5)/n-.5)*9;
  const a=Math.atan2((pz-pond.z)/pond.depth,(px-pond.x)/pond.width);
  if(Math.hypot((px-pond.x)/(pond.width/2),(pz-pond.z)/(pond.depth/2))<shoreRadius(a)+.015)continue;
  const k=row*(n+1)+col;indices.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);
 }
 data.positions=positions;data.indices=indices;data.uvs=uvs;data.normals=normals;
 const patch=new Mesh('specimen-forest-floor',scene);data.applyToMesh(patch);patch.material=m;patch.receiveShadows=true;
}
