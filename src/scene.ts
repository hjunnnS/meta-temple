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
import { lanternSlots, visibleLanternSlots, OWNED_INDICES, LANTERN_PALETTE, lanternColourIndex, normalizeLanternName } from './contracts.ts';
export type TimeOfDay = 'day' | 'dusk' | 'night';
export type Quality = 'high' | 'low';
export function createTemple(canvas:HTMLCanvasElement) {
 const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},false);
 const scene=new Scene(engine); scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=1;scene.imageProcessingConfiguration.exposure=1.3;scene.imageProcessingConfiguration.contrast=1.12; scene.clearColor=new Color4(.64,.7,.68,1);
 scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.0025;scene.fogColor=new Color3(.64,.7,.68);
 const skyTexture=new DynamicTexture('sunlit-sky',{width:2048,height:1024},scene,false);
 const skyMaterial=new StandardMaterial('sky-gradient',scene);skyMaterial.disableLighting=true;skyMaterial.emissiveTexture=skyTexture;skyMaterial.diffuseColor=Color3.Black();skyMaterial.fogEnabled=false;skyMaterial.imageProcessingConfiguration=new ImageProcessingConfiguration();
 const skyDome=MeshBuilder.CreateSphere('open-sky',{diameter:300,segments:32,sideOrientation:Mesh.BACKSIDE},scene);skyDome.material=skyMaterial;skyDome.infiniteDistance=true;skyDome.isPickable=false;
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
 camera.lowerRadiusLimit=2.5;camera.upperRadiusLimit=65;camera.upperBetaLimit=2.15;camera.lowerBetaLimit=.15;
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
 const ground=MeshBuilder.CreateGround('earth',{width:160,height:160},scene);ground.material=groundMat;ground.receiveShadows=true;
 box('court',32,.15,44,0,-.03,-3,stoneDark,false);
 // Stone joints are geometry, using the same small palette and merged after creation.
 for(let iz=0;iz<26;iz++)for(let ix=0;ix<9;ix++)box('paving',1.7,.1,1.45,(ix-4)*1.77,.08,-21+iz*1.53,stone,false);
 for(let s=0;s<3;s++)box('plinth',21-s*.8,.35,12-s*.7,0,.25+s*.35,8,stone);
 for(let s=0;s<5;s++)box('step',6,.2,1.1,0,.12+s*.2,1.1+s*.5,stone);
 box('hall-floor',19,.24,9,0,1.25,8,wood);
 box('back-wall',19,3.6,.25,0,3.15,12.3,wood);
 for(const x of [-9,-6,-3,0,3,6,9])for(const z of [3.8,12.2]){
  cylinder('column-base',.78,.35,new Vector3(x,1.45,z),stone);
  cylinder('column',.48,3.9,new Vector3(x,3.45,z),wood);
  for(let l=0;l<3;l++){box('bracket',1.1+l*.32,.2,.6,x,5.2+l*.25,z,jade);box('bracket-red',.32,.18,1.2+l*.3,x,5.3+l*.25,z,red);}
 }
 // Warm paper doors with a geometric timber lattice.
 for(let bay=0;bay<6;bay++){
  const x=-7.5+bay*3;box('door-frame',2.82,3.04,.25,x,3,4.02,wood);box('paper-door',2.65,2.8,.12,x,3,3.85,paper);
  for(let i=0;i<7;i++)box('door-vertical',.045,2.8,.04,x-1.25+i*.415,3,3.74,wood,false);
  for(let i=0;i<9;i++)box('door-horizontal',2.65,.045,.04,x,1.65+i*.34,3.73,wood,false);
 }
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
 const signTexture=new DynamicTexture('sign',{width:512,height:192},scene,false);const sc=signTexture.getContext() as CanvasRenderingContext2D;sc.fillStyle='#202c29';sc.fillRect(0,0,512,192);sc.strokeStyle='#bb9b60';sc.lineWidth=8;sc.strokeRect(10,10,492,172);sc.fillStyle='#ddc592';sc.font='bold 100px serif';sc.textAlign='center';sc.fillText('大雄殿',256,133);signTexture.update();const signMat=mat('sign-material','#ffffff');signMat.diffuseTexture=signTexture;box('hall-sign',3.4,1.25,.18,0,5.2,3.35,signMat);
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
 // Warm architectural light pools, deliberately bounded to a handful of lights.
 for(const x of [-7.5,0,7.5]){const light=new PointLight('hall-warm-light',new Vector3(x,3.5,2.7),scene);light.diffuse=Color3.FromHexString('#ffaf43');light.intensity=.12;light.range=8;}
 // Low walls and trees frame the sample, rather than a whole production map.
 for(const x of [-17,17]){box('wall',.5,1.7,37,x,.85,-4,masonry);box('wall-cap',.8,.16,37,x,1.78,-4,roofMat);}
 let seed=42;function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
 for(let i=0;i<65;i++){const side=i%2?1:-1;const x=side*(20+rand()*30),z=-35+rand()*80,h=6+rand()*8;
 cylinder('tree-trunk',.4,h*.7,new Vector3(x,h*.35,z),trunk);
 for(let level=0;level<5;level++)for(let branch=0;branch<7;branch++){
  const angle=branch*Math.PI*2/7+level*1.1;const spread=(1-level*.12)*2;
  const a=MeshBuilder.CreateSphere('pine-foliage',{diameter:1.8+rand()*.8,segments:6},scene);a.scaling.set(1,.45+rand()*.3,.8);a.position.set(x+Math.cos(angle)*spread,h*.5+level*h*.11+rand()*.8,z+Math.sin(angle)*spread);a.material=leaves;staticMeshes.push(a);
 }
 }
 for(const side of [-1,1])for(let i=0;i<18;i++){
  const rock=MeshBuilder.CreateSphere('garden-granite',{diameter:1,segments:5},scene);rock.position.set(side*(17.8+rand()*3),.3,-20+i*2);rock.scaling.set(1+rand(),.5+rand()*.6,1+rand());rock.material=stoneDark;staticMeshes.push(rock);
  const shrub=MeshBuilder.CreateSphere('garden-shrub',{diameter:1.8,segments:8},scene);shrub.position.set(side*(18+rand()*2),.65,-20+i*2);shrub.scaling.y=.65;shrub.material=leaves;staticMeshes.push(shrub);
 }
 // Merge static geometry by material. Shadow lists are rebuilt to avoid disposed casters.
 const grouped=new Map<StandardMaterial,Mesh[]>();for(const a of staticMeshes){const m=a.material as StandardMaterial;if(!grouped.has(m))grouped.set(m,[]);grouped.get(m)!.push(a);}
 shadows.getShadowMap()!.renderList=[];
 for(const [m,list] of grouped){const merged=Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.name=`architecture-${m.name}`;merged.receiveShadows=true;shadows.addShadowCaster(merged);merged.freezeWorldMatrix();}}
 const palette=LANTERN_PALETTE;
 const hanjiTexture=new Texture('/textures/hanji-fibres-generated-v1.png',scene);
 // Three shape-specific UV mappings share the approved optical model and five dyes.
 const lanternMaterials=Array.from({length:15},(_,i)=>createHanjiMaterial(scene,`hanji-${i}`,palette[Math.floor(i/3)],i%3===2?1:8,undefined,hanjiTexture));
 const ownedMaterials=Array.from({length:15},(_,i)=>createHanjiMaterial(scene,`owned-hanji-${i}`,palette[Math.floor(i/3)],i%3===2?1:8,undefined,hanjiTexture));
 const haloMat=mat('ownership-light','#ffcb65',1.2);haloMat.disableLighting=true;
 const bulbMat=mat('warm-pin-lights','#e8bb74',.4);bulbMat.disableLighting=true;
 const bamboo=mat('fine-bamboo-frame','#9a6844');bamboo.specularColor=Color3.Black();
 const names=new Map<number,string>([[23,'이름']]);const tagTextures=new Map<number,DynamicTexture>();
 function drawTag(texture:DynamicTexture,name:string){
  const c=texture.getContext() as CanvasRenderingContext2D;c.fillStyle='#fff9e8';c.fillRect(0,0,160,640);c.strokeStyle='#b84438';c.lineWidth=3;c.strokeRect(10,10,140,620);c.fillStyle='#ad4536';c.font='20px serif';c.textAlign='center';c.fillText('발 원',80,53);
  const chars=Array.from(name||'이름');const size=Math.min(55,420/Math.max(1,chars.length));c.fillStyle='#352c25';c.font=`${size}px serif`;chars.forEach((ch,i)=>c.fillText(ch,80,130+i*(size+5)));c.font='20px serif';c.fillStyle='#8a7764';c.fillText('사 사',80,604);texture.update();
 }
 function setName(value:string){const name=normalizeLanternName(value);if(name)names.set(selected,name);else names.delete(selected);rebuildLanterns(density);return name;}
 let lanternRoot=new TransformNode('lantern-samples',scene),selected=23,density=300;
 let ownerBodies:Mesh[]=[];let ownerHalos:Mesh[]=[];let sparkles:{mesh:Mesh,center:Vector3,phase:number}[]=[];let marker:Mesh|null=null;
 function rebuildLanterns(count:number){
  for(const mesh of lanternRoot.getChildMeshes())glow.removeIncludedOnlyMesh(mesh as Mesh);
  for(const mesh of lanternRoot.getChildMeshes())if(mesh.name.startsWith('owned-tag'))mesh.material?.dispose(false,true);tagTextures.clear();
  lanternRoot.dispose(false);lanternRoot=new TransformNode('lantern-samples',scene);ownerBodies=[];ownerHalos=[];sparkles=[];density=count;
  const slots=visibleLanternSlots(count),buckets=Array.from({length:15},()=>[] as Matrix[]);
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
   return Mesh.MergeMeshes(parts,true,true)!;
  }
  for(const s of slots){const i=Number(s.id.split(':').at(-1));
   const p=Vector3.FromArray([...s.position]);const isOwn=(OWNED_INDICES as readonly number[]).includes(i);const type=i%3;
   if(isOwn){const a=body(`owned-${i}`,type);a.position=p;a.material=ownedMaterials[lanternColourIndex(s.position)*3+type];a.parent=lanternRoot;ownerBodies.push(a);}else buckets[lanternColourIndex(s.position)*3+type].push(Matrix.Translation(p.x,p.y,p.z));
  }
  buckets.forEach((matrices,i)=>{if(!matrices.length)return;const a=body(`lantern-${['round','octagonal','lotus'][i%3]}-${i}`,i%3);a.material=lanternMaterials[i];a.parent=lanternRoot;a.thinInstanceAdd(matrices);});
  for(const owned of ownerBodies){
   const ring=MeshBuilder.CreateTorus('owner-halo',{diameter:1.15,thickness:.012,tessellation:64},scene);ring.rotation.x=Math.PI/2;ring.bakeCurrentTransformIntoVertices();ring.position=owned.position.clone();ring.material=haloMat;ring.parent=lanternRoot;ring.billboardMode=Mesh.BILLBOARDMODE_ALL;ownerHalos.push(ring);glow.addIncludedOnlyMesh(ring);
   for(let k=0;k<9;k++){const a=MeshBuilder.CreateSphere('owner-sparkle',{diameter:.035,segments:6},scene);a.material=haloMat;a.parent=lanternRoot;glow.addIncludedOnlyMesh(a);sparkles.push({mesh:a,center:owned.position.clone(),phase:k*Math.PI*2/9});}
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
  for(const x of new Set(slots.map(s=>s.position[0]))){const path=slots.filter(s=>s.position[0]===x).sort((a,b)=>a.position[2]-b.position[2]).map(s=>new Vector3(x,s.position[1]+.9,s.position[2]));const line=MeshBuilder.CreateLines('longitudinal-canopy-string',{points:path},scene);line.color=new Color3(.16,.14,.11);line.parent=lanternRoot;}
  for(const s of slots){const p=Vector3.FromArray([...s.position]);const line=MeshBuilder.CreateLines('suspension',{points:[p.add(new Vector3(0,.43,0)),p.add(new Vector3(0,.9,0))]},scene);line.color=new Color3(.25,.2,.12);line.parent=lanternRoot;}

  marker=MeshBuilder.CreateTorus('destination-marker',{diameter:1.05,thickness:.035,tessellation:32},scene);marker.material=haloMat;marker.parent=lanternRoot;setSelected(selected);
 }
 function setSelected(index:number){selected=index;if(marker){const p=lanternSlots(1000)[index].position;marker.position.set(p[0],p[1]-.65,p[2]);}}
 let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let currentTime:TimeOfDay='day';let quality:Quality='high';
 function time(value:TimeOfDay){currentTime=value;paintSky(value);for(const m of [...lanternMaterials,...ownedMaterials])m.setFloat('night',value==='night'?1:value==='dusk'?.45:0);const skies={day:'#a6dbfa',dusk:'#354865',night:'#080f24'};const c=Color3.FromHexString(skies[value]);scene.clearColor=new Color4(c.r,c.g,c.b,1);scene.fogColor=c;hemi.intensity=value==='night'?.35:value==='dusk'?.95:1.1;hemi.diffuse=Color3.FromHexString('#e4f2ff');sun.intensity=value==='day'?1.4:value==='dusk'?1.1:.25;sun.diffuse=Color3.FromHexString(value==='day'?'#fff3db':value==='dusk'?'#ffc17b':'#c1d5ec');sun.direction=new Vector3(-.65,value==='day'?-.95:-.5,.45);glow.intensity=value==='night'?.65:value==='dusk'?.5:.4;paper.emissiveColor=paper.diffuseColor.scale(value==='night'?.08:value==='dusk'?.025:0);}
 function setQuality(value:Quality){quality=value;engine.setHardwareScalingLevel(value==='low'?Math.max(1,Math.min(canvas.clientWidth/640,canvas.clientHeight/720)):1);shadows.getShadowMap()!.resize(value==='low'?512:2048);glow.isEnabled=value==='high';}
 function view(name:string){if(name==='canopy'){camera.setTarget(new Vector3(0,6,-16));camera.alpha=-Math.PI/2;camera.beta=2.1;camera.radius=9;}else if(name==='front'){camera.setTarget(new Vector3(0,4,4));camera.alpha=-Math.PI/2;camera.beta=1.36;camera.radius=38;}else if(name==='detail'){camera.setTarget(new Vector3(-4,5.5,4));camera.alpha=-2;camera.beta=1.3;camera.radius=12;}else if(name==='lantern'){const p=lanternSlots(1000)[selected].position;camera.setTarget(Vector3.FromArray([...p]).add(new Vector3(0,-.4,0)));camera.alpha=-2.9;camera.beta=1.95;camera.radius=4;}else{camera.setTarget(new Vector3(0,3,2));camera.alpha=-Math.PI*.67;camera.beta=Math.PI*.37;camera.radius=36;}}
 rebuildLanterns(300);time('day');
 scene.onBeforeRenderObservable.add(()=>{
  camera.beta=Math.min(camera.beta,Math.acos(Math.max(-1,Math.min(1,(.6-camera.target.y)/camera.radius))));
  const t=performance.now()*.001,pulse=reduced?1:1+.18*Math.sin(t*2);for(const m of [...lanternMaterials,...ownedMaterials]){m.setVector3('eye',camera.position);m.setVector3('sunDirection',sun.direction);m.setColor3('sunTint',sun.diffuse);m.setFloat('sunlight',sun.intensity);m.setFloat('skylight',hemi.intensity);}for(const m of ownedMaterials)m.setFloat('lampOn',1.18*pulse);
  haloMat.emissiveColor=Color3.FromHexString('#ffcb65').scale(1.1*pulse);
  for(const h of ownerHalos){const scale=Math.min(1.8,Math.max(1,Vector3.Distance(camera.position,h.position)/18));h.scaling.setAll(scale);}
  for(const {mesh,center,phase} of sparkles){const a=phase+(reduced?0:t*.23);mesh.position.set(center.x+Math.cos(a)*.65,center.y+Math.sin(a*1.7)*.55,center.z+Math.sin(a)*.3);mesh.scaling.setAll(reduced?1:.4+.9*Math.pow(Math.sin(t*2+phase),2));}
 });
 return {engine,scene,camera,time,setQuality,view,setSelected,rebuildLanterns,setName,setReduced:(v:boolean)=>{reduced=v;},get settings(){return {time:currentTime,quality,density,visibleLanternCount:visibleLanternSlots(density).length,nameTagCount:tagTextures.size,selected,reduced,owned:OWNED_INDICES,renderWidth:engine.getRenderWidth(),renderHeight:engine.getRenderHeight()};}};
}
