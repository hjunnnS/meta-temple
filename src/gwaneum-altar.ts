import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

// Local coordinates run from the altar's foot upward. The statue faces the courtyard (-Z).
export function createGwaneumAltar(scene:Scene, meshes:Mesh[], origin:Vector3, wood:StandardMaterial){
 const finish=(name:string,hex:string,lift:number)=>{
  const material=new StandardMaterial(name,scene);
  material.diffuseColor=Color3.FromHexString(hex);
  material.emissiveColor=material.diffuseColor.scale(lift);
  material.specularColor=new Color3(.12,.1,.07);
  return material;
 };
 const gilding=finish('gwaneum-gilding','#d8aa55',.32);
 const porcelain=finish('gwaneum-white-robe','#e1daca',.30);
 const crimson=finish('gwaneum-lacquer','#713a32',.15);
 const bronze=finish('gwaneum-hair','#3a3128',.20);
 const jade=finish('gwaneum-jade','#457566',.23);
 function add(mesh:Mesh,x:number,y:number,z:number,material:StandardMaterial){
  mesh.position.set(origin.x+x,origin.y+y,origin.z+z);
  mesh.material=material;mesh.receiveShadows=true;meshes.push(mesh);return mesh;
 }
 function box(name:string,w:number,h:number,d:number,y:number,m:StandardMaterial){
  return add(MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene),0,y,0,m);
 }
 function oval(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial){
  const mesh=add(MeshBuilder.CreateSphere(name,{diameter:1,segments:20},scene),x,y,z,m);
  mesh.scaling.set(w,h,d);return mesh;
 }
 function contour(name:string,points:number[][],radius:number,m:StandardMaterial){
  const mesh=MeshBuilder.CreateTube(name,{path:points.map(p=>Vector3.FromArray(p)),radius,tessellation:8},scene);
  add(mesh,0,0,0,m);
 }
 box('altar-foot',2.55,.10,1.02,.05,crimson);
 box('altar-cabinet',2.42,.36,.93,.28,wood);
 box('altar-gilt-edge',2.62,.027,1.06,.475,gilding);
 box('altar-tabletop',2.68,.07,1.1,.52,crimson);
 oval('lotus-dais',0,.64,0,1.03,.19,.68,gilding);
 for(let i=0;i<15;i++){
  const a=i*Math.PI*2/15;
  const petal=oval('lotus-petal',.41*Math.cos(a),.71,.255*Math.sin(a),.17,.19,.11,porcelain);
  petal.rotation.z=-.45*Math.cos(a);
 }
 const robe=MeshBuilder.CreateLathe('flowing-mantle',{shape:[[.34,.75],[.39,.79],[.28,.97],[.19,1.20],[.20,1.49],[.25,1.59],[.18,1.67],[.09,1.70]].map(([r,h])=>new Vector3(r,h,0)),tessellation:48,sideOrientation:Mesh.DOUBLESIDE},scene);
 add(robe,0,0,0,porcelain);robe.scaling.z=.75;
 for(let i=-2;i<=2;i++)contour('mantle-hem',[[i*.043,1.36,-.13],[i*.055,1.12,-.145],[i*.09+.018,.93,-.185],[i*.12,.79,-.22]],.008,gilding);
 for(const side of [-1,1]){
  const sleeve=oval('folded-sleeve',side*.19,1.39,-.058,.185,.44,.23,porcelain);sleeve.rotation.z=-side*.29;
  oval('palm',side*.12,1.28,-.19,.118,.095,.123,gilding);
  contour('mantle-border',[[side*.16,1.64,-.09],[side*.11,1.52,-.144],[0,1.40,-.155]],.012,gilding);
 }
 oval('neck',0,1.68,0,.115,.14,.13,gilding);
 oval('face',0,1.82,-.014,.258,.331,.214,gilding);
 for(const side of [-1,1]){
  oval('ear',side*.127,1.795,0,.041,.107,.055,gilding);
  contour('lowered-lid',[[side*.021,1.83,-.117],[side*.050,1.824,-.116],[side*.083,1.833,-.101]],.0038,bronze);
 }
 oval('nose',0,1.81,-.116,.036,.077,.035,gilding);
 oval('lips',0,1.767,-.109,.064,.014,.014,crimson);
 oval('chignon',0,1.98,.015,.225,.183,.174,bronze);
 for(let i=0;i<9;i++){
  const a=i*Math.PI*2/9;
  oval('jewelled-crown',.109*Math.sin(a),1.969,-.084*Math.cos(a),.057,.102,.047,gilding);
 }
 oval('crown-jade',0,1.972,-.112,.032,.049,.018,jade);
 for(const r of [.27,.294])contour('nimbus',Array.from({length:65},(_,i)=>[r*Math.cos(i*Math.PI/32),1.84+r*Math.sin(i*Math.PI/32),.13]),.009,gilding);
 contour('lotus-stem',[[.115,1.27,-.21],[.145,1.41,-.22],[.175,1.53,-.215]],.007,jade);
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;oval('held-lotus',.175+.03*Math.cos(a),1.55,-.215+.03*Math.sin(a),.034,.071,.034,porcelain);}
}
