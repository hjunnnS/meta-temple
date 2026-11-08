import type { ReviewSlot } from './review-slots.ts';
import { pedestrianWorld, walkingController } from './walking.ts';
import { paving, boundaries } from './temple-terrain.ts';
import { readApplication, type Offering } from './reception.ts';
import '@babylonjs/core/Culling/ray';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { placeGuardians } from './gate-guardians.ts';
import { furnishBell } from './temple-bell.ts';
import { seatedFigure } from './gilt-figure.ts';
import { createGwaneumAltar } from './gwaneum-altar.ts';
import { furnishHall } from './hall-interior.ts';
import { wishGarden, wallCenterX, wallThickness, gardenBorderWidth, sideHallCenterZ, courtSouthEdge, courtDepth, courtHalfWidth, templePlaces, daeungDimensions, meditationTrees } from './temple-layout.ts';
import { createHanjiMaterial } from './hanji-material.ts';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Matrix, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { candleCabinets, candleSlot, plaqueSlot, rackSpacing, gateCanopyAnchor, hallLampSlots, lanternSlots, canopyLanternSlots, OWNED_INDICES, LANTERN_PALETTE, lanternColourIndex, normalizeLanternName } from './contracts.ts';
export type TimeOfDay = 'day' | 'dusk' | 'night';
export type Quality = 'high' | 'low';
export function createTemple(canvas:HTMLCanvasElement) {
 const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},false);
 const scene=new Scene(engine); scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=1;scene.imageProcessingConfiguration.exposure=1.3;scene.imageProcessingConfiguration.contrast=1.12; scene.clearColor=new Color4(.64,.7,.68,1);
 scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.0025;scene.fogColor=new Color3(.64,.7,.68);
 const skyTexture=new DynamicTexture('sunlit-sky',{width:2048,height:1024},scene,false);
 const skyMaterial=new StandardMaterial('sky-gradient',scene);skyMaterial.disableLighting=true;skyMaterial.emissiveTexture=skyTexture;skyMaterial.diffuseColor=Color3.Black();skyMaterial.fogEnabled=false;skyMaterial.imageProcessingConfiguration=new ImageProcessingConfiguration();
 const skyDome=MeshBuilder.CreateSphere('open-sky',{diameter:2000,segments:32,sideOrientation:Mesh.BACKSIDE},scene);skyDome.material=skyMaterial;skyDome.infiniteDistance=true;skyDome.isPickable=false;
 function paintSky(value:TimeOfDay){
  const c=skyTexture.getContext() as CanvasRenderingContext2D;const g=c.createLinearGradient(0,0,0,1024);
  const shades=value==='day'?['#e5f7ff','#8ed2ff','#218de9']:value==='dusk'?['#ffe2bd','#b7cde9','#6483b9']:['#121c35','#101d38','#081025'];
  g.addColorStop(0,shades[0]);g.addColorStop(.48,shades[1]);g.addColorStop(1,shades[2]);c.fillStyle=g;c.fillRect(0,0,2048,1024);
  if(value!=='night')for(let cluster=0;cluster<12;cluster++)for(let puff=0;puff<8;puff++){
   const x=(cluster*181+puff*23)%2048,y=510+(cluster%3)*72+Math.sin(puff)*18;const cloud=c.createRadialGradient(x,y,3,x,y,50);cloud.addColorStop(0,'rgba(255,255,255,.23)');cloud.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=cloud;c.fillRect(x-50,y-50,100,100);
  }
  skyTexture.update();
 }
 const camera=new ArcRotateCamera('camera',-Math.PI*.67,Math.PI*.37,36,new Vector3(0,3,2),scene);
 camera.lowerRadiusLimit=2.5;camera.upperRadiusLimit=260;camera.upperBetaLimit=2.15;camera.lowerBetaLimit=.15;
 camera.minZ=.1;camera.wheelPrecision=18;camera.panningSensibility=70;camera.attachControl(canvas,true);
 const hemi=new HemisphericLight('sky',new Vector3(0,1,0),scene);hemi.intensity=.8;hemi.groundColor=new Color3(.22,.27,.24);
 const sun=new DirectionalLight('sun',new Vector3(-.45,-.85,.45),scene);sun.position=new Vector3(20,35,-20);sun.intensity=1.6;
 const shadows=new ShadowGenerator(2048,sun);shadows.usePercentageCloserFiltering=true;shadows.bias=.002;shadows.normalBias=.035;
 const glow=new GlowLayer('lantern-glow',scene,{mainTextureFixedSize:1024,blurKernelSize:48});glow.intensity=.35;
 const colors:Record<string,StandardMaterial>={};
 function mat(name:string,hex:string,emissive=0){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.06,.06,.06);m.emissiveColor=m.diffuseColor.scale(emissive);colors[name]=m;return m;}
 const stone=mat('stone','#a59b88'),stoneDark=mat('dark-stone','#494955'),wood=mat('aged-redwood','#783021'),roofMat=mat('roof','#202a39'),roofEdge=mat('ridge','#394757'),jade=mat('jade','#275c48'),red=mat('red','#97402e'),ochre=mat('gold','#a58950'),paper=mat('paper','#a2957a',.1),leaves=mat('leaves','#123f32'),trunk=mat('trunk','#555245'),groundMat=mat('earth','#253e32');
 // Original deterministic surface maps: fine wood grain, mineral flecks and roof weathering.
 function surface(m:StandardMaterial,kind:'wood'|'stone'|'tile'){
  const t=new DynamicTexture(`${kind}-surface`,{width:512,height:512},scene,true);const c=t.getContext() as CanvasRenderingContext2D;
  c.fillStyle=kind==='wood'?'#b9a18e':'#bdbdbd';c.fillRect(0,0,512,512);let state=81;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  for(let i=0;i<16000;i++){const x=random()*512,y=random()*512,v=80+random()*150;c.fillStyle=`rgba(${v},${v},${v},${kind==='wood'?.13:.23})`;c.fillRect(x,y,kind==='wood'?1:random()*3,kind==='wood'?12+random()*60:random()*3);}
  if(kind==='wood'){for(let x=0;x<512;x+=5){c.beginPath();c.strokeStyle='rgba(45,21,10,.22)';c.lineWidth=.8;for(let y=0;y<520;y+=8){const xx=x+3*Math.sin(y/43+x);if(y===0)c.moveTo(xx,y);else c.lineTo(xx,y);}c.stroke();}}
  t.update();m.diffuseTexture=t;const bump=t.clone();if(bump){(bump.getContext() as CanvasRenderingContext2D).putImageData(c.getImageData(0,0,512,512),0,0);bump.update();bump.level=kind==='wood'?.14:.23;m.bumpTexture=bump;}
 }
 surface(wood,'wood');surface(stone,'stone');surface(stoneDark,'stone');surface(roofMat,'tile');surface(roofEdge,'tile');
 function scanned(m:StandardMaterial,asset:string,u=1,v=1){
  m.diffuseTexture?.dispose();m.bumpTexture?.dispose();
  const diffuse=new Texture(`/textures/${asset}_diff_1k.jpg`,scene);diffuse.uScale=u;diffuse.vScale=v;diffuse.anisotropicFilteringLevel=8;m.diffuseTexture=diffuse;
  const normal=new Texture(`/textures/${asset}_nor_gl_1k.jpg`,scene);normal.gammaSpace=false;normal.uScale=u;normal.vScale=v;normal.level=.55;m.bumpTexture=normal;m.invertNormalMapY=true;
 }
 scanned(stone,'rock_face',.6,.6);stone.diffuseColor=Color3.FromHexString('#839ead');
 scanned(wood,'wood_planks_dirt',1,1);wood.diffuseColor=Color3.FromHexString('#b07856');
 const masonry=mat('rough-masonry','#aaa69c');scanned(masonry,'stone_wall',5,1);
 scanned(roofMat,'grey_roof_tiles',7,4);roofMat.diffuseColor=Color3.FromHexString('#8d9299');
 roofEdge.diffuseColor=Color3.FromHexString('#51565c');
 roofMat.specularColor=new Color3(.09,.09,.09);roofMat.specularPower=18;
 ochre.specularColor=new Color3(.18,.14,.07);ochre.specularPower=28;
 const staticMeshes:Mesh[]=[];
 function box(name:string,w:number,h:number,d:number,x:number,y:number,z:number,m:StandardMaterial,shadow=true){const a=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);a.position.set(x,y,z);a.material=m;a.receiveShadows=true;staticMeshes.push(a);if(shadow)shadows.addShadowCaster(a);return a;}
 function cylinder(name:string,diameter:number,height:number,pos:Vector3,m:StandardMaterial){const a=MeshBuilder.CreateCylinder(name,{diameterTop:diameter*.94,diameterBottom:diameter,height,tessellation:24},scene);a.position=pos;a.material=m;staticMeshes.push(a);shadows.addShadowCaster(a);return a;}
 const terrainSize=160;
 const ground=MeshBuilder.CreateGround('earth',{width:terrainSize,height:terrainSize},scene);ground.receiveShadows=true;

 // Stone joints are geometry, using the same small palette and merged after creation.
 for(let iz=19;iz<26;iz++)for(let ix=0;ix<9;ix++)box('paving',1.7,.1,1.45,(ix-4)*1.77,.08,-21+iz*1.53,stone,false);
 const displayFixtures:Mesh[]=[];
 const displayBatches:Mesh[]=[];
 let occupancy:'current'|'empty'|'full'='current';
 const displayKinds=new Set<Offering>(['plaque','votive','memorial']);
 const applicationSlots=new Map<string,{kind:Offering;point:Vector3;mark:Mesh;parts:Mesh[]}>();
 let onSlotClick:(id:string)=>void=()=>{};
 const pinTexture=new DynamicTexture('available-slot-sign',128,scene,false);
 const pinBrush=pinTexture.getContext() as CanvasRenderingContext2D;
 pinBrush.fillStyle='#24574a';pinBrush.beginPath();pinBrush.arc(64,64,54,0,Math.PI*2);pinBrush.fill();
 pinBrush.lineWidth=6;pinBrush.strokeStyle='#ffe6a7';pinBrush.stroke();
 pinBrush.fillStyle='#fff4d3';pinBrush.fillRect(38,60,52,8);pinBrush.fillRect(60,38,8,52);
 pinTexture.hasAlpha=true;pinTexture.update();
 const pinMaterial=mat('available-place','#ffffff');pinMaterial.diffuseTexture=pinTexture;
 pinMaterial.useAlphaFromDiffuseTexture=true;pinMaterial.disableLighting=true;pinMaterial.emissiveColor=Color3.White();
 function applicationSlot(id:string,kind:Offering,point:Vector3,parts:Mesh[]=[],size=.36){
  const mark=MeshBuilder.CreatePlane('apply-'+id,{size},scene);mark.billboardMode=Mesh.BILLBOARDMODE_ALL;
  mark.position.copyFrom(point);mark.material=pinMaterial;mark.metadata={applicationId:id};
  const filled=!!readApplication(id);mark.setEnabled(!filled);
  for(const mesh of parts)mesh.setEnabled(filled);
  applicationSlots.set(id,{kind,point,parts,mark});
 }
 scene.onPointerObservable.add(event=>{
  if(event.type!==PointerEventTypes.POINTERTAP)return;
  const pick=scene.pick(scene.pointerX,scene.pointerY,mesh=>mesh.isEnabled()&&!!mesh.metadata?.applicationId&&Vector3.DistanceSquared(camera.position,mesh.position)<24*24);
  const id=pick?.pickedMesh?.metadata?.applicationId;
  if(id)onSlotClick(id);
 });
 const hallStart=staticMeshes.length;
 for(let s=0;s<3;s++)box('plinth',21-s*.8,.35,12-s*.7,0,.25+s*.35,8,stone);
 for(let s=0;s<5;s++)box('step',6,.2,1.1,0,.12+s*.2,1.1+s*.5,stone);
 box('hall-floor',19,.24,9,0,1.25,8,wood);
 box('back-wall',19,3.6,.25,0,3.15,12.3,wood);
 for(const x of [-9,-6,-3,0,3,6,9])for(const z of [3.8,12.2]){
  cylinder('column-base',.78,.35,new Vector3(x,1.45,z),stone);
  cylinder('column',.48,3.9,new Vector3(x,3.45,z),wood);
  for(let l=0;l<3;l++){box('bracket',1.1+l*.32,.2,.6,x,5.2+l*.25,z,jade);box('bracket-red',.32,.18,1.2+l*.3,x,5.3+l*.25,z,red);}
 }
 const doorsStart=staticMeshes.length;
 // Warm paper doors with a geometric timber lattice.
 for(let bay=0;bay<6;bay++){
  if(bay===2||bay===3)continue;
  const bayStart=staticMeshes.length;
  const x=-7.5+bay*3;box('door-frame',2.82,3.04,.25,x,3,4.02,wood);box('paper-door',2.65,2.8,.12,x,3,3.85,paper);
  for(let i=0;i<7;i++)box('door-vertical',.045,2.8,.04,x-1.25+i*.415,3,3.74,wood,false);
  for(let i=0;i<9;i++)box('door-horizontal',2.65,.045,.04,x,1.65+i*.34,3.73,wood,false);
  for(const panel of staticMeshes.slice(bayStart))panel.metadata={doorBay:bay};
 }
 const facadeDoors=staticMeshes.slice(doorsStart);
 const texture=new DynamicTexture('original-dancheong',{width:1024,height:128},scene,false);
 const ctx=texture.getContext() as CanvasRenderingContext2D;ctx.fillStyle='#075e50';ctx.fillRect(0,0,1024,128);
 for(let y=0;y<3;y++){ctx.fillStyle=['#b69a64','#9c4230','#243e41'][y];ctx.fillRect(0,y*9,1024,5);ctx.fillRect(0,123-y*9,1024,5);}
 for(let x=32;x<1024;x+=64){for(let p=0;p<8;p++){const angle=p*Math.PI/4;ctx.beginPath();ctx.fillStyle=p%2?'#a84d39':'#bc9f6d';ctx.ellipse(x+Math.cos(angle)*17,64+Math.sin(angle)*17,11,5,angle,0,Math.PI*2);ctx.fill();}ctx.beginPath();ctx.fillStyle='#437478';ctx.arc(x,64,9,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle='#eddfad';ctx.arc(x,64,4,0,Math.PI*2);ctx.fill();}
 for(let i=0;i<5000;i++){const x=(i*73)%1024,y=(i*31)%128;ctx.fillStyle=i%3?'rgba(34,24,16,.09)':'rgba(219,207,172,.12)';ctx.fillRect(x,y,1+(i%4),1);}
 texture.update();const painted=mat('dancheong','#ffffff');painted.diffuseTexture=texture;
 box('painted-beam',20,.65,.3,0,5.5,3.65,painted);box('rear-painted-beam',20,.65,.3,0,5.5,12.35,painted);
 for(let i=0;i<49;i++){let a=cylinder('rafter',.15,11,new Vector3(-10+i*.416,5.85,8),jade);a.rotation.x=Math.PI/2;}
 function roofY(x:number,z:number){return 8.9-2.8*Math.pow(Math.abs(z)/5.9,.7)+.65*Math.pow(Math.abs(x)/11.5,5)+.25*Math.pow(Math.abs(z)/5.9,6);}
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];const nx=46,nz=24;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-11.5+i*23/nx,z=-5.9+j*11.8/nz;positions.push(x,roofY(x,z),z+8);uvs.push(i/nx,j/nz);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
 const roof=new Mesh('curved-roof',scene);const vd=new VertexData();vd.positions=positions;vd.indices=indices;vd.uvs=uvs;const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);vd.normals=normals;vd.applyToMesh(roof);roof.material=roofMat;roofMat.backFaceCulling=false;staticMeshes.push(roof);shadows.addShadowCaster(roof);
 // Curved tile ribs and raised eave edges.
 for(let i=0;i<=57;i++)for(const sign of [-1,1]){const x=-11.4+i*.4;const path=Array.from({length:15},(_,j)=>{const z=sign*(.05+j*5.85/14);return new Vector3(x,roofY(x,z)+.07,z+8);});const rib=MeshBuilder.CreateTube('tile-rib',{path,radius:.065,tessellation:5},scene);rib.material=roofEdge;staticMeshes.push(rib);}
 for(const z of [-5.9,0,5.9]){const path=Array.from({length:48},(_,i)=>{const x=-11.5+i*23/47;return new Vector3(x,roofY(x,z)+.13,z+8);});const edge=MeshBuilder.CreateTube('ridge',{path,radius:z===0?.2:.12,tessellation:8},scene);edge.material=roofEdge;staticMeshes.push(edge);}
 const signTexture=new DynamicTexture('sign',{width:512,height:192},scene,false);const sc=signTexture.getContext() as CanvasRenderingContext2D;sc.fillStyle='#202c29';sc.fillRect(0,0,512,192);sc.strokeStyle='#bb9b60';sc.lineWidth=8;sc.strokeRect(10,10,492,172);sc.fillStyle='#ddc592';sc.font='bold 100px serif';sc.textAlign='center';sc.fillText('大雄殿',256,133);signTexture.update();const signMat=mat('sign-material','#ffffff');signMat.diffuseTexture=signTexture;box('hall-sign',3.4,1.25,.18,0,4.35,3.35,signMat);
 // Roof tile courses and lotus end-caps give the eaves an articulated silhouette.
 for(const side of [-1,1])for(let row=1;row<15;row++){
  const z=side*row*5.9/14;const path=Array.from({length:47},(_,i)=>{const x=-11.5+i*.5;return new Vector3(x,roofY(x,z)+.028,z+8);});
  const seam=MeshBuilder.CreateTube('tile-course',{path,radius:.022,tessellation:4},scene);seam.material=roofEdge;staticMeshes.push(seam);
 }
 for(const side of [-1,1])for(let i=0;i<58;i++){
  const x=-11.4+i*.4,z=side*5.9;
  const disc=cylinder('eave-rosette',.19,.08,new Vector3(x,roofY(x,z)+.04,z+8),roofEdge);disc.rotation.x=Math.PI/2;
  const medallion=MeshBuilder.CreateTorus('rosette-ring',{diameter:.12,thickness:.022,tessellation:10},scene);medallion.rotation.x=Math.PI/2;medallion.position.set(x,roofY(x,z)+.04,z+8+side*.05);medallion.material=roofEdge;staticMeshes.push(medallion);
 }
 for(const z of [3.7,12.3])for(const x of [-9,-6,-3,0,3,6,9]){
  for(let level=0;level<3;level++)for(const side of [-1,1]){
   const bracket=box('carved-bracket',.72,.14,.32,x+side*(.38+level*.2),5.1+level*.24,z-.38,jade);bracket.rotation.z=side*.2;
   box('bracket-gold-trim',.7,.035,.34,x+side*(.38+level*.2),5.18+level*.24,z-.38,red,false);
  }
  for(const y of [1.7,4.8])box('column-paint-band',.5,.035,.5,x,y,z,wood,false);
 }
 for(const z of [4.7,7.5,10.5])box('ceiling-painted-beam',19,.3,.38,0,5.05,z,painted);
 for(const side of [-1,1]){
  for(let i=0;i<10;i++){const z=3.5+i*.95;box('balustrade-post',.14,.75,.14,side*9.7,1.65,z,wood);box('balustrade-cap',.23,.08,.23,side*9.7,2.07,z,wood);}
  box('balustrade-rail',.15,.12,9.6,side*9.7,1.98,7.8,red);
 }
 for(let i=0;i<17;i++)box('plinth-carved-panel',.85,.3,.08,-9.3+i*1.16,.68,2.18,stoneDark,false);
 // Masonry coursing, threshold joinery and plank floors retain real construction scale.
 for(const side of [-1,1]){
  box('side-infill',.24,3.4,8.1,side*8.95,3.1,8.1,wood);
  for(let z=4.7;z<12;z+=.8)box('side-wall-stile',.3,3.5,.065,side*9.1,3.1,z,wood);
 }
 for(let row=0;row<3;row++)for(let col=0;col<21;col++)box('plinth-block',.96,.29,.16,-10+col+(row%2)*.18,.22+row*.33,2.05,stone);
 for(let i=0;i<36;i++)box('floorboard',.5,.025,8.6,-8.9+i*.51,1.39,8,wood,false);
 for(const x of [-9,-6,-3,0,3,6,9]){
  const foot=MeshBuilder.CreateCylinder('carved-column-foot',{height:.27,diameterTop:.58,diameterBottom:.85,tessellation:20},scene);foot.position.set(x,1.62,3.8);foot.material=stone;staticMeshes.push(foot);
 }
 // Reuse the representative architecture for spatial review; individual art review follows.
 const hallTemplate=staticMeshes.slice(hallStart);
 type HallSite=(typeof templePlaces)[number];
 function turnPoint(point:Vector3, site:HallSite){
  if(!('yaw' in site))return point;
  const dx=point.x-site.x,dz=point.z-site.z;
  const c=Math.cos(site.yaw),s=Math.sin(site.yaw);
  return new Vector3(site.x+c*dx+s*dz,point.y,site.z-s*dx+c*dz);
 }
 function faceCourtyard(mesh:Mesh,site:HallSite){
  if(!('yaw' in site))return;
  mesh.position.copyFrom(turnPoint(mesh.position,site));
  const local=mesh.rotationQuaternion??Quaternion.FromEulerVector(mesh.rotation);
  mesh.rotationQuaternion=Quaternion.RotationAxis(new Vector3(0,1,0),site.yaw).multiply(local);
 }
 for(const place of templePlaces.filter(p=>p.kind==='hall' && p.id!=='daeung')){
  for(const original of hallTemplate){
   if(original.name==='hall-sign')continue;
   const copy=original.clone(`${place.id}-${original.name}`,null)!;
   copy.scaling.scaleInPlace(place.scale);
   copy.position.set(original.position.x*place.scale+place.x,original.position.y*place.scale,(original.position.z-8)*place.scale+place.z);
   const bay=original.metadata?.doorBay;
   if((place.id==='gwaneum'||place.id==='jijang') && (bay===1 || bay===4)){
    // Swing each inner leaf back against its outer jamb, including its lattice.
    const side=bay===1?-1:1;
    const hingeX=side*5.91;
    const hingeZ=4.02;
    copy.rotation.y=side*Math.PI/2;
    copy.position.x=place.x+(hingeX+side*(original.position.z-hingeZ))*place.scale;
    copy.position.z=place.z+(hingeZ-8-side*(original.position.x-hingeX))*place.scale;
   }
   // Roof vertices are authored around z=8; clone translation compensates their baked origin.
   if(original.name==='curved-roof'||original.name==='tile-rib'||original.name==='ridge'||original.name==='tile-course')copy.position.z=place.z-8*place.scale;
   faceCourtyard(copy,place);
   staticMeshes.push(copy);
  }
 }
 const prayerHall=templePlaces.find(place=>place.id==='gwaneum')!;
 const cushionCloth=mat('gwaneum-cushion','#ae5348',.14);
 cushionCloth.specularColor=Color3.Black();
 const weave=new DynamicTexture('woven-cushion-cover',{width:256,height:256},scene,true);
 const cloth=weave.getContext() as CanvasRenderingContext2D;
 cloth.fillStyle='#e2d5c9';cloth.fillRect(0,0,256,256);
 for(let i=0;i<256;i+=4){
  cloth.fillStyle='rgba(78,58,48,.23)';cloth.fillRect(i,0,1,256);
  cloth.fillStyle='rgba(255,245,229,.39)';cloth.fillRect(0,i,256,1);
  for(let j=(i%8?4:0);j<256;j+=8){
   cloth.fillStyle='rgba(92,66,54,.25)';cloth.fillRect(j,i+1,3,1);
  }
 }
 weave.update();weave.uScale=2;weave.vScale=2;cushionCloth.diffuseTexture=weave;
 const floorHeight=1.4025*prayerHall.scale;
 const fittingsStart=staticMeshes.length;
 createGwaneumAltar(scene,staticMeshes,new Vector3(prayerHall.x,floorHeight,prayerHall.z+2.25),wood);
 for(const side of [-1,1])for(const dx of [1.55,3.55])for(const dz of [-1.58,.56]){
  const pad=MeshBuilder.CreateSphere('gwaneum-prayer-cushion',{diameter:1,segments:20},scene);
  pad.scaling.set(1.12,.145,.93);
  pad.position.set(prayerHall.x+side*dx,floorHeight+.067,prayerHall.z+dz);
  pad.material=cushionCloth;staticMeshes.push(pad);
 }
 for(const fitting of staticMeshes.slice(fittingsStart))faceCourtyard(fitting,prayerHall);
 const memorialHall=templePlaces.find(p=>p.id==='jijang')!;
 const memorialStart=staticMeshes.length;
 // Centre the aisle on an open bay between the structural front columns.
 const altarX=memorialHall.x+1.125, altarZ=memorialHall.z+2, baseY=1.4025*memorialHall.scale;
 const goldLeaf=mat('jijang-gold','#e2ad53',.39);
 const gildedSkin=mat('jijang-face','#f0c67c',.42);
 const giltScalp=mat('jijang-scalp','#9eab85',.29);
 const jewel=mat('jijang-jewel','#91dfcc',.66);
 const wax=mat('votive-ivory','#f4ddae',.35);
 const fire=mat('votive-fire','#ffad49',1.65);
 box('memorial-altar',3.25,.44,1.25,altarX,baseY+.22,altarZ,wood);
 box('memorial-gilt-trim',3.34,.045,1.34,altarX,baseY+.457,altarZ,goldLeaf);
 box('memorial-altar-top',3.4,.08,1.38,altarX,baseY+.52,altarZ,red);
 cylinder('memorial-dais',1.44,.19,new Vector3(altarX,baseY+.63,altarZ),goldLeaf);
 const statueY=baseY+.53, figureScale=.82;
 seatedFigure(scene,staticMeshes,altarX,statueY,altarZ,figureScale,goldLeaf,giltScalp,gildedSkin,true,true);
 function ornament(name:string,x:number,y:number,z:number,w:number,h:number,d:number,material:StandardMaterial){
  const mesh=MeshBuilder.CreateSphere(name,{diameter:1,segments:20},scene);
  mesh.scaling.set(w,h,d);mesh.position.set(x,y,z);mesh.material=material;staticMeshes.push(mesh);
 }
 ornament('wish-jewel',altarX,statueY+.82,altarZ-.38,.17,.17,.17,jewel);
 const staffX=altarX-.68;
 cylinder('ringed-staff',.035,1.83,new Vector3(staffX,statueY+1.19,altarZ-.28),goldLeaf);
 for(const [dx,dy,diameter] of [[0,2.25,.32],[-.12,2.13,.10],[.12,2.13,.10]]){
  const ring=MeshBuilder.CreateTorus('staff-ring',{diameter,thickness:.02,tessellation:32},scene);
  ring.rotation.x=Math.PI/2;ring.position.set(staffX+dx,statueY+dy,altarZ-.28);ring.material=goldLeaf;staticMeshes.push(ring);
 }
 for(const side of [-1,1]){
  const x=altarX+side*1.28,z=altarZ-.49;
  cylinder('candle-foot',.26,.08,new Vector3(x,baseY+.60,z),goldLeaf);
  cylinder('altar-candle',.11,.32,new Vector3(x,baseY+.80,z),wax);
  ornament('altar-flame',x,baseY+1.015,z,.054,.13,.054,fire);
  for(const dz of [-1.86,-.48,.9]){
   ornament('memorial-prayer-cushion',altarX+side*1.46,baseY+.065,memorialHall.z+dz,1.02,.14,.86,cushionCloth);
  }
 }
 for(const fitting of staticMeshes.slice(memorialStart))faceCourtyard(fitting,memorialHall);
 const amberLamp=mat('indeung-amber','#ffc45d',.55);
 const pearlLamp=mat('memorial-pearl','#ffe4bf',.48);
 const lotusPetal=mat('memorial-lotus','#deada4',.22);
 const lampBronze=mat('hall-lamp-bronze','#b79054',.25);
 const indeungHall=templePlaces.find(p=>p.id==='indeung')!;
 for(const kind of ['votive','memorial'] as const){
  const votive=kind==='votive';
  const hall=votive?indeungHall:memorialHall;
  const x=hall.x+(votive?0:4.35),z=hall.z+(votive?1.65:1.8);
  const floor=1.4025*hall.scale,width=votive?4.16:2.42;
  const base=votive?.69:.83;
  const start=staticMeshes.length;
  box('lamp-stand-plinth',width,base-.10,.76,x,floor+(base-.10)/2,z,wood);
  box('lamp-stand-cornice',width+.10,.10,.84,x,floor+base-.05,z,wood);
  if(votive){
   for(const level of [1,2])
    box('indeung-shelf',width,.07,.70,x,floor+base+.75*level-.035,z,wood);
   for(let post=0;post<=6;post++)
    box('indeung-divider',.055,1.5,.58,x+(post-3)*.64,floor+base+.75,z,wood);
  }
  for(const part of staticMeshes.slice(start))faceCourtyard(part,hall);
  for(const slot of hallLampSlots(kind)){
   const [lx,y,lz]=slot.position;
   cylinder(slot.id+'-foot',votive?.33:.42,.07,new Vector3(lx,y+.035,lz),lampBronze);
   const lampStart=staticMeshes.length;
   const body=MeshBuilder.CreateSphere(slot.id,{diameter:1,segments:18},scene);
   body.position.set(lx,y+(votive?.25:.22),lz);
   body.scaling.set(votive?.29:.25,votive?.34:.30,votive?.29:.25);
   body.material=votive?amberLamp:pearlLamp;staticMeshes.push(body);
   if(votive){
    cylinder('indeung-cap',.33,.055,new Vector3(lx,y+.42,lz),lampBronze);
    cylinder('indeung-finial',.08,.09,new Vector3(lx,y+.49,lz),lampBronze);
   }else{
    for(let n=0;n<8;n++){
     const angle=n*Math.PI/4;
     const petal=MeshBuilder.CreateSphere('memorial-lotus-petal',{diameter:1,segments:10},scene);
     petal.scaling.set(.17,.24,.06);
     petal.position.set(lx+.145*Math.sin(angle),y+.145,lz+.145*Math.cos(angle));
     petal.rotationQuaternion=Quaternion.FromEulerAngles(0,angle,0).multiply(Quaternion.FromEulerAngles(.48,0,0));
     petal.material=lotusPetal;staticMeshes.push(petal);
    }
   }
   if(import.meta.env.MODE==='review'||slot.id.endsWith('02')||slot.id.endsWith('04'))
    applicationSlot(slot.id,kind,new Vector3(lx,y+.25,lz),staticMeshes.splice(lampStart));
   else displayFixtures.push(...staticMeshes.splice(lampStart));
  }
 }
 for(const door of facadeDoors){staticMeshes.splice(staticMeshes.indexOf(door),1);door.dispose();}
 const daeung=templePlaces.find(p=>p.id==='daeung')!;
 for(const original of hallTemplate){
  if(original.isDisposed())continue;
  original.scaling.multiplyInPlace(new Vector3(daeungDimensions.x,daeungDimensions.y,daeungDimensions.z));
  original.position.set(original.position.x*daeungDimensions.x,original.position.y*daeungDimensions.y,(original.position.z-8)*daeungDimensions.z+daeung.z);
  if(['curved-roof','tile-rib','ridge','tile-course'].includes(original.name))original.position.z=daeung.z-8*daeungDimensions.z;
 }
 // Timber soffits and exposed rafter tails under the main hall's tiled eaves.
 const soffitMaterial=mat('main-hall-soffit','#50634f');
 soffitMaterial.backFaceCulling=false;
 const eaveTimber=mat('main-hall-rafter','#82523b');
 const eaveBand=mat('main-hall-rafter-band','#436e64');
 function eavePoint(x:number,z:number,drop:number){
  return new Vector3(x*daeungDimensions.x,(roofY(x,z)-drop)*daeungDimensions.y,daeung.z+z*daeungDimensions.z);
 }
 for(const side of [-1,1]){
  const vertices:number[]=[],faces:number[]=[],uv:number[]=[];
  for(let row=0;row<=4;row++)for(let col=0;col<=46;col++){
   const x=-11.5+col*.5,z=side*(3.35+row*.635);
   vertices.push(...eavePoint(x,z,.13).asArray());uv.push(col/46,row/4);
   if(row<4&&col<46){const k=row*47+col;faces.push(k,k+1,k+47,k+1,k+48,k+47);}
  }
  const panel=new Mesh('main-eave-boarding',scene);
  const data=new VertexData(),normals:number[]=[];
  VertexData.ComputeNormals(vertices,faces,normals);
  data.positions=vertices;data.indices=faces;data.uvs=uv;data.normals=normals;data.applyToMesh(panel);
  panel.material=soffitMaterial;staticMeshes.push(panel);
  for(let i=0;i<59;i++){
   const endX=-11.32+i*22.64/58;
   function rafterPoint(t:number){
    const flare=Math.sign(endX)*Math.max(0,Math.abs(endX)-8.1)*.43;
    return eavePoint(endX-flare*(1-t),side*(3.32+2.59*t),.245);
   }
   const path=Array.from({length:9},(_,n)=>rafterPoint(n/8));
   const tail=MeshBuilder.CreateTube('main-eave-rafter',{path,radius:.154,tessellation:12,cap:Mesh.CAP_ALL},scene);
   tail.material=eaveTimber;staticMeshes.push(tail);
   for(const t of [.80,.94]){
    const band=MeshBuilder.CreateTube('rafter-painted-band',{path:[rafterPoint(t),rafterPoint(t+.024)],radius:.158,tessellation:12},scene);
    band.material=eaveBand;staticMeshes.push(band);
   }
  }
 }
 function plaque(label:string,x:number,y:number,z:number){
  const t=new DynamicTexture(`label-${label}`,{width:512,height:128},scene,false);const c=t.getContext() as CanvasRenderingContext2D;
  c.fillStyle='#26372e';c.fillRect(0,0,512,128);c.strokeStyle='#bfa56e';c.lineWidth=5;c.strokeRect(6,6,500,116);c.fillStyle='#f4dfad';c.font='bold 68px serif';c.textAlign='center';c.fillText(label,256,89);t.update();
  const m=mat(`plaque-${label}`,'#ffffff');m.diffuseTexture=t;return box(`name-${label}`,3.2,.8,.12,x,y,z,m);
 }
 const office=templePlaces.find(p=>p.id==='office')!;
 const deskStart=staticMeshes.length,deskFloor=1.4025*office.scale;
 box('reception-front',3.7,.83,.72,office.x,deskFloor+.425,office.z+.3,wood);
 box('reception-counter',3.94,.10,.94,office.x,deskFloor+.89,office.z+.3,wood);
 box('reception-trim',3.71,.035,.04,office.x,deskFloor+.68,office.z-.07,ochre);
 box('reception-register',.51,.035,.36,office.x+.8,deskFloor+.96,office.z+.15,paper);
 plaque('등 · 소원 접수처',office.x,deskFloor+1.96,office.z+1.7);
 const entryNotice=plaque('기도 · 연등 접수',office.x+2.6,deskFloor+.84,office.z-3.1);
 entryNotice.scaling.set(.56,.64,1);
 for(const part of staticMeshes.slice(deskStart))faceCourtyard(part,office);
 for(const place of templePlaces.filter(p=>p.kind==='hall'&&p.id!=='daeung')){
  const entrySign=place.id==='office'||place.id==='indeung';
  const height=entrySign?4.38:place.id==='jijang'?4.5:5.2;
  const frontOffset=entrySign?5.2:4.65;
  faceCourtyard(plaque(place.name,place.x,height*place.scale,place.z-frontOffset*place.scale),place);
 }
 for(const place of templePlaces.filter(p=>p.kind==='gate'||p.kind==='bell')){
  const groupStart=staticMeshes.length;
  const kingGate=place.id==='cheonwang';
  const w=place.kind==='bell'?8:place.id==='ilju'?8:12,d=kingGate?11:place.kind==='bell'?5:4;
  const lift=kingGate?2.65:0;
  box(`${place.id}-base`,w+2,.25,d+2,place.x,.12,place.z,stone);
  for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])cylinder(`${place.id}-pillar`,kingGate?.65:.45,4.5+lift,new Vector3(place.x+x,2.5+lift/2,place.z+z),wood);
  box(`${place.id}-beam`,w+1,.5,d,place.x,4.7+lift,place.z,painted);
  const gateRoof=roof.clone(`${place.id}-roof`,null)!;const sx=(w+3)/23,sz=(d+3)/11.8;gateRoof.scaling.set(sx,.65,sz);gateRoof.position.set(place.x,1+lift,place.z-8*sz);staticMeshes.push(gateRoof);
  plaque(place.name,place.x,4.3+lift,place.z-d/2-.2);
  if(kingGate)for(const side of [-1,1]){
   box('guardian-gallery-back',.22,6.6,d,place.x+side*(w/2-.12),3.55,place.z,wood);
   for(const height of [.70,1.20])box('guardian-gallery-rail',.12,.10,d,place.x+side*2.30,height,place.z,red);
   for(let i=0;i<=6;i++)box('guardian-gallery-post',.14,1.20,.14,place.x+side*2.30,.85,place.z-d/2+i*d/6,wood);
  }
  if(place.kind==='bell'){
   furnishBell(scene,staticMeshes,place.x,place.z,wood);
   for(const part of staticMeshes.slice(groupStart))faceCourtyard(part,place);
  }
 }
 // Central court and southern entrance axis remain distinct from the fixed lantern slots.
 box('central-court',2*courtHalfWidth,.12,courtDepth,0,.03,courtSouthEdge+courtDepth/2,stone,false);
 const soil=mat('border-soil','#715942');
 const grass=mat('border-grass','#506849');
 for(const side of [-1,1]){
  box('garden-soil',gardenBorderWidth,.08,courtDepth,side*(courtHalfWidth+gardenBorderWidth/2),.025,courtSouthEdge+courtDepth/2,soil,false);
  for(let i=0;i<35;i++){
   const tuft=MeshBuilder.CreateSphere('low-groundcover',{diameter:1,segments:6},scene);
   tuft.scaling.set(.32+.08*Math.sin(i),.13+.04*Math.cos(i),.46);
   tuft.position.set(side*(courtHalfWidth+.62+.32*Math.sin(i*2.3)),.085,courtSouthEdge+.3+i*(courtDepth-.6)/34);
   tuft.material=grass;staticMeshes.push(tuft);
  }
 }
 const pathSoil=mat('path-soil','#524d48');
 surface(pathSoil,'stone');pathSoil.specularColor=Color3.Black();
 const slabs=['#a4a8a4','#acaeaa','#a8aba7'].map((shade,index)=>{
  const material=mat('path-flagstone-'+index,shade);
  material.diffuseTexture=new Texture('/textures/flagstone-gray.jpg',scene);
  material.bumpTexture=new Texture('/textures/rock_face_nor_gl_1k.jpg',scene);material.bumpTexture.level=.16;material.invertNormalMapY=true;
  material.specularColor=Color3.Black();
  return material;
 });
 // Inset the soil beyond the clipped corners so the surrounding grass meets the stones.
 function flaggedPath(name:string,x1:number,z1:number,x2:number,z2:number,columns=1){
  const length=Math.hypot(x2-x1,z2-z1),yaw=Math.atan2(x2-x1,z2-z1);
  const rowCount=Math.round(length/1.12),stride=length/rowCount;
  const width=columns===1?1.54:3.8,lane=width/columns;
  const soilInset=.26;
  const bed=box(name+'-soil',width-2*soilInset,.055,length-2*soilInset,(x1+x2)/2,.033,(z1+z2)/2,pathSoil,false);
  bed.rotation.y=yaw;
  for(let row=0;row<rowCount;row++)for(let col=0;col<columns;col++){
   const phase=row*2.47+col*4.51+x1+z1;
   const along=(row+.5)*stride;
   const across=(col+.5)*lane-width/2+.024*Math.cos(phase);
   const hw=lane*.5-.045-.018*Math.sin(phase),hd=stride*.5-.042;
   const cut=.055+.035*(1+Math.cos(phase));
   const outline=[[-hw+cut,-hd],[hw-cut,-hd],[hw,-hd+cut],[hw,hd-cut],[hw-cut,hd],[-hw+cut,hd],[-hw,hd-cut],[-hw,-hd+cut]];
   const positions:number[]=[],indices:number[]=[],uvs:number[]=[],normals:number[]=[];
   for(const [u,v] of outline){
    positions.push(u,.088+.005*Math.sin(phase),v);
    uvs.push((u+along*.71)/1.7,(v+col*.54+across)/1.7);normals.push(0,1,0);
   }
   for(let i=1;i<7;i++)indices.push(0,i,i+1);
   const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;
   const slab=new Mesh(name+'-stone',scene);data.applyToMesh(slab);
   slab.rotation.y=yaw+.016*Math.sin(phase);
   slab.position.set(x1+along*Math.sin(yaw)+across*Math.cos(yaw),0,z1+along*Math.cos(yaw)-across*Math.sin(yaw));
   slab.material=slabs[(row+col*2)%slabs.length];staticMeshes.push(slab);
  }
 }
 for(const path of paving)flaggedPath(path.name,path.from[0],path.from[1],path.to[0],path.to[1],path.lanes);
 const earth=mat('courtyard-compacted-soil','#afaaa2');
 earth.specularColor=Color3.Black();
 const grit=new DynamicTexture('fine-earth-and-gravel',512,scene,true);
 const soilBrush=grit.getContext() as CanvasRenderingContext2D;
 soilBrush.fillStyle='#bdb4a7';soilBrush.fillRect(0,0,512,512);
 let gritSeed=27437;
 const grain=()=>{gritSeed=Math.imul(1664525,gritSeed)+1013904223|0;return (gritSeed>>>0)/4294967296;};
 for(let i=0;i<22000;i++){
  const x=grain()*512,y=grain()*512,size=.5+grain()*1.9;
  soilBrush.fillStyle=grain()<.55?'rgba(74,63,56,.22)':'rgba(246,239,224,.34)';
  soilBrush.fillRect(x,y,size,size*.76);
 }
 for(let i=0;i<380;i++){
  const x=grain()*512,y=grain()*512,r=1.1+grain()**2*3.1;
  soilBrush.fillStyle='#9c9284';soilBrush.beginPath();soilBrush.ellipse(x,y,r,r*.68,grain()*3,0,2*Math.PI);soilBrush.fill();
  soilBrush.fillStyle='#d1c9bc';soilBrush.fillRect(x-r*.4,y-r*.45,r,.55);
 }
 const relief=new DynamicTexture('soil-grain-normals',512,scene,true);
 const reliefBrush=relief.getContext() as CanvasRenderingContext2D;
 const pixels=soilBrush.getImageData(0,0,512,512).data;
 const soilNormalPixels=reliefBrush.createImageData(512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const height=(dx:number,dy:number)=>pixels[4*(((y+dy+512)%512)*512+(x+dx+512)%512)];
  const nx=(height(-1,0)-height(1,0))*.022,ny=(height(0,-1)-height(0,1))*.022;
  const inv=1/Math.hypot(nx,ny,1),i=(y*512+x)*4;
  soilNormalPixels.data.set([128+127*nx*inv,128+127*ny*inv,128+127*inv,255],i);
 }
 reliefBrush.putImageData(soilNormalPixels,0,0);relief.gammaSpace=false;relief.level=.55;
 for(const texture of [grit,relief]){
  texture.wrapU=texture.wrapV=Texture.WRAP_ADDRESSMODE;texture.anisotropicFilteringLevel=8;texture.update();
 }
 earth.diffuseTexture=grit;earth.bumpTexture=relief;
 ground.material=groundMat;
 // The soil ends at the court's north edge; grass continues around the hall and outside the walls.
 const southGate=templePlaces.find(p=>p.id==='ilju')!,northGate=templePlaces.find(p=>p.id==='cheonwang')!;
 const southWall=northGate.z-5.5;
 const soilSections=[[southGate.z-2,4],[southGate.z+2,4],[southWall,6],[southWall,wallCenterX],[courtSouthEdge+courtDepth,wallCenterX]];
 const soilMesh=new Mesh('temple-inner-earth',scene),soilData=new VertexData();
 const soilVertices:number[]=[],soilUVs:number[]=[],soilNormals:number[]=[],soilFaces:number[]=[];
 for(const [z,extent] of soilSections){
  for(const x of [-extent,extent]){
   soilVertices.push(x,.006,z);soilUVs.push(x/3,z/3);soilNormals.push(0,1,0);
  }
  const k=soilVertices.length/3-2;
  if(k>0&&soilVertices[(k-2)*3+2]!==z)soilFaces.push(k-2,k-1,k,k-1,k+1,k);
 }
 soilData.positions=soilVertices;soilData.indices=soilFaces;soilData.normals=soilNormals;soilData.uvs=soilUVs;
 soilData.applyToMesh(soilMesh);soilMesh.material=earth;soilMesh.receiveShadows=true;
 const garden=wishGarden;
 const gravel=mat('warm-garden-gravel','#c6b899');
 box('wish-garden-ground',garden.width,.12,garden.depth,garden.x,.05,garden.z,gravel,false);
 const rackLength=5;

 for(const side of [-1,1]){
  for(let k=0;k<5;k++){
   const shrub=MeshBuilder.CreateSphere('garden-groundcover',{diameter:1,segments:9},scene);
   shrub.position.set(garden.x+side*(4.02+.19*Math.sin(k*2)),.25,garden.z+1.9-k*.6);
   shrub.scaling.set(.68,.39+.15*(k%2),.73);shrub.material=leaves;staticMeshes.push(shrub);
  }
 }

 const wishes=['가족건강','평안','감사','행복'];
 const tablets=wishes.map((wish,index)=>{
  const tex=new DynamicTexture('inscribed-wood-'+index,{width:128,height:256},scene,true);
  const c=tex.getContext() as CanvasRenderingContext2D;
  c.fillStyle=['#d6aa74','#e4c395','#d8b887','#cfa779'][index];c.fillRect(0,0,128,256);
  for(let j=0;j<96;j++){
   c.beginPath();c.strokeStyle='rgba(113,65,25,.10)';c.moveTo(j*1.5,0);
   c.bezierCurveTo(j*1.5+6,75,j*1.5-6,160,j*1.5+2,256);c.stroke();
  }
  c.strokeStyle='#ac855c';
  c.font='bold 28px serif';c.fillStyle='#503925';c.textAlign='center';
  [...wish].forEach((ch,n)=>c.fillText(ch,64,120-(wish.length-2)*17+n*35));
  c.fillStyle='#904537';c.fillRect(57,213,14,14);tex.update();
  const m=mat('wish-tablet-'+index,'#ffffff',.14);m.diffuseTexture=tex;return m;
 });
 const cord=mat('braided-wish-cord','#934a3f',.12);
 // Convex outlines in face coordinates. The inscribed face looks west toward the walk.
 const profiles:number[][][]=[
  [[-.15,-.26],[.15,-.26],[.15,.26],[-.15,.26]],
  Array.from({length:40},(_,i)=>[.208*Math.cos(i*Math.PI/20),.208*Math.sin(i*Math.PI/20)]),
  [[-.20,-.22],[.20,-.22],[.20,.05],[0,.25],[-.20,.05]],
 ];
 function wishTablet(profile:number[][],rackX:number,z:number,y:number,material:StandardMaterial){
  const positions:number[]=[],indices:number[]=[],uvs:number[]=[],normals:number[]=[];
  const halfW=Math.max(...profile.map(p=>Math.abs(p[0]))),halfH=Math.max(...profile.map(p=>Math.abs(p[1])));
  for(const x of [-.024,.024])for(const [u,v] of profile){
   positions.push(x,v,-u);uvs.push(.5+u/(2*halfW),.5+v/(2*halfH));
  }
  const n=profile.length;
  for(let i=1;i<n-1;i++)indices.push(0,i,i+1,n,n+i+1,n+i);
  for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,n+i,j,j,n+i,n+j);}
  const data=new VertexData();VertexData.ComputeNormals(positions,indices,normals);
  data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;
  const mesh=new Mesh('wooden-wish-tablet',scene);data.applyToMesh(mesh);
  mesh.position.set(rackX-.105,y,z);mesh.material=material;staticMeshes.push(mesh);
 }
 function writeWish(id:string){
  const slot=applicationSlots.get(id);
  const inscription=readApplication(id)?.text;
  if(!slot||!inscription)return;
  const tablet=slot.parts[0],name='personal-'+id;
  let material=colors[name];
  if(!material){
   material=mat(name,'#ffffff',.18);
   material.diffuseTexture=new DynamicTexture(name,{width:256,height:512},scene,true);
  }
  const texture=material.diffuseTexture as DynamicTexture;
  const brush=texture.getContext() as CanvasRenderingContext2D;
  brush.fillStyle='#dfbc8e';brush.fillRect(0,0,256,512);
  const chars=Array.from(inscription);const size=Math.min(55,380/chars.length);
  brush.textAlign='center';brush.fillStyle='#54351c';brush.font='bold '+size+'px serif';
  chars.forEach((char,i)=>brush.fillText(char,128,256+(i-(chars.length-1)/2)*size));
  texture.update();tablet.material=material;
 }
 profiles.forEach((profile,kind)=>{
  const rackX=garden.x+(kind-1)*rackSpacing;
  const center=garden.z-(kind-1)*.40;
  for(const side of [-1,1]){
   const z=center+side*(rackLength/2-.15);
   box('rack-footing',.40,.20,.32,rackX,.20,z,stone);
   box('rack-post',.16,2.06,.13,rackX,1.28,z,wood);
  }
  box('rack-crown',.28,.17,rackLength,rackX,2.37,center,wood);
  for(let row=0;row<2;row++){
   const railY=2.11-row*.78;
   box('wish-rack-rail',.10,.078,rackLength-.30,rackX,railY,center,wood);
   for(let i=0;i<9;i++){
    const slot=plaqueSlot(kind,row,i);
    const [,tabletY,z]=slot.position;
    const drop=.115+.022*Math.sin(i+row);
    const tabletStart=staticMeshes.length;
    wishTablet(profile,rackX,z,tabletY,tablets[kind===1?1+(i+row)%3:(i+row+kind)%4]);
    for(const side of [-1,1]){
     const ends=[new Vector3(rackX,railY+.026,z),new Vector3(rackX-.13,railY-drop-.045,z+side*.048)];
     const tie=MeshBuilder.CreateTube('wish-cord',{path:ends,radius:.009,tessellation:6},scene);
     tie.material=cord;staticMeshes.push(tie);
    }
    if(import.meta.env.MODE==='review'||(i===2 && row===0)){
     const id=slot.id;
     applicationSlot(id,'plaque',Vector3.FromArray([...slot.position]),staticMeshes.splice(tabletStart));
     writeWish(id);
    }else displayFixtures.push(...staticMeshes.splice(tabletStart));
   }
  }
 });
 const pagodaX=prayerHall.x, pagodaZ=courtSouthEdge+courtDepth/2;
 cylinder('pagoda-court',8,.12,new Vector3(pagodaX,.05,pagodaZ),stone);
 for(let tier=0;tier<3;tier++){
  box('pagoda-body',1.8-tier*.3,.9,1.8-tier*.3,pagodaX,1.06+tier*1.1,pagodaZ,stone);
  box('pagoda-eave',2.8-tier*.5,.2,2.8-tier*.5,pagodaX,1.61+tier*1.1,pagodaZ,stoneDark);
 }
 box('pagoda-base',3.4,.5,3.4,pagodaX,.36,pagodaZ,stone);
 cylinder('pagoda-finial',.24,1.3,new Vector3(pagodaX,4.56,pagodaZ),ochre);
 const candleLights:PointLight[]=[];
 const flameTexture=new DynamicTexture('offering-flame-profile',128,scene,false);
 const brush=flameTexture.getContext() as CanvasRenderingContext2D;
 const halo=brush.createRadialGradient(64,65,2,64,65,63);
 halo.addColorStop(0,'rgba(255,218,145,.86)');
 halo.addColorStop(.22,'rgba(255,188,88,.40)');
 halo.addColorStop(.55,'rgba(255,159,57,.12)');
 halo.addColorStop(1,'rgba(255,146,49,0)');
 brush.fillStyle=halo;brush.fillRect(0,0,128,128);
 brush.beginPath();brush.moveTo(65,46);
 brush.bezierCurveTo(64,56,51,72,63,77);
 brush.bezierCurveTo(75,76,68,58,65,46);
 brush.fillStyle='#fff4cb';brush.fill();
 flameTexture.hasAlpha=true;flameTexture.update();
 const flameMaterial=mat('offering-flame-gold','#ffffff');
 flameMaterial.disableLighting=true;flameMaterial.emissiveColor=new Color3(1.35,1.2,1);
 flameMaterial.diffuseTexture=flameTexture;flameMaterial.useAlphaFromDiffuseTexture=true;
 const offeringFlames:Mesh[]=[];
 for(const material of [stone,stoneDark,wood,ochre,wax])material.maxSimultaneousLights=5;
 for(const [dx,dz,yaw] of candleCabinets){
  // One soft source per row of flames, just inside the cabinet lip.
  const light=new PointLight('offering-candlelight',new Vector3(pagodaX+dx*.87,1.42,pagodaZ+dz*.87),scene);
  light.diffuse=Color3.FromHexString('#ffb16a');
  light.specular=Color3.FromHexString('#71401c');
  light.range=8;
  light.intensity=1.85;
  candleLights.push(light);
  const firstMesh=staticMeshes.length;
  box('candle-cabinet-foot',1.12,.24,4.9,0,.18,0,stone);
  box('candle-cabinet-base',.92,.55,4.72,0,.555,0,wood);
  box('candle-cabinet-shelf',1.06,.1,4.8,0,.88,0,stoneDark);
  for(const postX of [-.44,.44])for(const postZ of [-2.26,2.26]){
   box('candle-cabinet-post',.085,.85,.085,postX,1.35,postZ,wood);
  }
  box('candle-cabinet-cap',1.18,.11,4.98,0,1.82,0,stoneDark);
  for(let slot=0;slot<7;slot++){
   const z=(slot-3)*.64;
   cylinder('candle-holder',.32,.07,new Vector3(0,.965,z),ochre);
   const fixed=candleSlot(candleLights.length-1,slot);
   const [wx,,wz]=fixed.position;
   const available=slot%3===1;
   const taperStart=staticMeshes.length;
   const height=.49+.10*Math.sin(slot*3.9+dx+dz);
   const tip=1+height;
   cylinder('offering-taper',.087,height,new Vector3(0,1+height/2,z),wax);
   cylinder('offering-wick',.016,.032,new Vector3(0,tip+.016,z),wood);
   const flame=MeshBuilder.CreatePlane('offering-flame',{size:.66},scene);
   flame.material=flameMaterial;flame.billboardMode=Mesh.BILLBOARDMODE_ALL;flame.isPickable=false;
   flame.position.set(wx,tip+.078,wz);
   offeringFlames.push(flame);
   if(available||import.meta.env.MODE==='review'){
    const parts=staticMeshes.splice(taperStart);
    for(const mesh of parts)mesh.position.set(wx,mesh.position.y,wz);
    applicationSlot(fixed.id,'candle',flame.position.subtract(new Vector3(0,.24,0)),[...parts,flame]);
   }
  }
  for(const part of staticMeshes.slice(firstMesh)){
   const {x:localX,z:localZ}=part.position;
   part.position.x=pagodaX+dx+localX*Math.cos(yaw)+localZ*Math.sin(yaw);
   part.position.z=pagodaZ+dz-localX*Math.sin(yaw)+localZ*Math.cos(yaw);
   part.rotation.y+=yaw;
  }
 }
 const granite=mat('lantern-granite','#b3aba0');
 surface(granite,'stone');
 const lampCore=mat('lantern-lamplight','#deb27a');
 const lampLights:PointLight[]=[];
 const stoneLanternScale=.72;
 for(const x of [-6,6]){
  const z=15;
  const base=new Vector3(x,.09,z);
  const firstPart=staticMeshes.length;
  function octagon(name:string,y:number,height:number,bottom:number,top:number,material=granite){
   const mesh=MeshBuilder.CreateCylinder(name,{height,diameterBottom:bottom,diameterTop:top,tessellation:8},scene);
   mesh.material=material;mesh.position.set(x,y,z);staticMeshes.push(mesh);
  }
  octagon('plinth',.20,.22,1.26,1.26);
  octagon('lower-lotus',.42,.22,1.18,.59);
  octagon('lower-collar',.57,.09,.63,.59);
  octagon('octagonal-shaft',.95,.68,.51,.46);
  octagon('upper-lotus',1.43,.28,.48,1.10);
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   for(const upper of [false,true]){
    const petal=MeshBuilder.CreateSphere('lotus-relief',{diameter:1,segments:12},scene);
    petal.scaling.set(.23,.31,.09);
    petal.rotationQuaternion=Quaternion.FromEulerAngles(0,angle,0).multiply(Quaternion.FromEulerAngles(upper?.68:-.76,0,0));
    petal.position.set(x+.416*Math.sin(angle),upper?1.44:.43,z+.416*Math.cos(angle));
    petal.material=granite;staticMeshes.push(petal);
   }
  }
  octagon('fire-chamber-sill',1.62,.10,1.12,1.12);
  octagon('recessed-light',1.95,.5,.46,.46,lampCore);
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   const pier=box('fire-chamber-pier',.16,.60,.19,x+.445*Math.sin(angle),1.97,z+.445*Math.cos(angle),granite);
   pier.rotation.y=angle;
  }
  octagon('chamber-lintel',2.30,.12,1.08,1.16);
  octagon('roof-eave',2.40,.08,1.52,1.55);
  octagon('roof-slope',2.53,.18,1.55,.80);
  octagon('roof-crown',2.68,.12,.80,.43);
  octagon('finial-neck',2.78,.09,.35,.24);
  octagon('finial-bud',2.89,.14,.23,.32);
  octagon('finial-tip',3.05,.18,.32,.035);
  for(const part of staticMeshes.slice(firstPart)){
   part.position.subtractInPlace(base).scaleInPlace(stoneLanternScale).addInPlace(base);
   part.scaling.scaleInPlace(stoneLanternScale);
  }
  const lightHeight=base.y+(1.94-base.y)*stoneLanternScale;
  const lamp=new PointLight('stone-lantern-spill',new Vector3(x,lightHeight,z),scene);
  lamp.diffuse=Color3.FromHexString('#ffc07b');lamp.specular=Color3.Black();
  lamp.intensity=.95;lamp.range=6;lampLights.push(lamp);
 }

 // Endpoints follow the wall centreline. Heights include the tiled ridge.
 function tiledWall(x1:number,z1:number,x2:number,z2:number,top:number){
  const length=Math.hypot(x2-x1,z2-z1), yaw=Math.atan2(x2-x1,z2-z1);
  const x=(x1+x2)/2,z=(z1+z2)/2;
  const body=box('garden-wall',wallThickness,top-.22,length,x,(top-.22)/2,z,masonry);
  body.rotation.y=yaw;
  for(const side of [-1,1]){
   const offset=side*.19;
   const tiles=box('wall-tile-slope',.43,.09,length,x+offset*Math.cos(yaw),top-.16,z-offset*Math.sin(yaw),roofMat);
   tiles.rotationQuaternion=Quaternion.FromEulerAngles(0,yaw,0).multiply(Quaternion.FromEulerAngles(0,0,-side*.32));
  }
  box('wall-ridge',.15,.12,length,x,top-.06,z,roofEdge).rotation.y=yaw;
 }
 const outerGate=templePlaces.find(p=>p.id==='ilju')!;
 const innerGate=templePlaces.find(p=>p.id==='cheonwang')!;
 for(const wall of boundaries)tiledWall(wall.from[0],wall.from[1],wall.to[0],wall.to[1],wall.height);
 placeGuardians(scene,staticMeshes,innerGate.z);
 let seed=42;function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
 for(let i=0;i<65;i++){const side=i%2?1:-1;const x=side*(42+rand()*25),z=-70+rand()*140,h=6+rand()*8;
 cylinder('tree-trunk',.4,h*.7,new Vector3(x,h*.35,z),trunk);
 for(let level=0;level<5;level++)for(let branch=0;branch<7;branch++){
  const angle=branch*Math.PI*2/7+level*1.1;const spread=(1-level*.12)*2;
  const a=MeshBuilder.CreateSphere('pine-foliage',{diameter:1.8+rand()*.8,segments:6},scene);a.scaling.set(1,.45+rand()*.3,.8);a.position.set(x+Math.cos(angle)*spread,h*.5+level*h*.11+rand()*.8,z+Math.sin(angle)*spread);a.material=leaves;staticMeshes.push(a);
 }
 }
 for(const side of [-1,1])for(let i=0;i<18;i++){
  const rock=MeshBuilder.CreateSphere('garden-granite',{diameter:1,segments:5},scene);rock.position.set(side*(38+rand()*3),.3,-20+i*2);rock.scaling.set(1+rand(),.5+rand()*.6,1+rand());rock.material=stoneDark;staticMeshes.push(rock);
  const shrub=MeshBuilder.CreateSphere('garden-shrub',{diameter:1.8,segments:8},scene);shrub.position.set(side*(38+rand()*2),.65,-20+i*2);shrub.scaling.y=.65;shrub.material=leaves;staticMeshes.push(shrub);
 }
 for(const {x,z} of meditationTrees){ cylinder('meditation-tree',.35,5,new Vector3(x,2.5,z),trunk);const crown=MeshBuilder.CreateSphere('meditation-crown',{diameter:4.5,segments:8},scene);crown.position.set(x,5.8,z);crown.material=leaves;staticMeshes.push(crown);}
 furnishHall(scene,staticMeshes,wood,painted);
 // Merge static geometry by material. Shadow lists are rebuilt to avoid disposed casters.
 const walking=walkingController(scene,camera,canvas,pedestrianWorld(staticMeshes));
 shadows.getShadowMap()!.renderList=[];
 function batchArchitecture(meshes:Mesh[],display:boolean){
  const groups=new Map<StandardMaterial,Mesh[]>();
  for(const mesh of meshes){
   const material=mesh.material as StandardMaterial;
   if(!groups.has(material))groups.set(material,[]);
   groups.get(material)!.push(mesh);
  }
  for(const [material,parts] of groups){
   const merged=Mesh.MergeMeshes(parts,true,true);
   if(!merged)continue;
   merged.name='architecture-'+material.name;merged.receiveShadows=true;
   shadows.addShadowCaster(merged);merged.freezeWorldMatrix();
   if(display)displayBatches.push(merged);
  }
 }
 batchArchitecture(staticMeshes,false);batchArchitecture(displayFixtures,true);
 const luminousWindows=scene.meshes.find(mesh=>mesh.material===lampCore);
 if(luminousWindows instanceof Mesh)glow.addIncludedOnlyMesh(luminousWindows);
 const candleReceivers=scene.meshes.filter(mesh=>[stone,stoneDark,wood,ochre,wax].some(material=>mesh.material===material));
 for(const light of candleLights)light.includedOnlyMeshes=candleReceivers;
 stone.maxSimultaneousLights=7;
 for(const lamp of lampLights)lamp.includedOnlyMeshes=scene.meshes.filter(mesh=>mesh.material===stone||mesh.material===granite);
 const nightWayfinding=new HemisphericLight('moonlit-path-and-sign',new Vector3(0,1,-.5),scene);
 nightWayfinding.intensity=1.14;nightWayfinding.diffuse=Color3.FromHexString('#eddac0');
 nightWayfinding.includedOnlyMeshes=scene.meshes.filter(mesh=>mesh.material===signMat||slabs.some(material=>mesh.material===material));
 const palette=LANTERN_PALETTE;
 const hanjiTexture=new Texture('/textures/hanji-fibres-generated-v1.png',scene);
 // Three shape-specific UV mappings share the approved optical model and five dyes.
 const lanternMaterials=Array.from({length:15},(_,i)=>createHanjiMaterial(scene,`hanji-${i}`,palette[Math.floor(i/3)],i%3===2?1:8,undefined,hanjiTexture));
 const ownedMaterials=Array.from({length:15},(_,i)=>createHanjiMaterial(scene,`owned-hanji-${i}`,palette[Math.floor(i/3)],i%3===2?1:8,undefined,hanjiTexture));
 const haloMat=mat('selection-marker','#ffcb65',.6);
 const auraTexture=new DynamicTexture('owned-soft-aura',{width:128,height:128},scene,false);
 const ac=auraTexture.getContext() as CanvasRenderingContext2D;ac.clearRect(0,0,128,128);
 const ag=ac.createRadialGradient(64,64,8,64,64,64);ag.addColorStop(0,'rgba(255,255,255,.60)');ag.addColorStop(.45,'rgba(255,255,255,.28)');ag.addColorStop(1,'rgba(255,255,255,0)');ac.fillStyle=ag;ac.fillRect(0,0,128,128);auraTexture.hasAlpha=true;auraTexture.update();
 const auraMaterials=palette.map((c,i)=>{const m=mat(`owned-aura-${i}`,c,1);m.disableLighting=true;m.diffuseColor=Color3.Black();m.opacityTexture=auraTexture;m.alpha=.35;m.disableDepthWrite=true;m.backFaceCulling=false;return m;});
 const starTexture=new DynamicTexture('owned-led-star',{width:128,height:128},scene,false);
 const starContext=starTexture.getContext() as CanvasRenderingContext2D;starContext.clearRect(0,0,128,128);
 const sg=starContext.createRadialGradient(64,64,0,64,64,62);sg.addColorStop(0,'rgba(255,255,255,1)');sg.addColorStop(.15,'rgba(255,255,255,.9)');sg.addColorStop(.42,'rgba(255,255,255,.2)');sg.addColorStop(1,'rgba(255,255,255,0)');starContext.fillStyle=sg;starContext.fillRect(0,0,128,128);
 starContext.fillStyle='rgba(255,255,255,.85)';starContext.beginPath();starContext.moveTo(64,7);starContext.lineTo(69,59);starContext.lineTo(121,64);starContext.lineTo(69,69);starContext.lineTo(64,121);starContext.lineTo(59,69);starContext.lineTo(7,64);starContext.lineTo(59,59);starContext.closePath();starContext.fill();starTexture.hasAlpha=true;starTexture.update();
 const sparkleMaterials=palette.map((c,i)=>{const m=mat(`owned-led-${i}`,c,1.4);m.disableLighting=true;m.emissiveColor=Color3.Lerp(Color3.FromHexString(c),Color3.White(),.65).scale(2);m.opacityTexture=starTexture;m.diffuseColor=Color3.Black();m.backFaceCulling=false;m.disableDepthWrite=true;return m;});
 const bulbMat=mat('warm-pin-lights','#e8bb74',.4);bulbMat.disableLighting=true;
 const bamboo=mat('fine-bamboo-frame','#9a6844');bamboo.specularColor=Color3.Black();
 const names=new Map<number,string>([[23,'이름']]);const tagTextures=new Map<number,DynamicTexture>();
 function drawTag(texture:DynamicTexture,name:string){
  const c=texture.getContext() as CanvasRenderingContext2D;c.fillStyle='#fff9e8';c.fillRect(0,0,160,640);c.strokeStyle='#b84438';c.lineWidth=3;c.strokeRect(10,10,140,620);c.fillStyle='#ad4536';c.font='20px serif';c.textAlign='center';c.fillText('발 원',80,53);
  const chars=Array.from(name||'이름');const size=Math.min(55,420/Math.max(1,chars.length));c.fillStyle='#352c25';c.font=`${size}px serif`;chars.forEach((ch,i)=>c.fillText(ch,80,130+i*(size+5)));c.font='20px serif';c.fillStyle='#8a7764';c.fillText('사 사',80,604);texture.update();
 }
 function setName(value:string){const name=normalizeLanternName(value);if(name)names.set(selected,name);else names.delete(selected);rebuildLanterns(density);return name;}
 let lanternRoot=new TransformNode('lantern-samples',scene),selected=23,density=1000;
 let lanternCasters:Mesh[]=[];
 let canopyCapacity=0,installedLanterns=0;
 let ownerBodies:Mesh[]=[];let ownerHalos:Mesh[]=[];let sparkles:{mesh:Mesh,center:Vector3,phase:number}[]=[];let marker:Mesh|null=null;
 const reviewSlots=new Map<string,ReviewSlot>();
 const claimedSlots=new Set<string>(import.meta.env.MODE==='review'?['sample:Z02:lantern:0023','sample:Z02:lantern:0002']:[]);
 const reviewMarks:Mesh[]=[];
 function applyReviewSlots(slots:ReviewSlot[]){
  // Previously supplied IDs remain server-managed after their removal.
  reviewSlots.clear();
  for(const mark of reviewMarks)mark.dispose();
  reviewMarks.length=0;
  for(const slot of slots){reviewSlots.set(slot.id,slot);claimedSlots.add(slot.id);}
  for(const id of claimedSlots){
   const local=applicationSlots.get(id);
   if(local)local.mark.setEnabled(false);
  }
  for(const slot of slots){
   if(slot.accepts!=='lantern'){refreshApplication(slot.id);continue;}
   if(slot.installationId)continue;
   const mark=MeshBuilder.CreatePlane('server-empty-slot',{size:.7},scene);
   mark.position.set(...slot.position);mark.material=pinMaterial;mark.billboardMode=Mesh.BILLBOARDMODE_ALL;
   mark.metadata={applicationId:slot.id};reviewMarks.push(mark);
  }
  rebuildLanterns(density);
 }
 const freeLanternIndices=[2,34,66];
 for(const slot of lanternSlots(67).filter(slot=>freeLanternIndices.includes(Number(slot.id.split(':').at(-1))))){
  applicationSlot(slot.id,'lantern',Vector3.FromArray([...slot.position]),[],.7);
  if(claimedSlots.has(slot.id))applicationSlots.get(slot.id)!.mark.setEnabled(false);
 }
 function rebuildLanterns(count:number){
  for(const caster of lanternCasters)shadows.removeShadowCaster(caster);lanternCasters=[];
  for(const mesh of lanternRoot.getChildMeshes())glow.removeIncludedOnlyMesh(mesh as Mesh);
  for(const mesh of lanternRoot.getChildMeshes())if(mesh.name.startsWith('owned-tag'))mesh.material?.dispose(false,true);tagTextures.clear();
  lanternRoot.dispose(false);lanternRoot=new TransformNode('lantern-samples',scene);ownerBodies=[];ownerHalos=[];sparkles=[];density=count;
  for(const index of freeLanternIndices){
   const slot=lanternSlots(67)[index],record=readApplication(slot.id);
   if(record?.text)names.set(index,record.text);else names.delete(index);
  }
  const candidates=[...canopyLanternSlots(count).filter(s=>!claimedSlots.has(s.id)),...[...reviewSlots.values()].filter(s=>s.accepts==='lantern'&&(Number(s.id.slice(-4))<count||s.owned))];
  const slots=candidates.filter(slot=>reviewSlots.has(slot.id)?!!reviewSlots.get(slot.id)!.installationId:!applicationSlots.has(slot.id)||!!readApplication(slot.id)),buckets=Array.from({length:15},()=>[] as Matrix[]);
  canopyCapacity=candidates.length;installedLanterns=slots.length;
  function body(name:string,type:number){
   if(type===0){const a=MeshBuilder.CreateSphere(name,{diameter:.74,segments:24},scene);a.scaling.y=1.12;a.bakeCurrentTransformIntoVertices();return a;}
   if(type===1)return MeshBuilder.CreateLathe(name,{shape:[new Vector3(.18,-.43,0),new Vector3(.39,-.22,0),new Vector3(.39,.22,0),new Vector3(.18,.43,0)],tessellation:8,cap:Mesh.NO_CAP,closed:true},scene);
   const parts:Mesh[]=[];const core=MeshBuilder.CreateSphere(name+'-core',{diameter:.53,segments:16},scene);parts.push(core);
   for(let ring=0;ring<2;ring++)for(let k=0;k<8;k++){
    const angle=k*Math.PI/4+ring*Math.PI/8,positions:number[]=[],indices:number[]=[],uvs:number[]=[];
    for(let j=0;j<=10;j++)for(let i=0;i<=8;i++){const t=j/10,u=(i/8-.5)*2;const w=.21*Math.sin(Math.PI*t);const radius=.10+.35*Math.sin(t*Math.PI*.67)+ring*.04;const y=-.30+t*.63-ring*.08;const radial=radius-.07*u*u*Math.sin(Math.PI*t);positions.push(Math.sin(angle)*radial+Math.cos(angle)*u*w,y,Math.cos(angle)*radial-Math.sin(angle)*u*w);uvs.push(i/8,t);}
    for(let j=0;j<10;j++)for(let i=0;i<8;i++){const a=j*9+i;indices.push(a,a+9,a+1,a+1,a+9,a+10);}
    const petal=new Mesh(name+'-petal',scene),data=new VertexData(),normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);data.positions=positions;data.normals=normals;data.indices=indices;data.uvs=uvs;data.applyToMesh(petal);parts.push(petal);
   }
   const lotus=Mesh.MergeMeshes(parts,true,true)!;lotus.scaling.set(.78,1,.78);lotus.bakeCurrentTransformIntoVertices();return lotus;
  }
  for(const s of slots){const i=Number(s.id.split(':').at(-1));
   const p=Vector3.FromArray([...s.position]);const isOwn=reviewSlots.get(s.id)?.owned??((OWNED_INDICES as readonly number[]).includes(i)||applicationSlots.has(s.id));const type=i%3;
   if(isOwn){const a=body(`owned-${i}`,type);a.name=`owned-${i}`;a.position=p;a.rotation.y=s.rotationY;a.material=ownedMaterials[lanternColourIndex(s.position)*3+type];a.parent=lanternRoot;ownerBodies.push(a);lanternCasters.push(a);}else buckets[lanternColourIndex(s.position)*3+type].push(Matrix.Translation(p.x,p.y,p.z));
  }
  buckets.forEach((matrices,i)=>{if(!matrices.length)return;const a=body(`lantern-${['round','octagonal','lotus'][i%3]}-${i}`,i%3);a.material=lanternMaterials[i];a.parent=lanternRoot;a.thinInstanceAdd(matrices);lanternCasters.push(a);});
  for(const owned of ownerBodies){
   const colorIndex=lanternColourIndex([owned.position.x,owned.position.y,owned.position.z]);
   const aura=MeshBuilder.CreatePlane('owned-soft-glow',{width:2.0,height:2.15},scene);aura.position=owned.position.clone();aura.material=auraMaterials[colorIndex];aura.parent=lanternRoot;aura.billboardMode=Mesh.BILLBOARDMODE_ALL;aura.isPickable=false;ownerHalos.push(aura);
   for(let k=0;k<8;k++){const a=MeshBuilder.CreatePlane('owner-sparkle',{size:.12},scene);a.billboardMode=Mesh.BILLBOARDMODE_ALL;a.isPickable=false;a.material=sparkleMaterials[colorIndex];a.parent=lanternRoot;glow.addIncludedOnlyMesh(a);sparkles.push({mesh:a,center:owned.position.clone(),phase:k*Math.PI*2/8});}

  }
  // Eight distinct corners and sloping shoulders, not a cylindrical paper tube.
  const frameParts:Mesh[]=[];
  for(let k=0;k<8;k++){const a=k*Math.PI/4;const path=[[-.425,.175],[-.22,.385],[.22,.385],[.425,.175]].map(([y,r])=>new Vector3(Math.sin(a)*r,y,Math.cos(a)*r));const rail=MeshBuilder.CreateTube('octagonal-frame-edge',{path,radius:.0013,tessellation:5},scene);frameParts.push(rail);}
  for(const y of [-.22,.22]){const points=Array.from({length:9},(_,k)=>new Vector3(Math.sin(k*Math.PI/4)*.385,y,Math.cos(k*Math.PI/4)*.385));frameParts.push(MeshBuilder.CreateTube('octagonal-frame-rim',{path:points,radius:.0011,tessellation:5},scene));}
  const frame=Mesh.MergeMeshes(frameParts,true,true)!;frame.material=bamboo;frame.parent=lanternRoot;frame.thinInstanceAdd(slots.filter(s=>Number(s.id.split(':').at(-1))%3===1).map(s=>Matrix.Translation(...s.position)));
  // Gold ribs, pendants and small warm bulbs echo the reference's jewel-like light rhythm.
  const ribs=MeshBuilder.CreateTorus('lantern-gold-band',{diameter:.725,thickness:.002,tessellation:24},scene);ribs.material=bamboo;ribs.parent=lanternRoot;ribs.thinInstanceAdd(slots.filter(s=>Number(s.id.split(':').at(-1))%3===0).map(s=>Matrix.Translation(s.position[0],s.position[1],s.position[2])));
  // Only requested name tags exist. The initial scene has one example (slot 23).
  for(const s of slots){const i=Number(s.id.split(':').at(-1));const name=names.get(i);if(!name)continue;
   const p=Vector3.FromArray([...s.position]);const string=MeshBuilder.CreateLines('tag-thread',{points:[p.add(new Vector3(0,-.43,0)),p.add(new Vector3(0,-.64,0))]},scene);string.color=new Color3(.56,.43,.31);string.parent=lanternRoot;
   const texture=new DynamicTexture(`name-tag-${i}`,{width:160,height:640},scene,true);drawTag(texture,name);tagTextures.set(i,texture);
   const material=mat(`tag-paper-${i}`,'#ffffff',.12);material.diffuseTexture=texture;material.backFaceCulling=false;
   const tag=MeshBuilder.CreatePlane(`owned-tag-${i}`,{width:.21,height:.76,sideOrientation:Mesh.DOUBLESIDE},scene);tag.position=p.add(new Vector3(0,-1.02,0));tag.material=material;tag.parent=lanternRoot;tag.billboardMode=Mesh.BILLBOARDMODE_Y;
  }
  const bulb=MeshBuilder.CreateSphere('canopy-fairy-lights',{diameter:.065,segments:6},scene);bulb.material=bulbMat;bulb.parent=lanternRoot;bulb.thinInstanceAdd(slots.map(s=>Matrix.Translation(s.position[0]+.3,s.position[1]+.65,s.position[2])));glow.addIncludedOnlyMesh(bulb);
  const all=slots.map(s=>Matrix.Translation(s.position[0],s.position[1]-.43,s.position[2]));
  const cap=MeshBuilder.CreateCylinder('caps',{height:.018,diameter:.13,tessellation:8},scene);cap.material=bamboo;cap.parent=lanternRoot;cap.thinInstanceAdd(all);
  const top=cap.clone('tops')!;top.parent=lanternRoot;top.thinInstanceSetBuffer('matrix',null);top.thinInstanceAdd(slots.map(s=>Matrix.Translation(s.position[0],s.position[1]+.43,s.position[2])));
  for(const x of new Set(slots.map(s=>s.position[0]))){
   const path=slots.filter(s=>s.position[0]===x).sort((a,b)=>a.position[2]-b.position[2]).map(s=>new Vector3(x,s.position[1]+.9,s.position[2]));
   if(Math.abs(x)<=gateCanopyAnchor.halfWidth){
    const anchor=new Vector3(x,gateCanopyAnchor.y,gateCanopyAnchor.z-.04);
    const tie=MeshBuilder.CreateTube('gate-eave-canopy-tie',{path:[anchor,path[0]],radius:.025,tessellation:6},scene);
    tie.material=bamboo;tie.parent=lanternRoot;
   }
   const line=MeshBuilder.CreateLines('longitudinal-canopy-string',{points:path},scene);
   line.color=new Color3(.16,.14,.11);line.parent=lanternRoot;
  }
  const cords=slots.map(slot=>{
   const [x,y,z]=slot.position;
   return [new Vector3(x,y+.43,z),new Vector3(x,y+.9,z)];
  });
  const suspension=MeshBuilder.CreateLineSystem('suspension',{lines:cords},scene);
  suspension.color=new Color3(.25,.2,.12);suspension.parent=lanternRoot;


  marker=MeshBuilder.CreateTorus('destination-marker',{diameter:1.05,thickness:.035,tessellation:32},scene);marker.material=haloMat;marker.parent=lanternRoot;marker.isVisible=false;setSelected(selected);
  if(currentTime==='day')for(const caster of lanternCasters)shadows.addShadowCaster(caster);
 }
 function selectedPosition(index:number){const sample=lanternSlots(1000)[index];return reviewSlots.get(sample.id)?.position??sample.position;}
 function setSelected(index:number){selected=index;if(marker){const p=selectedPosition(index);marker.position.set(p[0],p[1]-.65,p[2]);}}
 let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let currentTime:TimeOfDay='day';let quality:Quality='high';
 function time(value:TimeOfDay){
  nightWayfinding.setEnabled(value==='night');
  amberLamp.emissiveColor=amberLamp.diffuseColor.scale(value==='night'?1.45:.55);
  pearlLamp.emissiveColor=pearlLamp.diffuseColor.scale(value==='night'?1.15:.48);
  flameMaterial.alpha=value==='night'?1:value==='dusk'?.88:.7;
  for(const lamp of lampLights){
   lamp.intensity=value==='night'?5:.95;
   lamp.setEnabled(value!=='day');
  }
  lampCore.emissiveColor=Color3.FromHexString('#ffb161').scale(value==='night'?2.65:value==='dusk'?.65:.06);
  for(const light of candleLights)light.setEnabled(value==='night');
  currentTime=value;shadows.bias=value==='day'?.00015:.002;shadows.normalBias=value==='day'?.008:.035;shadows.getShadowMap()!.resize(quality==='low'?512:value==='day'?4096:2048);for(const caster of lanternCasters){shadows.removeShadowCaster(caster);if(value==='day')shadows.addShadowCaster(caster);}paintSky(value);for(const m of [...lanternMaterials,...ownedMaterials])m.setFloat('night',value==='night'?1:value==='dusk'?.45:0);const skies={day:'#a6dbfa',dusk:'#354865',night:'#080f24'};const c=Color3.FromHexString(skies[value]);scene.clearColor=new Color4(c.r,c.g,c.b,1);scene.fogColor=c;hemi.intensity=value==='night'?.35:value==='dusk'?.95:1.1;hemi.diffuse=Color3.FromHexString('#e4f2ff');sun.intensity=value==='day'?1.4:value==='dusk'?1.1:.25;sun.diffuse=Color3.FromHexString(value==='day'?'#fff3db':value==='dusk'?'#ffc17b':'#c1d5ec');sun.direction=value==='day'?new Vector3(-.35,-1.8,.25):new Vector3(-.65,-.5,.45);glow.intensity=value==='night'?.65:value==='dusk'?.5:.4;paper.emissiveColor=paper.diffuseColor.scale(value==='night'?.08:value==='dusk'?.025:0);}
 function setQuality(value:Quality){quality=value;engine.setHardwareScalingLevel(value==='low'?Math.max(1,Math.min(canvas.clientWidth/640,canvas.clientHeight/720)):1);shadows.getShadowMap()!.resize(value==='low'?512:currentTime==='day'?4096:2048);glow.isEnabled=value==='high';}
 const startZ=outerGate.z+3;
 const exitZ=innerGate.z+7.2;
 let walkZ:number|null=null;
 let walkEnd=exitZ;
 function approachPose(z:number){
  if(z<=exitZ){gateWalkPose(z);return;}
  const lanterns=Math.exp(-((z+24)**2)/60);
  const pagoda=Math.exp(-((z-6)**2)/25);
  camera.setTarget(new Vector3(-6*pagoda,2.15+2.5*lanterns+.8*pagoda,z+7));
  camera.setPosition(new Vector3(0,1.72,z));
 }
 function gateWalkPose(z:number){
  const glance=Math.exp(-((z-(innerGate.z-2))**2)/13);
  camera.setTarget(new Vector3(-3.85*glance,2.15+3.15*glance,z+5.8-2*glance));
  camera.setPosition(new Vector3(0,1.72,z));
 }
 function cancelGateWalk(){walkZ=null;}
 canvas.addEventListener('pointerdown',cancelGateWalk);
 canvas.addEventListener('wheel',cancelGateWalk);
 canvas.addEventListener('keydown',cancelGateWalk);
 function view(name:string){
  cancelGateWalk();
  walking.mode(name==='walk');
  if(name==='walk')return;
  if(name==='gateEave'){
   camera.fov=.92;camera.fovMode=ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(new Vector3(0,6.15,innerGate.z+6.4));
   camera.setPosition(new Vector3(7.8,3.75,innerGate.z+13));
   return;
  }
  if(name==='templeApproach'||name==='gateWalk'||name==='guardianGallery'){
   camera.fov=1.12;
   camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   if(name==='guardianGallery'){
    camera.setTarget(new Vector3(-3.85,4.3,innerGate.z+2.65));camera.setPosition(new Vector3(.5,1.72,innerGate.z-1.7));
   }else{
    walkEnd=name==='templeApproach'?courtSouthEdge+courtDepth-1:exitZ;
    if(reduced){approachPose(walkEnd);}
    else{walkZ=name==='templeApproach'?outerGate.z-5:startZ;approachPose(walkZ);}
   }
   return;
  }
  if(name==='gateArrival'||name==='gatePassage'||name==='courtWall'){
   camera.fov=name==='gatePassage'&&canvas.clientWidth<canvas.clientHeight?1.42:.94;camera.fovMode=name==='gatePassage'&&canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   if(name==='courtWall'){
    camera.setTarget(new Vector3(-35,1.3,17));camera.setPosition(new Vector3(-13,1.7,11));
   }else{
    camera.setTarget(new Vector3(0,2.7,innerGate.z));
    camera.setPosition(new Vector3(0,1.7,name==='gateArrival'?outerGate.z-11:startZ));
   }
   return;
  }
  if(name==='forest'){
   camera.fov=.9;camera.fovMode=ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(new Vector3(-6,1.8,68));
   camera.setPosition(new Vector3(6,2.3,52));
   return;
  }
  if(name==='entryRowMap'||name==='gateExitOffice'){
   camera.fovMode=ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
  if(name==='entryRowMap'){
    camera.fov=.84;camera.setTarget(new Vector3(0,0,-35));
    camera.alpha=-Math.PI/2;camera.beta=.151;camera.radius=canvas.clientWidth<canvas.clientHeight?118:58;
   }else{
    camera.fov=.98;camera.setTarget(new Vector3(office.x,2.55,office.z+2));
    camera.setPosition(new Vector3(0,1.7,exitZ+1));
   }
   return;
  }
  if(name==='officeReception'||name==='lanternReception'){
   camera.fov=.93;camera.fovMode=ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   if(name==='officeReception'){
    camera.setTarget(turnPoint(new Vector3(office.x,deskFloor+1.31,office.z+.52),office));
    camera.setPosition(turnPoint(new Vector3(office.x+.48,deskFloor+1.56,office.z-2.5),office));
   }else{
    camera.setTarget(new Vector3(-1.9,5.25,-20.8));
    camera.setPosition(new Vector3(-1.9,2.3,-28.3));
   }
   return;
  }
  if(name==='stoneLanterns'){
   camera.fov=.83;
   camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(new Vector3(-3.6,1.65,15.3));
   camera.setPosition(new Vector3(-10,2.2,10.5));
   return;
  }
  if(name==='pagodaCourt'||name==='candleCourt'){
   const pagoda=name==='pagodaCourt';
   camera.fov=.9;
   camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(pagoda?new Vector3(pagodaX,2,(prayerHall.z+pagodaZ)/2):new Vector3(pagodaX,1.45,pagodaZ));
   camera.setPosition(pagoda?new Vector3(pagodaX+31,13,pagodaZ+3):new Vector3(pagodaX+15,8,pagodaZ+3));
   return;
  }
  if(name==='wishGarden'||name==='wishAisle'){
   camera.fov=.87;camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   if(name==='wishAisle'){
    const aisleX=garden.x-rackSpacing/2;
    camera.setTarget(new Vector3(aisleX+.15,1.52,garden.z+2));
    camera.setPosition(new Vector3(aisleX,1.65,garden.z-3.43));
   }else{
    const distance=canvas.clientWidth<canvas.clientHeight?1.5:1;
    camera.setTarget(new Vector3(garden.x,1.3,garden.z));
    camera.setPosition(new Vector3(garden.x-5.8*distance,1.7,garden.z-4.8*distance));
   }
   return;
  }
  if(name==='votiveShelves'||name==='memorialLamps'){
   const votive=name==='votiveShelves',hall=votive?indeungHall:memorialHall;
   camera.fov=.95;
   camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(turnPoint(new Vector3(hall.x+(votive?0:3.55),votive?2.1:2.0,hall.z+1.8),hall));
   camera.setPosition(turnPoint(new Vector3(hall.x+(votive?.55:2.0),2.45,hall.z-(votive?1.95:1.85)),hall));
   return;
  }
  if(name==='officeApproach'||name==='indeungApproach'){
   const site=templePlaces.find(p=>p.id===(name==='officeApproach'?'office':'indeung'))!;
   const side=site.x>0?-1:1;
   camera.fov=.71;
   camera.fovMode=ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(new Vector3(site.x+side*3,2.5,site.z));
   camera.setPosition(new Vector3(site.x+side*13,1.7,site.z-4));
   return;
  }
  if(name==='bellApproach'||name==='bellDetail'){
   const site=templePlaces.find(p=>p.id==='bell')!;
   const close=name==='bellDetail';
   camera.fov=close?.93:.70;
   camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(new Vector3(site.x,close?2.30:2.55,site.z-.28));
   camera.setPosition(close?new Vector3(site.x+5.5,2.17,site.z-1.05):new Vector3(-2,1.72,-47));
   return;
  }
  if(name==='jijangPlaza'||name==='jijangInterior'){
   const inside=name==='jijangInterior';
   camera.fov=inside?.99:.91;
   camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
   camera.setTarget(turnPoint(new Vector3(altarX,inside?baseY+1.05:2.3,altarZ),memorialHall));
   camera.setPosition(turnPoint(new Vector3(altarX+(inside?.82:0),inside?2.55:1.82,memorialHall.z-(inside?2.85:19.5)),memorialHall));
   return;
  }
  camera.fov=name==='plazaCourt'?1.49:.8;
  camera.fovMode=(name==='plazaCourt'||name==='gwaneumDoor'||name==='gwaneumSeats') && canvas.clientWidth<canvas.clientHeight ? ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED : ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
  if(name==='plazaCourt'||name==='gwaneumAltar'||name==='gwaneumDoor'||name==='gwaneumSeats'||name==='plazaHall'||name==='courtHall'||name==='eavesHall'||name==='face'||name==='entrance'||name==='seating'||name==='sanctuary'||name==='shrine'||name==='chime'){
   const frames={plazaCourt:[0,1.8,-20,0,2.85,15],gwaneumAltar:[.5,2.17,-2.55,0,2.24,2.25],gwaneumDoor:[3.2,2.35,-12,0,2.14,2.25],gwaneumSeats:[-5.95,3.55,2.65,.7,1.14,-.45],plazaHall:[-2,1.85,-11,0,5,33],courtHall:[-9,1.9,11,0,4.3,33],eavesHall:[13.2,4.8,22.8,15,7.5,28.4],face:[-.35,5.35,42.4,0,5.34,45.1],entrance:[-2,3.4,21,0,3.8,42.5],seating:[-11.8,5.8,30.3,1,2.6,39.7],sanctuary:[0,3.45,30.25,0,3.48,44.8],shrine:[-1.3,3.75,37.4,0,4.15,45],chime:[14.8,5.7,23.8,16.7,7.08,26.4]};
   const [x,y,z,tx,ty,tz]=frames[name];const toWorld=(px:number,py:number,pz:number)=>name.startsWith('gwaneum')
    ? turnPoint(new Vector3(prayerHall.x+px,py,prayerHall.z+pz),prayerHall)
    : new Vector3(px,py,pz);
   camera.setTarget(toWorld(tx,ty,tz));camera.setPosition(toWorld(x,y,z));return;
  }
  const place=templePlaces.find(p=>p.id===name);if(place){camera.setTarget(new Vector3(place.x,3,place.z));camera.alpha=-Math.PI/2-('yaw' in place?place.yaw:0);camera.beta=1.15;camera.radius=place.kind==='forest'?48:place.scale*(canvas.clientWidth/canvas.clientHeight<.9?42:28);return;}if(name==='map'){camera.setTarget(new Vector3(0,0,-2));camera.alpha=-Math.PI/2;camera.beta=.24;camera.radius=210;return;}if(name==='canopy'){camera.setTarget(new Vector3(0,6,-16));camera.alpha=-Math.PI/2;camera.beta=2.1;camera.radius=9;}else if(name==='front'){camera.setTarget(new Vector3(0,5,32));camera.alpha=-Math.PI/2;camera.beta=1.36;camera.radius=55;}else if(name==='detail'){camera.setTarget(new Vector3(-6,6.6,29));camera.alpha=-2;camera.beta=1.3;camera.radius=12;}else if(name==='lantern'){const p=selectedPosition(selected);camera.setTarget(Vector3.FromArray([...p]).add(new Vector3(0,-.4,0)));camera.alpha=-2.9;camera.beta=1.95;camera.radius=4;}else{camera.setTarget(new Vector3(0,2,-2));camera.alpha=-Math.PI*.58;camera.beta=.65;camera.radius=175;}}
 rebuildLanterns(1000);time('day');
 scene.onBeforeRenderObservable.add(()=>{
  walking.update(engine.getDeltaTime()/1000);
  if(walkZ!==null){
   walkZ=Math.min(walkEnd,walkZ+Math.min(engine.getDeltaTime(),60)*.0021);
   approachPose(walkZ);
   if(walkZ>=walkEnd)cancelGateWalk();
  }
  camera.beta=Math.min(camera.beta,Math.acos(Math.max(-1,Math.min(1,(.6-camera.target.y)/camera.radius))));
  const t=performance.now()*.001,pulse=reduced?1:1+.12*Math.sin(t*1.05);for(const m of [...lanternMaterials,...ownedMaterials]){m.setVector3('eye',camera.position);m.setVector3('sunDirection',sun.direction);m.setColor3('sunTint',sun.diffuse);m.setFloat('sunlight',sun.intensity);m.setFloat('skylight',hemi.intensity);}for(const m of ownedMaterials){m.setFloat('lampOn',currentTime==='night'?1.35:1);m.setFloat('ownedLight',1.35*pulse);}
  for(const m of auraMaterials)m.alpha=(currentTime==='night'?.60:.85)*pulse;
  for(const h of ownerHalos){const scale=Math.min(2.1,Math.max(1,Vector3.Distance(camera.position,h.position)/22));h.scaling.setAll(scale);}
  for(const [index,flame] of offeringFlames.entries()){
   const shimmer=reduced?0:Math.sin(t*(2.1+.12*(index%5))+index*2.4);
   flame.scaling.set(1+.045*shimmer,1+.09*shimmer,1);
  }
  for(const {mesh,center,phase} of sparkles){
   const a=phase+(reduced?0:t*.10);
   mesh.position.set(center.x+Math.cos(a)*.50,center.y+Math.sin(a*1.7)*.43,center.z+Math.sin(a)*.30);
   const distance=Vector3.Distance(camera.position,center);
   const twinkle=reduced?1:.25+1.4*Math.pow((1+Math.sin(t*3.0+phase))/2,4);
   let scale=Math.min(4.5,Math.max(1,distance/12))*twinkle;
   // One LED on the near shoulder stays legible as the paper body recedes.
   if(phase===0 && distance>8){
    const blend=Math.min(1,(distance-8)/12);
    const towardEye=camera.position.subtract(center).normalize();
    const pin=center.add(towardEye.scale(.55));
    pin.y+=.36;
    Vector3.LerpToRef(mesh.position,pin,blend,mesh.position);
    const beat=reduced?.65:Math.pow(.5+.5*Math.cos(t*4.2),3);
    const angularSize=.022+.046*beat;
    scale+=(distance*angularSize/.12-scale)*blend;
   }
   mesh.scaling.setAll(scale);
  }
 });
 view('gatePassage');
 function refreshApplication(id:string){
  const slot=applicationSlots.get(id);if(!slot)return;
  const filled=displayKinds.has(slot.kind)&&occupancy!=='current'?occupancy==='full':reviewSlots.has(id)?!!reviewSlots.get(id)!.installationId:!!readApplication(id);
  for(const mesh of slot.parts)mesh.setEnabled(filled);
  slot.mark.setEnabled(!filled);
  if(slot.kind==='lantern')rebuildLanterns(density);
  if(slot.kind==='plaque')writeWish(id);
 }
 function showOccupancy(value:'current'|'empty'|'full'){
  occupancy=value;
  for(const mesh of displayBatches)mesh.setEnabled(value!=='empty');
  for(const [id,slot] of applicationSlots)if(displayKinds.has(slot.kind))refreshApplication(id);
 }
 return {showOccupancy,get visitorPose(){return walking.pose;},applyReviewSlots,reviewSlots,applicationSlots,refreshApplication,onSlotClick:(callback:(id:string)=>void)=>{onSlotClick=callback;},engine,scene,camera,time,setQuality,view,setSelected,rebuildLanterns,setName,setReduced:(v:boolean)=>{reduced=v;},get settings(){return {visitor:walking.position,time:currentTime,quality,density,canopyCapacity,visibleLanternCount:installedLanterns,nameTagCount:tagTextures.size,selected,reduced,owned:OWNED_INDICES,renderWidth:engine.getRenderWidth(),renderHeight:engine.getRenderHeight()};}};
}
