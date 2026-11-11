import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import type {Scene} from '@babylonjs/core/scene';
import type {Face} from './face-types';

const coats:Record<Face,string>={
 human:'#d9ad90',rat:'#aaa3a2',ox:'#a37551',tiger:'#df9b4c',rabbit:'#dfd3c5',dragon:'#659d87',snake:'#8ca667',
 horse:'#aa7454',sheep:'#e3d9c9',monkey:'#a37953',rooster:'#dbb679',dog:'#bd936e',pig:'#dfaaa0'
};
export function visitorFace(scene:Scene,parent:TransformNode,kind:Face,monk=false){
 const root=new TransformNode(kind+' face',scene),groups=new Map<string,Mesh[]>();
 function finish(mesh:Mesh,color:string,x:number,y:number,z:number){
  mesh.position.set(x,y,z);
  if(!groups.has(color))groups.set(color,[]);
  groups.get(color)!.push(mesh);return mesh;
 }
 function oval(color:string,x:number,y:number,z:number,w:number,h:number,d:number,tilt=0){
  const m=MeshBuilder.CreateSphere('oval',{diameter:1,segments:14},scene);
  m.scaling.set(w,h,d);m.rotation.z=tilt;return finish(m,color,x,y,z);
 }
 function point(color:string,x:number,y:number,z:number,width:number,height:number,tilt=0){
  const m=MeshBuilder.CreateCylinder('point',{diameterBottom:width,diameterTop:.014,height,tessellation:16},scene);
  m.rotation.z=tilt;m.scaling.z=.67;return finish(m,color,x,y,z);
 }
 const base=coats[kind],dark='#413832',cream='#ebd6b6',pink='#cb9089';
 const human=kind==='human',long=kind==='horse'||kind==='ox';
 oval(base,0,0,0,human?.365:long?.43:.49,human?.45:.41,long?.47:.39);
 if(human){
  oval(base,0,-.18,0,.15,.15,.16);
  if(!monk){
   oval(dark,0,.117,-.018,.384,.25,.37);
   oval(dark,-.062,.112,.128,.235,.084,.093,.25);
  }
  oval(base,0,-.026,.192,.052,.083,.057);
  oval('#9d6758',0,-.106,.164,.069,.013,.019);
 }
 for(const s of [-1,1]){
  const x=s*(human?.071:.094);
  if(kind==='monkey')oval(cream,x,.005,.145,.19,.23,.10,s*.18);
  oval(dark,x,.021,human?.179:long?.215:.185,monk?.05:.038,monk?.013:.048,.022);
  if(!monk)oval('#fff3da',x-.006,.031,human?.19:long?.226:.196,.010,.010,.007);
  if(human){oval(base,s*.183,-.008,0,.054,.09,.060);oval(dark,x,.068,.167,.066,.013,.017,-s*.08);}
  if(kind==='rat'||kind==='monkey'){
   const h=kind==='rat'?.17:.015;
   oval(base,s*.21,h,0,.17,.18,.095);oval(pink,s*.216,h,.034,.115,.124,.039);
  }
  if(kind==='rabbit'){
   oval(base,s*.105,.285,0,.115,.33,.09,-s*.15);oval(pink,s*.11,.29,.037,.063,.23,.025,-s*.15);
  }
  if(['tiger','pig','horse','dragon'].includes(kind))point(base,s*.153,.193,-.01,.14,kind==='horse'?.19:.145,-s*.24);
  if(kind==='dog')oval('#805a44',s*.219,-.006,-.007,.123,.27,.135,s*.20);
  if(kind==='ox'||kind==='sheep'||kind==='dragon'){
   const horn=kind==='sheep'?'#ab8761':'#d1b683';
   if(kind==='sheep'){
    const path=Array.from({length:15},(_,i)=>{const a=i*.29;return new Vector3(s*(.018*i/14),.073*Math.cos(a),.068*Math.sin(a));});
    finish(MeshBuilder.CreateTube('curled horn',{path,radius:.036,tessellation:10,cap:Mesh.CAP_ALL},scene),horn,s*.204,.095,0);
   }else point(horn,s*.154,.225,-.065,.085,kind==='dragon'?.22:.16,-s*.35);
   oval(base,s*.22,.073,0,.14,.075,.085,s*.35);
  }
  if(kind==='tiger'){
   oval(dark,s*.183,-.038,.125,.077,.017,.026,s*.27);
   oval(dark,s*.055,.147,.124,.024,.08,.029,-s*.25);
  }
 }
 if(kind==='horse')oval(dark,0,.15,-.094,.13,.23,.27);
 if(kind==='sheep')for(const x of [-.13,-.045,.045,.13])oval('#eee5d6',x,.145,.07,.141,.141,.14);
 if(kind==='pig'||long||kind==='dragon'){
  const depth=long?.25:.15,z=long?.217:.196;
  oval(kind==='pig'?pink:cream,0,-.084,z,long?.263:.19,.139,depth);
  for(const s of [-1,1])oval(dark,s*.047,-.068,z+depth*.46,.024,.024,.013);
 }else if(kind==='rooster'){
  for(let i=0;i<3;i++)oval('#ae4a3d',0,.204+i*.009,(i-1)*.065,.08,.145,.087);
  oval('#b85143',0,-.1,.153,.074,.133,.075);
  const beak=point('#da9639',0,-.043,.224,.119,.135);beak.rotation.x=Math.PI/2;
 }else if(kind==='snake'){
  oval(base,0,-.059,.167,.29,.143,.159);
  const tongue=oval('#b05a56',0,-.107,.252,.023,.015,.088);tongue.rotation.x=.12;
 }else if(!human){
  for(const s of [-1,1])oval(cream,s*.04,-.065,.184,.116,.082,.089);
  oval(kind==='rat'||kind==='rabbit'?pink:dark,0,-.041,.224,.055,.039,.035);
 }
 for(const [hex,parts] of groups){
  const material=new StandardMaterial(kind+' pigment',scene);
  material.diffuseColor=Color3.FromHexString(hex);material.specularColor=Color3.Black();
  const mesh=Mesh.MergeMeshes(parts,true,true)!;mesh.material=material;mesh.parent=root;mesh.isPickable=false;
 }
 root.parent=parent;return root;
}
