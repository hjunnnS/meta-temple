import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Curve3} from '@babylonjs/core/Maths/math.path';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {sculptedFace} from './sculpted-face';

export function standingStoneFigure(scene:Scene,parts:Mesh[],x:number,z:number,scale=1){
 const firstPart=parts.length;
 const stone=new StandardMaterial('standing-buddha-granite',scene);
 stone.diffuseColor=Color3.FromHexString('#d4d1c4');stone.specularColor=Color3.Black();stone.emissiveColor=new Color3(.065,.064,.060);
 const grain=new DynamicTexture('stone-figure-minerals',512,scene,true),brush=grain.getContext() as CanvasRenderingContext2D;
 brush.fillStyle='#e1dfd6';brush.fillRect(0,0,512,512);
 let seed=2437;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<24000;i++){
  brush.fillStyle=i%3?'rgba(255,254,241,.48)':'rgba(102,100,91,.23)';
  const r=.35+rnd()*1.4;brush.fillRect(rnd()*512,rnd()*512,r,r*.7);
 }
 grain.update();stone.diffuseTexture=grain;
 const recess=new StandardMaterial('stone-figure-recess',scene);
 recess.diffuseColor=Color3.FromHexString('#a3a295');recess.specularColor=Color3.Black();
 function place(mesh:Mesh,material=stone){
  mesh.position.x+=x;mesh.position.z+=z;mesh.material=material;mesh.receiveShadows=true;parts.push(mesh);return mesh;
 }
 function oval(name:string,px:number,y:number,pz:number,w:number,h:number,d:number){
  const mesh=MeshBuilder.CreateSphere(name,{diameter:1,segments:24},scene);
  mesh.position.set(px,y,pz);mesh.scaling.set(w,h,d);return place(mesh);
 }
 function drum(name:string,diameter:number,height:number,y:number,top=diameter){
  const mesh=MeshBuilder.CreateCylinder(name,{diameterBottom:diameter,diameterTop:top,height,tessellation:64},scene);
  mesh.position.y=y;return place(mesh);
 }
 drum('stone-buddha-base',6.3,.42,.21);
 drum('stone-buddha-plinth',5.66,.34,.59);
 drum('lotus-pedestal-waist',4.40,.68,1.10,4.02);
 drum('lotus-pedestal-lip',4.18,.16,1.65);
 // Two alternating rows of pointed lotus petals are carved into the pedestal.
 for(const row of [0,1])for(let i=0;i<20;i++){
  const angle=(i+row*.5)*Math.PI/10;
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let j=0;j<=12;j++)for(let k=0;k<=8;k++){
   const t=j/12,u=k/8*2-1,spread=.22*Math.sin(Math.PI*t)**.70;
   const a=angle+u*spread;
   const radius=2.22+.70*Math.sin(Math.PI*t)+.12*(1-u*u);
   const y=row===0?.62+t*.78:1.70-t*.67;
   positions.push(Math.sin(a)*radius,y,-Math.cos(a)*radius);uvs.push(k/8,t);
   if(j<12&&k<8){const v=j*9+k;indices.push(v,v+1,v+9,v+1,v+10,v+9);}
  }
  const data=new VertexData(),normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);
  data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;
  const petal=new Mesh('carved-lotus-petal',scene);data.applyToMesh(petal);place(petal);
 }
 const base=1.71;
 function limb(name:string,knots:number[][],radii:number[],material=stone){
  const path=Curve3.CreateCatmullRomSpline(knots.map(p=>new Vector3(p[0],p[1]+base,p[2])),9).getPoints();
  const mesh=MeshBuilder.CreateTube(name,{path,tessellation:24,cap:3,radiusFunction:i=>{
   const u=i/(path.length-1)*(radii.length-1),k=Math.min(radii.length-2,Math.floor(u));return radii[k]+(radii[k+1]-radii[k])*(u-k);
  }},scene);return place(mesh,material);
 }
 // Continuous standing robe with U-shaped folds across the front.
 const profile=[[.12,.92,.52],[.45,1.12,.60],[1.5,1.08,.58],[3,1.07,.58],[4.6,1.12,.63],[6.1,1.19,.67],[7.3,1.40,.61],[7.72,1.25,.53],[8.10,.77,.40],[8.32,.35,.29]];
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[],normals:number[]=[];
 const columns=128,rows=180;
 for(let j=0;j<=rows;j++){
  const y=.12+(8.32-.12)*j/rows;let k=0;while(k<profile.length-2&&y>profile[k+1][0])k++;
  const t=(y-profile[k][0])/(profile[k+1][0]-profile[k][0]);
  const rx=profile[k][1]*(1-t)+profile[k+1][1]*t,rz=profile[k][2]*(1-t)+profile[k+1][2]*t;
  for(let i=0;i<=columns;i++){
   const a=i/columns*Math.PI*2,px=rx*Math.sin(a),front=Math.max(0,Math.cos(a));
   const fold=(.010+.020*front)*Math.sin((y-.78*px*px)*12.4);
   positions.push(px+Math.sin(a)*fold,base+y,-Math.cos(a)*(rz+fold));
   uvs.push(i/columns*2,j/rows*4);
   if(j<rows&&i<columns){const v=j*(columns+1)+i;indices.push(v,v+1,v+columns+1,v+1,v+columns+2,v+columns+1);}
  }
 }
 VertexData.ComputeNormals(positions,indices,normals);
 const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;
 const robe=new Mesh('standing-stone-robe',scene);data.applyToMesh(robe);place(robe);
 oval('neck',0,base+8.28,0,.65,.84,.63);
 // Reuse the approved facial sculpt, with stone pigment and a taller oval silhouette.
 const face=sculptedFace(scene,stone);
 face.useVertexColors=false;face.scaling.set(1.75,1.88,1.78);
 face.position.y=base+9.13-2.277*1.88;place(face);
 for(const side of [-1,1]){
  oval('elongated-ear',side*.49,base+8.99,-.01,.18,.78,.20);
  oval('stone-foot',side*.32,base+.14,-.42,.46,.24,.81);
 }
 oval('stone-scalp',0,base+9.67,.07,1.06,.72,.99);
 oval('ushnisha',0,base+10.04,.065,.47,.42,.46);
 // Right hand faces the approaching visitor, left hand supports a shallow bowl.
 limb('right-sleeve',[[-1.00,7.42,.02],[-1.39,6.98,-.07],[-1.40,6.65,-.25],[-1.33,7.04,-.48]],[.43,.39,.34,.22]);
 oval('raised-palm',-1.33,base+7.35,-.53,.39,.53,.15);
 for(let i=0;i<4;i++){
  const fx=-1.48+i*.097;
  limb('raised-finger',[[fx,7.46,-.54],[fx,7.75-.035*Math.abs(i-1),-.56],[fx+.018,7.87-.04*Math.abs(i-1),-.54]],[.047,.039,.021]);
 }
 limb('raised-thumb',[[-1.16,7.28,-.53],[-1.06,7.45,-.59],[-1.12,7.55,-.57]],[.065,.052,.026]);
 limb('left-sleeve',[[1.05,7.44,0],[1.37,6.91,-.08],[1.23,6.18,-.24],[.85,5.92,-.69],[.44,6.05,-.91]],[.45,.47,.43,.30,.16]);
 oval('supporting-palm',.46,base+6.04,-.96,.66,.16,.39);
 const bowl=MeshBuilder.CreateLathe('stone-offering-bowl',{shape:[[0,0],[.32,0],[.51,.15],[.58,.32],[.51,.34],[.44,.15],[0,.12]].map(([r,y])=>new Vector3(r,y,0)),tessellation:48,sideOrientation:Mesh.DOUBLESIDE},scene);
 bowl.position.set(.39,base+6.12,-1);place(bowl);
 for(const part of parts.slice(firstPart)){
  part.position.x=x+(part.position.x-x)*scale;
  part.position.y*=scale;
  part.position.z=z+(part.position.z-z)*scale;
  part.scaling.scaleInPlace(scale);
 }
 stone.backFaceCulling=false;
}
