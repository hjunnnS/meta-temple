import type{Scene}from'@babylonjs/core/scene';
import type{Mesh}from'@babylonjs/core/Meshes/mesh';
import type{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';
import{MeshBuilder}from'@babylonjs/core/Meshes/meshBuilder.js';
import{Vector3,Quaternion,Matrix}from'@babylonjs/core/Maths/math.vector.js';
export const haetaeSites=[{x:-4.8,z:-43,radius:.9,yaw:-Math.PI/2},{x:4.8,z:-43,radius:.9,yaw:Math.PI/2}];
/** A matched, low stone pair leaves the centre of the approach open. */
export function placeHaetae(scene:Scene,parts:Mesh[],stone:StandardMaterial){
 for(const[side,site]of haetaeSites.entries()){
  const meshes:Mesh[]=[];const add=(m:Mesh,x:number,y:number,z:number)=>{m.position.set(site.x+x,y,site.z+z);m.material=stone;m.receiveShadows=true;parts.push(m);meshes.push(m);return m;};
  const oval=(name:string,x:number,y:number,z:number,w:number,h:number,d:number)=>{const m=add(MeshBuilder.CreateSphere('haetae-'+side+'-'+name,{diameter:1,segments:12},scene),x,y,z);m.scaling.set(w,h,d);return m;};
  add(MeshBuilder.CreateBox('haetae-plinth',{width:1.35,height:.25,depth:1.75},scene),0,.125,0);
  oval('body',0,.83,.12,.88,.78,1.18);oval('chest',0,1.02,-.28,.9,.85,.72);
  for(const x of [-.33,.33])for(const z of [-.37,.55]){oval('leg',x,.57,z,.24,.7,.28);oval('paw',x,.34,z-.08,.35,.18,.43);for(let i=-1;i<=1;i++)oval('toe',x+i*.085,.34,z-.28,.065,.07,.13);}
  oval('head',0,1.35,-.44,.78,.66,.65);oval('muzzle',0,1.20,-.77,.58,.24,.22);
  oval('lower-jaw',0,1.09,-.69,.50,.12,.25);
  for(const x of [-.22,.22]){oval('eye-rim',x,1.44,-.70,.24,.18,.11);oval('eyeball',x,1.44,-.76,.09,.1,.045);const brow=oval('brow',x,1.54,-.71,.28,.08,.12);brow.rotation.z=x<0?-.24:.24;oval('ear',x*1.7,1.55,-.37,.17,.31,.20);}
  oval('nose',0,1.29,-.85,.28,.14,.10);
  for(const x of [-.19,.19]){const fang=add(MeshBuilder.CreateCylinder('haetae-fang',{diameterTop:.01,diameterBottom:.075,height:.14,tessellation:8},scene),x,1.16,-.78);fang.rotation.z=Math.PI;}
  add(MeshBuilder.CreateCylinder('haetae-single-horn',{height:.23,diameterBottom:.14,diameterTop:0,tessellation:10},scene),0,1.78,-.41);
  for(let i=0;i<15;i++){const a=i*Math.PI*2/15;const curl=add(MeshBuilder.CreateTorus('haetae-mane-curl',{diameter:.20,thickness:.07,tessellation:10},scene),Math.sin(a)*.44,1.31+Math.cos(a)*.40,-.37);curl.rotation.x=Math.PI/2;}
  const tail=add(MeshBuilder.CreateTube('haetae-curled-tail',{path:[new Vector3(0,0,0),new Vector3(.18,.25,.12),new Vector3(.20,.53,.06),new Vector3(.05,.65,-.06),new Vector3(-.06,.52,-.08)],radius:.075,tessellation:8},scene),0,.85,.65);tail.rotation.z=side?-.2:.2;
  const turn=Matrix.RotationY(site.yaw),rotation=Quaternion.RotationYawPitchRoll(site.yaw,0,0);for(const m of meshes){const local=m.position.subtract(new Vector3(site.x,0,site.z));m.position.copyFrom(Vector3.TransformCoordinates(local,turn).add(new Vector3(site.x,0,site.z)));m.rotationQuaternion=rotation.multiply(Quaternion.FromEulerVector(m.rotation));m.rotation.setAll(0);}
 }
}
