import type {Scene} from '@babylonjs/core/scene.js';
import type {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Mesh as LeafMesh} from '@babylonjs/core/Meshes/mesh.js';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';

export function treeSeason(date=new Date()){
 const month=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',month:'numeric'}).format(date));
 return month>=3&&month<=5?'spring':month>=6&&month<=11?'autumn':'winter';
}
export function seasonalTrees(scene:Scene,meshes:Mesh[],bark:StandardMaterial,detail=1){
 const season=treeSeason();
 const palette=season==='spring'?['#f8c7d8','#ffe4e5','#eeb0c5']:
  season==='autumn'?['#bd5129','#d7aa3e','#a53722','#c8802c','#7f893b']:['#f4f7f7','#dde7eb','#fffaf0'];
 const materials=palette.map((hex,i)=>{
  const m=new StandardMaterial('seasonal-'+season+'-'+i,scene);m.diffuseColor=Color3.FromHexString(hex);
  m.specularColor=Color3.Black();m.backFaceCulling=false;m.twoSidedLighting=true;m.emissiveColor=m.diffuseColor.scale(.045);return m;
 });
 function branch(name:string,path:Vector3[],radius:number){
  const mesh=MeshBuilder.CreateTube(name,{path,radius,tessellation:7,cap:3},scene);
  mesh.material=bark;meshes.push(mesh);return mesh;
 }
 return (x:number,z:number,height:number,id=0)=>{
  branch('meditation-tree',[new Vector3(x,0,z),new Vector3(x-.12,height*.36,z+.11),new Vector3(x+.17,height*.68,z)],height*.024);
  const leaves=materials.map(()=>({positions:[] as number[],indices:[] as number[]}));
  for(let j=0;j<7;j++){
   const a=j*2.39996+id,layer=j/7;
   const spread=height*(.27-.10*layer);
   const end=new Vector3(x+Math.cos(a)*spread,height*(.52+.34*layer),z+Math.sin(a)*spread);
   branch('tree-branch',[new Vector3(x,height*(.32+.24*layer),z),
    new Vector3(x+(end.x-x)*.58,end.y-height*.07,z+(end.z-z)*.58),end],height*(.009-.004*layer));
   if(season==='winter'){
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
   }else{
    // Opaque, lobed leaf geometry leaves real gaps and catches sunlight on different planes.
    // The same sample centres are retained between LOD tiers; distant leaves grow modestly.
    let seed=(7103+j*1777+id*97)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const outline=[[0,1],[.20,.36],[.62,.65],[.44,.13],[.94,.10],[.38,-.23],[.35,-.65],[0,-.42],[-.35,-.65],[-.38,-.23],[-.94,.10],[-.44,.13],[-.62,.65],[-.20,.36]];
    for(let n=0;n<120;n++){
     const a=n*2.39996+j,r=Math.cbrt(random()),v=random()*2-1,s=Math.sqrt(1-v*v);
     const cx=end.x+Math.cos(a)*s*r*height*.22,cy=end.y+v*r*height*.115,cz=end.z+Math.sin(a)*s*r*height*.19;
     const size=height*(.035+random()*.024)*Math.sqrt(detail),yaw=random()*Math.PI*2,tilt=.2+random()*1.6,roll=random()*Math.PI*2;
     const bucket=leaves[(id+j+(n%5===0?1:0))%materials.length];
     if(n%detail)continue;
     const base=bucket.positions.length/3;
     function vertex(lx:number,lz:number,fold:number){
      const rx=(lx*Math.cos(roll)-lz*Math.sin(roll))*size,rz=(lx*Math.sin(roll)+lz*Math.cos(roll))*size;
      const ly=rz*Math.sin(tilt)+fold*size*.16,zz=rz*Math.cos(tilt);
      bucket.positions.push(cx+rx*Math.cos(yaw)+zz*Math.sin(yaw),cy+ly,cz-rx*Math.sin(yaw)+zz*Math.cos(yaw));
     }
     vertex(0,0,1);for(const [lx,lz]of outline)vertex(lx,lz,0);
     for(let k=0;k<outline.length;k++)bucket.indices.push(base,base+1+k,base+1+(k+1)%outline.length);
    }
   }

  }
  for(const [i,bucket]of leaves.entries()){if(!bucket.indices.length)continue;const data=new VertexData(),normals:number[]=[];data.positions=bucket.positions;data.indices=bucket.indices;VertexData.ComputeNormals(bucket.positions,bucket.indices,normals);data.normals=normals;const mesh=new LeafMesh('seasonal-lobed-leaves',scene);data.applyToMesh(mesh);mesh.material=materials[i];mesh.receiveShadows=true;meshes.push(mesh);}
 };
}
