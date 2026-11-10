import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {Texture} from '@babylonjs/core/Materials/Textures/texture';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {treeSeason} from './seasonal-tree';

export function mountainLandscape(scene:Scene,ground:StandardMaterial){
 const season=treeSeason();
 const soil=new DynamicTexture('mountain-foot-soil',512,scene,true);
 const brush=soil.getContext() as CanvasRenderingContext2D;
 brush.fillStyle=season==='winter'?'#c3bfb0':'#a19478';brush.fillRect(0,0,512,512);
 let seed=713;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<26000;i++){
  brush.fillStyle=['#554f4144','#dcd1b766','#74795466','#b9aa8766'][i%4];
  brush.fillRect(rand()*512,rand()*512,.6+rand()*2,.6+rand()*3);
 }
 for(let patch=0;patch<260;patch++){
  const x=rand()*512,y=rand()*512;
  brush.strokeStyle=season==='winter'?'#eeeae09a':'#69704b66';
  for(let blade=0;blade<8;blade++){
   brush.beginPath();brush.moveTo(x+rand()*14,y+rand()*8);brush.lineTo(x+rand()*14,y-3-rand()*9);brush.stroke();
  }
 }
 soil.update();soil.wrapU=soil.wrapV=Texture.WRAP_ADDRESSMODE;
 ground.diffuseColor=Color3.FromHexString('#a49c87');ground.diffuseTexture=soil;
 soil.uScale=soil.vScale=26;ground.specularColor=Color3.Black();
 // Undulating ridges share a flat valley floor around the complete approved footprint.
 const peaks=[
  [-142,82,48,57,80],[-180,-5,32,49,64],[-155,182,77,73,72],
  [-77,191,83,57,67],[31,166,61,61,49],[126,170,76,60,78],
  [154,68,49,43,66],[189,-7,33,58,58],
  [-340,226,120,99,143],[-180,366,137,120,91],[81,366,145,139,108],[349,220,139,125,137],
 ];
 const smooth=(v:number)=>{const t=Math.min(1,Math.max(0,v));return t*t*(3-2*t);};
 const positions:number[]=[],indices:number[]=[],colors:number[]=[],uvs:number[]=[];
 const count=160,extent=860;
 for(let row=0;row<=count;row++)for(let col=0;col<=count;col++){
  const x=(col/count-.5)*extent*2,z=(row/count-.5)*extent*2;
  const edge=Math.max((Math.abs(x)-95)/65,(z-95)/65);
  let height=0;
  for(const [px,pz,h,sx,sz] of peaks)height+=h*Math.exp(-(((x-px)/sx)**2+((z-pz)/sz)**2));
  const ripple=1+.095*Math.sin(x*.061+z*.043)+.055*Math.sin(x*.13-z*.077);
  height=Math.max(0,height*.38*ripple*smooth(edge)*smooth((z+115)/110));
  positions.push(x,height-.045,z);uvs.push(x/156,z/156);
  const band=.5+.23*Math.sin(x*.11+z*.09)+.16*Math.cos(z*.18);
  const forest=season==='winter'?Color3.FromHexString('#aeb9ad'):
   season==='autumn'?Color3.FromHexString(band>.57?'#77744c':'#687451'):Color3.FromHexString('#667c58');
  const land=Color3.FromHexString('#a3987e');
  const colour=Color3.Lerp(land,forest,smooth(height/20)*.85);
  colors.push(colour.r,colour.g,colour.b,1);
  if(row<count&&col<count){const i=row*(count+1)+col;indices.push(i,i+count+1,i+1,i+1,i+count+1,i+count+2);}
 }
 const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);
 for(let i=0;i<normals.length;i+=3)if(normals[i+1]<0){normals[i]*=-1;normals[i+1]*=-1;normals[i+2]*=-1;}
 const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.colors=colors;
 const terrain=new Mesh('surrounding-mountain-valley',scene);data.applyToMesh(terrain);terrain.isPickable=false;
 const material=new StandardMaterial('mountain-forest-and-earth',scene);
 material.backFaceCulling=false;material.diffuseColor=Color3.White();material.specularColor=Color3.Black();
 material.diffuseTexture=soil;
 terrain.material=material;terrain.receiveShadows=true;
}
