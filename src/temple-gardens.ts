import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {interiorWoodland,paving,sanctuaryWalk,rearPrayerWalk,prayerHallApproaches,teaApproach,teaGardenWalk,distanceToSegment} from './temple-terrain';
import {courtSouthEdge,courtDepth,courtHalfWidth} from './temple-layout';
const bambooZone=(x:number,z:number)=>z>=60||(Math.abs(x)>=24&&z>=32);
export const bambooSites=interiorWoodland.filter((p,i)=>bambooZone(p.x,p.z)&&i%2===0);
export const inBambooGarden=(x:number,z:number)=>bambooSites.some(p=>p.x===x&&p.z===z);
export function furnishGardens(scene:Scene,parts:Mesh[]){
 const material=(name:string,color:string)=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();m.backFaceCulling=false;m.twoSidedLighting=true;return m;};
 const moss=material('garden-moss','#303923'),grass=material('garden-meadow','#294326'),leaf=material('garden-leaf','#244329'),bark=material('garden-bark','#79725a'),cane=material('garden-bamboo','#3b5839'),joint=material('garden-bamboo-joint','#a3aa78');
 const cover=new DynamicTexture('soft-moss-edge',256,scene,true),brush=cover.getContext() as CanvasRenderingContext2D;
 const fade=brush.createRadialGradient(128,128,15,128,128,128);fade.addColorStop(0,'rgba(255,255,255,.75)');fade.addColorStop(.6,'rgba(255,255,255,.5)');fade.addColorStop(1,'rgba(255,255,255,0)');brush.fillStyle=fade;brush.fillRect(0,0,256,256);cover.hasAlpha=true;cover.update();moss.diffuseTexture=cover;moss.useAlphaFromDiffuseTexture=true;moss.transparencyMode=2;moss.alpha=.72;
 const add=(mesh:Mesh,m:StandardMaterial)=>{mesh.material=m;mesh.isPickable=false;parts.push(mesh);return mesh;};
 const clear=(x:number,z:number)=>[...paving.map(p=>[p.from,p.to]),...([sanctuaryWalk,rearPrayerWalk,...prayerHallApproaches.map(a=>a.route),teaApproach,teaGardenWalk].flatMap(path=>path.slice(1).map((p,i)=>[path[i],p])))].every(([a,b])=>distanceToSegment(x,z,a,b)>2.1);
 function patch(x:number,z:number,rx:number,rz:number,seed:number){
  const pos=[x,.035,z],uv=[.5,.5],indices:number[]=[];
  for(let i=0;i<=14;i++){const a=i/14*Math.PI*2,r=1+.12*Math.sin(a*3+seed)+.06*Math.cos(a*5);pos.push(x+Math.cos(a)*rx*r,.035,z+Math.sin(a)*rz*r);uv.push(.5+.5*Math.cos(a),.5+.5*Math.sin(a));if(i)indices.push(0,i+1,i);}
  const data=new VertexData();data.positions=pos;data.indices=indices;data.uvs=uv;data.normals=[];VertexData.ComputeNormals(pos,indices,data.normals);const mesh=new Mesh('garden-moss-patch',scene);data.applyToMesh(mesh);add(mesh,moss);
 }
 function tuft(x:number,z:number,size:number,angle:number){
  const pos:number[]=[],ids:number[]=[];
  for(let i=0;i<5;i++){const a=angle+i*2.4,dx=Math.cos(a)*size*.28,dz=Math.sin(a)*size*.28,j=pos.length/3;pos.push(x-dz,.025,z+dx,x+dz,.025,z-dx,x+dx*.9,.16+size*.24,z+dz*.9);ids.push(j,j+1,j+2);}
  const d=new VertexData();d.positions=pos;d.indices=ids;d.normals=[];VertexData.ComputeNormals(pos,ids,d.normals);const mesh=new Mesh('garden-meadow-tuft',scene);d.applyToMesh(mesh);add(mesh,grass);
 }
 function bed(x:number,z:number,rx:number,rz:number,seed:number){patch(x,z,rx,rz,seed);for(let n=0;n<13;n++){const a=n*2.4+seed,r=.25+.65*((n*7)%13)/13,px=x+Math.cos(a)*rx*r,pz=z+Math.sin(a)*rz*r;if(clear(px,pz))tuft(px,pz,.5+.35*(n%3),a);}}
 // Keep the existing open court, routes and item footprints clear.
 for(const side of[-1,1])for(let i=0;i<9;i++){const z=courtSouthEdge+1.2+i*(courtDepth-2.4)/8;bed(side*(courtHalfWidth+1.05),z,.6,1.3,i);}
 for(const [x,z,rx,rz]of[[-33,-60,2,3],[-33,-51,1.3,2.8],[-33,-39,1.2,3],[-22,-61,3.5,1.8],[44,-17,4,2.5],[62,-12,4,2.7],[47,7,3,2.7],[71,15,2,4],[72,-22,2,3],[72,2,2,3],[38,24,3,2]]){
  if(clear(x,z))bed(x,z,rx,rz,x+z);
 }
 // A few low, open shrubs provide depth without filling the walking court.
 for(const [x,z]of[[-33,-58],[-33,-40],[45,-16],[63,-12],[47,7],[71,15],[72,-22],[37,24]]){
  if(!clear(x,z))continue;
  const stem=MeshBuilder.CreateCylinder('garden-shrub-stem',{height:.75,diameter:.07,tessellation:5},scene);stem.position.set(x,.375,z);add(stem,bark);
  for(let i=0;i<4;i++){const a=i*2.4,m=MeshBuilder.CreateIcoSphere('garden-low-shrub',{radius:1,subdivisions:1},scene);m.position.set(x+Math.cos(a)*.45,.55+(i%2)*.2,z+Math.sin(a)*.45);m.scaling.set(.65,.30,.55);add(m,leaf);}
 }
 // Opaque leaf geometry avoids transparency overdraw; the scene batches each shared material.
 for(const [index,p]of bambooSites.entries()){
  patch(p.x,p.z,1.7,1.3,index);
  const collider=MeshBuilder.CreateCylinder('meditation-tree',{height:5,diameter:.34,tessellation:5},scene);collider.position.set(p.x,2.5,p.z);collider.isVisible=false;parts.push(collider);
  for(let n=0;n<6;n++){
   const a=n*2.4+index,x=p.x+Math.cos(a)*(.25+n*.12),z=p.z+Math.sin(a)*(.25+n*.12),h=4.2+1.3*Math.sin(n*1.8+index)**2;
   const stalk=MeshBuilder.CreateCylinder('bamboo-cane',{height:h,diameterBottom:.095,diameterTop:.055,tessellation:5},scene);stalk.position.set(x,h/2,z);add(stalk,cane);
   for(let k=1;k<7;k++){const y=h*k/7;const ring=MeshBuilder.CreateCylinder('bamboo-node',{height:.035,diameter:.105,tessellation:5},scene);ring.position.set(x,y,z);add(ring,joint);}
   for(let k=0;k<3;k++){
    const b=a+k*2.1,y=h*(.62+k*.12),dir=new Vector3(Math.cos(b),.13,Math.sin(b));
    const twig=MeshBuilder.CreateTube('bamboo-twig',{path:[new Vector3(x,y,z),new Vector3(x+dir.x*.85,y+.16,z+dir.z*.85)],radius:.014,tessellation:3},scene);add(twig,cane);
    const pos:number[]=[],ids:number[]=[];
    for(let l=0;l<5;l++){const side=l%2?1:-1,at=.2+l*.13,px=x+dir.x*at,pz=z+dir.z*at,dx=dir.x*.22-dir.z*.4*side,dz=dir.z*.22+dir.x*.4*side,j=pos.length/3;pos.push(px,y+.12,pz,px+dx*.45-dir.z*.075,y+.17,pz+dz*.45+dir.x*.075,px+dx,y+.03,pz+dz,px+dx*.45+dir.z*.075,y+.09,pz+dz*.45-dir.x*.075);ids.push(j,j+1,j+2,j,j+2,j+3);}
    const data=new VertexData();data.positions=pos;data.indices=ids;data.normals=[];VertexData.ComputeNormals(pos,ids,data.normals);const mesh=new Mesh('bamboo-leaf-spray',scene);data.applyToMesh(mesh);add(mesh,leaf);
   }
  }
 }
 return {bambooClumps:bambooSites.length};
}
