import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {ShaderMaterial} from '@babylonjs/core/Materials/shaderMaterial';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Matrix} from '@babylonjs/core/Maths/math.vector';
import {Constants} from '@babylonjs/core/Engines/constants';
import {LANTERN_PALETTE,lanternColourIndex,type Slot} from './contracts';
import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';
const vertex=`precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 viewProjection;uniform mat4 view;
#include<instancesDeclaration>
varying vec2 vUV;void main(){
#include<instancesVertex>
vec3 center=(finalWorld*vec4(0.,0.,0.,1.)).xyz;
vec3 right=vec3(view[0][0],view[1][0],view[2][0]),up=vec3(view[0][1],view[1][1],view[2][1]);
vUV=uv;gl_Position=viewProjection*vec4(center+right*position.x+up*position.y,1.);}`;
const fragment=`precision highp float;varying vec2 vUV;uniform vec3 tint;uniform float strength;
void main(){float r=length((vUV-.5)*2.);float edge=1.-smoothstep(.40,1.,r);float inner=smoothstep(.23,.56,r);float alpha=edge*inner*.14*strength;gl_FragColor=vec4(tint,alpha);}`;
/** Shared night-only spill: five halo batches and one ground mask, zero added lights. */
export function lanternNightLight(scene:Scene){
 const halos=LANTERN_PALETTE.map((hex,i)=>{
  const material=new ShaderMaterial('lantern-night-aura-'+i,scene,{vertexSource:vertex,fragmentSource:fragment},{attributes:['position','uv'],uniforms:['world','view','viewProjection','tint','strength'],needAlphaBlending:true});
  material.setColor3('tint',Color3.Lerp(Color3.FromHexString(hex),Color3.FromHexString('#ffd6a1'),.32));material.setFloat('strength',0);material.disableDepthWrite=true;material.backFaceCulling=false;material.alphaMode=Constants.ALPHA_ADD;
  const mesh=MeshBuilder.CreatePlane('lantern-night-spill-'+i,{width:1.6,height:1.65},scene);mesh.material=material;mesh.isPickable=false;mesh.setEnabled(false);return {mesh,material};
 });
 const texture=new DynamicTexture('shared-lantern-ground-light',512,scene,false);texture.hasAlpha=true;
 const groundMaterial=new StandardMaterial('lantern-night-ground-warmth',scene);groundMaterial.diffuseColor=Color3.Black();groundMaterial.emissiveColor=Color3.FromHexString('#ffc67c');groundMaterial.disableLighting=true;groundMaterial.disableDepthWrite=true;groundMaterial.opacityTexture=texture;groundMaterial.alpha=0;
 let ground:Mesh|null=null,amount=0;
 function time(value:string){amount=value==='night'?1:value==='dusk'?.28:0;for(const h of halos){h.material.setFloat('strength',amount);h.mesh.setEnabled(amount>0&&h.mesh.thinInstanceCount>0);}groundMaterial.alpha=.30*amount;if(ground)ground.setEnabled(amount>0);}
 return {time,set(slots:readonly Slot[],decorative:readonly {position:readonly[number,number,number];color:number}[]=[]){
  const points=[...slots.map(s=>({p:s.position,color:lanternColourIndex(s.position)})),...decorative.map(({position:p,color})=>({p,color}))];
  for(const[i,h]of halos.entries()){h.mesh.thinInstanceSetBuffer('matrix',null);const matrices=points.filter(p=>p.color===i).map(({p})=>Matrix.Translation(...p));if(matrices.length)h.mesh.thinInstanceAdd(matrices);h.mesh.setEnabled(amount>0&&matrices.length>0);}
  ground?.dispose();ground=null;if(!points.length)return;
  const xs=points.map(p=>p.p[0]),zs=points.map(p=>p.p[2]),west=Math.min(...xs)-3,east=Math.max(...xs)+3,south=Math.min(...zs)-3,north=Math.max(...zs)+3;
  const c=texture.getContext() as CanvasRenderingContext2D;c.clearRect(0,0,512,512);
  for(const {p}of points){const x=(p[0]-west)/(east-west)*512,y=(p[2]-south)/(north-south)*512,rx=2.6/(east-west)*512,ry=2.6/(north-south)*512;c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(255,255,255,.075)');g.addColorStop(.4,'rgba(255,255,255,.045)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();}
  texture.update(false);ground=MeshBuilder.CreateGround('lantern-night-ground-spill',{width:east-west,height:north-south},scene);ground.position.set((west+east)/2,.145,(south+north)/2);ground.material=groundMaterial;ground.isPickable=false;
  const positions=ground.getVerticesData('position')!,uvs=ground.getVerticesData('uv')!;for(let i=0;i<positions.length;i+=3){uvs[i/3*2]=(positions[i]+(east-west)/2)/(east-west);uvs[i/3*2+1]=(positions[i+2]+(north-south)/2)/(north-south);}ground.setVerticesData('uv',uvs);ground.setEnabled(amount>0);
 }};
}
