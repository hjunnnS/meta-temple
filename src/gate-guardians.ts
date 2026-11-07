import {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';

type Point=[number,number,number];
export function placeGuardians(scene:Scene, meshes:Mesh[], gateZ:number){
 const pigment=(name:string,hex:string)=>{
  const m=new StandardMaterial('guardian-'+name,scene);
  m.diffuseColor=Color3.FromHexString(hex);m.emissiveColor=m.diffuseColor.scale(.17);
  m.specularColor=new Color3(.12,.10,.07);return m;
 };
 const gold=pigment('gilt','#d2a448'),red=pigment('lacquer','#962f24'),jade=pigment('jade','#427967');
 const blue=pigment('indigo','#344663'),ink=pigment('ink','#352b28'),ivory=pigment('ivory','#eee0b6');
 const bronze=pigment('plinth','#51463c'),wood=pigment('pearwood','#a66628');
 const faces=['#d29950','#839bb3','#92a887','#d5aa78'].map((c,i)=>pigment('skin-'+i,c));
 for(const [index,attribute] of ['sword','serpent','pagoda','lute'].entries()){
  const side=index%2===0?-1:1;
  const root=new TransformNode('guardian-'+attribute,scene);
  const scale=1.72;
  const turn=1.16;
  root.position.set(side*3.85,.25,gateZ+(index<2?-2.65:2.65));
  root.scaling.setAll(scale);
  root.rotation.y=side*turn;
  const podiumHeight=.72;
  const statue=new TransformNode('standing-figure',scene);
  statue.parent=root;statue.position.y=podiumHeight;
  let parent=root;
  const skin=faces[index],armour=[blue,red,jade,red][index];
  function add(mesh:Mesh,m:StandardMaterial,x:number,y:number,z:number){
   mesh.parent=parent;mesh.position.set(x,y,z);mesh.material=m;meshes.push(mesh);return mesh;
  }
  function oval(x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial,tilt=0){
   const o=add(MeshBuilder.CreateSphere('carving',{diameter:1,segments:14},scene),m,x,y,z);
   o.scaling.set(w,h,d);o.rotation.z=tilt;return o;
  }
  function casting(x:number,y:number,z:number,profile:number[][],m:StandardMaterial,depth=1,sides=32){
   const o=add(MeshBuilder.CreateLathe('casting',{shape:profile.map(([r,h])=>new Vector3(r,h,0)),tessellation:sides,sideOrientation:Mesh.DOUBLESIDE},scene),m,x,y,z);
   o.scaling.z=depth;return o;
  }
  function stroke(points:Point[],radius:number,m:StandardMaterial){
   return add(MeshBuilder.CreateTube('painted-relief',{path:points.map(p=>new Vector3(...p)),radius,tessellation:8,cap:Mesh.CAP_ALL},scene),m,0,0,0);
  }
  casting(0,0,0,[[.98,0],[.98,.14],[.89,.20],[.84,.27],[.84,.74],[.90,.79],[.93,.85],[.93,podiumHeight],[0,podiumHeight]],bronze,.79,8);
  parent=statue;
  casting(0,0,0,[[.78,0],[.8,.08],[.69,.15],[.73,.21],[0,.21]],bronze,.73,8);
  for(const s of [-1,1]){
   oval(s*.25,.37,-.12,.41,.27,.52,ink);
   oval(s*.28,.72,-.04,.42,.70,.42,blue,s*.13);
   oval(s*.30,.83,-.19,.34,.34,.22,armour);
   stroke([[s*.42,.91,-.25],[s*.30,.96,-.29],[s*.18,.91,-.25]],.022,gold);
  }
  casting(0,0,0,[[.54,.66],[.58,.77],[.46,1.12],[.34,1.37]],red,.72);
  casting(0,0,0,[[.39,1.12],[.49,1.27],[.41,1.44],[.58,1.83],[.55,1.99],[.24,2.10]],armour,.72);
  for(let row=0;row<5;row++)for(let j=-3;j<=3;j++){
   const x=j*.119+(row%2)*.023;
   const y=.78+row*.082;
   oval(x,y,-.34+.46*x*x,.112,.14,.055,(row+j)%3===0?gold:jade);
  }
  for(const s of [-1,1]){
   oval(s*.28,1.79,-.28,.47,.41,.16,gold,s*.22);
   oval(s*.28,1.79,-.35,.39,.34,.13,jade,s*.22);
   for(let k=0;k<7;k++){
    const t=k*Math.PI*2/7;oval(s*.28+.105*Math.cos(t),1.8+.09*Math.sin(t),-.418,.062,.065,.03,gold);
   }
   oval(s*.53,1.89,0,.48,.34,.49,gold);
   oval(s*.54,1.89,-.045,.41,.27,.47,armour);
   stroke([[s*.51,1.83,0],[s*.65,1.56,-.07],[s*.48,1.45,-.34]],.132,armour);
   oval(s*.47,1.45,-.38,.20,.19,.22,skin);
   stroke([[s*.43,1.94,.09],[s*.72,1.83,.04],[s*.76,1.32,0],[s*.55,.94,-.18],[s*.64,.67,-.18]],.046,index%2?blue:jade);
  }
  casting(0,1.28,0,[[.47,0],[.47,.10]],gold,.76);
  oval(0,1.34,-.36,.25,.16,.06,jade);
  oval(0,2.01,0,.32,.36,.27,skin);
  const headStart=meshes.length;
  // Cut a broad brow, hollow temples and a narrower jaw into one continuous face.
  const face=new Mesh('carved-guardian-head',scene);
  const data=new VertexData(),positions:number[]=[],indices:number[]=[],normals:number[]=[],uvs:number[]=[];
  const profile=[[2.00,.12,.16],[2.06,.20,.213],[2.14,.25,.24],[2.22,.276,.247],[2.30,.31,.26],[2.39,.305,.247],[2.48,.302,.25],[2.58,.274,.22],[2.62,.15,.14]];
  const segments=48;
  for(const [y,w,d] of profile){
   for(let i=0;i<segments;i++){
    const angle=2*Math.PI*i/segments,x=w*Math.sin(angle),front=Math.cos(angle);
    const cheek=.052*Math.exp(-((Math.abs(x)-.19)**2)/.004-((y-2.29)**2)/.0025);
    const socket=.038*Math.exp(-((Math.abs(x)-.13)**2)/.003-((y-2.39)**2)/.0011);
    uvs.push(i/segments,(y-2)/.62);
    positions.push(x,y,-d*Math.sign(front)*Math.abs(front)**.62-(cheek-socket)*Math.max(0,front));
   }
  }
  for(let row=0;row<profile.length-1;row++)for(let i=0;i<segments;i++){
   const a=row*segments+i,b=row*segments+(i+1)%segments;
   indices.push(a,b,a+segments,b,b+segments,a+segments);
  }
  VertexData.ComputeNormals(positions,indices,normals);data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;
  data.applyToMesh(face);add(face,skin,0,0,0);
  function carvedLine(points:Point[],radii:number[],m:StandardMaterial){
   return add(MeshBuilder.CreateTube('tapered-carving',{path:points.map(p=>new Vector3(...p)),radiusFunction:i=>radii[i],tessellation:10,cap:Mesh.CAP_ALL},scene),m,0,0,0);
  }
  for(const s of [-1,1]){
   oval(s*.302,2.29,0,.092,.225,.092,skin);
   oval(s*.131,2.366,-.231,.164,.076,.052,ivory,s*.20);
   oval(s*.121,2.350,-.256,.068,.060,.023,ink);
   carvedLine([[s*.029,2.378,-.257],[s*.092,2.395,-.278],[s*.164,2.414,-.251],[s*.234,2.435,-.209],[s*.267,2.456,-.151]],[.018,.037,.033,.020,.003],ink);
   carvedLine([[s*.033,2.342,-.251],[s*.118,2.325,-.257],[s*.204,2.352,-.227]],[.005,.013,.002],skin);
   carvedLine([[s*.018,2.202,-.303],[s*.094,2.207,-.284],[s*.173,2.195,-.246],[s*.233,2.20,-.197],[s*.269,2.256,-.152]],[.016,.032,.030,.019,.003],ink);
   for(let j=0;j<4;j++){
    const x=s*(.035+j*.046);
    carvedLine([[x,2.101+j*.014,-.22],[x*1.09,2.055,-.224],[x*.87,1.96+j*.022,-.206]],[.035,.037,.002],ink);
   }
  }
  oval(0,2.327,-.249,.090,.178,.115,skin);
  oval(0,2.247,-.283,.144,.085,.102,skin);
  carvedLine([[-.119,2.142,-.231],[-.058,2.159,-.253],[0,2.156,-.261],[.058,2.159,-.253],[.119,2.142,-.231]],[.003,.012,.013,.012,.003],ink);
  casting(0,2.53,0,[[.30,0],[.32,.065],[.27,.15]],gold,.83);
  for(let k=0;k<9;k++){
   const a=k*Math.PI*2/9,x=.258*Math.sin(a),z=-.216*Math.cos(a);
   casting(x,2.57,z,[[.069,0],[.084,.08],[.051,.16],[.008,.24]],red,.7,6);
   oval(x,2.67,z*1.18,.066,.102,.045,jade);
  }
  const head=new TransformNode('downward-gaze',scene);
  head.parent=statue;head.position.y=2.025;
  head.rotation.x=-Math.atan2(root.position.y+scale*(podiumHeight+2.36)-1.7,Math.abs(root.position.x)/Math.sin(turn));
  for(const part of meshes.slice(headStart)){
   part.parent=head;part.position.y-=head.position.y;
  }
  if(attribute==='sword'){
   const blade=new Mesh('curved-sword-blade',scene);
   const data=new VertexData();
   data.positions=[-.45,1.54,-.49,-.42,1.43,-.49,.32,1.16,-.51,.63,1.11,-.51,.86,1.17,-.51,.38,1.28,-.51];
   data.indices=[0,1,2,0,2,5,5,2,3,5,3,4,2,1,0,5,2,0,3,2,5,4,3,5];
   data.normals=Array.from({length:6},()=>[0,0,-1]).flat();data.uvs=[0,1,0,0,.6,0,.85,0,1,.6,.62,1];
   data.applyToMesh(blade);add(blade,ivory,0,0,0);
   stroke([[-.56,1.55,-.49],[-.43,1.49,-.49]],.039,wood);
   stroke([[-.50,1.37,-.48],[-.38,1.64,-.48]],.042,gold);
  }else if(attribute==='serpent'){
   stroke([[.45,1.46,-.46],[.64,1.77,-.44],[.73,2.06,-.41],[.66,2.28,-.40],[.49,2.32,-.42]],.073,jade);
   oval(.49,2.33,-.43,.21,.13,.13,gold);oval(-.47,1.60,-.4,.20,.20,.20,ivory);
  }else if(attribute==='pagoda'){
   for(let i=0;i<4;i++){
    const r=.205-i*.034;
    casting(.46,1.53+i*.127,-.40,[[r,.01],[r,.035],[r*.56,.08],[r*.56,.13]],gold,1,8);
   }
   stroke([[.46,2.04,-.4],[.46,2.17,-.4]],.022,gold);
  }else{
   oval(-.11,1.44,-.52,.54,.67,.21,wood,-.42);
   stroke([[-.04,1.61,-.54],[.55,2.27,-.52]],.070,wood);
   for(let i=0;i<4;i++)stroke([[-.23+i*.022,1.27,-.631],[.50+i*.016,2.24,-.583]],.0065,ivory);
   for(let i=0;i<4;i++)oval(.36+i*.05,2.12+i*.062,-.52,.19,.034,.053,gold);
  }
 }
}
