import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3,Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { renderWhileViewing } from './preview-rendering.ts';

const canvas=document.querySelector<HTMLCanvasElement>('#head')!;
const engine=new Engine(canvas,true);
const scene=new Scene(engine);
scene.clearColor=new Color4(.19,.18,.15,1);
const camera=new ArcRotateCamera('reference-view',-Math.PI/2,Math.PI/2,600,Vector3.Zero(),scene);
camera.mode=Camera.ORTHOGRAPHIC_CAMERA;
camera.orthoLeft=-185;camera.orthoRight=185;camera.orthoTop=250;camera.orthoBottom=-250;
camera.attachControl(canvas,true);camera.panningSensibility=0;
camera.lowerBetaLimit=1.18;camera.upperBetaLimit=1.88;
const ambient=new HemisphericLight('indirect',new Vector3(0,1,-.3),scene);ambient.intensity=.66;
ambient.groundColor=new Color3(.45,.32,.19);
const key=new DirectionalLight('window',new Vector3(.58,-.45,.85),scene);key.intensity=1.03;
function material(name:string,hex:string,spec:number){
 const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);
 m.specularColor=new Color3(spec,spec*.82,spec*.52);m.specularPower=32;return m;
}
const gilt=material('warm gilding','#b88b43',.30);
const curls=material('dark patinated curls','#292820',.14);
const g=(v:number,w:number)=>Math.exp(-((v/w)**2));
const clamp=(v:number)=>Math.min(1,Math.max(0,v));

// The front elevation uses coordinates of the enlarged crop. Profile interpolation
// sets the silhouette; depth is inferred for the oblique inspection view.
type Section=[number,number,number]; // image y, half width, half depth
function radius(profile:Section[],y:number,column:1|2){
 let k=0;while(k<profile.length-2 && y>profile[k+1][0])k++;
 const a=profile[k],b=profile[k+1],prev=profile[Math.max(0,k-1)],next=profile[Math.min(profile.length-1,k+2)];
 const t=(y-a[0])/(b[0]-a[0]),span=b[0]-a[0];
 const m=(b[column]-prev[column])/(b[0]-prev[0])*span;
 const n=(next[column]-a[column])/(next[0]-a[0])*span;
 return Math.max(.1,(2*t**3-3*t*t+1)*a[column]+(t**3-2*t*t+t)*m+(-2*t**3+3*t*t)*b[column]+(t**3-t*t)*n);
}
function surface(name:string,p:Section[],material:StandardMaterial,cols:number,rows:number,
 sculpt:(x:number,y:number,z:number,a:number)=>number[]){
 const pos:number[]=[],indices:number[]=[],colors:number[]=[];
 for(let j=0;j<=rows;j++){
  const y=p.at(-1)![0]+(p[0][0]-p.at(-1)![0])*j/rows,rx=radius(p,y,1),rz=radius(p,y,2);
  for(let i=0;i<cols;i++){
   const a=2*Math.PI*i/cols;
   const [x,v,z,r=1,green=1,b=1]=sculpt(rx*Math.sin(a),y,-rz*Math.cos(a),a);
   pos.push(x-6,250-v,z);colors.push(r,green,b,1);
   if(j<rows){const q=j*cols+i,next=j*cols+(i+1)%cols;indices.push(q,next,q+cols,next,next+cols,q+cols);}
  }
 }
 const data=new VertexData(),normals:number[]=[];VertexData.ComputeNormals(pos,indices,normals);
 data.positions=pos;data.indices=indices;data.normals=normals;data.colors=colors;
 const mesh=new Mesh(name,scene);data.applyToMesh(mesh);mesh.material=material;return mesh;
}
const face:Section[]=[[155,55,55],[191,98,82],[214,108,87],[257,110,94],[295,109,97],[337,102,93],[371,91,86],[402,74,77],[419,52,62],[427,25,42],[429,1,20]];
surface('face',face,gilt,320,300,(x,y,z,a)=>{
 const s=Math.abs(x),f=Math.max(0,Math.cos(a))**2,t=clamp((s-16)/61);
 const span=Math.sin(Math.PI*t)**.76;
 const eye=273-7*t+2*span, brow=251-15*span-13*t;
 const opening=span*clamp((y-eye+4*span)/1.4)*clamp((eye+3.6*span-y)/1.4);
 const iris=opening*clamp((9-Math.hypot(s-44,y-eye-2))/2);
 const mouthSpan=clamp(1-(x/31)**2),lipLine=353-3*(1-mouthSpan)+1.2*Math.cos(x/7);
 const nostril=g(s-13,4.5)*g(y-325,3);
 const nose=19*g(x,13)*g(y-282,48)+20*g(x,18)*g(y-317,12)
  +10*g(s-16,8.5)*g(y-321,8)-5*nostril;
 const upperLip=8*g(y-lipLine+5.5+2*g(s-9,6),6.1);
 const lowerLip=11*g(y-lipLine-6.8,7.1);
 const relief=nose+11*g(s-60,34)*g(y-312,34)+10*g(x,43)*g(y-392,19)
  -9*g(s-46,25)*g(y-260,18)+span*(4.8*g(y-brow,8)+3.6*g(y-eye+8,7)+3*g(y-eye-8,5))
  +7*g(x,34)*g(y-354,21)+mouthSpan*(upperLip+lowerLip);
 const vermilion=mouthSpan*g(y-lipLine,12);
 const ink=f*Math.max(.95*iris,.66*span*g(y-brow,2.7),.40*span*g(y-eye+3*span,1.5),.56*nostril,.43*mouthSpan*g(y-lipLine,1.6));
 return [x,y,z-f*relief,1-.88*ink,1-.93*ink-.68*f*vermilion,1-.93*ink-.48*f*vermilion];
});
const crown:Section[]=[[62,2,2],[65,30,25],[79,50,41],[103,66,54],[121,69,61],[135,81,72],[148,90,79],[173,104,88],[196,113,95],[207,114,97]];
const radiusAtBand=Array.from({length:24},(_,i)=>radius(crown,Math.min(207,65+i*6.7),1));
surface('curl-covered crown',crown,curls,480,200,(x,y,z,a)=>{
 const temple=16*(1-Math.max(0,Math.cos(a))**4)*clamp((y-175)/32);
 // Stagger tapered whorls along gently curving rows. Vary their pitch and relief
 // continuously around the crown so the front and rear meet at the same seam.
 const row=(y-62)/6.7+.31*Math.sin(3*a+y*.029)+.16*Math.cos(7*a-y*.018);
 const band=Math.floor(row), v=(row-band)*2-1;
 const radius=radiusAtBand[Math.min(radiusAtBand.length-1,Math.max(0,band))];
 const count=Math.max(8,Math.round(2*Math.PI*radius/8.4));
 const column=a*count/(2*Math.PI)+band*.47+.21*Math.sin(5*a+band*.54);
 const u=2*(column-Math.floor(column)) - 1;
 const r=Math.hypot(u+.12*v,v);
 const envelope=Math.max(0,1-r*r)**1.4;
 const spiral=.5+.5*Math.cos(Math.atan2(v,u)-r*8);
 const variation=.9+.16*Math.sin(3*a-band*.8);
 const ridge=envelope*(.52+.48*spiral);
 const bump=2.75*ridge*variation, tone=.65+.47*ridge*variation;
 return [x+bump*Math.sin(a),y+temple-5*g(Math.abs(x)-81,24)*clamp((y-177)/30),z-bump*Math.cos(a)-2,tone,tone,tone];
});
function oval(name:string,x:number,y:number,z:number,w:number,h:number,d:number){
 const o=MeshBuilder.CreateSphere(name,{diameter:1,segments:32},scene);o.position.set(x-6,250-y,z);o.scaling.set(w,h,d);o.material=gilt;return o;
}
oval('crown jewel',0,155,-85,22,12,9);
surface('neck',[[396,60,52],[426,63,53],[462,70,57],[492,100,67],[515,126,74]],gilt,128,90,(x,y,z,a)=>{
 const groove=Math.max(0,Math.cos(a))*(2.1*g(y-447,3)+1.6*g(y-460,3)+1.2*g(y-473,3));
 return [x,y,z+groove+14];
});
for(const side of [-1,1]){
 const ear:Section[]=[[238,3,3],[248,13,9],[268,16,11],[301,12,10],[332,9,8],[368,8,7],[397,7,6],[410,7,5],[416,2,2]];
 surface('ear',ear,gilt,72,90,(x,y,z,a)=>{
  const bowl=5*Math.max(0,Math.cos(a))*g(x,7)*g(y-278,28);
  return [side*(109-6*clamp((y-320)/90))+x,y,z-12+bowl];
 });
}
document.querySelector('#front')!.addEventListener('click',()=>{camera.alpha=-Math.PI/2;camera.beta=Math.PI/2;camera.inertialAlphaOffset=0;camera.inertialBetaOffset=0;});
document.querySelector('#side')!.addEventListener('click',()=>{camera.alpha=-Math.PI/2+.58;camera.beta=Math.PI/2;});
new ResizeObserver(()=>engine.resize()).observe(canvas);
renderWhileViewing(engine,()=>scene.render());

const input=document.querySelector<HTMLInputElement>('#reference-file')!;
const reference=document.querySelector<HTMLImageElement>('#reference')!;
let referenceUrl='';
input.onchange=()=>{
 const file=input.files?.[0];
 if(!file)return;
 if(referenceUrl)URL.revokeObjectURL(referenceUrl);
 referenceUrl=URL.createObjectURL(file);
 reference.src=referenceUrl;
 reference.hidden=false;
};
