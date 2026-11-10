import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import {treeSpecimen} from './tree-specimen';
import {wishToss} from './wish-toss';
import {descendingLight,goldRing} from './practice-light';
import { pond,canThrowCoin } from './temple-terrain';

export function furnishPond(scene:Scene,staticParts:Mesh[],shore:(a:number)=>Vector3,brush:CanvasRenderingContext2D,bed:DynamicTexture){
 let seed=813;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 function material(name:string,hex:string){
  const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=Color3.Black();return m;
 }
 function oval(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial,parent?:TransformNode){
  const mesh=MeshBuilder.CreateSphere(name,{diameter:1,segments:8},scene);
  mesh.position.set(x,y,z);mesh.scaling.set(w,h,d);mesh.material=m;mesh.receiveShadows=true;
  if(parent)mesh.parent=parent;else staticParts.push(mesh);return mesh;
 }
 const granite=new DynamicTexture('pond-granite-grain',256,scene,true);
 const stoneBrush=granite.getContext() as CanvasRenderingContext2D;
 stoneBrush.fillStyle='#cecac1';stoneBrush.fillRect(0,0,256,256);
 for(let i=0;i<11500;i++){
  const size=.3+random()**3*2.8;
  stoneBrush.fillStyle=i%3?'rgba(255,249,228,.6)':'rgba(60,58,54,.55)';
  stoneBrush.fillRect(random()*256,random()*256,size,size*.76);
 }
 granite.update();
 const relief=new Texture('/textures/rock_face_nor_gl_1k.jpg',scene);relief.level=.26;
 const rocks=['#999480','#d1cbb9','#726f61','#ada69a'].map((c,i)=>{
  const m=material('waterside-granite-'+i,c);m.diffuseTexture=granite;m.bumpTexture=relief;m.emissiveColor=m.diffuseColor.scale(.085);return m;
 });
 const target=new Vector3(pond.x-pond.width/6,.32,pond.z);
 const access=shore(Math.PI);access.x-=1;
 const sites=[access,...[2.35,2.35+Math.PI].map(angle=>{
  const p=shore(angle);p.x+=Math.cos(angle)*1.25;p.z+=Math.sin(angle)*1.25;return p;
 })];
 for(const p of sites){
  const pad=MeshBuilder.CreateCylinder('coin-throwing-step',{diameter:1.35,height:.11,tessellation:12},scene);
  pad.position.set(p.x,.055,p.z);pad.material=rocks[1];staticParts.push(pad);
 }
 // Closely spaced small stones establish a continuous, raised water edge.
 const shoreSamples=Array.from({length:193},(_,i)=>shore(i*Math.PI/96));
 const lengths=[0];
 for(let i=1;i<shoreSamples.length;i++)lengths.push(lengths[i-1]+Vector3.Distance(shoreSamples[i-1],shoreSamples[i]));
 const count=Math.ceil(lengths.at(-1)!/.40);
 for(let i=0;i<count;i++){
  const distance=i/count*lengths.at(-1)!;
  let k=1;while(k<lengths.length-1&&lengths[k]<distance)k++;
  const t=(distance-lengths[k-1])/(lengths[k]-lengths[k-1]);
  const edge=Vector3.Lerp(shoreSamples[k-1],shoreSamples[k],t);
  const direction=shoreSamples[k].subtract(shoreSamples[k-1]);
  const size=.40+random()*.26;
  const rock=oval('water-edge-stone',edge.x,.43,edge.z,size,.30+random()*.16,.48+random()*.21,rocks[i%4]);
  rock.rotation.y=Math.atan2(direction.x,direction.z)-Math.PI/2;
  rock.rotation.z=(random()-.5)*.19;
 }
 for(let i=0;i<155;i++){
  const a=i*2.39996,edge=shore(a),spread=.38+random()*.55,size=.12+random()*.33;
  const rock=oval('bank-gravel',edge.x+Math.cos(a)*spread,.12,edge.z+Math.sin(a)*spread,size*1.24,size*.7,size,rocks[i%4]);
  rock.rotation.y=random()*6.28;
 }
 for(const [i,angle] of [.35,2.02].entries()){
  const foot=shore(angle);
  treeSpecimen(scene,staticParts,foot.x,foot.z,3.8,i===1);
 }
 // Mineral variations and submerged gravel soften the transition into deeper water.
 brush.fillStyle='rgba(164,154,118,.13)';brush.fillRect(0,0,512,512);
 for(let i=0;i<5500;i++){
  const x=random()*512,y=random()*512,r=.2+random()**3*1.4;
  brush.fillStyle=i%3?'rgba(232,218,179,.44)':'rgba(78,87,66,.22)';
  brush.beginPath();brush.ellipse(x,y,r*1.5,r,random()*3,0,Math.PI*2);brush.fill();
 }
 bed.update();
 for(let i=0;i<170;i++){
  const a=random()*Math.PI*2,r=Math.sqrt(random())*.82;
  const x=pond.x+Math.cos(a)*pond.width*.5*r,z=pond.z+Math.sin(a)*pond.depth*.5*r;
  const size=.09+random()**2*.28;
  oval('submerged-pebble',x,.065,z,size*1.4,size*.36,size,rocks[i%4]);
 }
 const pad=material('lotus-leaves','#527d43'),petal=material('lotus-shell-pink','#f7a4b9'),inner=material('lotus-ivory','#ffdfce'),gold=material('lotus-heart','#ecb750');
 for(const [x,z] of [[-3.4,1.5],[2.8,2],[3.8,-1.5],[-2,-1.7]]){
  for(let j=0;j<5;j++){
   const a=j*2.4,leaf=oval('floating-pad',pond.x+x+.68*Math.cos(a),.522+j*.004,pond.z+z+.47*Math.sin(a),.53,.031,.44,pad);
   leaf.rotation.y=a;
  }
  for(let ring=0;ring<2;ring++)for(let j=0;j<8;j++){
   const a=(j+ring*.5)*Math.PI/4,r=ring?.09:.17;
   const leaf=oval('lotus-petal',pond.x+x+r*Math.sin(a),.67+.07*ring,pond.z+z+r*Math.cos(a),.12,.12,.34-ring*.08,ring?inner:petal);
   leaf.rotation.set(-.40-ring*.25,a,0);
  }
  oval('lotus-seedhead',pond.x+x,.78,pond.z+z,.13,.10,.13,gold);
 }
 const ivory=material('koi-ivory','#fff0d3'),red=material('koi-vermilion','#e36728'),charcoal=material('koi-ink','#453c35');
 const fish=Array.from({length:8},(_,i)=>{
  const root=new TransformNode('koi',scene),base=i>=3&&i<6?red:ivory;
  oval('carp-body',0,0,0,.15,.112,.38,base,root);
  oval('carp-head',0,0,.145,.127,.094,.13,base,root);
  for(const side of [-1,1]){
   oval('eye',side*.049,.024,.18,.019,.015,.024,charcoal,root);
   oval('pectoral-fin',side*.079,-.016,.051,.075,.013,.086,ivory,root).rotation.y=side*.48;
  }
  if(i>=6)for(let j=0;j<3;j++)oval('koi-mark',.025*Math.sin(i+j),.043,-.09+j*.083,.083,.029,.074,j===2&&i%2?charcoal:red,root);
  const tail=new TransformNode('caudal-fin',scene);tail.parent=root;tail.position.z=-.145;
  for(const side of [-1,1])oval('tail-lobe',side*.034,0,-.081,.065,.028,.17,base,tail).rotation.y=-side*.42;
  root.scaling.setAll(1.24+i*.053);return {root,tail};
 });
 const coinMetal=material('wish-brass','#e5b76b');coinMetal.specularColor=new Color3(.55,.42,.2);
 const bowlStone=material('wish-basins','#c1b5a6');bowlStone.diffuseTexture=granite;bowlStone.bumpTexture=relief;bowlStone.emissiveColor=bowlStone.diffuseColor.scale(.14);bowlStone.backFaceCulling=false;
 function basin(cx:number,cz:number,yaw:number){
  const rings=[[.001,.055],[.60,.065],[1,.46],[1,.54],[.83,.54],[.73,.21],[.001,.21]];
  const paths=rings.map(([r,h])=>Array.from({length:97},(_,i)=>{
   const a=i*Math.PI/48;
   const x=16*Math.sin(a)**3/16;
   const z=(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/17;
   return new Vector3(r*x*1.05,h,r*z*1.05);
  }));
  const bowl=MeshBuilder.CreateRibbon('hollow-wishing-basin',{pathArray:paths,sideOrientation:Mesh.DOUBLESIDE},scene);
  bowl.position.set(cx,.38,cz);bowl.rotation.y=yaw;bowl.material=bowlStone;staticParts.push(bowl);
  // Four overlapping layers occupy the lower quarter of the bowl interior.
  for(let layer=0;layer<4;layer++)for(let i=0;i<82;i++){
   let x:number,z:number;
   do{
    x=(random()-.5)*1.30;z=(random()-.45)*1.27;
   }while((x*x+z*z-.40)**3-x*x*z*z*z>.0);
   const coin=MeshBuilder.CreateCylinder('resting-coin',{diameter:.085+random()*.018,height:.017,tessellation:12},scene);
   coin.position.set(cx+x*Math.cos(yaw)+z*Math.sin(yaw),.606+layer*.020+random()*.011,cz+z*Math.cos(yaw)-x*Math.sin(yaw));
   coin.rotation.set((random()-.5)*.20,random()*6.28,(random()-.5)*.20);
   coin.material=coinMetal;staticParts.push(coin);
  }
 }
 // A low stone shelf on the visitor side holds the two carved bowls.
 oval('coin-ledge',target.x+1,.305,target.z-.2,4.4,.28,3.0,rocks[1]);
 basin(target.x,target.z,0);basin(target.x+2.05,target.z-.65,.15);
 const thrown=MeshBuilder.CreateCylinder('wish-coin',{diameter:.11,height:.018,tessellation:20},scene);thrown.material=coinMetal;thrown.setEnabled(false);
 const tossState=wishToss();
 const landing=descendingLight(scene,10,2.6),rising=goldRing(scene,2.0,true),aura=descendingLight(scene,12,1.6);
 landing.mesh.setEnabled(false);rising.mesh.setEnabled(false);aura.mesh.setEnabled(false);
 const rippleMaterial=material('coin-water-ripple','#d3ede2');
 rippleMaterial.disableLighting=true;rippleMaterial.emissiveColor=new Color3(.55,.76,.71);rippleMaterial.alpha=0;
 const ripples=[0,1].map(()=>{
  const mesh=MeshBuilder.CreateTorus('coin-splash-ring',{diameter:1,thickness:.028,tessellation:48},scene);
  mesh.material=rippleMaterial;mesh.isPickable=false;mesh.setEnabled(false);return mesh;
 });
 const sprayMaterial=material('coin-splash-droplet','#c7e4e1');sprayMaterial.alpha=.75;
 const drops=Array.from({length:7},()=>{
  const m=MeshBuilder.CreateSphere('coin-water-drop',{diameter:.04,segments:6},scene);
  m.material=sprayMaterial;m.isPickable=false;m.setEnabled(false);return m;
 });
 let elapsed=0,wishAge=0,phase='idle',source=access.clone(),hit=false;
 const end=target.clone();

 return {target,access,sites,canToss:canThrowCoin,get countdown(){return Math.max(1,3-Math.floor(wishAge));},get busy(){return phase!=='idle';},get wishing(){return phase==='wishing';},
 toss(visitor?:readonly number[],site=0){
  if(visitor&&!canThrowCoin(visitor[0],visitor[2]))return;
  const draw=crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
  if(!tossState.start(performance.now(),draw))return;
  source=visitor?Vector3.FromArray([...visitor]):sites[site].clone();source.y+=1.18;
  hit=draw<.25;phase='wishing';thrown.setEnabled(false);
  end.set(target.x+(hit?0:2.8+Math.random()*1.5),hit?.66:.28,target.z+(hit?0:1.9+Math.random()*1.2));
 },update(dt:number,reduced:boolean,visitor?:readonly number[]){
  elapsed+=dt*(reduced?.32:1);
  for(const [i,{root,tail}] of fish.entries()){
   const a=i*1.62+elapsed*(.19+i*.013),rx=1.25+i*.22,rz=.64+i*.08;
   root.position.set(pond.x+(i%3-1)*3.1+rx*Math.cos(a),.30+i*.003,pond.z+(i%2-.5)*2+rz*Math.sin(a));
   root.rotation.y=Math.atan2(-rx*Math.sin(a),rz*Math.cos(a));tail.rotation.y=.28*Math.sin(elapsed*4.2+i);
  }
  const state=tossState.frame(performance.now());phase=state.phase;wishAge=state.age;
  thrown.setEnabled(phase==='flying'||phase==='miss'||phase==='success');
  landing.mesh.setEnabled(phase==='success');rising.mesh.setEnabled(phase==='success');aura.mesh.setEnabled(phase==='success');
  const impactAge=state.age-3.85;
  const splash=phase==='miss'&&impactAge>=0&&impactAge<1.6;
  for(const [i,ripple] of ripples.entries()){
   const age=Math.max(0,impactAge-i*.20);
   ripple.setEnabled(splash&&impactAge>=i*.20);
   ripple.position.set(end.x,.515+i*.002,end.z);ripple.scaling.setAll(.1+age*.95);
  }
  rippleMaterial.alpha=splash?Math.max(0,.65*(1-impactAge/1.6)):0;
  for(const [i,drop] of drops.entries()){
   const age=Math.min(.65,Math.max(0,impactAge)),angle=i*Math.PI*2/7;
   drop.setEnabled(splash&&impactAge<.65);
   drop.position.set(end.x+Math.cos(angle)*age*.5,.50+age*1.1-age*age*1.7,end.z+Math.sin(angle)*age*.5);
  }
  if(phase==='wishing'||phase==='idle')return;
  const u=Math.min(1,Math.max(0,(state.age-3)/.85));
  thrown.position.copyFrom(Vector3.Lerp(source,end,u));thrown.position.y+=reduced?0:5.5*u*(1-u);
  thrown.rotation.x=reduced?0:Math.PI*4*u;
  if(phase!=='success')return;
  const age=state.age-3.85,fade=Math.min(1,age*2)*Math.min(1,(7.1-state.age)/.8);
  landing.draw(reduced?1:Math.min(1,age/.55),.90*fade,reduced);
  landing.mesh.position.x=target.x;landing.mesh.position.z=target.z;landing.mesh.position.y+=.66;
  rising.mesh.position.set(visitor?.[0]??source.x,(visitor?.[1]??source.y-1.18)+.08+(reduced?1:Math.min(1,age/2.4)*12),visitor?.[2]??source.z);
  rising.mesh.scaling.setAll(reduced?1:.82+.18*Math.sin(age*3));
  rising.material.alpha=.95*fade;
  const reach=reduced?1:Math.min(1,age/2.4);
  aura.draw(reach,.70*fade,reduced);
  aura.mesh.position.set(rising.mesh.position.x,(visitor?.[1]??source.y-1.18)+.06+6*reach,rising.mesh.position.z);
 }};
}
