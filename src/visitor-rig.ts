import{bowPhase}from'./motion-timing';
import {visitorFace} from './visitor-face';
import type {Face} from './face-types';
import {Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import type {Mesh} from '@babylonjs/core/Meshes/mesh';
import type {Scene} from '@babylonjs/core/scene';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
export function legacyVisitorMesh(scene:Scene,name:string,monk=false){
 const root=new TransformNode(name,scene);
 const fabric=new StandardMaterial(name+'-fabric',scene);fabric.diffuseColor=Color3.FromHexString('#57756b');fabric.specularColor=Color3.Black();
 const skin=new StandardMaterial(name+'-skin',scene);skin.diffuseColor=Color3.FromHexString('#e6bd8b');
 function capsule(label:string,height:number,radius:number,x:number,y:number,material:StandardMaterial){
  const mesh=MeshBuilder.CreateCapsule(name+label,{height,radius,tessellation:10},scene);
  mesh.position.set(x,y,0);mesh.parent=root;mesh.material=material;mesh.isPickable=false;return mesh;
 }
 function joint(label:string,parent:TransformNode,x:number,y:number,z=0){
  const node=new TransformNode(name+label,scene);node.parent=parent;node.position.set(x,y,z);return node;
 }
 const hips=joint('hips',root,0,.63),chest=joint('chest',hips,0,0);
 function part(label:string,parent:TransformNode,height:number,radius:number,y:number,material:StandardMaterial){
  const mesh=capsule(label,height,radius,0,y,material);mesh.parent=parent;return mesh;
 }
 let face:Face="human";
 const head=new TransformNode("visitor face joint",scene);head.parent=chest;
 let model=visitorFace(scene,head,face,monk);
 function setFace(next:Face){
  if(next===face)return;
  const replacement=visitorFace(scene,head,next,monk);model.dispose(false,true);model=replacement;face=next;
 }
 head.position.y=.73;head.scaling.setAll(1.18);
 hips.scaling.set(1,.9,1);
 const coat=MeshBuilder.CreateLathe('everyday jacket',{shape:[[0,-.07],[.23,-.07],[.235,-.04],[.205,.27],[.22,.40],[.185,.47],[.12,.51],[0,.51]].map(([r,y])=>new Vector3(r,y,0)),tessellation:32},scene);
 coat.parent=chest;coat.scaling.z=.79;coat.material=fabric;coat.isPickable=false;
 const binding=new StandardMaterial(name+'-coat-trim',scene);binding.diffuseColor=Color3.FromHexString('#c8bc98');binding.specularColor=Color3.Black();
 for(const side of [-1,1]){
  const lapel=MeshBuilder.CreateTube('jacket collar',{path:[new Vector3(side*.106,.486,.087),new Vector3(side*.071,.44,.182),new Vector3(.015,.381,.208)],radius:.012,tessellation:8},scene);
  lapel.parent=coat;lapel.material=binding;lapel.isPickable=false;
 }
 for(const height of [.30,.20,.10]){
  const knot=capsule('cloth button',.025,.012,.015,height,binding);
  knot.parent=coat;knot.position.z=.217;knot.scaling.x=1.6;
 }
 const trousers=new StandardMaterial(name+'-trousers',scene);trousers.diffuseColor=Color3.FromHexString('#474e50');trousers.specularColor=Color3.Black();
 const hands:Mesh[]=[];
 const legs:TransformNode[]=[],shins:TransformNode[]=[],arms:TransformNode[]=[],forearms:TransformNode[]=[],sleeves:Mesh[]=[];
 for(const side of [-1,1]){
  const hip=joint('hip',hips,side*.11,0),knee=joint('knee',hip,0,-.35);
  part('thigh',hip,.42,.099,-.175,trousers);part('shin',knee,.43,.089,-.175,trousers);
  const foot=part('shoe',knee,.16,.084,-.45,trousers);foot.scaling.set(1.13,.9,1.58);foot.position.z=.034;
  hip.scaling.y=hip.scaling.z=.79;
  legs.push(hip);shins.push(knee);
  const shoulder=joint('shoulder',chest,side*.203,.41),elbow=joint('elbow',shoulder,0,-.255);
  sleeves.push(part('sleeve',shoulder,.32,.087,-.125,fabric));
  sleeves.push(part('cuff',elbow,.28,.071,-.11,fabric));
  hands.push(part('hand',elbow,.14,.056,-.25,skin));
  arms.push(shoulder);forearms.push(elbow);
 }
 function ease(phase:number,start:number,end:number){
  const u=Math.min(1,Math.max(0,(phase-start)/(end-start)));return u*u*(3-2*u);
 }
 function bow(phase:number){
  phase=bowPhase(phase);chest.rotation.y=0;
  for(const limb of [...legs,...shins])limb.rotationQuaternion=null;
  // Give the hands time to take weight before lowering the forehead.
  const joined=ease(phase,0,.105)*(1-ease(phase,.89,1));
  const kneel=ease(phase,.13,.36)*(1-ease(phase,.76,.90));
  const fold=ease(phase,.33,.51)*(1-ease(phase,.59,.75));
  const planted=ease(phase,.29,.42)*(1-ease(phase,.70,.79));
  const thigh=-1.48*kneel,shin=1.59*kneel;
  // Keep the shoe centre over its standing contact as the two leg segments fold.
  hips.position.y=.63+.9*.79*(.35*(Math.cos(thigh)-1)+.45*(Math.cos(shin)-1)+.034*Math.sin(shin));
  hips.position.z=.79*(.35*Math.sin(thigh)+.45*Math.sin(shin)+.034*(1-Math.cos(shin)));
  chest.rotation.x=.20*kneel+1.15*fold;
  head.rotation.x=.09*joined+.66*fold;
  for(let i=0;i<2;i++){
   legs[i].rotation.x=thigh;shins[i].rotation.x=shin-thigh;
   const side=i===0?-1:1,arm=arms[i],elbow=forearms[i];
   if(!joined){
    arm.rotationQuaternion=null;elbow.rotationQuaternion=null;
    arm.rotation.setAll(0);elbow.rotation.setAll(0);hands[i].scaling.setAll(1);continue;
   }
   const shoulder=arm.position;
   const target=Vector3.Lerp(new Vector3(shoulder.x,shoulder.y-.502,0),new Vector3(side*.047,.38,.245),joined);
   // Convert the stationary cushion contact into the rotating chest frame.
   const pitch=chest.rotation.x,dy=(.052-hips.position.y)/hips.scaling.y,dz=.76-hips.position.z;
   const ground=new Vector3(side*.235,dy*Math.cos(pitch)+dz*Math.sin(pitch),dz*Math.cos(pitch)-dy*Math.sin(pitch));
   Vector3.LerpToRef(target,ground,planted,target);
   const axis=target.subtract(shoulder),length=Math.min(.504,axis.length());
   axis.normalize();
   const hint=new Vector3(side*.70,-.85,-.12);
   const bend=hint.subtract(axis.scale(Vector3.Dot(hint,axis))).normalize();
   const upper=.255,lower=.25,along=(upper*upper-lower*lower+length*length)/(2*length);
   const elbowOffset=axis.scale(along).add(bend.scale(Math.sqrt(Math.max(0,upper*upper-along*along))));
   const forearm=axis.scale(length).subtract(elbowOffset);
   const upperQ=Quaternion.Identity(),lowerQ=Quaternion.Identity();
   Quaternion.FromUnitVectorsToRef(Vector3.Down(),elbowOffset.normalize(),upperQ);
   Quaternion.FromUnitVectorsToRef(Vector3.Down(),forearm.normalize(),lowerQ);
   arm.rotationQuaternion=upperQ;elbow.rotationQuaternion=upperQ.conjugate().multiply(lowerQ);
   hands[i].scaling.set(1,1-.19*planted,1+.15*planted);
  }
 }
 return {root,hips,head,legs,shins,arms,forearms,hands,chest,coat,sleeves,bow,plantFeet:()=>{},setFace,get face(){return face;}};
}

