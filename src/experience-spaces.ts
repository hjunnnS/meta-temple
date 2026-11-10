import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {teaPavilion,teaTerrace,teaSeats,teaTables,teaGardenTables,teaGardenWalk,personalGate,sanctuaryWalk,teaApproach,gateApproach,type GroundPoint} from './temple-terrain';

export function placeExperienceSpaces(scene:Scene,parts:Mesh[],wood:StandardMaterial,roof:StandardMaterial,stone:StandardMaterial){
 function box(name:string,w:number,h:number,d:number,x:number,y:number,z:number,material:StandardMaterial){
  const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
  mesh.position.set(x,y,z);mesh.material=material;mesh.receiveShadows=true;parts.push(mesh);return mesh;
 }
 const trail=new StandardMaterial('forest-walk-earth',scene);trail.diffuseColor=Color3.FromHexString('#a99b7d');trail.specularColor=Color3.Black();
 const tex=new DynamicTexture('forest-walk-fine-earth',256,scene,true),c=tex.getContext() as CanvasRenderingContext2D;
 c.fillStyle='#c1b49b';c.fillRect(0,0,256,256);
 let state=72;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let i=0;i<10000;i++){c.fillStyle=i%2?'#f5e7c577':'#625d4b55';c.fillRect(random()*256,random()*256,.5+random()*1.7,.5+random()*1.8);}
 tex.update();trail.diffuseTexture=tex;
 function path(name:string,route:GroundPoint[],width:number){
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[],normals:number[]=[];let along=0;
  for(let i=0;i<route.length;i++){
   const point=route[i],prev=route[Math.max(0,i-1)],next=route[Math.min(route.length-1,i+1)];
   if(i)along+=Math.hypot(point[0]-prev[0],point[1]-prev[1]);
   const dx=next[0]-prev[0],dz=next[1]-prev[1],length=Math.hypot(dx,dz);
   for(const side of [-1,1]){
    positions.push(point[0]+side*dz/length*width/2,.018,point[1]-side*dx/length*width/2);
    uvs.push(side*.5+.5,along/2);normals.push(0,1,0);
   }
   if(i){const k=i*2;indices.push(k-2,k,k-1,k-1,k,k+1);}
  }
  const data=new VertexData();data.positions=positions;data.indices=indices;data.uvs=uvs;data.normals=normals;
  const mesh=new Mesh(name,scene);data.applyToMesh(mesh);mesh.material=trail;mesh.receiveShadows=true;
  trail.backFaceCulling=false;
 }
 path('sanctuary-walking-trail',sanctuaryWalk,1.8);
 path('tea-pavilion-trail',teaApproach,1.5);
 path('tea-garden-walking-trail',teaGardenWalk,1.5);
 path('personal-gate-trail',gateApproach,1.6);
 function plaque(text:string,x:number,y:number,z:number,yaw:number,width:number){
  const texture=new DynamicTexture('place-sign-'+text,{width:1024,height:256},scene,true),brush=texture.getContext() as CanvasRenderingContext2D;
  brush.fillStyle='#203d32';brush.fillRect(0,0,1024,256);brush.strokeStyle='#bca16c';brush.lineWidth=10;brush.strokeRect(12,12,1000,232);
  brush.font='bold 80px serif';brush.fillStyle='#eadfba';brush.textAlign='center';brush.textBaseline='middle';brush.fillText(text,512,133,940);texture.update();
  const m=new StandardMaterial('place-sign-'+text,scene);m.diffuseTexture=texture;m.emissiveColor=new Color3(.06,.05,.03);
  const sign=MeshBuilder.CreatePlane('place-name',{width,height:width/4,sideOrientation:Mesh.DOUBLESIDE},scene);
  sign.position.set(x,y,z);sign.rotation.y=yaw;sign.material=m;parts.push(sign);
 }
 const t=teaPavilion;
 box('tea-pavilion-plinth',t.width+.3,.16,t.depth+.3,t.x,.08,t.z,stone);
 box('tea-pavilion-hall-floor',t.width,.16,t.depth,t.x,.24,t.z,wood);
 box('tea-terrace-plinth',teaTerrace.width+.3,.16,teaTerrace.depth,teaTerrace.x,.08,teaTerrace.z,stone);
 box('tea-terrace-hall-floor',teaTerrace.width,.16,teaTerrace.depth,teaTerrace.x,.24,teaTerrace.z,wood);
 box('tea-pavilion-step',.65,.15,1.7,t.x-t.width/2-.3,.075,teaTerrace.z,stone);
 box('tea-terrace-east-step',.65,.15,1.7,t.x+t.width/2+.3,.075,teaTerrace.z,stone);
 const timber=new StandardMaterial('tea-furniture-oak',scene);timber.diffuseColor=Color3.FromHexString('#9e7951');timber.specularColor=new Color3(.07,.06,.04);
 const cushion=new StandardMaterial('tea-chair-linen',scene);cushion.diffuseColor=Color3.FromHexString('#b8b099');cushion.specularColor=Color3.Black();
 for(const dx of [-6.65,6.65])for(const dz of [-3.65,3.65])box('tea-pavilion-column',.22,3.15,.22,t.x+dx,1.89,t.z+dz,wood);
 for(const dz of [-3.65,3.65])box('tea-pavilion-beam',13.6,.25,.25,t.x,3.46,t.z+dz,wood);
 // Hipped tile roof, scaled to the expanded floor without closing the pond-facing side.
 const roofMesh=MeshBuilder.CreateCylinder('tea-pavilion-roof',{diameterBottom:21,diameterTop:7,height:.85,tessellation:4},scene);
 roofMesh.rotation.y=Math.PI/4;roofMesh.scaling.z=.61;roofMesh.position.set(t.x,3.98,t.z);roofMesh.material=roof;parts.push(roofMesh);
 box('tea-pavilion-roof-ridge',8,.14,.19,t.x,4.46,t.z,roof);
 for(const {x,z} of teaTables){
  box('tea-pavilion-table',2.2,.12,.78,x,1.02,z,timber);
  for(const dx of [-.85,.85])box('tea-table-pillar',.10,.64,.10,x+dx,.64,z,timber);
 }
 for(const table of teaGardenTables){
  const pad=MeshBuilder.CreateCylinder('tea-garden-paving',{diameter:2.8,height:.025,tessellation:32},scene);pad.position.set(table.x,.0125,table.z-.35);pad.material=stone;pad.receiveShadows=true;parts.push(pad);
  const top=MeshBuilder.CreateCylinder('tea-garden-round-table',{diameter:1.15,height:.10,tessellation:40},scene);top.position.set(table.x,.71,table.z);top.material=timber;top.receiveShadows=true;parts.push(top);
  box('tea-garden-table-pillar',.13,.64,.13,table.x,.34,table.z,timber);
  box('tea-garden-table-foot',.62,.055,.62,table.x,.04,table.z,timber);
 }
 for(const seat of teaSeats){
  const offset=seat.ground-.32;
  box('tea-chair-seat',.65,.12,.58,seat.x,.72+offset,seat.z,timber);
  box('tea-chair-linen',.61,.055,.53,seat.x,.80+offset,seat.z,cushion);
  box('tea-chair-back-wall',.65,.42,.075,seat.x,1.01+offset,seat.z-.29,timber);
  for(const dx of [-.25,.25])for(const dz of [-.21,.21])box('tea-chair-pillar',.075,.37,.075,seat.x+dx,.505+offset,seat.z+dz,timber);
 }
 plaque('차 · 커피 쉼터',t.x-6.82,3.09,t.z,Math.PI/2,2.6);
 const g=personalGate;
 for(const dz of [-1.45,1.45]){
  box('personal-gate-base',.72,.16,.72,g.x,.08,g.z+dz,stone);
  box('personal-gate-column',.30,3.0,.30,g.x,1.64,g.z+dz,wood);
 }
 box('personal-gate-crossbeam',.44,.30,3.55,g.x,3.08,g.z,wood);
 const gateRoof=MeshBuilder.CreateCylinder('personal-gate-roof',{diameterBottom:5,diameterTop:1.8,height:.58,tessellation:4},scene);
 gateRoof.rotation.y=Math.PI/4;gateRoof.scaling.x=.60;gateRoof.position.set(g.x,3.49,g.z);gateRoof.material=roof;parts.push(gateRoof);
 plaque('시간과 공간의 방',g.x-.245,2.76,g.z,Math.PI/2,2.3);
}
