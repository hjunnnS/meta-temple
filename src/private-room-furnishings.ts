import type {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Texture} from '@babylonjs/core/Materials/Textures/texture';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';

export function furnishPrivateRetreat(scene:Scene){
 const parts:Mesh[]=[];
 function mat(name:string,colour:string){const m=new StandardMaterial('retreat-'+name,scene);m.diffuseColor=Color3.FromHexString(colour);m.specularColor=new Color3(.025,.025,.02);return m;}
 const timber=mat('cedar','#c9b697'),dark=mat('dark-wood','#665541'),plaster=mat('plaster','#ece3cc'),jade=mat('jade','#566f5e'),gold=mat('brass','#b5a16d'),linen=mat('linen','#b5a18a'),stone=mat('garden-stone','#a4a494'),earth=mat('garden-earth','#b1b99e'),leaf=mat('leaf','#688260'),flower=mat('flower','#cba6b0'),white=mat('ceramic','#ede4ce');
 const woodTexture=new Texture('/textures/wood_planks_dirt_diff_1k.jpg',scene);woodTexture.uScale=2;woodTexture.vScale=3;timber.diffuseTexture=woodTexture;
 const soilTexture=new DynamicTexture('retreat-moss-soil',128,scene,true),soilBrush=soilTexture.getContext() as CanvasRenderingContext2D;
 soilBrush.fillStyle='#697857';soilBrush.fillRect(0,0,128,128);let seed=94;
 for(let i=0;i<3500;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%128,y=(seed>>>8)%128;soilBrush.fillStyle=i%2?'#c2bb9133':'#243a2d33';soilBrush.fillRect(x,y,1+(i%2),1);}
 soilTexture.update();soilTexture.uScale=5;soilTexture.vScale=6;earth.diffuseTexture=soilTexture;
 const rockTexture=new Texture('/textures/stone_wall_diff_1k.jpg',scene);rockTexture.uScale=rockTexture.vScale=2;stone.diffuseTexture=rockTexture;
 function finish(mesh:Mesh,m:StandardMaterial,x:number,y:number,z:number){mesh.material=m;mesh.position.set(x,y,z);mesh.receiveShadows=true;parts.push(mesh);return mesh;}
 const box=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,m:StandardMaterial)=>finish(MeshBuilder.CreateBox('retreat-'+name,{width:w,height:h,depth:d},scene),m,x,y,z);
 const oval=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,m:StandardMaterial)=>{const mesh=finish(MeshBuilder.CreateSphere('retreat-'+name,{diameter:1,segments:10},scene),m,x,y,z);mesh.scaling.set(w,h,d);return mesh;};
 function label(text:string,x:number,y:number,z:number,yaw=0,w=1.8,h=.4){
  const tex=new DynamicTexture('retreat-label-'+text,{width:512,height:128},scene,true),c=tex.getContext() as CanvasRenderingContext2D;
  c.fillStyle='#354b3c';c.fillRect(0,0,512,128);c.strokeStyle='#bca77b';c.lineWidth=8;c.strokeRect(8,8,496,112);c.fillStyle='#eee2bd';c.font='bold 48px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,65,475);tex.update();
  const m=mat('label-'+text,'#ffffff');m.diffuseTexture=tex;const sign=finish(MeshBuilder.CreatePlane('retreat-label',{width:w,height:h,sideOrientation:Mesh.DOUBLESIDE},scene),m,x,y,z);sign.rotation.y=yaw;
 }
 box('floor',12,.12,16,0,.06,0,timber);box('garden-ground',12,.12,14,12,.04,2,earth);
 box('back-wall',12,4.5,.20,0,2.25,8,plaster);box('left-wall',.20,4.5,16,-6,2.25,0,plaster);
 box('right-front-wall',.20,4.5,6.4,6,2.25,-4.8,plaster);box('right-rear-wall',.20,4.5,1.2,6,2.25,7.4,plaster);
 box('open-window-header',.20,.95,8.4,6,4.025,2.6,dark);
 for(const x of [-3.65,3.65])box('front-wall',4.7,4.5,.20,x,2.25,-8,plaster);
 for(const x of [-1.35,1.35])box('return-door-post',.18,3,.24,x,1.5,-7.9,dark);
 box('return-door-lintel',2.9,.18,.24,0,3,-7.9,dark);label('사찰로 돌아가기',0,3.45,-7.85,Math.PI,2.2,.55);
 for(const x of [-5.85,0,5.85])box('ceiling-beam',.16,.28,16,x,4.32,0,dark);
 for(const z of [-7.8,-3.8,.4,4.2,7.8])box('crossbeam',12,.32,.18,0,4.3,z,dark);
 box('ceiling',12,.08,16,0,4.5,0,plaster);
 for(const z of [-7.8,-3.8,.4,4.2,7.8])box('left-column',.22,4.3,.22,-5.84,2.15,z,dark);
 for(const z of [-1.6,2.6,6.8])box('garden-window-column',.20,3.6,.20,5.92,1.8,z,dark);
 // Modest shrine and a broad cloth practice mat keep a clear central approach.
 box('altar-base',3.45,.48,1.15,0,.36,6.8,dark);box('altar-brass-edge',3.58,.055,1.22,0,.625,6.8,gold);box('altar-top',3.5,.07,1.18,0,.68,6.8,timber);
 for(const x of [-1.05,0,1.05])box('altar-carved-panel',.85,.25,.035,x,.36,6.21,jade);
 box('backdrop',3.3,2.45,.07,0,2.15,7.83,jade);box('backdrop-cap',3.5,.10,.16,0,3.4,7.78,dark);
 const halo=finish(MeshBuilder.CreateTorus('retreat-lotus-halo',{diameter:1.4,thickness:.035,tessellation:48},scene),gold,0,2.3,7.74);halo.rotation.x=Math.PI/2;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const petal=oval('lotus-relief',.2,.5,.06,Math.sin(a)*.29,2.3+Math.cos(a)*.29,7.70,gold);petal.rotation.z=-a;}
 for(const x of [-1.1,1.1]){
  finish(MeshBuilder.CreateCylinder('retreat-candle-holder',{diameter:.16,height:.15,tessellation:16},scene),gold,x,.80,6.6);
  finish(MeshBuilder.CreateCylinder('retreat-candle',{diameter:.07,height:.24,tessellation:12},scene),white,x,.98,6.6);
  const flame=mat('flame-'+x,'#ffca74');flame.emissiveColor=Color3.FromHexString('#ffbc61');oval('flame',.035,.075,.035,x,1.135,6.6,flame);
 }
 for(const x of [-1.95,1.95]){oval('flower-vase',.28,.43,.28,x,.36,6.85,white);for(let i=0;i<5;i++)oval('flower',.15,.14,.15,x+Math.sin(i*2.1)*.18,.75+i*.035,6.85+Math.cos(i*2.1)*.12,flower);}
 const weave=new DynamicTexture('retreat-linen-weave',128,scene,true),wc=weave.getContext() as CanvasRenderingContext2D;wc.fillStyle='#cfbfa5';wc.fillRect(0,0,128,128);wc.strokeStyle='#8e80622e';wc.lineWidth=1;for(let i=0;i<128;i+=3){wc.beginPath();wc.moveTo(i,0);wc.lineTo(i,128);wc.moveTo(0,i);wc.lineTo(128,i);wc.stroke();}weave.update();weave.uScale=3;weave.vScale=4;linen.diffuseTexture=weave;
 box('practice-mat',1.55,.055,2.5,0,.15,3.1,linen);box('meditation-cushion',.84,.11,.82,0,.22,4.55,linen);
 // Empty display fittings: purchased items are not fabricated or published here.
 for(const z of [-1.85,1.8]){
  box('display-back',.10,2.45,3.2,-5.72,1.38,z,dark);
  for(const y of [.48,1.28,2.10])box('display-shelf',1.05,.10,3.2,-5.2,y,z,timber);
  for(const dz of [-1.57,1.57])box('display-post',.14,2.5,.14,-5.25,1.37,z+dz,dark);
 }
 label('연등 · 인등 · 추모등',-5.62,2.85,0,-Math.PI/2,2.15,.4);
 box('wish-display-back',.10,2.45,3.3,5.72,1.38,-4.65,dark);
 for(const y of [.48,1.28,2.10])box('wish-display-shelf',1.05,.10,3.3,5.2,y,-4.65,timber);
 label('소원패 · 봉헌초',5.62,2.85,-4.65,Math.PI/2,2.2,.4);
 // Long open veranda facing a small, private garden.
 box('veranda',2.9,.12,8,7.45,.06,2.6,timber);
 for(const z of [-1.15,6.35])box('veranda-low-edge',2.9,.06,.09,7.45,.18,z,dark);
 for(const z of [.25,4.9]){box('veranda-cushion',.7,.10,.7,7.2,.17,z,linen);}
 box('tea-low-table',.85,.08,1.1,7.25,.45,2.5,timber);for(const z of [2.1,2.9])box('tea-table-foot',.6,.31,.08,7.25,.275,z,dark);
 finish(MeshBuilder.CreateCylinder('retreat-tea-cup',{diameter:.10,height:.10,tessellation:16},scene),white,7.25,.54,2.5);
 // Quiet stepping stones and a shallow reflective bowl among varied low stones.
 for(const [x,z] of [[9,1],[10.2,.2],[11.5,-.5],[13,-1],[14.4,-.5],[15.5,.5],[15.8,2],[15.5,4.5],[14.5,5.6],[12.8,6.2],[11,5.7]])oval('garden-stepping-stone',.85,.07,.62,x,.085,z,stone);
 const water=mat('water','#4a7374');water.alpha=.87;water.specularColor=new Color3(.19,.25,.25);water.specularPower=96;
 const waterTexture=new DynamicTexture('retreat-water-ripples',256,scene,true),waterBrush=waterTexture.getContext() as CanvasRenderingContext2D;
 const tint=waterBrush.createRadialGradient(128,128,12,128,128,128);tint.addColorStop(0,'#668982');tint.addColorStop(1,'#b3c1a2');waterBrush.fillStyle=tint;waterBrush.fillRect(0,0,256,256);
 for(let i=0;i<36;i++){waterBrush.strokeStyle=i%2?'#d3e9e225':'#425f5b30';waterBrush.lineWidth=.7;waterBrush.beginPath();waterBrush.ellipse(128+Math.sin(i)*16,128+Math.cos(i)*13,8+i*3.7,4+i*2,0,.2,5.7);waterBrush.stroke();}waterTexture.update();water.diffuseTexture=waterTexture;
 const pool=finish(MeshBuilder.CreateDisc('retreat-garden-water',{radius:1,tessellation:64,sideOrientation:Mesh.DOUBLESIDE},scene),water,13.4,.125,3.1);pool.rotation.x=Math.PI/2;pool.scaling.set(2.15,1.65,1);
 for(let i=0;i<20;i++){const a=i*Math.PI/10,r=1+.04*Math.sin(i*3);oval('pond-edge',.40+i%3*.10,.22+i%2*.10,.34,13.4+Math.cos(a)*2.2*r,.18,3.1+Math.sin(a)*1.72*r,stone);}
 for(const [x,z,s] of [[10.2,6.8,.9],[16,6.4,1.2],[16.2,-2.1,.85]]){
  box('tree-trunk',.12,1.9*s,.12,x,1.0*s,z,dark);
  for(let i=0;i<7;i++){const a=i*2.4;oval('tree-crown',.95*s,.48*s,.85*s,x+Math.cos(a)*.43*s,1.65*s+i*.05,z+Math.sin(a)*.43*s,leaf);}
 }
 for(const [x,z] of [[10,-2],[16.5,7.7],[10.5,7],[16.8,0]]){oval('garden-rock',.7,.45,.6,x,.29,z,stone);for(let i=0;i<4;i++)oval('garden-shrub',.45,.36,.42,x+Math.sin(i)*.5,.28,z+Math.cos(i)*.4,leaf);}
 box('garden-east-wall',.14,1.55,14,17.9,.88,2,jade);box('garden-north-wall',12,1.55,.14,12,.88,8.9,jade);box('garden-south-wall',12,1.55,.14,12,.88,-4.9,jade);
 for(let i=0;i<9;i++)box('garden-fence-cap',.25,.10,14,17.9,.25+i*.16,2,dark);
 const groups=new Map<string,Mesh[]>();for(const mesh of parts){mesh.computeWorldMatrix(true);const key=mesh.material!.uniqueId+':'+mesh.getVerticesDataKinds().sort().join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(mesh);}
 const merged:Mesh[]=[];for(const group of groups.values()){if(group.length===1){merged.push(group[0]);continue;}const mesh=Mesh.MergeMeshes(group,true,true,undefined,false,true);if(mesh){mesh.receiveShadows=true;merged.push(mesh);}}
 return merged;
}
