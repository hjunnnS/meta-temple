import { seatedFigure } from './gilt-figure.ts';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder as B } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { hallSeats } from './hall-seats.ts';

// Built separately from the exterior template so other buildings do not inherit the shrine.
export function furnishHall(scene:Scene, meshes:Mesh[], timber:StandardMaterial, beam:StandardMaterial){
 const mat=(name:string,hex:string,fill=.32)=>{
  const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);
  m.emissiveColor=m.diffuseColor.scale(fill);m.specularColor=new Color3(.12,.1,.08);return m;
 };
 const gold=mat('gilded-bronze','#bf8230',.12), dark=mat('antique-bronze','#4c4033'), black=mat('hair','#302824'),
 red=mat('cinnabar','#903f36'), jade=mat('altar-jade','#245950'), ivory=mat('candle-wax','#ffeac3'),
 flame=mat('candle-flame','#ffbe60',1.8), matRed=mat('cushion','#ae4841'),ochre=mat('monk-cushion','#ebae46');
 gold.specularColor=new Color3(.98,.77,.42);gold.specularPower=34;
 const add=(m:Mesh,x:number,y:number,z:number,material:StandardMaterial)=>{m.position.set(x,y,z);m.material=material;m.receiveShadows=true;meshes.push(m);return m;};
 const box=(n:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial)=>add(B.CreateBox(n,{width:w,height:h,depth:d},scene),x,y,z,m);
 const oval=(n:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial)=>{
  const a=add(B.CreateSphere(n,{diameter:1,segments:12},scene),x,y,z,m);a.scaling.set(w,h,d);return a;
 };
 const lathe=(n:string,x:number,y:number,z:number,profile:number[][],m:StandardMaterial)=>
  add(B.CreateLathe(n,{shape:profile.map(([r,h])=>new Vector3(r,h,0)),tessellation:32,sideOrientation:Mesh.DOUBLESIDE},scene),x,y,z,m);
 const faceGold=gold.clone('satin-gilt-face');
 faceGold.specularColor=new Color3(.52,.37,.17);faceGold.specularPower=26;
 const floor=1.69;
 const shrineLight=new PointLight('altar-warm-fill',new Vector3(-2.5,5.6,42.1),scene);
 shrineLight.diffuse=Color3.FromHexString('#ffe3b0');shrineLight.intensity=.82;shrineLight.range=8;

 box('altar-cabinet',0,floor+.48,44.95,14,.96,2.25,timber);
 box('altar-lacquer',0,floor+1,44.95,14.3,.14,2.45,red);
 box('altar-gilt-lip',0,floor+.94,43.73,14.3,.045,.07,gold);
 for(let x=-6;x<=6;x+=2){box('carved-panel',x,floor+.47,43.8,1.82,.65,.09,jade);box('recessed-lacquer',x,floor+.47,43.735,1.63,.52,.035,red);
  for(const side of [-1,1]){
   box('carved-rail',x,floor+.47+side*.253,43.705,1.66,.027,.023,gold);
   box('carved-stile',x+side*.815,floor+.47,43.705,.028,.5,.023,gold);
  }
  for(let i=-2;i<=2;i++){const petal=oval('lotus-relief',x+i*.085,floor+.46,43.69,.105,.26,.045,gold);petal.rotation.z=-i*.37;}
}
 // Three seated figures with crossed legs, robe folds, elongated ears and topknot.
 for(const x of [-3.8,0,3.8]){
  const s=x===0?1.12:.91,z=45.12,y=floor+1.07;
  const part=(n:string,dx:number,dy:number,dz:number,w:number,h:number,d:number,m=gold)=>oval(n,x+dx*s,y+dy*s,z+dz*s,w*s,h*s,d*s,m);
  box('painted-shrine-panel',x,4.12,46.22,3.6,4.55,.13,jade);
  // Openwork aureole with curling flame tips and a smaller nimbus around the head.
  function haloLine(name:string,points:Vector3[],radius:number){
   const wire=add(B.CreateTube(name,{path:points,radius:radius*s,tessellation:6},scene),x,y,z,gold);
   wire.scaling.setAll(1);
  }
  const outline=(a:number,r:number)=>new Vector3(1.22*r*Math.sin(a)*s,(1.78+1.54*r*Math.cos(a))*s,.77*s);
  for(const r of [.86,.91,1])haloLine('filigree-rim',Array.from({length:97},(_,i)=>outline(Math.PI*i/48,r)),.016);
  for(let i=0;i<36;i++){
   const angle=i*Math.PI/18;
   haloLine('aureole-flame',Array.from({length:21},(_,j)=>{
    const t=j/20;return outline(angle+.12*Math.sin(2*Math.PI*t)+.09*t,.89+.24*Math.sin(Math.PI*t));
   }),.014);
  }
  for(const r of [.54,.595])haloLine('head-nimbus',Array.from({length:65},(_,i)=>{
   const a=i*Math.PI/32;return new Vector3(r*Math.cos(a)*s,(2.37+r*Math.sin(a))*s,.52*s);
  }),.018);
  part('lotus-seat',0,.17,0,2.5,.43,1.32,red);
  for(let j=0;j<12;j++){const a=j*Math.PI/6;const petal=part('lotus-petal',Math.cos(a),.27,.49*Math.sin(a),.28,.40,.20);petal.rotation.z=-.43*Math.cos(a);}
  seatedFigure(scene,meshes,x,y,z,s,gold,black,faceGold,x!==0);
 }
 for(const x of [-6.4,-5.55,-2.35,2.35,5.55,6.4]){
  const base=floor+1.07,z=44.01;
  lathe('brass-candlestick',x,base,z,[[.19,0],[.2,.06],[.06,.13],[.045,.4],[.16,.46],[.17,.49]],gold);
  lathe('beeswax',x,base+.49,z,[[.058,0],[.06,.31],[.054,.36],[.032,.35],[0,.34]],ivory);
  lathe('wick',x,base+.83,z,[[.009,0],[.007,.05]],dark);
  lathe('tapered-flame',x,base+.87,z,[[.006,0],[.028,.025],[.023,.074],[.001,.157]],flame);
  oval('wax-drip',x-.02,base+.78,z-.05,.019,.104,.018,ivory);
 }
 box('monk-mat',0,floor+.055,42.52,1.36,.11,1.16,ochre);
 box('scripture-desk',0,floor+.48,43.23,1.5,.13,.54,timber);
 for(const x of [-.59,.59])box('desk-foot',x,floor+.22,43.23,.12,.44,.4,timber);
 box('sutra',-.2,floor+.565,43.2,.66,.05,.33,ivory);
 oval('moktak',.48,floor+.67,43.18,.31,.19,.23,dark);
 const coats=['#53677a','#75615b','#596659','#a17b74','#665971'].map((c,i)=>mat('visitor-coat-'+i,c));
 const skin=mat('skin','#cc9675'),pants=mat('trousers','#42434b');
 for(const [i,{x,z}] of hallSeats.entries()){
  const coat=coats[(i*3+Math.floor(i/10))%coats.length];
  box('bow-cushion',x,floor+.044,z,1.02,.088,.87,matRed);
  oval('folded-legs',x,floor+.23,z+.09,.75,.28,.63,pants);
  oval('seated-robe',x,floor+.56,z,.49,.69,.36,coat);
  oval('head',x,floor+1.01,z,.225,.285,.23,skin);oval('hair',x,floor+1.085,z-.016,.238,.17,.235,black);
  for(const side of [-1,1]){const arm=oval('sleeve',x+side*.225,floor+.59,z+.055,.16,.46,.19,coat);arm.rotation.x=-.3;oval('hand',x+side*.21,floor+.39,z+.15,.12,.13,.15,skin);}
 }
 // Hanging Korean eave bells: slender chain, flared bronze lip and clapper.
 for(const x of [-16.7,16.7])for(const z of [26.4,49.6]){
  const top=8.17;
  lathe('eave-anchor',x,top-.03,z,[[.027,0],[.027,.24]],dark);
  lathe('bell-hanger',x,top-.81,z,[[.045,0],[.026,.17]],dark);
  for(let i=0;i<8;i++){const link=add(B.CreateTorus('chain-link',{diameter:.09,thickness:.017,tessellation:10},scene),x,top-.09*i,z,dark);link.rotation.x=Math.PI/2;link.rotation.y=i%2*.9;link.scaling.z=1.6;}
  lathe('eave-bell',x,top-1.3,z,[[.25,0],[.26,.045],[.22,.09],[.19,.34],[.16,.45],[.09,.52],[.035,.54]],dark);
  oval('clapper',x,top-1.32,z,.09,.15,.09,gold);
 }
 // Close the upward view over the prayer floor with a painted coffer ceiling.
 for(let ix=-3;ix<=3;ix++)for(let iz=0;iz<5;iz++)
  box('ceiling-inset',ix*3.7,6.85,31.2+iz*3.35,3.65,.09,3.29,jade);
 for(let ix=-3;ix<=3;ix++)box('ceiling-runner',ix*3.7-1.84,6.74,38,.13,.2,17,beam);
 for(let iz=0;iz<=5;iz++)box('ceiling-crossbeam',0,6.72,29.52+iz*3.35,26,.2,.15,beam);
}
