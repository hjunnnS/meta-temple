import { sculptedFace } from './sculpted-face.ts';
import { Scene } from '@babylonjs/core/scene';
import { Curve3 } from '@babylonjs/core/Maths/math.path';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

type Profile = [number, number, number][];

// Coordinates are local to the lotus pedestal. The face looks toward the southern doorway.
export function seatedFigure(scene:Scene, meshes:Mesh[], x:number,y:number,z:number,scale:number,
 gold:StandardMaterial, hair:StandardMaterial, faceGold:StandardMaterial, raisedHand:boolean, shavenHead=false) {
 const place=(mesh:Mesh,material:StandardMaterial)=>{
  mesh.position.set(x,y,z);mesh.scaling.setAll(scale);mesh.material=material;
  mesh.receiveShadows=true;meshes.push(mesh);return mesh;
 };
 const bead=(name:string,px:number,py:number,pz:number,w:number,h:number,d:number,m=gold)=>{
  const mesh=place(MeshBuilder.CreateSphere(name,{diameter:1,segments:12},scene),m);
  mesh.position.addInPlace(new Vector3(px,py,pz).scale(scale));mesh.scaling.set(w*scale,h*scale,d*scale);return mesh;
 };
 function casting(name:string,profile:Profile,sections:number,rings:number,
  shape:(px:number,py:number,pz:number,a:number)=>number[],material:StandardMaterial){
  const positions:number[]=[],indices:number[]=[],uvs:number[]=[];
  for(let j=0;j<=rings;j++){
   const h=profile[0][0]+(profile.at(-1)![0]-profile[0][0])*j/rings;
   let k=0;while(k<profile.length-2&&h>profile[k+1][0])k++;
   const t=(h-profile[k][0])/(profile[k+1][0]-profile[k][0]);
   const radii=[1,2].map(i=>profile[k][i]*(1-t)+profile[k+1][i]*t);
   for(let i=0;i<sections;i++){
    uvs.push(i/sections,j/rings);
    const a=2*Math.PI*i/sections;positions.push(...shape(Math.sin(a)*radii[0],h,-Math.cos(a)*radii[1],a));
    if(j<rings){const v=j*sections+i,n=j*sections+(i+1)%sections;indices.push(v,n,v+sections,n,n+sections,v+sections);}
   }
  }
  const mesh=place(new Mesh(name,scene),material),data=new VertexData(),normals:number[]=[];
  data.uvs=uvs;data.positions=positions;data.indices=indices;VertexData.ComputeNormals(positions,indices,normals);data.normals=normals;data.applyToMesh(mesh);
 }
 place(sculptedFace(scene,faceGold),faceGold);
 for(const sign of [-1,1]){
  // A long pinna with a recessed bowl and a slender pendant lobe.
  const ear=bead('ear',sign*.278,2.22,-.005,.108,.425,.109);
  ear.rotation.z=-sign*.073;
  bead('inner-ear',sign*.298,2.264,-.058,.038,.156,.019,gold);
 }
 bead('neck',0,1.969,0,.342,.43,.334);
 if(shavenHead){
  bead('shaven-scalp',0,2.48,0,.606,.35,.535,hair);
 }else{
 // One continuous coiffure. Fine staggered curls follow its surface from the
 // temples up into the broad crown, including the transition to the ushnisha.
 const hairProfile:Profile=[[2.48,.301,.268],[2.52,.306,.275],[2.60,.292,.261],
  [2.67,.253,.228],[2.71,.207,.181],[2.745,.171,.152],[2.785,.149,.132],
  [2.818,.114,.098],[2.842,.061,.054],[2.85,.002,.002]];
 casting('fine-curled-crown',hairProfile,248,110,(px,h,pz,a)=>{
  const row=(h-2.48)/.020;
  const curls=.0042*(.5+.5*Math.cos(a*66+Math.PI*Math.floor(row)))*Math.sin(Math.PI*(row%1))**2;
  const temples=(1-Math.max(0,Math.cos(a))**2)*.075*Math.exp(-((h-2.48)**2)/.0008);
  return [px+curls*Math.sin(a),h-temples,pz-.011-curls*Math.cos(a)];
 },hair);
 bead('crown-jewel',0,2.668,-.248,.052,.031,.024);
 }
 casting('draped-silhouette',[[.29,.84,.40],[.34,1.01,.51],[.44,1.09,.59],[.55,1.07,.6],[.65,.94,.53],[.74,.72,.45],[.82,.55,.39],[1,.46,.32],[1.35,.5,.32],[1.64,.62,.33],[1.75,.60,.3],[1.87,.42,.23],[1.96,.18,.16]],100,90,(px,h,pz,a)=>{
  const lap=Math.max(0,Math.min(1,(1.05-h)/.32));
  // The neckline sags over the chest, then rises to the covered shoulder.
  const neckEdge=1.48+.56*px+.81*px*px;
  const drape=Math.min(1,Math.max(0,(neckEdge-h)*24));
  const upper=(h-.55*px-.75*px*px+.035*Math.sin(5*h+px))*47;
  const lower=(h+.50*Math.abs(px)**1.65+.08*Math.sin(4*a))*48;
  const t=upper*(1-lap)+lower*lap;
  const front=Math.max(0,Math.cos(a));
  const fold=(.009+.029*front)*(.8+.2*Math.cos(h*9+px))*drape*Math.pow(.5+.5*Math.cos(t),2.1);
  return [px+Math.sin(a)*fold,h,pz-Math.cos(a)*fold];
 },gold);
 // A continuous tapered arm follows shoulder, elbow and wrist without joint seams.
 function limb(name:string,knots:number[][],radii:number[]){
  const subdivisions=8;
  const path=Curve3.CreateCatmullRomSpline(knots.map(p=>Vector3.FromArray(p)),subdivisions).getPoints();
  place(MeshBuilder.CreateTube(name,{path,tessellation:18,cap:Mesh.CAP_ALL,
   radiusFunction:(i)=>{const u=i/(path.length-1)*(radii.length-1),k=Math.min(radii.length-2,Math.floor(u));
    return radii[k]+(radii[k+1]-radii[k])*(u-k);}
  },scene),gold);
 }
 const palmX=raisedHand?-.19:-.74,palmY=raisedHand?1.45:.68;
 limb('right-arm',[[-.45,1.67,.01],[-.566,1.43,-.02],[-.59,1.1,-.07],
  raisedHand?[-.46,1.07,-.31]:[-.63,.88,-.24],[palmX,palmY-.025,-.46]],[.18,.165,.136,.12,.079]);
 bead('right-palm',palmX,palmY,-.48,.18,raisedHand?.215:.17,.095);
 for(let i=0;i<4;i++){
  const xx=palmX+(i-1.5)*.043,dir=raisedHand?1:-1,tip=palmY+dir*(.21-.024*Math.abs(i-1));
  limb('right-finger',[[xx,palmY+dir*.055,-.493],[xx+.006,palmY+dir*.128,-.512],[xx+.012,tip,-.509]],[.025,.021,.011]);
 }
 limb('right-thumb',[[palmX+.07,palmY,-.49],[palmX+.11,palmY+.065,-.515],[palmX+.072,palmY+.107,-.52]],[.032,.027,.014]);
 limb('draped-left-arm',[[.46,1.66,.04],[.56,1.45,.02],[.63,1.12,-.025],[.49,.98,-.26],[.15,.86,-.445]],[.205,.19,.173,.145,.09]);
 bead('upturned-palm',.06,.858,-.45,.26,.085,.175);
 for(let i=0;i<4;i++)limb('resting-finger',[[.035,.86,-.51+i*.036],[-.06,.862,-.516+i*.036],[-.12,.879,-.50+i*.036]],[.023,.021,.012]);
 for(const sign of [-1,1]){
  const foot=bead('crossed-foot',sign*.36,.615,-.39,.54,.152,.207);foot.rotation.z=sign*.13;
 }
}
