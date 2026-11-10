import type {Scene} from '@babylonjs/core/scene';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {Mesh,} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type {Texture} from '@babylonjs/core/Materials/Textures/texture';
import type {Material} from '@babylonjs/core/Materials/material';
import {createHanjiMaterial} from './hanji-material';
import {fixedSlots,lanternColourIndex,LANTERN_PALETTE} from './contracts';
import type {DisplayItem,DisplayPosition} from './private-display-layout';
import {reducedMotion} from './practice-light';

export function privateDisplayModel(scene:Scene,item:DisplayItem,place:DisplayPosition,fibre:Texture){
 const root=new TransformNode('private-display-'+item.orderId,scene);root.position.set(...place.position);root.rotation.y=place.yaw;
 const materials:Material[]=[],textures:DynamicTexture[]=[];let paper:ReturnType<typeof createHanjiMaterial>|undefined,flame:Mesh|undefined;
 function material(name:string,colour:string,emission=0){const m=new StandardMaterial('display-'+name,scene);m.diffuseColor=Color3.FromHexString(colour);m.emissiveColor=m.diffuseColor.scale(emission);m.specularColor=new Color3(.08,.07,.05);materials.push(m);return m;}
 const wood=material('wood','#a37a4b'),gold=material('brass','#c4a66f'),cream=material('paper','#eee2c3');
 function part(mesh:Mesh,m:Material,x:number,y:number,z:number){mesh.parent=root;mesh.position.set(x,y,z);mesh.material=m;mesh.receiveShadows=true;return mesh;}
 const box=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,m:Material)=>part(MeshBuilder.CreateBox('display-'+name,{width:w,height:h,depth:d},scene),m,x,y,z);
 const cylinder=(name:string,d:number,h:number,x:number,y:number,z:number,m:Material,sides=24)=>part(MeshBuilder.CreateCylinder('display-'+name,{diameter:d,height:h,tessellation:sides},scene),m,x,y,z);
 function inscription(name:string,text:string,y:number,w:number,h:number){
  const texture=new DynamicTexture('private-display-inscription',{width:256,height:384},scene,true),c=texture.getContext() as CanvasRenderingContext2D;textures.push(texture);
  c.fillStyle='#efe0b9';c.fillRect(0,0,256,384);c.strokeStyle='#ab7e49';c.lineWidth=8;c.strokeRect(8,8,240,368);c.fillStyle='#523d2a';c.textAlign='center';c.font='bold 32px serif';c.fillText(name,128,51,222);
  const characters=Array.from(text);c.font='24px serif';for(let i=0;i<Math.min(7,Math.ceil(characters.length/8));i++)c.fillText(characters.slice(i*8,i*8+8).join(''),128,99+i*35,225);texture.update();
  const m=material('inscription','#ffffff');m.diffuseTexture=texture;
  return part(MeshBuilder.CreatePlane('private-display-inscription',{width:w,height:h,sideOrientation:Mesh.DOUBLESIDE},scene),m,0,y,-.13);
 }
 if(item.kind==='lantern'){
  const index=Number(item.slotId.split(':').at(-1))||0,type=index%3;
  const slot=fixedSlots().find(slot=>slot.id===item.slotId),colour=LANTERN_PALETTE[slot?lanternColourIndex(slot.position):index%5];
  paper=createHanjiMaterial(scene,'private-hanji-'+item.orderId,colour,type===0?1:8,Vector3.Zero(),fibre);paper.setFloat('night',.12);paper.setFloat('ownedLight',.1);materials.push(paper);
  let body:Mesh;
  if(type===0){body=MeshBuilder.CreateSphere('display-round-lantern',{diameter:.74,segments:24},scene);body.scaling.y=1.12;}
  else if(type===1)body=MeshBuilder.CreateLathe('display-octagonal-lantern',{shape:[new Vector3(.18,-.43,0),new Vector3(.39,-.22,0),new Vector3(.39,.22,0),new Vector3(.18,.43,0)],tessellation:8,cap:Mesh.NO_CAP,closed:true},scene);
  else{
   const petals:Mesh[]=[MeshBuilder.CreateSphere('display-lotus-core',{diameter:.53,segments:16},scene)];
   for(let ring=0;ring<2;ring++)for(let k=0;k<8;k++){
    const angle=k*Math.PI/4+ring*Math.PI/8,positions:number[]=[],indices:number[]=[],uvs:number[]=[],normals:number[]=[];
    for(let j=0;j<=10;j++)for(let i=0;i<=8;i++){const t=j/10,u=(i/8-.5)*2,w=.21*Math.sin(Math.PI*t),r=.10+.35*Math.sin(t*Math.PI*.67)+ring*.04-.07*u*u*Math.sin(Math.PI*t);positions.push(Math.sin(angle)*r+Math.cos(angle)*u*w,-.30+t*.63-ring*.08,Math.cos(angle)*r-Math.sin(angle)*u*w);uvs.push(i/8,t);}
    for(let j=0;j<10;j++)for(let i=0;i<8;i++){const a=j*9+i;indices.push(a,a+9,a+1,a+1,a+9,a+10);}
    VertexData.ComputeNormals(positions,indices,normals);const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;const mesh=new Mesh('display-lotus-petal',scene);data.applyToMesh(mesh);petals.push(mesh);
   }
   body=Mesh.MergeMeshes(petals,true,true)!;body.scaling.set(.78,1,.78);
  }
  part(body,paper,0,.30,0);body.scaling.scaleInPlace(.55);
  cylinder('lantern-base',.19,.035,0,.035,0,gold);cylinder('lantern-cap',.18,.035,0,.55,0,gold);
  if(item.tag)inscription(item.name,'',.13,.10,.15);
 }else if(item.kind==='wish-plaque'){
  const rack=Number(item.slotId.split(':').at(-1)?.split('-')[0])||0;
  if(rack===1){const disk=cylinder('round-wish',.42,.04,0,.25,0,wood,40);disk.rotation.x=Math.PI/2;}
  else{box('wish-board',.37,.42,.04,0,.25,0,wood);if(rack===2){const roof=part(MeshBuilder.CreateCylinder('display-house-roof',{diameter:.52,height:.04,tessellation:3},scene),wood,0,.49,0);roof.rotation.x=Math.PI/2;}}
  inscription(item.name,item.text,.25,.31,.34);cylinder('plaque-support',.08,.1,0,.05,0,gold);
 }else{
  const memorial=item.kind==='memorial',wax=material('wax',memorial?'#f0e7cf':'#f8ead3');
  cylinder('lamp-base',item.kind==='candle'?.22:.34,.055,0,.03,0,gold);
  if(item.kind==='candle')cylinder('votive-candle',.09,.38,0,.24,0,wax);
  else{
   box('lamp-back',.29,.40,.12,0,.26,.03,memorial?cream:wood);box('lamp-paper',.23,.30,.025,0,.26,-.045,cream);
   const m=material('warm-lamp','#ffc985',.6);box('inner-light',.10,.20,.025,0,.26,-.065,m);cylinder('lamp-crown',.34,.06,0,.49,.03,gold,8);
   if(item.tag||item.name)inscription(item.name,item.text,.15,.20,.12);
  }
  const light=material('flame','#ffd49a',.85);flame=part(MeshBuilder.CreateSphere('display-candle-flame',{diameter:1,segments:10},scene),light,0,item.kind==='candle'?.46:.32,item.kind==='candle'?0:-.09);flame.scaling.set(.045,.10,.045);
 }
 return {root,update(time:number){paper?.setVector3('eye',scene.activeCamera?.position??Vector3.Zero());if(flame&&!reducedMotion())flame.scaling.y=.10+.008*Math.sin(time*5.7);},dispose(){root.dispose();for(const m of materials)m.dispose(false,false);for(const tex of textures)tex.dispose();}};
}
