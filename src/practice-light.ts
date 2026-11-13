import {ShaderMaterial} from '@babylonjs/core/Materials/shaderMaterial';
import {Constants} from '@babylonjs/core/Engines/constants';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import type {Scene} from '@babylonjs/core/scene';
import type {Vector3} from '@babylonjs/core/Maths/math.vector';

export function reducedMotion(){
 return !!document.querySelector<HTMLInputElement>('#reduced')?.checked || matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function goldRing(scene:Scene,size:number,orbit=false){
 const mesh=MeshBuilder.CreateGround('gold-halo',{width:size,height:size},scene);
 const texture=new DynamicTexture('halo-gradient',256,scene,false);
 const ctx=texture.getContext();
 const gradient=ctx.createRadialGradient(128,128,0,128,128,128);
 for(const [offset,opacity] of [[0,.02],[.48,.05],[.68,.27],[.78,.82],[.8,.94],[.83,.35],[1,0]]){
  gradient.addColorStop(offset,'rgba(255,217,146,'+opacity+')');
 }
 ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
 if(orbit){
  ctx.strokeStyle='rgba(255,239,202,.9)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(128,128,103,0,Math.PI*2);ctx.stroke();
  const spark=ctx.createRadialGradient(231,128,0,231,128,13);
  spark.addColorStop(0,'#fff9df');spark.addColorStop(.23,'#fff1be');spark.addColorStop(1,'rgba(255,222,150,0)');
  ctx.fillStyle=spark;ctx.fillRect(218,115,26,26);
 }
 texture.hasAlpha=true;texture.update();
 const material=new StandardMaterial('gold-halo',scene);
 material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;material.disableDepthWrite=true;
 material.disableLighting=true;material.emissiveColor=Color3.White();material.backFaceCulling=false;
 mesh.material=material;mesh.isPickable=false;
 return {mesh,material};
}

// Anchor the upper edge as the lower end travels from the rafters to the floor.
export function descendingLight(scene:Scene,height:number,width:number){
 const mesh=MeshBuilder.CreatePlane('descending-light',{height,width},scene);
 mesh.billboardMode=Mesh.BILLBOARDMODE_Y;mesh.isPickable=false;
 const texture=new DynamicTexture('gold-light-strands',256,scene,false);
 const ctx=texture.getContext(),pixels=ctx.getImageData(0,0,256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const v=y/255, u=(x/255-.5)*2+.26*(v-.5);
  const spread=.75-.24*v, n=u/spread;
  const haze=Math.exp(-3*n*n);
  const strands=.44*Math.exp(-72*(n+.28)**2)+.52*Math.exp(-140*(n-.06)**2)+.24*Math.exp(-110*(n-.43)**2);
  const feather=Math.min(1,v*12,(1-v)*24);
  pixels.data.set([255,236,186,Math.round(255*Math.min(1,.38*haze+strands)*feather)],(y*256+x)*4);
 }
 ctx.putImageData(pixels,0,0);texture.hasAlpha=true;texture.update();
 const mat=new StandardMaterial('warm-light-rays',scene);mat.disableLighting=true;mat.disableDepthWrite=true;
 mat.diffuseTexture=mat.emissiveTexture=texture;mat.emissiveColor=Color3.White();mat.useAlphaFromDiffuseTexture=true;mat.alpha=0;
 mesh.material=mat;
 // A narrow luminous column inside the broad haze remains legible across the hall.
 const column=MeshBuilder.CreateCylinder('heaven-light-core',{
  height:1,diameterTop:width*.35,diameterBottom:width*.40,tessellation:48,cap:Mesh.NO_CAP
 },scene);
 column.parent=mesh;column.isPickable=false;
 const core=new ShaderMaterial('falling-gold',scene,{
  vertexSource:`precision highp float;
   attribute vec3 position; attribute vec2 uv; uniform mat4 worldViewProjection;
   varying vec2 coords;
   void main(){coords=uv;gl_Position=worldViewProjection*vec4(position,1.0);}`,
  fragmentSource:`precision highp float;
   varying vec2 coords; uniform float time; uniform float power;
   void main(){
    float y=coords.y;
    float a=coords.x*6.2831853;
    float strands=pow(.5+.5*cos(a*7.0+.45*sin(y*4.0)+.22*sin(time*2.1)),3.0);
    float flow=.5+.5*cos(y*12.0+time*6.2);
    float foot=exp(-8.0*y);
    vec2 grid=vec2(coords.x*48.0,y*21.0+time*2.6);
    vec2 cell=floor(grid);
    float seed=fract(sin(dot(cell,vec2(43.21,79.13)))*4375.73);
    float glint=(1.0-smoothstep(.035,.16,length(fract(grid)-vec2(.5,seed))))*step(.72,seed);
    float light=.22+.43*strands+.14*flow+.24*foot+.7*glint;
    vec3 gold=mix(vec3(1.0,.73,.39),vec3(1.0,.99,.86),min(1.0,strands+.4*flow+glint));
    gl_FragColor=vec4(gold, power*min(.92,light)*smoothstep(0.0,.055,y));
   }`
 },{attributes:['position','uv'],uniforms:['worldViewProjection','time','power'],needAlphaBlending:true});
 core.alphaMode=Constants.ALPHA_ADD;core.disableDepthWrite=true;column.material=core;
 let clock=0;
 return {mesh,draw(reach:number,intensity:number,reduced:boolean){
  const length=Math.max(.001,reach);
  mesh.scaling.y=length;mesh.position.y=height*(1-length/2)+.045;
  mat.alpha=Math.min(1,intensity*1.18);
  column.scaling.y=height;
  if(!reduced)clock+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
  core.setFloat('time',reduced?0:clock);core.setFloat('power',intensity);
 },dispose(){column.dispose();core.dispose();mesh.dispose();mat.dispose(false,true);}};
}

export function prayerLight(scene:Scene,position:Vector3,intensity=1){
 const ring=goldRing(scene,2.65,true);
 ring.mesh.position.copyFrom(position);ring.mesh.position.y+=.105;
 const shaft=descendingLight(scene,6.7,2.5);
 shaft.mesh.position.copyFrom(position);
 let age=0;
 let ending=false,finishTime=0;
 const clean=()=>{scene.onBeforeRenderObservable.remove(observer);shaft.dispose();ring.mesh.dispose();ring.material.dispose(false,true);};
 const observer=scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
  age+=dt;
  const reduced=reducedMotion();
  if(!reduced)ring.mesh.rotation.y+=dt*.85;
  if(ending)finishTime+=dt;
  const fade=Math.min(1,Math.max(0,(finishTime-.65)/1.4));
  const strength=Math.min(1,age*1.35)*(1-fade*fade*(3-2*fade));
  const landing=reduced?1:Math.min(1,age/.72);
  ring.mesh.scaling.setAll(reduced?1:.24+.76*Math.min(1,Math.max(0,age-.4)/.95));
  ring.material.alpha=.76*intensity*strength*landing*Math.max(0,1-finishTime/.75);
  shaft.draw(landing,.67*intensity*strength,reduced);
  shaft.mesh.position.y+=position.y;
  if(ending&&strength===0)clean();
 });
 ring.material.alpha=0;
 return {fade:()=>{ending=true;},cancel:clean};
}
