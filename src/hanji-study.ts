import './hanji-study.css';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { LANTERN_PALETTE } from './contracts.ts';

const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<canvas id="study" aria-label="팔각 한지 연등 한 개. 드래그로 회전, 휠로 확대." tabindex="0"></canvas>
<header><a href="/">사사 <small>SASA</small></a><span>한지 연등 · 재질 검수 01</span></header>
<section class="caption"><span class="overline">종이 사이로 스며드는 빛</span><h1>한 장의 한지,<br>하나의 연등.</h1><p>섬유의 결, 접힌 자국, 빛이 스미는 얇은 면을<br>가까이 돌려보며 확인하세요.</p></section>
<div id="loading">한지 연등을 준비하고 있어요…</div>
<footer><div class="controls"><div class="light-buttons" aria-label="조명"><button data-light="day" aria-pressed="true">낮 · 종이결</button><button data-light="night" aria-pressed="false">밤 · 내부 점등</button></div><div class="swatches" aria-label="연등 색상">${['그린','핑크','블루','옐로우','레드'].map((n,i)=>`<button aria-label="${n}" data-color="${i}" aria-pressed="${i===4}" style="--swatch:${LANTERN_PALETTE[i]}"></button>`).join('')}</div><button id="closeup">한지 가까이</button><button id="reset">전체 보기</button></div><p>드래그하여 회전 · 휠 / 두 손가락으로 확대 <span>실시간 3D · 검토용 시안</span></p></footer>`;
const canvas=document.querySelector<HTMLCanvasElement>('#study')!;
const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});
const scene=new Scene(engine);scene.clearColor=new Color4(.88,.87,.83,1);
const camera=new ArcRotateCamera('study-camera',-1.15,1.3,2.6,new Vector3(0,1.35,0),scene);camera.attachControl(canvas,true);camera.lowerRadiusLimit=.85;camera.upperRadiusLimit=4;camera.lowerBetaLimit=.35;camera.upperBetaLimit=2.2;camera.minZ=.03;camera.wheelPrecision=80;camera.panningSensibility=0;
new HemisphericLight('studio-fill',new Vector3(0,1,0),scene).intensity=.8;
const sun=new DirectionalLight('daylight',new Vector3(.5,-.6,.8),scene);sun.intensity=1;
const fibre=new Texture('/textures/hanji-fibres-generated-v1.png',scene);fibre.anisotropicFilteringLevel=16;
const vertex=`precision highp float;
attribute vec3 position;attribute vec3 normal;attribute vec2 uv;
uniform mat4 world;uniform mat4 worldViewProjection;
varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;
void main(){vPosition=(world*vec4(position,1.)).xyz;vNormal=normalize(mat3(world)*normal);vUV=uv;gl_Position=worldViewProjection*vec4(position,1.);}`;
const fragment=`precision highp float;
varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;
uniform sampler2D paper;uniform vec3 dye;uniform float night;
void main(){
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 vec2 texUV=vUV*vec2(.72,1.2);vec3 fibres=texture2D(paper,texUV).rgb;
 float pulp=dot(fibres,vec3(.299,.587,.114));
 // Dense fibres obscure light; thin patches pass more. No glossy/specular term.
 float fibrePattern=clamp((pulp-.83)*6.5,0.,1.);
 float density=mix(.78,.09,fibrePattern);
 float dx=dot(texture2D(paper,texUV+vec2(.0015,0.)).rgb,vec3(.333))-pulp;
 float dy=dot(texture2D(paper,texUV+vec2(0.,.0015)).rgb,vec3(.333))-pulp;
 vec3 tangent=normalize(cross(vec3(0.,1.,.001),n));vec3 bitangent=normalize(cross(n,tangent));n=normalize(n+12.*dx*tangent+12.*dy*bitangent);
 float key=max(dot(n,normalize(vec3(-.6,.8,-.7))),0.);
 float rear=max(dot(-n,normalize(vec3(-.6,.8,-.7))),0.);
 float seam=min(vUV.x,1.-vUV.x);
 float seamShadow=mix(.50,1.,smoothstep(.0,.025,seam));
 float edgeY=min(vUV.y,1.-vUV.y);
 float overlap=mix(.72,1.,smoothstep(0.,.025,edgeY));
 vec3 inside=vec3(.025,1.32,-.018)-vPosition;
 float internalFalloff=1./(1.+dot(inside,inside)*3.8);
 float transmission=exp(-density*1.65)*seamShadow*overlap;
 float wrinkle=.985+.015*sin(vUV.y*245.+sin(vUV.x*37.)*2.);
 vec3 daylight=dye*(.36+.65*key+.60*rear*transmission)*mix(.52,1.25,fibrePattern)*wrinkle;
 vec3 lamp=dye*(.08+3.1*internalFalloff*transmission)*vec3(1.,.88,.68)*wrinkle;
 // A restrained light source preserves saturated dye and fibre contrast.
 vec3 color=mix(daylight,lamp,night);color=color/(vec3(1.)+color*.38);
 gl_FragColor=vec4(pow(max(color,0.),vec3(1./2.2)),1.);
}`;
const paper=new ShaderMaterial('hanji-transmission',scene,{vertexSource:vertex,fragmentSource:fragment},{attributes:['position','normal','uv'],uniforms:['world','worldViewProjection','dye','night'],samplers:['paper']});paper.backFaceCulling=false;paper.setTexture('paper',fibre);paper.setColor3('dye',Color3.FromHexString(LANTERN_PALETTE[4]).toLinearSpace());paper.setFloat('night',0);
const frame=new StandardMaterial('interior-bamboo',scene);frame.diffuseColor=Color3.FromHexString('#785840');frame.specularColor=Color3.Black();
const edgePaper=new StandardMaterial('paper-fold-edge',scene);edgePaper.diffuseColor=Color3.FromHexString('#9a302b');edgePaper.specularColor=Color3.Black();
const profile=[[-.46,.17],[-.23,.40],[.23,.40],[.46,.17]];
// Separately tensioned paper faces: thin open shell, with actual folded shoulders.
for(let face=0;face<8;face++)for(let tier=0;tier<3;tier++){
 const a0=face*Math.PI/4,a1=(face+1)*Math.PI/4;const [y0,r0]=profile[tier],[y1,r1]=profile[tier+1];
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];const U=28,V=28;
 for(let j=0;j<=V;j++)for(let i=0;i<=U;i++){
  const u=i/U,v=j/V,r=r0+(r1-r0)*v,y=y0+(y1-y0)*v;
  const x=(Math.sin(a0)*(1-u)+Math.sin(a1)*u)*r,z=(Math.cos(a0)*(1-u)+Math.cos(a1)*u)*r;
  // Millimetre-scale tension wrinkles, not inflated/padded faces.
  const envelope=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
  const ripple=(.0016*Math.sin(v*63+face*1.7+Math.sin(u*19))+.0012*Math.sin(u*31+v*17))*envelope;
  const sag=.004*envelope;const radial=Vector3.Normalize(new Vector3(x,0,z));positions.push(x+radial.x*(ripple-sag),y+1.35,z+radial.z*(ripple-sag));uvs.push(u,v);
 }
 for(let j=0;j<V;j++)for(let i=0;i<U;i++){const a=j*(U+1)+i;indices.push(a,a+U+1,a+1,a+1,a+U+1,a+U+2);}
 const mesh=new Mesh(`hanji-face-${face}-${tier}`,scene),data=new VertexData(),normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(mesh);mesh.material=paper;
}
// Slender internal ribs sit beneath the paper, rather than thick outer metal edging.
for(let k=0;k<8;k++){
 const a=k*Math.PI/4;const path=profile.map(([y,r])=>new Vector3(Math.sin(a)*(r-.003),y+1.35,Math.cos(a)*(r-.003)));
 const rib=MeshBuilder.CreateTube('bamboo-rib',{path,radius:.0017,tessellation:6},scene);rib.material=frame;
}
for(const [y,r] of profile){const points=Array.from({length:9},(_,k)=>new Vector3(Math.sin(k*Math.PI/4)*r,y+1.35,Math.cos(k*Math.PI/4)*r));const hoop=MeshBuilder.CreateTube('paper-joined-fold',{path:points,radius:.0012,tessellation:6},scene);hoop.material=edgePaper;}
const cord=MeshBuilder.CreateTube('suspension-cord',{path:[new Vector3(0,1.81,0),new Vector3(0,2.8,0)],radius:.0018,tessellation:8},scene);cord.material=frame;
for(const side of [-1,1]){const handle=MeshBuilder.CreateTube('wire-handle',{path:[new Vector3(side*.15,1.81,0),new Vector3(side*.12,1.97,0),new Vector3(0,2.04,0)],radius:.0012,tessellation:6},scene);handle.material=frame;}
let night=false;const buttons=document.querySelectorAll<HTMLButtonElement>('[data-light]');
for(const b of buttons)b.onclick=()=>{night=b.dataset.light==='night';paper.setFloat('night',night?1:0);scene.clearColor=night?new Color4(.035,.046,.065,1):new Color4(.88,.87,.83,1);sun.intensity=night?.12:1;document.body.classList.toggle('night',night);for(const other of buttons)other.setAttribute('aria-pressed',String(b===other));};
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-color]'))b.onclick=()=>{const c=LANTERN_PALETTE[Number(b.dataset.color)];paper.setColor3('dye',Color3.FromHexString(c).toLinearSpace());edgePaper.diffuseColor=Color3.FromHexString(c).scale(.65);for(const other of document.querySelectorAll('[data-color]'))other.setAttribute('aria-pressed',String(b===other));};
document.querySelector<HTMLButtonElement>('#closeup')!.onclick=()=>{camera.setTarget(new Vector3(.12,1.37,-.14));camera.alpha=-1.1;camera.beta=1.35;camera.radius=1.5;document.body.classList.add('closeup');};
document.querySelector<HTMLButtonElement>('#reset')!.onclick=()=>{camera.setTarget(new Vector3(0,1.35,0));camera.alpha=-1.15;camera.beta=1.3;camera.radius=2.6;document.body.classList.remove('closeup');};
engine.runRenderLoop(()=>{scene.render();if(scene.isReady())document.querySelector<HTMLElement>('#loading')!.hidden=true;});window.addEventListener('resize',()=>engine.resize());
