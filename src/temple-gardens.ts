import {quietGardenBeds,quietShrubClusters} from './quiet-garden-layout';
import {woodlandGroups,groveBounds} from './woodland-groups';
import {treeSeason} from './seasonal-tree';
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
export const bambooSites=interiorWoodland.filter(p=>p.kind==='bamboo');
export const inBambooGarden=(x:number,z:number)=>bambooSites.some(p=>p.x===x&&p.z===z);
export function furnishGardens(scene:Scene,parts:Mesh[],stone?:StandardMaterial){
 const material=(name:string,color:string)=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();m.backFaceCulling=false;m.twoSidedLighting=true;return m;};
 const moss=material('garden-moss','#303923'),grass=material('garden-meadow','#294326'),leaf=material('garden-leaf','#244329'),bark=material('garden-bark','#79725a'),cane=material('garden-bamboo','#587b36'),joint=material('garden-bamboo-joint','#9ea86a');
 const bambooLeaf=material('garden-bamboo-leaf','#4d7836');bambooLeaf.emissiveColor=Color3.FromHexString('#304c22').scale(.05);
 const cover=new DynamicTexture('soft-moss-edge',256,scene,true),brush=cover.getContext() as CanvasRenderingContext2D;
 const fade=brush.createRadialGradient(128,128,15,128,128,128);fade.addColorStop(0,'rgba(255,255,255,.75)');fade.addColorStop(.6,'rgba(255,255,255,.5)');fade.addColorStop(1,'rgba(255,255,255,0)');brush.fillStyle=fade;brush.fillRect(0,0,256,256);cover.hasAlpha=true;cover.update();moss.diffuseTexture=cover;moss.useAlphaFromDiffuseTexture=true;moss.transparencyMode=2;moss.alpha=.72;
 const add=(mesh:Mesh,m:StandardMaterial)=>{mesh.material=m;mesh.isPickable=false;parts.push(mesh);return mesh;};
 const clear=(x:number,z:number)=>[...paving.map(p=>[p.from,p.to]),...([sanctuaryWalk,rearPrayerWalk,...prayerHallApproaches.map(a=>a.route),teaApproach,teaGardenWalk].flatMap(path=>path.slice(1).map((p,i)=>[path[i],p])))].every(([a,b])=>distanceToSegment(x,z,a,b)>2.1);
 function patch(x:number,z:number,rx:number,rz:number,seed:number,finish=moss){
  const pos=[x,.035,z],uv=[.5,.5],indices:number[]=[];
  for(let i=0;i<=14;i++){const a=i/14*Math.PI*2,r=1+.12*Math.sin(a*3+seed)+.06*Math.cos(a*5);pos.push(x+Math.cos(a)*rx*r,.035,z+Math.sin(a)*rz*r);uv.push(.5+.5*Math.cos(a),.5+.5*Math.sin(a));if(i){const previous=(i)*3,current=(i+1)*3;if(clear(pos[previous],pos[previous+2])&&clear(pos[current],pos[current+2]))indices.push(0,i+1,i);}}
  const data=new VertexData();data.positions=pos;data.indices=indices;data.uvs=uv;data.normals=[];VertexData.ComputeNormals(pos,indices,data.normals);const mesh=new Mesh('garden-moss-patch',scene);data.applyToMesh(mesh);add(mesh,finish);
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
  if(clear(x,z)&&!woodlandGroups.some(g=>{const b=groveBounds(g);return Math.abs(x-b.x)<b.rx+1&&Math.abs(z-b.z)<b.rz+1;}))bed(x,z,rx,rz,x+z);
 }
 // A few low, open shrubs provide depth without filling the walking court.
 for(const [x,z]of[[-33,-58],[-33,-40],[45,-16],[63,-12],[47,7],[71,15],[72,-22],[37,24]]){
  if(!clear(x,z))continue;
  const stem=MeshBuilder.CreateCylinder('garden-shrub-stem',{height:.75,diameter:.07,tessellation:5},scene);stem.position.set(x,.375,z);add(stem,bark);
  for(let i=0;i<4;i++){const a=i*2.4,m=MeshBuilder.CreateIcoSphere('garden-low-shrub',{radius:1,subdivisions:1},scene);m.position.set(x+Math.cos(a)*.45,.55+(i%2)*.2,z+Math.sin(a)*.45);m.scaling.set(.65,.30,.55);add(m,leaf);}
 }
 // A shared litter map unifies each seasonal grove, rather than overlapping a disc under every tree.
 const litter=material('garden-grove-litter','#766246');
 const litterTexture=new DynamicTexture('shared-grove-litter',256,scene,true),lc=litterTexture.getContext() as CanvasRenderingContext2D;
 const season=treeSeason();lc.fillStyle=season==='winter'?'#c7c5b5':'#8a7355';lc.fillRect(0,0,256,256);
 let seed=513;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<2200;i++){
  lc.fillStyle=(season==='spring'?['#d9b4bb88','#bb977b88','#716b5488']:season==='winter'?['#e5e7dc99','#9c9a8899','#bab7a499']:['#ba874b99','#94734c88','#736b4788'])[i%3];
  lc.beginPath();lc.ellipse(rand()*256,rand()*256,.7+rand()*2.2,.35+rand(),rand()*6.28,0,Math.PI*2);lc.fill();
 }
 const image=lc.getImageData(0,0,256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const dx=(x-128)/128,dz=(y-128)/128,a=Math.atan2(dz,dx),r=Math.hypot(dx,dz)/(1+.06*Math.sin(a*5));
  image.data[(y*256+x)*4+3]=Math.round(100*Math.max(0,Math.min(1,(1-r)/.24)));
 }
 lc.putImageData(image,0,0);litterTexture.hasAlpha=true;litterTexture.update();litter.diffuseTexture=litterTexture;litter.useAlphaFromDiffuseTexture=true;litter.transparencyMode=2;
 const groveBeds=woodlandGroups.map(group=>({...groveBounds(group),id:group.id,kind:group.kind}));
 for(const [index,g]of groveBeds.entries()){
  patch(g.x,g.z,g.rx,g.rz,index,g.kind==='bamboo'?moss:litter);
  // Sparse low plants sit at the grove edge; the trunk count and canopy models are unchanged.
  for(let n=0;n<9;n++){const a=n*2.4+index,px=g.x+Math.cos(a)*g.rx*.86,pz=g.z+Math.sin(a)*g.rz*.86;if(clear(px,pz))tuft(px,pz,.45+(n%3)*.14,a);}
 }
 // Wider, connected edge beds turn leftover ground into intentional gardens.
 for(const [index,g]of quietGardenBeds.entries()){
  patch(g.x,g.z,g.rx,g.rz,index+17,g.kind==='bamboo'?moss:litter);
  for(let n=0;n<16;n++){const a=n*2.4+index,r=.55+.35*(n%4)/3,px=g.x+Math.cos(a)*g.rx*r,pz=g.z+Math.sin(a)*g.rz*r;if(clear(px,pz))tuft(px,pz,.34+(n%3)*.12,a);}
 }
 for(const [index,[x,z]]of quietShrubClusters.entries()){
  if(!clear(x,z))continue;
  for(let n=0;n<3;n++){const a=index+n*2.4,m=MeshBuilder.CreateIcoSphere('garden-edge-underplant',{radius:1,subdivisions:1},scene);m.position.set(x+Math.cos(a)*.38,.37+n*.075,z+Math.sin(a)*.38);m.scaling.set(.80,.40,.68);m.rotation.y=a;add(m,leaf);}
 }
 // Short, separated planting beds soften the distant walls, leaving the middle of the yard open.
 for(const [x,z,rx,rz]of[[-54,91,1.4,5],[-5,112,4,1.25],[25,112,5.5,1.3],[70,111,7,1.4],[92,93,1.25,6],[92,35,1.4,3]]){
  if(clear(x,z))bed(x,z,rx,rz,x+z);
 }
 const edgeStone=stone??material('garden-edge-granite','#928d7e');
 for(const [index,g]of groveBeds.entries())for(let n=0;n<5;n++){
  const a=n*2.4+index,px=g.x+Math.cos(a)*(g.rx+.2),pz=g.z+Math.sin(a)*(g.rz+.2);
  if(!clear(px,pz))continue;
  const rock=MeshBuilder.CreateIcoSphere('garden-edge-stone',{radius:1,subdivisions:1},scene);
  rock.position.set(px,.07,pz);rock.scaling.set(.15+rand()*.16,.09+rand()*.10,.14+rand()*.15);rock.rotation.y=a;add(rock,edgeStone);
 }
 for(const [x,z]of[[-53,92],[-6,112],[24,112],[71,111],[91.5,94]])for(let n=0;n<3;n++){
  const px=x+Math.cos(n*2.4)*.7,pz=z+Math.sin(n*2.4)*.7;if(!clear(px,pz))continue;
  const shrub=MeshBuilder.CreateIcoSphere('garden-low-shrub',{radius:1,subdivisions:1},scene);shrub.position.set(px,.28+(n%2)*.12,pz);shrub.scaling.set(.65,.32,.59);add(shrub,leaf);
 }
 // Opaque leaf geometry avoids transparency overdraw; the scene batches each shared material.
 for(const [index,p]of bambooSites.entries()){
  const collider=MeshBuilder.CreateCylinder('meditation-tree',{height:5,diameter:1.7,tessellation:5},scene);collider.position.set(p.x,2.5,p.z);collider.isVisible=false;parts.push(collider);
  for(let n=0;n<6;n++){
   const a=n*2.4+index,x=p.x+Math.cos(a)*(.25+n*.12),z=p.z+Math.sin(a)*(.25+n*.12),h=4.2+1.3*Math.sin(n*1.8+index)**2;
   const stalk=MeshBuilder.CreateCylinder('bamboo-cane',{height:h,diameterBottom:.14,diameterTop:.085,tessellation:7},scene);stalk.position.set(x,h/2,z);add(stalk,cane);
   for(let k=1;k<7;k++){const y=h*k/7;const ring=MeshBuilder.CreateCylinder('bamboo-node',{height:.045,diameter:.15,tessellation:7},scene);ring.position.set(x,y,z);add(ring,joint);}
   for(let k=0;k<5;k++){
    const b=a+k*2.39996,y=h*(.40+k*.125),dir=new Vector3(Math.cos(b),.13,Math.sin(b));
    const twig=MeshBuilder.CreateTube('bamboo-twig',{path:[new Vector3(x,y,z),new Vector3(x+dir.x*1.25,y+.16,z+dir.z*1.25)],radius:.014,tessellation:3},scene);add(twig,cane);
    const pos:number[]=[],ids:number[]=[];
    for(let l=0;l<9;l++){const side=l%2?1:-1,at=.16+l*.12,px=x+dir.x*at,pz=z+dir.z*at,dx=dir.x*.28-dir.z*(.40+.08*Math.sin(l))*side,dz=dir.z*.28+dir.x*(.40+.08*Math.sin(l))*side,j=pos.length/3;pos.push(px,y+.12,pz,px+dx*.45-dir.z*.035,y+.17,pz+dz*.45+dir.x*.035,px+dx,y+.03,pz+dz,px+dx*.45+dir.z*.035,y+.09,pz+dz*.45-dir.x*.035);ids.push(j,j+1,j+2,j,j+2,j+3);}
    const data=new VertexData();data.positions=pos;data.indices=ids;data.normals=[];VertexData.ComputeNormals(pos,ids,data.normals);const mesh=new Mesh('bamboo-leaf-spray',scene);data.applyToMesh(mesh);add(mesh,bambooLeaf);
   }
  }
 }
 return {bambooClumps:bambooSites.length,seasonalTrees:interiorWoodland.length-bambooSites.length,groves:woodlandGroups.length};
}
