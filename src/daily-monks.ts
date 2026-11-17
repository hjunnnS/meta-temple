import type{Scene}from'@babylonjs/core/scene';
import type{Mesh}from'@babylonjs/core/Meshes/mesh';
import{MeshBuilder as B}from'@babylonjs/core/Meshes/meshBuilder';
import{TransformNode}from'@babylonjs/core/Meshes/transformNode';
import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';
import{Color3}from'@babylonjs/core/Maths/math.color';
import{Vector3,Quaternion,Matrix}from'@babylonjs/core/Maths/math.vector';
import{PointerEventTypes}from'@babylonjs/core/Events/pointerEvents';
import{visitorMesh}from'./walking';import{visitorRobe}from'./visitor-robe';
import{walkingPose}from'./locomotion';import{privateMeditationPose}from'./private-practice';
import{dailyMonkSites,dailyMonkFrame,dailyGreeting,turn,ease}from'./daily-monk-layout';
import{worldTapAllowed}from'./tap-guard';import{reducedMotion}from'./practice-light';import{t}from'./locales';
import'./daily-monks.css';

type Body=ReturnType<typeof visitorMesh>;
function handAt(body:Body,index:number,target:Vector3){
 const arm=body.arms[index],elbow=body.forearms[index],axis=target.subtract(arm.position),length=Math.max(.01,Math.min(.504,axis.length()));axis.normalize();
 const hint=new Vector3(index? .8:-.8,-.8,-.1),bend=hint.subtract(axis.scale(Vector3.Dot(hint,axis))).normalize(),along=(.255**2-.25**2+length**2)/(2*length);
 const upper=axis.scale(along).add(bend.scale(Math.sqrt(Math.max(0,.255**2-along**2)))),lower=axis.scale(length).subtract(upper),a=Quaternion.Identity(),b=Quaternion.Identity();
 Quaternion.FromUnitVectorsToRef(Vector3.Down(),upper.normalize(),a);Quaternion.FromUnitVectorsToRef(Vector3.Down(),lower.normalize(),b);arm.rotationQuaternion=a;elbow.rotationQuaternion=a.conjugate().multiply(b);
}
export function dailyMonks(scene:Scene,canvas:HTMLCanvasElement,visitor:()=>readonly number[]|null,timber:StandardMaterial){
 const material=(name:string,hex:string)=>{const m=new StandardMaterial('daily-'+name,scene);m.diffuseColor=Color3.FromHexString(hex).toLinearSpace();m.specularColor=Color3.Black();return m;};
 const iron=material('watering-can','#607c6e'),paper=material('book-paper','#e5d9b5'),ink=material('book-lines','#8d816a'),cover=material('book-cover','#714b31'),cloth=material('cloth','#e6dfcc'),grain=material('fish-food','#ba9763'),water=material('water','#88c6c4'),soil=material('flower-soil','#615140'),leaf=material('flower-leaf','#557652'),petal=material('flowers','#bc9479');water.alpha=.6;
 const furniture:Mesh[]=[];
 const box=(name:string,parent:TransformNode|null,w:number,h:number,d:number,x:number,y:number,z:number,mat:StandardMaterial)=>{const m=B.CreateBox(name,{width:w,height:h,depth:d},scene);m.parent=parent;m.position.set(x,y,z);m.material=mat;m.isPickable=false;return m;};
 const ball=(name:string,parent:TransformNode|null,size:number,x:number,y:number,z:number,mat:StandardMaterial)=>{const m=B.CreateSphere(name,{diameter:size,segments:6},scene);m.parent=parent;m.position.set(x,y,z);m.material=mat;m.isPickable=false;return m;};
 const actors=dailyMonkSites.map((site,index)=>{
  const body=visitorMesh(scene,site.id,true);visitorRobe(scene,body).setWearing(true);body.root.position.set(site.x,site.y,site.z);body.root.rotation.y=site.yaw;
  body.root.metadata={...body.root.metadata,dailyMonkId:site.id,role:site.role,activity:'work',greeting:false};
  for(const m of new Set(body.root.getChildMeshes().map(mesh=>mesh.material)))if(m instanceof StandardMaterial)m.diffuseColor=m.diffuseColor.toLinearSpace();
  for(const mesh of body.root.getChildMeshes()){mesh.isPickable=true;mesh.metadata={...mesh.metadata,dailyMonkId:site.id,blocksOfferingPick:true};}
  const tool=new TransformNode(site.id+'-tool',scene),particles:Mesh[]=[];let page:Mesh|undefined;
  if(site.role==='pond'){
   const bowl=B.CreateLathe('fish-food-bowl',{shape:[[0,0],[.10,0],[.135,.085],[.125,.09],[.095,.012],[0,.012]].map(([r,y])=>new Vector3(r,y,0)),tessellation:14},scene);bowl.parent=tool;bowl.material=cover;
   for(let i=0;i<7;i++)ball('fish-food-in-bowl',tool,.018,Math.sin(i*2.4)*.07,.035,Math.cos(i*2.4)*.06,grain);
   for(let i=0;i<6;i++)particles.push(ball('falling-fish-food',null,.014,0,-10,0,grain));
  }else if(site.role==='lamps')box('lamp-cleaning-cloth',tool,.15,.11,.025,0,0,0,cloth);
  else if(site.role==='garden'){
   const pot=B.CreateCylinder('watering-can',{diameter:.30,height:.27,tessellation:14},scene);pot.parent=tool;pot.material=iron;
   const handle=B.CreateTorus('watering-can-handle',{diameter:.27,thickness:.025,tessellation:12},scene);handle.parent=tool;handle.position.y=.20;handle.rotation.x=Math.PI/2;handle.material=iron;
   const spout=B.CreateTube('watering-can-spout',{path:[new Vector3(0,-.01,.13),new Vector3(0,.08,.34),new Vector3(0,.12,.49)],radius:.025,tessellation:8},scene);spout.parent=tool;spout.material=iron;
   for(let i=0;i<8;i++)particles.push(ball('watering-drops',null,.018,0,-10,0,water));
   for(let i=0;i<7;i++){
    const x=9.6+i*.9,z=103.15+.12*Math.sin(i*2.4);const pot=B.CreateCylinder('garden-flower-pot',{diameterTop:.43,diameterBottom:.32,height:.24,tessellation:10},scene);pot.position.set(x,.13,z);pot.material=cover;pot.isPickable=false;furniture.push(pot);
    const dirt=B.CreateCylinder('flower-pot-soil',{diameter:.39,height:.018,tessellation:10},scene);dirt.position.set(x,.254,z);dirt.material=soil;dirt.isPickable=false;furniture.push(dirt);
    for(let j=0;j<3;j++){const stalk=B.CreateCylinder('flower-stem',{diameter:.014,height:.26,tessellation:5},scene);stalk.position.set(x+(j-1)*.085,.37,z);stalk.material=leaf;stalk.isPickable=false;furniture.push(stalk);for(let p=0;p<4;p++){const blossom=ball('quiet-garden-petal',null,.07,x+(j-1)*.085+.035*Math.cos(p*Math.PI/2),.50,z+.035*Math.sin(p*Math.PI/2),petal);blossom.scaling.y=.4;furniture.push(blossom);}}
   }
  }else{
   box('scripture-book-binding',tool,.39,.025,.27,0,-.018,0,cover);box('scripture-book-pages',tool,.36,.018,.24,0,0,0,paper);
   for(const side of [-1,1])for(let line=0;line<8;line++)box('scripture-line',tool,.135,.001,.002,side*.095,.010,-.09+line*.025,ink);
   page=box('turning-scripture-page',tool,.175,.002,.235,.0875,.014,0,paper);const hinge=new TransformNode('scripture-page-hinge',scene);hinge.parent=tool;page.parent=hinge;
   furniture.push(box('reading-wooden-veranda',null,2.0,.14,1.55,site.x,.28,site.z,timber));
   for(const dx of[-.77,.77])for(const dz of[-.55,.55])furniture.push(box('reading-veranda-leg',null,.18,.22,.18,site.x+dx,.11,site.z+dz,timber));
   furniture.push(box('reading-cushion',null,.52,.06,.49,site.x,.38,site.z,cloth));
  }
  for(const mesh of tool.getChildMeshes())mesh.isPickable=false;
  return{site,body,tool,particles,page,clock:index*3.2,greet:-1,stride:0};
 });
 const caption=document.createElement('div');caption.id='daily-monk-caption';caption.hidden=true;caption.setAttribute('role','status');caption.setAttribute('aria-live','polite');document.body.append(caption);
 let privateSpace=false;
 const cancel=()=>{for(const a of actors)a.greet=-1;caption.hidden=true;};
 const space=(event:Event)=>{privateSpace=(event as CustomEvent<string>).detail==='private';cancel();for(const a of actors){a.body.root.setEnabled(!privateSpace);a.tool.setEnabled(!privateSpace);for(const p of a.particles)p.setEnabled(false);}for(const m of furniture)m.setEnabled(!privateSpace);};
 window.addEventListener('sasa:space',space);window.addEventListener('blur',cancel);
 const pointer=scene.onPointerObservable.add(info=>{
  if(info.type!==PointerEventTypes.POINTERTAP||privateSpace||!worldTapAllowed(canvas,info.event as PointerEvent))return;
  const id=info.pickInfo?.pickedMesh?.metadata?.dailyMonkId,a=actors.find(a=>a.site.id===id),p=visitor()??scene.activeCamera?.globalPosition.asArray();
  if(!a||!p||Math.hypot(p[0]-a.body.root.position.x,p[1]-a.body.root.position.y,p[2]-a.body.root.position.z)>6.5||a.greet>=0)return;
  cancel();a.greet=0;canvas.focus();
 });
 function update(a:typeof actors[number],dt:number){
  const {site,body,tool}=a,camera=scene.activeCamera;if(!camera)return;
  const distance=Math.hypot(camera.globalPosition.x-body.root.position.x,camera.globalPosition.z-body.root.position.z),wide=camera.globalPosition.y>22,visible=wide||distance<65;
  body.root.setEnabled(visible);tool.setEnabled(visible);for(const p of a.particles)p.setEnabled(visible);if(!visible)return;
  const p=visitor(),giveWay=!!p&&Math.hypot(p[0]-body.root.position.x,p[2]-body.root.position.z)<1.35;
  const before=body.root.position.clone();if(a.greet<0&&distance<48&&!(giveWay&&dailyMonkFrame(site,a.clock).walking))a.clock+=dt;
  const f=dailyMonkFrame(site,a.clock);body.root.position.set(f.x,site.y,f.z);body.root.rotation.y=f.yaw;
  const walking=f.walking&&!giveWay&&a.greet<0;a.stride+=Vector3.Distance(before,body.root.position)*7;
  if(site.role==='reader')privateMeditationPose(body,1,a.clock);else walkingPose(body,a.stride,walking?f.blend:0,false);
  const cycle=f.work,working=!f.walking&&cycle>0&&a.greet<0,soft=reducedMotion()?.35:1;
  body.head.rotation.x=site.role==='reader'?.23:.10;body.head.rotation.y=site.role==='reader'?.05*Math.sin(a.clock*.22):.07*Math.sin(a.clock*.2);
  if(site.role==='pond'){
   const toss=working?ease((cycle-2)/1.2)*(1-ease((cycle-8)/1.5)):0,swing=(.5+.5*Math.sin(cycle*2.1))*toss*soft;
   handAt(body,0,new Vector3(-.14,.24,.32));if(!walking)handAt(body,1,new Vector3(.13,.18+.22*swing,.28+.19*swing));
   body.root.computeWorldMatrix(true);body.hands[0].computeWorldMatrix(true);tool.position.copyFrom(body.hands[0].getAbsolutePosition());tool.position.y+=.02;tool.rotation.set(0,body.root.rotation.y,0);
   const start=body.hands[1].getAbsolutePosition();for(const[i,dot]of a.particles.entries()){const u=((cycle*.65+i/6)%1);dot.setEnabled(visible&&distance<48&&toss>.5);dot.position.set(start.x+(50.8-start.x)*u,.04+(start.y-.04)*(1-u)+Math.sin(Math.PI*u)*.26,start.z+(-45-start.z)*u);}
  }else if(site.role==='lamps'){
   if(!walking){handAt(body,0,new Vector3(-.12,.25,.28));handAt(body,1,new Vector3(.11*Math.sin(cycle*2.2)*soft,.62+.08*Math.sin(cycle*1.4)*soft,.43));}
   body.root.computeWorldMatrix(true);body.hands[1].computeWorldMatrix(true);tool.position.copyFrom(body.hands[1].getAbsolutePosition());tool.rotation.set(0,body.root.rotation.y,0);
  }else if(site.role==='garden'){
   const pour=working?ease((cycle-2)/1.2)*(1-ease((cycle-10)/1.4)):0;
   if(!walking){handAt(body,1,new Vector3(.14,.40,.40));handAt(body,0,new Vector3(-.10,.24,.34));}
   body.root.computeWorldMatrix(true);body.hands[1].computeWorldMatrix(true);tool.position.copyFrom(body.hands[1].getAbsolutePosition());tool.position.y-=.23;tool.rotation.set(.62*pour,body.root.rotation.y,0);tool.computeWorldMatrix(true);
   const start=Vector3.TransformCoordinates(new Vector3(0,.12,.49),tool.getWorldMatrix());for(const[i,dot]of a.particles.entries()){const u=(cycle*1.3+i/8)%1;dot.setEnabled(visible&&distance<48&&pour>.4);dot.position.set(start.x+.08*Math.sin(i*2.4)*u,start.y*(1-u)+.32*u,start.z+.30*u);}
  }else{
   handAt(body,0,new Vector3(-.13,.12,.30));handAt(body,1,new Vector3(.13,.12,.30));body.root.computeWorldMatrix(true);tool.position.copyFrom(Vector3.TransformCoordinates(new Vector3(0,.14,.34),body.chest.getWorldMatrix()));tool.rotation.set(.16,body.root.rotation.y,0);
   const phase=a.clock%15;if(a.page?.parent instanceof TransformNode)a.page.parent.rotation.z=Math.PI*ease((phase-10)/2.4);
  }
  if(a.greet>=0){
   a.greet+=dt;const palms=dailyGreeting(a.greet),point=p??camera.globalPosition.asArray(),goal=Math.atan2(point[0]-f.x,point[2]-f.z);
   body.root.rotation.y=turn(f.yaw,goal,palms*(site.role==='reader'?.2:1));
   const limbs=[...body.arms,...body.forearms],work=limbs.map(n=>n.rotationQuaternion?.clone()??Quaternion.FromEulerAngles(n.rotation.x,n.rotation.y,n.rotation.z));body.bow(.105);const joined=limbs.map(n=>n.rotationQuaternion?.clone()??Quaternion.Identity());
   if(site.role==='reader')privateMeditationPose(body,1,a.clock);
   for(let i=0;i<limbs.length;i++)limbs[i].rotationQuaternion=Quaternion.Slerp(work[i],joined[i],palms);
   body.head.rotation.x=.10+.08*palms;tool.setEnabled(site.role==='reader'||palms<.18);for(const dot of a.particles)dot.setEnabled(false);
   if(a.greet>=4){a.greet=-1;caption.hidden=true;}
  }
  body.root.metadata={...body.root.metadata,activity:a.greet>=0?'greet':walking?'walk':site.role,clock:a.clock,greeting:a.greet>=0};
 }
 for(const a of actors)update(a,0);
 const observer=scene.onBeforeRenderObservable.add(()=>{
  if(privateSpace||document.hidden)return;const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);for(const a of actors)update(a,dt);
  const active=actors.find(a=>a.greet>=.8&&a.greet<3.3),camera=scene.activeCamera;caption.hidden=!active||!camera;
  if(active&&camera){const point=Vector3.Project(active.body.root.position.add(new Vector3(0,1.92,0)),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(scene.getEngine().getRenderWidth(),scene.getEngine().getRenderHeight())),r=canvas.getBoundingClientRect();caption.hidden=point.z<0||point.z>1;if(!caption.hidden){caption.textContent=t(active.site.role==='pond'?'물결과 잉어를 보며 잠시 쉬어 가세요.':active.site.role==='lamps'?'작은 등 하나에도 정성을 담아 보세요.':active.site.role==='garden'?'천천히 걸으며 주변을 둘러보세요.':'잠시 마음을 모으고 편안히 머물러 보세요.');caption.style.transform=`translate(${Math.max(85,Math.min(innerWidth-85,r.x+point.x*r.width/scene.getEngine().getRenderWidth()))}px,${Math.max(80,r.y+point.y*r.height/scene.getEngine().getRenderHeight())}px) translate(-50%,-100%)`;}}
 });
 scene.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(observer);scene.onPointerObservable.remove(pointer);window.removeEventListener('sasa:space',space);window.removeEventListener('blur',cancel);caption.remove();});
 return{actors,furniture,shadowCasters:[...furniture,...actors.flatMap(a=>a.body.root.getChildMeshes().filter(m=>/soft-shirt|overlapping coat|upper-trouser|lower-trouser|scalp/.test(m.name)))],obstacles:()=>[...actors.map(a=>({x:a.body.root.position.x,z:a.body.root.position.z,radius:a.site.role==='reader'?1.27:.36})),...furniture.filter(m=>m.name==='garden-flower-pot').map(m=>({x:m.position.x,z:m.position.z,radius:.24}))]};
}
