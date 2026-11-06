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
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { LANTERN_PALETTE } from './contracts.ts';

const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<canvas id="study" aria-label="팔각 한지 연등 한 개. 드래그로 회전, 휠로 확대." tabindex="0"></canvas>
<header><a href="/">사사 <small>SASA</small></a><span>한지 연등 · 햇빛 검수 02</span></header>
<section class="caption"><span class="overline">종이 사이로 스며드는 빛</span><h1>한 장의 한지,<br>하나의 연등.</h1><p>섬유의 결, 접힌 자국, 빛이 스미는 얇은 면을<br>가까이 돌려보며 확인하세요.</p></section>
<div id="loading">한지 연등을 준비하고 있어요…</div>
<footer><div class="controls"><div class="light-buttons" aria-label="조명"><button data-light="day" aria-pressed="true">낮 · 햇빛 투과</button><button data-light="night" aria-pressed="false">밤 · 밝은 점등</button></div><div class="swatches" aria-label="연등 색상">${['그린','핑크','블루','옐로우','레드'].map((n,i)=>`<button aria-label="${n}" data-color="${i}" aria-pressed="${i===4}" style="--swatch:${LANTERN_PALETTE[i]}"></button>`).join('')}</div><button id="lamp" aria-pressed="true">내부 등 켜짐</button><button id="thickness" aria-pressed="true">한지 두께 표현 켜짐</button><button id="closeup">한지 가까이</button><button id="reset">전체 보기</button></div><p>드래그하여 회전 · 휠 / 두 손가락으로 확대 <span>실시간 3D · 검토용 시안</span></p></footer>`;
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
varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vLocalPosition;
void main(){vLocalPosition=position;vPosition=(world*vec4(position,1.)).xyz;vNormal=normalize(mat3(world)*normal);vUV=uv;gl_Position=worldViewProjection*vec4(position,1.);}`;
const fragment=`precision highp float;
varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vLocalPosition;
uniform sampler2D paper;uniform vec3 dye;uniform vec3 dayDye;uniform float night;uniform float lampOn;uniform vec3 eye;uniform float thicknessDetail;
void main(){
 vec3 pigment=mix(dayDye,dye,night);
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 vec2 texUV=vUV*vec2(.72,1.2);vec3 fibres=texture2D(paper,texUV).rgb;
 float pulp=dot(fibres,vec3(.299,.587,.114));
 // Optical density varies with fibres, wrinkles and glued seams.
 float fibrePattern=clamp((pulp-.83)*6.5,0.,1.);
 float density=mix(.90,.32,fibrePattern);
 float dx=dot(texture2D(paper,texUV+vec2(.0015,0.)).rgb,vec3(.333))-pulp;
 float dy=dot(texture2D(paper,texUV+vec2(0.,.0015)).rgb,vec3(.333))-pulp;
 vec3 tangent=normalize(cross(vec3(0.,1.,.001),n));vec3 bitangent=normalize(cross(n,tangent));n=normalize(n+3.*dx*tangent+3.*dy*bitangent);
 float seam=min(vUV.x,1.-vUV.x);
 float glued=1.-smoothstep(.008,.035,seam);
 float hoopDistance=abs(fract(vUV.y*16.+.5)-.5);
 float hoopShadow=mix(.46,1.,smoothstep(.012,.075,hoopDistance));
 float ribShadow=mix(.34,1.,smoothstep(.003,.028,seam));
 float smallFolds=.04*sin(vUV.y*210.+sin(vUV.x*21.)*2.);
 float opticalDepth=density+glued*.65+smallFolds;
 vec3 absorption=-log(max(pigment,vec3(.025)))*1.15+vec3(.14);
 vec3 transmitted=exp(-absorption*opticalDepth);
 vec3 source=vec3(.035,1.38,-.025);vec3 ray=vLocalPosition-source;
 float d2=dot(ray,ray);
 vec3 towardsEye=normalize(eye-vPosition);
 float forwardLobe=.22+.78*pow(max(dot(normalize(ray),towardsEye),0.),9.);
 float irradiance=1./(.16+d2*4.);
 float sourceShadow=hoopShadow*ribShadow;
 float key=max(dot(n,normalize(vec3(-.6,.8,-.7))),0.);
 vec3 exterior=pigment*(.24+.60*key)*mix(.88,1.08,fibrePattern)*mix(1.,.055,night);
 vec3 warmBulb=vec3(1.,.83,.57);
 vec3 interior=warmBulb*transmitted*irradiance*forwardLobe*sourceShadow*mix(.65,5.2,night)*lampOn;
 // Per-channel absorption reveals a warm core through thin paper, dyed edges and dark ribs.
 vec3 color=exterior+interior;
 if(night<.5){
  // Day only: fine, closely spaced hoops rather than thick dark bands.
  float closeHoop=abs(fract(vUV.y*34.+.5)-.5);
  float aa=max(.002,fwidth(vUV.y)*34.*.6);
  float fineHoops=mix(.48,1.,smoothstep(.006-aa,.045+aa,closeHoop));
  float fineRibs=mix(.61,1.,smoothstep(.001,.012,seam));
  // Broad external skylight and backlighting illuminate whole paper panels.
  vec3 toSun=normalize(vec3(-.6,.8,-.7));
  float back=max(dot(-n,toSun),0.);
  float skyThrough=.72+.20*max(-n.y,0.);
  vec3 sunlightThrough=mix(pigment,transmitted,.24)*(skyThrough+.48*back);
  sunlightThrough*=mix(.80,1.08,fibrePattern)*exp(-glued*.45)*fineHoops*fineRibs;
  vec3 reflected= pigment*(.24+.60*key)*mix(.88,1.08,fibrePattern)*fineHoops;
  // Small internal light contribution remains optional; sunlight is not tied to the bulb.
  vec3 dayBulb=warmBulb*transmitted*irradiance*.12*fineHoops*fineRibs*lampOn;
  if(thicknessDetail>.5){
   // A second fibre scale varies sheet thickness rather than painting dark surface dirt.
   float coarse=dot(texture2D(paper,texUV*.37+vec2(.19,.27)).rgb,vec3(.299,.587,.114));
   float pulpThickness=clamp((.98-coarse)*5.,0.,1.);
   float sheetThickness=mix(.98,.28,fibrePattern)+.18*(pulpThickness-.5);
   float opening=min(vUV.y,1.-vUV.y);
   float thinEdge=1.-smoothstep(.003,.025,opening);
   float overlap=1.-smoothstep(.010,.048,seam);
   float crease=min(abs(vUV.y-.22),abs(vUV.y-.78));
   float folded=1.-smoothstep(.002,.018,crease);
   sheetThickness=max(.16,sheetThickness-.18*thinEdge)+.65*overlap+.16*folded;
   vec3 sheetTransmission=exp(-absorption*sheetThickness);
   // Preserve the existing light budget and dye; redistribute it through the sheet.
   vec3 transmissionRatio=clamp(sheetTransmission/max(transmitted,vec3(.01)),vec3(.55),vec3(1.38));
   sunlightThrough*=transmissionRatio*exp((.60-sheetThickness)*.32);
   dayBulb*=transmissionRatio;
  }
  color=reflected+sunlightThrough+dayBulb;
 }
 color=color/(vec3(1.)+color);

 gl_FragColor=vec4(pow(max(color,0.),vec3(1./2.2)),1.);
}`;
const paper=new ShaderMaterial('hanji-transmission',scene,{vertexSource:vertex,fragmentSource:fragment},{attributes:['position','normal','uv'],uniforms:['world','worldViewProjection','dye','dayDye','night','lampOn','eye','thicknessDetail'],samplers:['paper']});paper.backFaceCulling=false;paper.setTexture('paper',fibre);paper.setColor3('dye',Color3.FromHexString(LANTERN_PALETTE[4]).toLinearSpace());paper.setColor3('dayDye',Color3.FromHexString(LANTERN_PALETTE[4]).toLinearSpace());paper.setFloat('night',0);paper.setFloat('lampOn',1);paper.setFloat('thicknessDetail',1);paper.setVector3('eye',camera.position);
const frame=new StandardMaterial('interior-bamboo',scene);frame.diffuseColor=Color3.FromHexString('#785840');frame.specularColor=Color3.Black();
const edgePaper=new StandardMaterial('paper-fold-edge',scene);edgePaper.diffuseColor=Color3.FromHexString('#9a302b');edgePaper.specularColor=Color3.Black();
// Octagonal prism with folded shoulders; only the paper has small tension wrinkles.
function radiusAt(v:number){
 if(v<.22)return .21+(.43-.21)*(v/.22);
 if(v>.78)return .21+(.43-.21)*((1-v)/.22);
 return .43;
}
// Eight flat-sided paper panels on slender ribs, with angular upper/lower shoulders.
for(let face=0;face<8;face++){
 const a0=face*Math.PI/4,a1=(face+1)*Math.PI/4;const positions:number[]=[],uvs:number[]=[],indices:number[]=[];const U=40,V=100;
 for(let j=0;j<=V;j++)for(let i=0;i<=U;i++){
  const u=i/U,v=j/V,r=radiusAt(v),y=-.46+v*.92;
  const x=(Math.sin(a0)*(1-u)+Math.sin(a1)*u)*r,z=(Math.cos(a0)*(1-u)+Math.cos(a1)*u)*r;
  const span=Math.sin(Math.PI*u);const heightEnvelope=Math.sin(Math.PI*v);
  const fold=.0015*Math.sin(v*210.+Math.sin(u*17.)*2.+face)*span;
  const tension=(.005*Math.sin(u*25.+v*11.)*Math.exp(-Math.min(u,1-u)*12.)-.003*span)*heightEnvelope;
  const radial=Vector3.Normalize(new Vector3(x,0,z));positions.push(x+radial.x*(fold+tension),y+1.35,z+radial.z*(fold+tension));uvs.push(u,v);
 }
 for(let j=0;j<V;j++)for(let i=0;i<U;i++){const a=j*(U+1)+i;indices.push(a,a+U+1,a+1,a+1,a+U+1,a+U+2);}
 const mesh=new Mesh(`thin-hanji-panel-${face}`,scene),data=new VertexData(),normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(mesh);mesh.material=paper;
}
for(let k=0;k<8;k++){
 const a=k*Math.PI/4;const path=Array.from({length:101},(_,j)=>{const v=j/100,r=radiusAt(v)-.002;return new Vector3(Math.sin(a)*r,.89+v*.92,Math.cos(a)*r);});
 const rib=MeshBuilder.CreateTube('octagonal-inner-rib',{path,radius:.0013,tessellation:6},scene);rib.material=frame;
}
for(const v of [0,1]){const r=radiusAt(v);const points=Array.from({length:9},(_,k)=>new Vector3(Math.sin(k*Math.PI/4)*r,.89+v*.92,Math.cos(k*Math.PI/4)*r));const hoop=MeshBuilder.CreateTube('thin-opening-rim',{path:points,radius:.0011,tessellation:6},scene);hoop.material=edgePaper;}
const cord=MeshBuilder.CreateTube('suspension-cord',{path:[new Vector3(0,1.81,0),new Vector3(0,2.8,0)],radius:.0018,tessellation:8},scene);cord.material=frame;
for(const side of [-1,1]){const handle=MeshBuilder.CreateTube('wire-handle',{path:[new Vector3(side*.15,1.81,0),new Vector3(side*.12,1.97,0),new Vector3(0,2.04,0)],radius:.0012,tessellation:6},scene);handle.material=frame;}
// Very soft light spill outside the silhouette, separate from the readable paper surface.
const haloTexture=new DynamicTexture('soft-lantern-spill',{width:256,height:256},scene,false);const hc=haloTexture.getContext() as CanvasRenderingContext2D;hc.clearRect(0,0,256,256);const hg=hc.createRadialGradient(128,128,20,128,128,128);hg.addColorStop(0,'rgba(255,255,255,.45)');hg.addColorStop(.45,'rgba(255,255,255,.18)');hg.addColorStop(1,'rgba(255,255,255,0)');hc.fillStyle=hg;hc.fillRect(0,0,256,256);haloTexture.hasAlpha=true;haloTexture.update();
const haloMaterial=new StandardMaterial('paper-light-spill',scene);haloMaterial.disableLighting=true;haloMaterial.diffuseColor=Color3.Black();haloMaterial.emissiveColor=Color3.FromHexString(LANTERN_PALETTE[4]);haloMaterial.opacityTexture=haloTexture;haloMaterial.alpha=.07;haloMaterial.disableDepthWrite=true;haloMaterial.backFaceCulling=false;
const halo=MeshBuilder.CreatePlane('soft-emission-halo',{width:1.65,height:1.8},scene);halo.position.set(0,1.35,0);halo.billboardMode=Mesh.BILLBOARDMODE_ALL;halo.material=haloMaterial;halo.isPickable=false;
let lampOn=true;
let night=false;const buttons=document.querySelectorAll<HTMLButtonElement>('[data-light]');
for(const b of buttons)b.onclick=()=>{night=b.dataset.light==='night';paper.setFloat('night',night?1:0);haloMaterial.alpha=lampOn?(night?.65:.04):0;scene.clearColor=night?new Color4(.035,.046,.065,1):new Color4(.88,.87,.83,1);sun.intensity=night?.12:1;document.body.classList.toggle('night',night);for(const other of buttons)other.setAttribute('aria-pressed',String(b===other));};
document.querySelector<HTMLButtonElement>('#lamp')!.onclick=()=>{lampOn=!lampOn;paper.setFloat('lampOn',lampOn?1:0);haloMaterial.alpha=lampOn?(night?.65:.04):0;const b=document.querySelector<HTMLButtonElement>('#lamp')!;b.textContent=lampOn?'내부 등 켜짐':'내부 등 꺼짐';b.setAttribute('aria-pressed',String(lampOn));};
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-color]'))b.onclick=()=>{const c=LANTERN_PALETTE[Number(b.dataset.color)];paper.setColor3('dye',Color3.FromHexString(c).toLinearSpace());paper.setColor3('dayDye',Color3.FromHexString(c).toLinearSpace());haloMaterial.emissiveColor=Color3.FromHexString(c);edgePaper.diffuseColor=Color3.FromHexString(c).scale(.65);for(const other of document.querySelectorAll('[data-color]'))other.setAttribute('aria-pressed',String(b===other));};
document.querySelector<HTMLButtonElement>('#closeup')!.onclick=()=>{camera.setTarget(new Vector3(.12,1.37,-.14));camera.alpha=-1.1;camera.beta=1.35;camera.radius=1.5;document.body.classList.add('closeup');};
document.querySelector<HTMLButtonElement>('#reset')!.onclick=()=>{camera.setTarget(new Vector3(0,1.35,0));camera.alpha=-1.15;camera.beta=1.3;camera.radius=2.6;document.body.classList.remove('closeup');};
engine.runRenderLoop(()=>{paper.setVector3('eye',camera.position);scene.render();if(scene.isReady())document.querySelector<HTMLElement>('#loading')!.hidden=true;});window.addEventListener('resize',()=>engine.resize());


let thicknessDetail=true;
document.querySelector<HTMLButtonElement>('#thickness')!.onclick=()=>{thicknessDetail=!thicknessDetail;paper.setFloat('thicknessDetail',thicknessDetail?1:0);const button=document.querySelector<HTMLButtonElement>('#thickness')!;button.setAttribute('aria-pressed',String(thicknessDetail));button.textContent=thicknessDetail?'한지 두께 표현 켜짐':'한지 두께 표현 꺼짐';};

// Group review reuses the exact same mesh geometry, shader, dye and illumination.
if(new URLSearchParams(location.search).get('group')==='3'){
 document.title='사사 · 한지 연등 3×3 거리 비교';
 const originals=[...scene.meshes];
 for(let row=-1;row<=1;row++)for(let col=-1;col<=1;col++){
  if(row===0&&col===0)continue;
  for(const original of originals){const copy=(original as Mesh).clone(`${original.name}-group-${row}-${col}`,null,true)!;copy.position.addInPlace(new Vector3(col*.9,0,row*.9));}
 }
 document.querySelector('header span')!.textContent='한지 연등 · 3 × 3 거리 비교';
 document.querySelector('.caption')!.innerHTML='<span class="overline">같은 한지, 다른 거리</span><h1>아홉 개의 연등.</h1><p>중심 간격 0.9m · 재질과 조명 고정</p>';
 document.querySelector('footer p')!.innerHTML='드래그하여 회전 · 휠 / 두 손가락으로 확대 <span>실제 중심 간격 0.9m · 동일 재질 9개</span>';
 canvas.setAttribute('aria-label','같은 한지 연등 아홉 개를 3×3으로 배치한 거리 비교 장면');
 const near=document.querySelector<HTMLButtonElement>('#closeup')!,far=document.querySelector<HTMLButtonElement>('#reset')!;
 near.textContent='가까이 · 3×3';far.textContent='멀리 · 3×3';
 function groupView(distant:boolean){camera.setTarget(new Vector3(0,1.35,0));camera.alpha=-1.15;camera.beta=2.0;camera.radius=distant?12:8;near.setAttribute('aria-pressed',String(!distant));far.setAttribute('aria-pressed',String(distant));}
 camera.upperRadiusLimit=16;near.onclick=()=>groupView(false);far.onclick=()=>groupView(true);groupView(false);
 document.body.classList.add('closeup');
}
