import { renderWhileViewing } from './preview-rendering.ts';
import './daylight-study.css';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';

// Isolated daytime reference study. No temple slots, palette or night materials are mutated.
document.querySelector<HTMLDivElement>('#app')!.innerHTML=`<canvas id="daylight" aria-label="촘촘한 팔각 연등 아래의 낮 비교 장면. 드래그로 둘러보기." tabindex="0"></canvas><header><a href="/">사사</a><span>햇살 아래 연등 · 비교 02</span></header><div id="loading">햇살 아래 연등을 준비하고 있어요…</div><footer><nav aria-label="비교 장면"><button id="wide" aria-pressed="true">연등 아래</button><button id="close" aria-pressed="false">한지 가까이</button><button id="transmit" aria-pressed="true">햇빛 투과 켜짐</button></nav><p>드래그로 둘러보기 · 내부 전구를 끈 낮 장면</p></footer>`;
const canvas=document.querySelector<HTMLCanvasElement>('#daylight')!;
const engine=new Engine(canvas,true,{preserveDrawingBuffer:true});
const scene=new Scene(engine);scene.clearColor=new Color4(.71,.86,.94,1);
const camera=new ArcRotateCamera('canopy-eye',-Math.PI/2,1.94,11,new Vector3(0,5.6,3),scene);camera.fov=1.05;camera.attachControl(canvas,true);camera.minZ=.04;camera.lowerRadiusLimit=1;camera.upperRadiusLimit=22;camera.wheelPrecision=45;camera.panningSensibility=0;
const sky=new HemisphericLight('sky',new Vector3(0,1,0),scene);sky.intensity=.95;sky.groundColor=Color3.FromHexString('#b8aa83');
const sun=new DirectionalLight('sun',new Vector3(-.35,-.95,.22),scene);sun.intensity=1.3;
const fibre=new Texture('/textures/hanji-fibres-generated-v1.png',scene);fibre.anisotropicFilteringLevel=16;
const vertex=`precision highp float;
attribute vec3 position;attribute vec3 normal;attribute vec2 uv;uniform mat4 viewProjection;
#include<instancesDeclaration>
varying vec3 vNormal;varying vec2 vUV;varying vec3 vLocal;
void main(){
#include<instancesVertex>
vNormal=normalize(mat3(finalWorld)*normal);vUV=uv;vLocal=position;gl_Position=viewProjection*finalWorld*vec4(position,1.);
}`;
const fragment=`precision highp float;
varying vec3 vNormal;varying vec2 vUV;varying vec3 vLocal;
uniform sampler2D fibres;uniform vec3 dye;uniform float transmission;
void main(){
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 float fibre=dot(texture2D(fibres,vUV*vec2(.7,1.2)).rgb,vec3(.299,.587,.114));
 float airy=clamp((fibre-.83)*6.5,0.,1.);
 float edge=min(vUV.x,1.-vUV.x);
 float edgeAA=max(.002,fwidth(vUV.x)*.7);
 float seam=1.-smoothstep(.008-edgeAA,.035+edgeAA,edge);
 float hoop=abs(fract(vUV.y*13.+.5)-.5);
 float hoopAA=max(.003,fwidth(vUV.y)*13.*.7);
 float rib=mix(.28,1.,smoothstep(.009-hoopAA,.045+hoopAA,hoop));
 float fold=min(abs(vUV.y-.22),abs(vUV.y-.78));
 rib*=mix(.43,1.,smoothstep(.003,.018,fold));
 float density=mix(1.05,.30,airy)+1.1*seam;
 vec3 toSun=normalize(vec3(.8,.60,-.35));
 float front=max(dot(n,toSun),0.);float back=max(dot(-n,toSun),0.);
 // Sun and diffuse sky illuminate the thin sheet from outside, with no internal bulb.
 vec3 absorbed=exp(-(-log(max(dye,vec3(.012)))*.86+vec3(.1))*density);
 vec3 lightColour=mix(dye,absorbed,.055);
 vec3 reflected=dye*(.12+.62*front)*mix(.85,1.06,airy);
 float openSky=.26+.20*max(n.y,0.);
 // Directional sunlight produces bright facets and shaded folds, rather than a uniform wash.
 float sunPatch=.70+.30*smoothstep(.12,.85,vUV.y);
 float paperOverlap=mix(.64,1.,smoothstep(.015,.10,edge));
 vec3 transmitted=lightColour*(openSky+1.45*back*sunPatch)*exp(-density*.38)*paperOverlap*transmission;
 vec3 linear=(reflected+transmitted)*1.65*mix(.40,1.,1.-seam)*rib;
 // Preserve channel ratios and saturated dye, while retaining brightness differences.
 float peak=max(linear.r,max(linear.g,linear.b));linear/=max(1.,peak/ .94);
 gl_FragColor=vec4(pow(max(linear,0.),vec3(1./2.2)),1.);
}`;
const colors=['#00c64e','#ff398a','#0345ef','#ffb900','#f51220'];
const materials=colors.map((c,i)=>{const m=new ShaderMaterial(`sunlit-hanji-${i}`,scene,{vertexSource:vertex,fragmentSource:fragment},{attributes:['position','normal','uv'],uniforms:['world','viewProjection','dye','transmission'],samplers:['fibres']});m.backFaceCulling=false;m.setTexture('fibres',fibre);m.setColor3('dye',Color3.FromHexString(c).toLinearSpace());m.setFloat('transmission',1);return m;});
function radius(v:number){return v<.22?.15+.18*v/.22:v>.78?.15+.18*(1-v)/.22:.33;}
function lantern(name:string){
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];const U=8,V=24;
 for(let side=0;side<8;side++){
  const base=positions.length/3,a=side*Math.PI/4,b=(side+1)*Math.PI/4;
  for(let j=0;j<=V;j++)for(let i=0;i<=U;i++){
   const u=i/U,v=j/V,r=radius(v),sag=-.002*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
   const x=(Math.sin(a)*(1-u)+Math.sin(b)*u)*(r+sag),z=(Math.cos(a)*(1-u)+Math.cos(b)*u)*(r+sag);
   positions.push(x,(v-.5)*.62+.0008*Math.sin(u*27+v*91),z);uvs.push(u,v);
  }
  for(let j=0;j<V;j++)for(let i=0;i<U;i++){const a=base+j*(U+1)+i;indices.push(a,a+U+1,a+1,a+1,a+U+1,a+U+2);}
 }
 const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);const d=new VertexData();d.positions=positions;d.normals=normals;d.indices=indices;d.uvs=uvs;const m=new Mesh(name,scene);d.applyToMesh(m);return m;
}
const buckets:Matrix[][]=colors.map(()=>[]);
// Almost touching, in five repeated bands; fixed deterministic sample positions.
for(let row=0;row<36;row++)for(let col=0;col<23;col++){
 const x=(col-11)*.65,z=-8+row*.66,y=4.25-.20*(1-Math.pow(x/7.5,2))+.025*Math.sin(row*.9);
 buckets[(Math.floor(row/4)+4)%5].push(Matrix.Translation(x,y,z));
}
buckets.forEach((matrices,i)=>{const m=lantern(`octagonal-band-${i}`);m.material=materials[i];m.thinInstanceAdd(matrices);});
function matte(name:string,hex:string){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex).toLinearSpace();m.specularColor=Color3.Black();return m;}
const cordMat=matte('linen-cord','#766b49');
for(let col=0;col<23;col++){const x=(col-11)*.65;const y=4.25-.20*(1-Math.pow(x/7.5,2));const cord=MeshBuilder.CreateCylinder('canopy-cord',{height:24,diameter:.008,tessellation:5},scene);cord.rotation.x=Math.PI/2;cord.position.set(x,y+.4,3.5);cord.material=cordMat;}
const floor=MeshBuilder.CreateGround('warm-stone-court',{width:36,height:54},scene);floor.position.z=6;floor.material=matte('sunlit-stone','#8b806d');
// Quiet perimeter gives the bright paper a shaded architectural backdrop.
const wallMat=matte('perimeter-plaster','#b5ab90');const wood=matte('perimeter-wood','#594a35');
for(const x of [-8.2,8.2]){const wall=MeshBuilder.CreateBox('low-wall',{width:.25,height:1.2,depth:30},scene);wall.position.set(x,.6,4);wall.material=wallMat;}
const back=MeshBuilder.CreateBox('shaded-backdrop',{width:16,height:2.5,depth:.3},scene);back.position.set(0,1.25,17);back.material=wood;
for(const z of [-7,0,7,14])for(const x of [-7.8,7.8]){const post=MeshBuilder.CreateCylinder('canopy-post',{height:4.8,diameter:.12,tessellation:12},scene);post.position.set(x,2.4,z);post.material=wood;}
function setView(close:boolean){camera.setTarget(close?new Vector3(0,4.05,-3.38):new Vector3(0,5.6,3));camera.alpha=-Math.PI/2;camera.beta=1.94;camera.radius=close?2.5:11;document.querySelector('#wide')!.setAttribute('aria-pressed',String(!close));document.querySelector('#close')!.setAttribute('aria-pressed',String(close));}
document.querySelector<HTMLButtonElement>('#wide')!.onclick=()=>setView(false);
document.querySelector<HTMLButtonElement>('#close')!.onclick=()=>setView(true);
let transmit=true;document.querySelector<HTMLButtonElement>('#transmit')!.onclick=()=>{transmit=!transmit;for(const m of materials)m.setFloat('transmission',transmit?1:0);const b=document.querySelector<HTMLButtonElement>('#transmit')!;b.setAttribute('aria-pressed',String(transmit));b.textContent=transmit?'햇빛 투과 켜짐':'햇빛 투과 꺼짐';};
renderWhileViewing(engine,()=>{scene.render();if(scene.isReady())document.querySelector<HTMLElement>('#loading')!.hidden=true;});window.addEventListener('resize',()=>engine.resize());
