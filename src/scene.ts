import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Matrix, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { lanternSlots, OWNED_INDICES } from './contracts.ts';
export type TimeOfDay = 'day' | 'dusk' | 'night';
export type Quality = 'high' | 'low';
export function createTemple(canvas:HTMLCanvasElement) {
 const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},false);
 const scene=new Scene(engine); scene.clearColor=new Color4(.64,.7,.68,1);
 scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.013;scene.fogColor=new Color3(.64,.7,.68);
 const camera=new ArcRotateCamera('camera',-Math.PI*.67,Math.PI*.37,36,new Vector3(0,3,2),scene);
 camera.lowerRadiusLimit=5;camera.upperRadiusLimit=65;camera.upperBetaLimit=Math.PI*.49;camera.lowerBetaLimit=.15;
 camera.minZ=.1;camera.wheelPrecision=18;camera.panningSensibility=70;camera.attachControl(canvas,true);
 const hemi=new HemisphericLight('sky',new Vector3(0,1,0),scene);hemi.intensity=.8;hemi.groundColor=new Color3(.22,.27,.24);
 const sun=new DirectionalLight('sun',new Vector3(-.45,-.85,.45),scene);sun.position=new Vector3(20,35,-20);sun.intensity=1.6;
 const shadows=new ShadowGenerator(1024,sun);shadows.usePercentageCloserFiltering=true;shadows.bias=.002;shadows.normalBias=.035;
 const glow=new GlowLayer('lantern-glow',scene,{mainTextureFixedSize:512,blurKernelSize:32});glow.intensity=.35;
 const colors:Record<string,StandardMaterial>={};
 function mat(name:string,hex:string,emissive=0){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.06,.06,.06);m.emissiveColor=m.diffuseColor.scale(emissive);colors[name]=m;return m;}
 const stone=mat('stone','#9a9b90'),stoneDark=mat('dark-stone','#626b63'),wood=mat('aged-redwood','#713c2b'),roofMat=mat('roof','#34494a'),roofEdge=mat('ridge','#536565'),jade=mat('jade','#356e62'),red=mat('red','#984d35'),ochre=mat('gold','#c8a76d'),paper=mat('paper','#c4bb96',.1),leaves=mat('leaves','#344e3f'),trunk=mat('trunk','#555245'),groundMat=mat('earth','#66715c');
 const staticMeshes:Mesh[]=[];
 function box(name:string,w:number,h:number,d:number,x:number,y:number,z:number,m:StandardMaterial,shadow=true){const a=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);a.position.set(x,y,z);a.material=m;a.receiveShadows=true;staticMeshes.push(a);if(shadow)shadows.addShadowCaster(a);return a;}
 function cylinder(name:string,diameter:number,height:number,pos:Vector3,m:StandardMaterial){const a=MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:12},scene);a.position=pos;a.material=m;staticMeshes.push(a);shadows.addShadowCaster(a);return a;}
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
  const x=-7.5+bay*3;box('paper-door',2.65,2.8,.12,x,3,4,paper);
  for(let i=0;i<7;i++)box('door-vertical',.045,2.8,.04,x-1.25+i*.415,3,3.9,wood,false);
  for(let i=0;i<9;i++)box('door-horizontal',2.65,.045,.04,x,1.65+i*.34,3.87,wood,false);
 }
 const texture=new DynamicTexture('original-dancheong',{width:1024,height:128},scene,false);
 const ctx=texture.getContext() as CanvasRenderingContext2D;ctx.fillStyle='#315d53';ctx.fillRect(0,0,1024,128);
 for(let y=0;y<3;y++){ctx.fillStyle=['#c9ac71','#9b4b38','#203f3b'][y];ctx.fillRect(0,y*9,1024,5);ctx.fillRect(0,123-y*9,1024,5);}
 for(let x=32;x<1024;x+=64){for(let p=0;p<8;p++){const angle=p*Math.PI/4;ctx.beginPath();ctx.fillStyle=p%2?'#bd704e':'#d6c18b';ctx.ellipse(x+Math.cos(angle)*17,64+Math.sin(angle)*17,11,5,angle,0,Math.PI*2);ctx.fill();}ctx.beginPath();ctx.fillStyle='#477d82';ctx.arc(x,64,9,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle='#eddfad';ctx.arc(x,64,4,0,Math.PI*2);ctx.fill();}
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
 // Low walls and trees frame the sample, rather than a whole production map.
 for(const x of [-17,17]){box('wall',.5,1.7,37,x,.85,-4,stoneDark);box('wall-cap',.8,.16,37,x,1.78,-4,roofMat);}
 let seed=42;function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
 for(let i=0;i<65;i++){const side=i%2?1:-1;const x=side*(20+rand()*30),z=-35+rand()*80,h=6+rand()*8;
 cylinder('tree-trunk',.4,h*.7,new Vector3(x,h*.35,z),trunk);
 for(let level=0;level<3;level++){const a=MeshBuilder.CreateCylinder('pine',{diameterTop:0,diameterBottom:4.8-level*.9,height:h*.48,tessellation:9},scene);a.position.set(x,h*.5+level*h*.17,z);a.material=leaves;staticMeshes.push(a);}
 }
 // Merge static geometry by material. Shadow lists are rebuilt to avoid disposed casters.
 const grouped=new Map<StandardMaterial,Mesh[]>();for(const a of staticMeshes){const m=a.material as StandardMaterial;if(!grouped.has(m))grouped.set(m,[]);grouped.get(m)!.push(a);}
 shadows.getShadowMap()!.renderList=[];
 for(const [m,list] of grouped){const merged=Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.name=`architecture-${m.name}`;merged.receiveShadows=true;shadows.addShadowCaster(merged);merged.freezeWorldMatrix();}}
 const palette=['#d69b72','#d2b66b','#8bafb0','#bd7770','#a6ad7a'];
 const lanternMaterials=palette.map((c,i)=>mat(`paper-lantern-${i}`,c,.32));
 const ownedMat=mat('my-lantern','#ffd18a',.7);
 const lanternTexture=new DynamicTexture('original-lantern-paper',{width:256,height:128},scene,false);
 const lc=lanternTexture.getContext() as CanvasRenderingContext2D;lc.fillStyle='#fff8df';lc.fillRect(0,0,256,128);
 lc.strokeStyle='#c2b69b';lc.lineWidth=.6;for(let x=0;x<256;x+=16){lc.beginPath();lc.moveTo(x,0);lc.lineTo(x,128);lc.stroke();}
 for(let x=32;x<256;x+=64){lc.strokeStyle='#aa9a7e';lc.lineWidth=1.2;for(let k=0;k<5;k++){lc.beginPath();lc.ellipse(x+(k-2)*4,76-Math.abs(k-2)*2,5,13,(k-2)*.32,0,Math.PI*2);lc.stroke();}}
 lanternTexture.update();for(const m of [...lanternMaterials,ownedMat]){m.diffuseTexture=lanternTexture;}

 let lanternRoot=new TransformNode('lantern-samples',scene),selected=23,density=100;
 let ownerBodies:Mesh[]=[];let marker:Mesh|null=null;
 function rebuildLanterns(count:number){
  lanternRoot.dispose(false);lanternRoot=new TransformNode('lantern-samples',scene);ownerBodies=[];density=count;
  const slots=lanternSlots(count),buckets=Array.from({length:5},()=>[] as Matrix[]);
  for(const [i,s] of slots.entries()){
   const p=Vector3.FromArray([...s.position]);const isOwn=(OWNED_INDICES as readonly number[]).includes(i);
   if(isOwn){const a=MeshBuilder.CreateSphere(`owned-${i}`,{diameter:.72,segments:12},scene);a.scaling.y=1.15;a.position=p;a.material=ownedMat;a.parent=lanternRoot;ownerBodies.push(a);}else buckets[i%5].push(Matrix.Compose(new Vector3(1,1.15,1),Quaternion.Identity(),p));
  }
  // Matrix.Translation + scale avoids per-lantern scene objects.
  buckets.forEach((matrices,i)=>{if(!matrices.length)return;const a=MeshBuilder.CreateSphere(`lantern-group-${i}`,{diameter:.72,segments:12},scene);a.material=lanternMaterials[i];a.parent=lanternRoot;a.thinInstanceAdd(matrices);});
  const all=slots.map(s=>Matrix.Translation(s.position[0],s.position[1]-.43,s.position[2]));
  const cap=MeshBuilder.CreateCylinder('caps',{height:.12,diameter:.26,tessellation:8},scene);cap.material=ochre;cap.parent=lanternRoot;cap.thinInstanceAdd(all);
  const top=cap.clone('tops')!;top.parent=lanternRoot;top.thinInstanceSetBuffer('matrix',null);top.thinInstanceAdd(slots.map(s=>Matrix.Translation(s.position[0],s.position[1]+.43,s.position[2])));
  for(const z of new Set(slots.map(s=>s.position[2]))){const path=Array.from({length:33},(_,c)=>new Vector3((c-16)*.9,6.25-.45*(1-Math.abs(c-16)/16),z));const line=MeshBuilder.CreateLines('canopy-string',{points:path},scene);line.color=new Color3(.23,.25,.2);line.parent=lanternRoot;}
  marker=MeshBuilder.CreateTorus('destination-marker',{diameter:1.05,thickness:.035,tessellation:32},scene);marker.material=ownedMat;marker.parent=lanternRoot;setSelected(selected);
 }
 function setSelected(index:number){selected=index;if(marker){const p=lanternSlots(1000)[index].position;marker.position.set(p[0],p[1]-.65,p[2]);}}
 let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let currentTime:TimeOfDay='dusk';let quality:Quality='high';
 function time(value:TimeOfDay){currentTime=value;const skies={day:'#acbdbb',dusk:'#9eada6',night:'#142a35'};const c=Color3.FromHexString(skies[value]);scene.clearColor=new Color4(c.r,c.g,c.b,1);scene.fogColor=c;hemi.intensity=value==='night'?.3:.85;sun.intensity=value==='day'?1.8:value==='dusk'?1.1:.18;sun.diffuse=Color3.FromHexString(value==='day'?'#fff3db':value==='dusk'?'#ffd6a2':'#c1d5ec');sun.direction=new Vector3(-.65,value==='day'?-.95:-.5,.45);glow.intensity=value==='night'?.6:.25;paper.emissiveColor=paper.diffuseColor.scale(value==='night'?.35:.08);}
 function setQuality(value:Quality){quality=value;engine.setHardwareScalingLevel(value==='low'?Math.max(1,Math.min(canvas.clientWidth/640,canvas.clientHeight/720)):1);shadows.getShadowMap()!.resize(value==='low'?512:1024);glow.isEnabled=value==='high';}
 function view(name:string){if(name==='front'){camera.setTarget(new Vector3(0,3.5,6));camera.alpha=-Math.PI/2;camera.beta=1.28;camera.radius=30;}else if(name==='detail'){camera.setTarget(new Vector3(-4,5.5,4));camera.alpha=-2;camera.beta=1.3;camera.radius=12;}else if(name==='lantern'){const p=lanternSlots(1000)[selected].position;camera.setTarget(Vector3.FromArray([...p]));camera.alpha=-Math.PI*.65;camera.beta=2.0;camera.radius=7;}else{camera.setTarget(new Vector3(0,3,2));camera.alpha=-Math.PI*.67;camera.beta=Math.PI*.37;camera.radius=36;}}
 rebuildLanterns(100);time('dusk');
 scene.onBeforeRenderObservable.add(()=>{const pulse=reduced?1:1+.12*Math.sin(performance.now()*.002);ownedMat.emissiveColor=Color3.FromHexString('#ffd18a').scale(.7*pulse);});
 return {engine,scene,camera,time,setQuality,view,setSelected,rebuildLanterns,setReduced:(v:boolean)=>{reduced=v;},get settings(){return {time:currentTime,quality,density,selected,reduced,owned:OWNED_INDICES,renderWidth:engine.getRenderWidth(),renderHeight:engine.getRenderHeight()};}};
}
