import{GlowLayer}from'@babylonjs/core/Layers/glowLayer';
import{Mesh as LeafMesh}from'@babylonjs/core/Meshes/mesh';
import{mobileDevice}from'./mobile-profile';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type{Scene}from'@babylonjs/core/scene';
import type{Mesh}from'@babylonjs/core/Meshes/mesh';
import type{Material}from'@babylonjs/core/Materials/material';
import{MeshBuilder}from'@babylonjs/core/Meshes/meshBuilder';
import{VertexBuffer}from'@babylonjs/core/Buffers/buffer';
import{VertexData}from'@babylonjs/core/Meshes/mesh.vertexData';
import{Matrix,Quaternion,Vector3}from'@babylonjs/core/Maths/math.vector';
import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';
import{ShaderMaterial}from'@babylonjs/core/Materials/shaderMaterial';
import{Effect}from'@babylonjs/core/Materials/effect';
import{Color3}from'@babylonjs/core/Maths/math.color';
import{sceneryBuildings,sceneryRandom,mountainHeight,landscapeFloor,riverBanks,type Scenery}from'./scenery-layout';
import{sceneryWater}from'./scenery-water';
/** Real geometry only; no photographic backdrop or circular patch underneath the window. */
export function privateViewWorld(scene:Scene){
 const compact=mobileDevice();let glow:GlowLayer|undefined;let meshes:Mesh[]=[],materials:Material[]=[],clock=0,trafficClock=-Infinity,water:ReturnType<typeof sceneryWater>|undefined;
 let trafficMesh:Mesh|undefined,trafficMatrices:Float32Array|undefined;
 let traffic:{mesh:Mesh;axis:'x'|'z';start:number;length:number;speed:number;offset:number}[]=[];
 type Batch={shape:'box'|'leaf'|'cone'|'rock'|'maple'|'cylinder';material:StandardMaterial;values:number[]};let batches=new Map<string,Batch>();
 const matrix=Matrix.Identity(),scale=Vector3.One(),position=Vector3.Zero();
 function clear(){glow?.dispose();glow=undefined;for(const m of meshes)m.dispose();for(const m of materials)m.dispose();meshes=[];materials=[];traffic=[];batches.clear();water=undefined;clock=0;trafficClock=-Infinity;trafficMesh=undefined;trafficMatrices=undefined;}
 function mat(name:string,hex:string,glow=false){const m=new StandardMaterial('scenery-'+name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.06,.07,.08);if(glow){m.disableLighting=true;m.emissiveColor=m.diffuseColor;m.fogEnabled=true;}materials.push(m);return m;}
 function box(name:string,m:StandardMaterial,x:number,y:number,z:number,w:number,h:number,d:number,yaw=0,shape:Batch['shape']='box',pitch=0,roll=0){let batch=batches.get(name);if(!batch){batch={shape,material:m,values:[]};batches.set(name,batch);}scale.set(w,h,d);position.set(x,y,z);Matrix.ComposeToRef(scale,Quaternion.RotationYawPitchRoll(yaw,pitch,roll),position,matrix);batch.values.push(...matrix.asArray());}
 function maple(){const points=[[0,.50],[.12,.23],[.36,.33],[.27,.08],[.49,-.03],[.17,-.16],[.18,-.40],[0,-.27],[-.18,-.40],[-.17,-.16],[-.49,-.03],[-.27,.08],[-.36,.33],[-.12,.23]],positions=[0,.12,0,0,-.04,0],indices:number[]=[];for(const[x,z]of points)positions.push(x,0,z);for(let i=0;i<points.length;i++){const a=i+2,b=(i+1)%points.length+2;indices.push(0,a,b,1,b,a);}const data=new VertexData();data.positions=positions;data.indices=indices;const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);data.normals=normals;const mesh=new LeafMesh('scenery-maple-leaves',scene);data.applyToMesh(mesh);return mesh;}
 function flush(){for(const[name,b]of batches){const mesh=b.shape==='maple'?maple():b.shape==='cylinder'?MeshBuilder.CreateCylinder('scenery-'+name,{height:1,diameter:1,tessellation:7},scene):b.shape==='box'?MeshBuilder.CreateBox('scenery-'+name,{size:1},scene):b.shape==='cone'?MeshBuilder.CreateCylinder('scenery-'+name,{height:1,diameterTop:0,diameterBottom:1,tessellation:8},scene):MeshBuilder.CreateIcoSphere('scenery-'+name,{radius:.5,subdivisions:b.shape==='rock'?1:0},scene);mesh.material=b.material;mesh.isPickable=false;mesh.thinInstanceSetBuffer('matrix',new Float32Array(b.values),16,true);mesh.thinInstanceRefreshBoundingInfo(true);mesh.metadata={privateScenery:true,instances:b.values.length/16};meshes.push(mesh);}batches.clear();}
 function sky(night:boolean,sunset=false){
  Effect.ShadersStore['scenerySkyVertexShader']='precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 direction;void main(){direction=position;gl_Position=worldViewProjection*vec4(position,1.0);}';
  Effect.ShadersStore['scenerySkyFragmentShader']='precision highp float;varying vec3 direction;uniform vec3 zenith;uniform vec3 horizon;void main(){float y=normalize(direction).y;gl_FragColor=vec4(mix(horizon,zenith,smoothstep(-.08,.65,y)),1.0);}';
  const m=new ShaderMaterial('scenery-sky',scene,'scenerySky',{attributes:['position'],uniforms:['worldViewProjection','zenith','horizon']});m.setColor3('zenith',Color3.FromHexString(night?'#07152d':sunset?'#607b9c':'#6caad0'));m.setColor3('horizon',Color3.FromHexString(night?'#263851':sunset?'#e9bc8c':'#d5dfe0'));m.backFaceCulling=false;m.disableDepthWrite=true;materials.push(m);const dome=MeshBuilder.CreateSphere('scenery-sky-dome',{diameter:2100,segments:24},scene);dome.material=m;dome.isPickable=false;dome.infiniteDistance=true;meshes.push(dome);
  const luminary=mat('sky-light',night?'#e6e8d4':'#ffdc97',true);box('sky-orb',luminary,510,150,-120,night?13:27,night?13:27,night?13:27,0,'leaf');
 }
 function ground(y:number,hex:string){const m=mat('ground',hex),g=MeshBuilder.CreateGround('scenery-continuous-ground',{width:5000,height:5000},scene);g.position.y=y;g.material=m;g.isPickable=false;g.receiveShadows=true;meshes.push(g);return m;}
 function towerBase(y:number,city:boolean){const stone=mat('balcony-building',city?'#727976':'#99998a'),edge=mat('balcony-cornice','#b2ac98');
  box('balcony-building',stone,0,y/2,0,12,-y,16);box('balcony-underfloor',edge,7.45,-.16,2.6,3.15,.30,7.9);box('balcony-front-edge',stone,8.95,-.36,2.6,.20,.4,7.9);
  if(city){const glass=mat('tower-windows','#263e4d'),lit=mat('tower-window-light','#d2bb82',true);for(let level=y+2;level< -1;level+=3.2){box('tower-floor-belt',edge,0,level,0,12.18,.12,16.18);for(let z=-6.8;z<7;z+=1.7)box('tower-windows',z%2>0?lit:glass,6.065,level+1.2,z,.07,1.45,.9);}}
 }
 function link(m:StandardMaterial,name:string,a:Vector3,b:Vector3,radius:number){const delta=b.subtract(a),length=delta.length(),mid=a.add(b).scale(.5);const pitch=Math.acos(Math.max(-1,Math.min(1,delta.y/length))),yaw=Math.atan2(delta.x,delta.z);box(name,m,mid.x,mid.y,mid.z,radius*2,length,radius*2,yaw,'cylinder',pitch,0);}
 function forestTree(x:number,y:number,z:number,size:number,palette:StandardMaterial[],trunk:StandardMaterial,rand:()=>number,detail:boolean,snow=false){
  const height=size*(3.0+rand()*.8);box('tree-trunks',trunk,x,y+height/2,z,.15*size,height,.17*size,0,'cylinder');
  const evergreen=snow&&rand()>.45;
  if(evergreen){
   const tiers=detail?5:4,branches=detail?7:5;
   for(let level=0;level<tiers;level++){const radius=(1.65-level*.27)*size,baseY=y+height*(.34+level*.145);
    for(let branch=0;branch<branches;branch++){const a=branch*Math.PI*2/branches+level*.7+rand()*.3,r=radius*(.78+rand()*.28),end=new Vector3(x+Math.sin(a)*r,baseY-.16*size,z+Math.cos(a)*r);link(trunk,'pine-branches',new Vector3(x,baseY+.08*size,z),end,.035*size);
     const clusters=detail?3:1;for(let i=0;i<clusters;i++){const t=detail?.35+i*.28:.67,px=x+(end.x-x)*t,pz=z+(end.z-z)*t,py=baseY-.16*size*t,w=size*(detail?.62:.85)*(1-level*.09);box('pine-needles',palette[0],px,py,pz,w,.48*size,w*.72,a,'rock');box('pine-branch-snow',palette[palette.length-1],px,py+.19*size,pz,w*.90,.17*size,w*.66,a,'rock',.06);}
    }
   }
   box('pine-tip',palette[0],x,y+height*1.04,z,.65*size,.85*size,.6*size,0,'rock');box('pine-tip-snow',palette[palette.length-1],x,y+height*1.16,z,.52*size,.25*size,.5*size,0,'rock');return;
  }
  for(let branch=0;branch<5;branch++){const a=branch*2.4+rand()*.5,end=new Vector3(x+Math.sin(a)*size*(.8+rand()*.6),y+height*(.63+branch*.07),z+Math.cos(a)*size*(.8+rand()*.6));link(trunk,'tree-branches',new Vector3(x,y+height*.5,z),end,.045*size);
   if(snow){const white=palette[palette.length-1],start=new Vector3(x,y+height*.5,z);link(white,'snow-on-bare-branch',start.add(new Vector3(0,.055*size,0)),end.add(new Vector3(0,.055*size,0)),.025*size);for(const side of[-1,1]){const twigEnd=end.add(new Vector3(Math.sin(a+side*.6)*size*.45,size*.28,Math.cos(a+side*.6)*size*.45));link(trunk,'bare-twigs',end,twigEnd,.018*size);link(white,'twig-snow',end.add(new Vector3(0,.04*size,0)),twigEnd.add(new Vector3(0,.04*size,0)),.023*size);}continue;}
   const count=detail?(compact?65:125):(compact?8:13);
   for(let i=0;i<count;i++){const r=Math.sqrt(rand())*size*(snow?.10:.95),a=rand()*Math.PI*2;const width=(snow?.32:detail?.18:.62)*size*(.7+rand()*.65);const m=snow?palette[palette.length-1]:palette[Math.floor(rand()*palette.length)];box('foliage-'+m.name,m,end.x+Math.cos(a)*r,end.y+(rand()-.5)*size*.65,end.z+Math.sin(a)*r,width,snow?width*.18:width*.22,width*(.6+rand()*.5),rand()*Math.PI,snow?'rock':'maple',rand()*.7,rand()*.5);}
  }
 }
 function city(kind:'city'|'river',rand:()=>number){const night=kind==='city';sky(night,!night);const base=landscapeFloor;ground(base-.15,night?'#202c36':'#6e7b68');towerBase(base,true);
  const facades=['#314657','#526476','#707d83','#414e5e','#7b817c'].map((c,i)=>mat('city-facade-'+i,c));const roof=mat('roof-mechanical','#495661'),glass=mat('curtain-glass','#203e51'),trim=mat('facade-trim','#8b9796');const windowMats=['#f2cf85','#bcd5db','#e0b979','#80b3c6'].map((c,i)=>mat('window-'+i,c,night));
  const buildings=sceneryBuildings(kind);for(const b of buildings){const{x,z,width:w,depth:d,height:h,style}=b,body=facades[b.tone];box('city-body-'+b.tone,body,x,base+h/2,z,w,h,d);box('city-roof',roof,x,base+h+.16,z,w+.25,.32,d+.25);
   if(style===0){box('city-crown',body,x,base+h+1.1,z,w*.74,2,d*.72);box('roof-equipment',roof,x+w*.15,base+h+2.4,z,w*.2,.7,d*.25);}else if(style===1){for(const sign of[-1,1])box('vertical-trim',trim,x-w/2-.035,base+h/2,z+sign*d*.36,.13,h,.18);}else if(style===2)box('curtain-glass',glass,x-w/2-.035,base+h/2,z,.06,h*.94,d*.74);
   const far=Math.hypot(x,z)>270,step=far?(compact?7:5):2.8,columns=Math.max(2,Math.floor(d/(far?3.3:1.8)));
   for(let level=1.5;level<h-.6;level+=step)for(let col=0;col<columns;col++){if(rand()<(night?.28:.48))continue;const m=windowMats[Math.floor(rand()*windowMats.length)];box('city-lit-windows-'+m.name,m,x-w/2-.09,base+level,z-d*.42+(col+.5)*d*.84/columns,.06,far?.7:1.0,far?.65:.62);}
   if(!far)for(let level=1.5;level<h-.6;level+=3.0)for(let col=0;col<Math.floor(w/2);col++){if(rand()<.35)continue;const m=windowMats[Math.floor(rand()*windowMats.length)];box('city-side-windows-'+m.name,m,x-w*.4+col*1.8,base+level,z+(z>0?-1:1)*(d/2+.06),.65,.92,.05);}
  }
  const asphalt=mat('street','#303b42'),roadLine=mat('road-markings','#b6ac88',night),lamp=mat('road-light','#efbf70',true);
  for(let row=-21;row<22;row++){const x=20+row*23;if(kind==='city'){box('city-cross-street',asphalt,x,base+.02,0,5,.03,1120);for(const side of[-1,1])box('city-cross-light',lamp,x+side*2.3,base+.12,0,.24,.06,1120);}else if(row===0)for(const bank of[-42,112]){box('river-bank-street',asphalt,210,base+.56,bank,1000,.035,5);box('river-bank-roadline',roadLine,210,base+.60,bank,1000,.02,.07);}}
  if(kind==='city'){for(const z of[-165,-77,11,99,187]){box('city-long-street',asphalt,20,base+.04,z,1070,.04,5);box('city-long-lights',lamp,20,base+.11,z-2.2,1070,.06,.24);}const landmark=facades[2];for(const[y,h,w]of[[20,40,16],[55,30,13],[83,26,9]])box('landmark-tower',landmark,285,base+y,-55,w,h,w);box('landmark-crown',glass,285,base+101,-55,8,12,8,0,'cone');box('landmark-spire',lamp,285,base+111,-55,.25,10,.25);for(let z=-60;z<=-50;z+=2)box('landmark-light-strips',windowMats[1],276.8,base+43,z,.08,83,.20);}
  else{
   const waterLife=sceneryWater(scene,false,base+.18,riverBanks);water=waterLife;meshes.push(water.mesh);materials.push(water.material);
   // Both banks are real geometry above the river, not a painted background.
   const bank=mat('riverbank','#7e8d6a'),bankStone=mat('riverbank-stone','#949584');for(const side of[-1,1]){const z=side<0?-320:390;box('river-land',bank,430,base+.35,z,900,.35,570);box('riverbank-retaining',bankStone,430,base+.22,side<0?-35:105,900,.8,2);}
   const concrete=mat('bridge-concrete','#aea99a'),deck=mat('bridge-road','#52616a'),cable=mat('bridge-cable','#b6bebc');for(const [index,x]of[86,226,405].entries()){
    box('bridge-deck',concrete,x,base+7,35,5,.8,153);box('bridge-asphalt',deck,x,base+7.44,35,4.3,.06,153);for(const side of[-1,1])box('bridge-guardrail',trim,x+side*2.48,base+8,35,.08,.65,153);
    for(let z=-33;z<=103;z+=21){box('bridge-pier',concrete,x,base+3.5,z,1.3,7,1.5);box('bridge-crosshead',concrete,x,base+6.2,z,4,.45,1.6);}
    if(index===1)for(const z of[-3,70]){for(const dx of[-1.7,1.7])box('cable-bridge-tower',concrete,x+dx,base+21,z,.6,29,.6);box('cable-bridge-lintel',concrete,x,base+34,z,4,.5,.7);for(const sign of[-1,1])for(let i=1;i<=5;i++)link(cable,'bridge-cables',new Vector3(x,base+34,z),new Vector3(x,base+8,z+sign*i*5),.035);}
    for(let z=-35;z<110;z+=11)for(const side of[-1,1])box('bridge-lamps',lamp,x+side*2.3,base+8.1,z,.14,.18,.14);
   }
   const park=mat('near-river-park','#788568'),path=mat('near-river-walk','#b0a58a');box('near-river-park',park,-36,base+.13,35,124,.3,140);box('near-river-promenade',path,20,base+.31,35,4,.03,140);box('near-river-bank',bankStone,25.5,base+.15,35,1,1,140);
   const bark=mat('riverside-tree-bark','#5e5644'),green=[mat('park-green','#547555'),mat('park-light-green','#7f905c')];for(let i=0;i<28;i++){const x=-76+rand()*94,z=-26+rand()*120;if(Math.abs(x)<14&&Math.abs(z)<14)continue;forestTree(x,base+.32,z,1.1+rand()*.65,green,bark,rand,false);}for(let i=0;i<65;i++){const x=22+rand()*470,z=rand()>.5?-38-rand()*17:109+rand()*18;forestTree(x,base+.5,z,.8+rand()*.5,green,bark,rand,false);}
  }
  const lights=mat('traffic-headlights','#fff3d1',true);if(compact){trafficMatrices=new Float32Array(18*16);trafficMesh=MeshBuilder.CreateBox('scenery-moving-traffic-batch',{width:.9,height:.12,depth:.35},scene);trafficMesh.material=lights;trafficMesh.isPickable=false;trafficMesh.alwaysSelectAsActiveMesh=true;meshes.push(trafficMesh);for(let i=0;i<18;i++)Matrix.Translation(24+i*21,base+(kind==='city'?.3:.7),kind==='city'?11:(i%2?-42:112)).copyToArray(trafficMatrices,i*16);trafficMesh.thinInstanceSetBuffer('matrix',trafficMatrices,16,false);}else for(let i=0;i<18;i++){const mesh=MeshBuilder.CreateBox('scenery-moving-traffic',{width:.9,height:.12,depth:.35},scene);mesh.material=lights;mesh.position.set(38+i*21,base+(kind==='city'?.3:.7),kind==='city'?11:(i%2?-42:112));mesh.isPickable=false;meshes.push(mesh);traffic.push({mesh,axis:'x',start:24,length:490,speed:night?4:3,offset:i*21});}
 }
 function mountains(snow:boolean,rand:()=>number){sky(false);ground(-9.3,snow?'#d2dce0':'#666f4b');towerBase(-9,false);const earth=mat('terrain','#ffffff');earth.specularColor=Color3.Black();
  const terrain=MeshBuilder.CreateGround('scenery-mountain-terrain',{width:2000,height:2200,subdivisions:150,updatable:true},scene);terrain.position.x=450;const p=terrain.getVerticesData(VertexBuffer.PositionKind)!,colors:number[]=[];
  for(let i=0;i<p.length;i+=3)p[i+1]=mountainHeight(p[i]+450,p[i+2]);const normals:number[]=[];VertexData.ComputeNormals(p,terrain.getIndices()!,normals);
  for(let i=0;i<p.length;i+=3){const h=p[i+1],steep=normals[i+1]<.68;if(snow){const c=steep?.55:.83+Math.sin(p[i]*.2+p[i+2]*.18)*.035;colors.push(c,c+.035,c+.055,1);}else{const mist=Math.min(.30,Math.max(0,(p[i]+350)/1800)),variation=Math.sin(p[i]*.12+p[i+2]*.08)*.035;colors.push(.27+variation+mist,.34+variation+mist,.19+variation+mist,1);}}
  terrain.updateVerticesData(VertexBuffer.PositionKind,p);terrain.updateVerticesData(VertexBuffer.NormalKind,normals);terrain.setVerticesData(VertexBuffer.ColorKind,colors);terrain.material=earth;terrain.isPickable=false;terrain.receiveShadows=true;meshes.push(terrain);
  const rock=mat('rock','#989991'),cap=mat('snowcap','#e3e9eb');for(const[x,z,height,width]of[[96,-28,18,9],[104,-19,24,11],[113,-7,17,9],[170,58,28,15],[183,74,32,15],[260,-145,45,22]]){const y=mountainHeight(x,z);box('granite-peaks',rock,x,y+height*.33,z,width*1.7,height,width*1.5,.4,'rock',.25);box('granite-foothills',rock,x+width*.65,y+height*.16,z+width*.4,width*1.9,height*.55,width*1.4,-.5,'rock',-.2);if(snow)box('rock-snowcaps',cap,x,y+height*.75,z,width*1.3,height*.22,width*1.2,.4,'rock');}
  const bark=mat('forest-bark','#655a4b'),palette=(snow?['#31544b','#f0f3f1']:['#a33324','#cd4b29','#de7e32','#d7a83c','#aa7734','#6e7b43']).map((c,i)=>{const m=mat('forest-leaf-'+i,c);m.specularColor=Color3.Black();m.emissiveColor=m.diffuseColor.scale(snow?.04:.17);return m;});
  for(let i=0;i<(compact?370:600);i++){const x=18+rand()*420,z=(rand()-.5)*690;if(Math.hypot(x-7,z-2.6)<12)continue;const y=mountainHeight(x,z);forestTree(x,y,z,(x<90?1:1.3)+rand()*1.1,palette,bark,rand,x<95&&Math.abs(z)<70,snow);}
  for(let i=0;i<(compact?65:130);i++){const x=40+rand()*160,z=(rand()-.5)*250;forestTree(x,mountainHeight(x,z),z,1.3+rand(),palette,bark,rand,false,snow);}
  for(let i=0;i<(compact?25:50);i++){const x=35+rand()*65,z=(rand()-.5)*65;forestTree(x,mountainHeight(x,z),z,1.25+rand()*.75,palette,bark,rand,false,snow);}
  // A few branches near the veranda frame the distant ridge without closing the view.
  for(const[x,z]of[[18,-7],[22,12],[29,-14],[32,17]])forestTree(x,mountainHeight(x,z),z,3.2,palette,bark,rand,true,snow);
 }
 function sea(rand:()=>number){sky(true);const y=-9;const life=sceneryWater(scene,true,y);water=life;meshes.push(life.mesh);materials.push(life.material);towerBase(y,false);const rock=mat('shore-rock','#5f6b6b'),shore=mat('shore','#797d70');box('coastal-ground',shore,-90,y-.7,0,203,1.5,180);for(let i=0;i<35;i++){const z=(rand()-.5)*170,x=12+rand()*5;box('shore-rocks',rock,x,y+.2,z,1+rand()*2,.6+rand(),1+rand()*2,rand()*Math.PI,'rock');}const boat=mat('boat-light','#eac88d',true);for(let i=0;i<7;i++)box('distant-boats',boat,220+rand()*350,y+.4,(rand()-.5)*480,.65,.16,.35);}
 function select(id:Scenery){clear();if(id==='pond')return;const rand=sceneryRandom(id==='snow'?7231:92841);if(id==='city'||id==='river')city(id,rand);else if(id==='sea')sea(rand);else mountains(id==='snow',rand);flush();if(id==='city'&&!compact){glow=new GlowLayer('scenery-city-glow',scene,{mainTextureRatio:compact?.20:.30,blurKernelSize:24});glow.intensity=.34;glow.customEmissiveColorSelector=(mesh,_sub,material,color)=>{const lit=/window-|road-light|traffic-head|landmark-light/.test(material?.name??'');const c=lit&&(material instanceof StandardMaterial)?material.emissiveColor:Color3.Black();color.set(c.r,c.g,c.b,1);};}for(const m of meshes)m.metadata={...m.metadata,privateScenery:true,scenery:id};}
 const observer=scene.onBeforeRenderObservable.add(()=>{const reduced=document.querySelector<HTMLInputElement>('#reduced')?.checked||matchMedia('(prefers-reduced-motion: reduce)').matches;clock+=reduced?0:Math.min(.05,scene.getEngine().getDeltaTime()/1000);water?.update(clock);if(trafficMesh&&trafficMatrices&&clock-trafficClock>=.10){trafficClock=clock;for(let i=0;i<18;i++)trafficMatrices[i*16+12]=24+(i*21+clock*4)%490;trafficMesh.thinInstanceBufferUpdated('matrix');}for(const v of traffic)v.mesh.position[v.axis]=v.start+(v.offset+clock*v.speed)%v.length;});
 return{select,dispose(){scene.onBeforeRenderObservable.remove(observer);clear();}};
}
