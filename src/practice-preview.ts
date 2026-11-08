import {facePicker} from './face-picker';
import {placeHallMonk} from './hall-monk';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Scene} from '@babylonjs/core/scene';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {visitorRobe} from './visitor-robe';
import {prayerLight} from './practice-light';
import {furnishHall} from './hall-interior';
import {practiceSeat} from './hall-seats';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {rainbow} from './bow-practice';
import {visitorMesh} from './walking';

const canvas=document.querySelector('canvas')!,engine=new Engine(canvas,true),scene=new Scene(engine);
scene.clearColor=new Color4(.86,.84,.79,1);
const camera=new ArcRotateCamera('preview-camera',Math.PI*.40,1.24,3.65,new Vector3(0,.85,0),scene);
camera.attachControl(canvas,true);camera.lowerRadiusLimit=2.6;camera.upperRadiusLimit=5;camera.upperBetaLimit=1.5;camera.wheelPrecision=60;camera.panningSensibility=0;
new HemisphericLight('sky',new Vector3(0,1,0),scene).intensity=.60;
new DirectionalLight('sun',new Vector3(-.65,-1,-.6),scene).intensity=.57;
function cloth(name:string,color:string){
 const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();return m;
}
const timber=cloth('hall wood','#70452d'),beam=cloth('painted beam','#914836');
const floor=MeshBuilder.CreateGround('hall floor',{width:34,height:24},scene);
floor.material=timber;floor.position.set(0,1.69,38);
const parts:Mesh[]=[];
const previewView=new URLSearchParams(location.search).get('view');
const monkReview=previewView==='monk-front'||previewView==='monk-side';
let scrub:number|null=null,monkStart=performance.now();
function monkTime(){return scrub??((performance.now()-monkStart)/1000)%19;}
furnishHall(scene,parts,timber,beam,monkReview?monkTime:undefined);
const groups=new Map<StandardMaterial,Mesh[]>();
for(const mesh of parts){
 // The front inspection camera sits inside the altar. Hide only its foreground scenery in this view.
 if(previewView==='monk-front'&&mesh.position.z>=43.68){mesh.dispose();continue;}
 const material=mesh.material as StandardMaterial;
 if(!groups.has(material))groups.set(material,[]);
 groups.get(material)!.push(mesh);
}
for(const parts of groups.values())Mesh.MergeMeshes(parts,true,true);
const avatar=visitorMesh(scene,'preview-visitor'),outfit=visitorRobe(scene,avatar);
facePicker(document.querySelector("header")!,avatar.setFace);
avatar.root.position.set(practiceSeat.x,1.778,practiceSeat.z);
camera.upperRadiusLimit=12;camera.setTarget(new Vector3(practiceSeat.x,2.95,practiceSeat.z));
camera.setPosition(new Vector3(practiceSeat.x-1.55,4.15,practiceSeat.z-6.4));
if(previewView==='bow'){
 camera.setTarget(new Vector3(practiceSeat.x,2.46,practiceSeat.z+.35));
 camera.setPosition(new Vector3(practiceSeat.x-2.60,2.53,practiceSeat.z+.88));
}
if(previewView==='monk'){
 camera.setTarget(new Vector3(-1.20,2.66,43.05));
 camera.setPosition(new Vector3(-3.7,3.0,40.9));
}
if(previewView==='characters'){
 const x=70;
 const fill=new HemisphericLight('portrait fill',new Vector3(-.25,.4,1),scene);fill.intensity=.68;fill.groundColor=new Color3(.47,.39,.34);
 const ground=MeshBuilder.CreateGround('portrait ground',{width:24,height:24},scene);
 ground.position.x=x;ground.material=cloth('warm limestone','#c5bca9');
 avatar.root.position.set(x+1.0,0,0);
 const dressed=visitorMesh(scene,'robed visitor');dressed.root.position.set(x,0,0);
 visitorRobe(scene,dressed).setWearing(true);
 const monk=placeHallMonk(scene,x-1,0,0);monk.rotation.y=Math.PI;
 for(const px of [x-1,x,x+1]){
  const shadow=MeshBuilder.CreateDisc('contact shade',{radius:.28,tessellation:40},scene);
  shadow.rotation.x=Math.PI/2;shadow.position.set(px,.002,0);shadow.scaling.y=.68;
  shadow.material=cloth('floor shadow','#aca18d');
 }
 camera.setTarget(new Vector3(x,.84,0));camera.setPosition(new Vector3(x,1.13,2.88));
 document.querySelector('h1')!.textContent='방문자 평상복 · 법복 · 대웅전 스님';
 document.querySelector('footer')!.hidden=true;document.querySelector('footer')!.style.display='none';
}
function framePreview(){
 camera.fovMode=canvas.clientWidth<canvas.clientHeight?ArcRotateCamera.FOVMODE_HORIZONTAL_FIXED:ArcRotateCamera.FOVMODE_VERTICAL_FIXED;
}
framePreview();
const plain=document.querySelector<HTMLButtonElement>('#everyday')!,robe=document.querySelector<HTMLButtonElement>('#robe')!,replay=document.querySelector<HTMLButtonElement>('#replay')!;
function wear(on:boolean){
 if(outfit.wearing===on)return;
 plain.disabled=robe.disabled=true;
 outfit.change(on,()=>{plain.disabled=robe.disabled=false;plain.setAttribute('aria-pressed',String(!on));robe.setAttribute('aria-pressed',String(on));});
}
plain.onclick=()=>wear(false);robe.onclick=()=>wear(true);
const status=document.querySelector<HTMLElement>('#phase')!;
if(previewView==='bow')replay.textContent='옆에서 절 한 번 보기';
replay.onclick=()=>{
 replay.disabled=true;status.textContent=previewView==='bow'?'절 동작':'108번째 절 · 수행 중';
 const light=previewView==='bow'?null:prayerLight(scene,avatar.root.position);
 let time=0,completed=false;
 const observer=scene.onBeforeRenderObservable.add(()=>{
  time+=Math.min(.1,engine.getDeltaTime()/1000);
  const phase=Math.min(1,Math.max(0,(time-.6)/4.8));
  avatar.bow(phase);
  if(phase===1&&!completed){completed=true;if(light){light.fade();rainbow(scene,avatar.root.position);}status.textContent=light?'108배 완료':'절 동작 완료';}
  if(completed&&!scene.getMeshByName('bow-rainbow-ring')){scene.onBeforeRenderObservable.remove(observer);replay.disabled=false;}
 });
};
if(monkReview){
 const front=previewView==='monk-front';
 document.querySelector('h1')!.textContent='대웅전 스님 · '+(front?'정면':'옆면');
 document.querySelector('#face-picker')?.remove();
 const bar=document.querySelector('footer')!;bar.replaceChildren();
 const other=document.createElement('a');other.textContent=front?'옆면 보기':'정면 보기';other.href='?view=monk-'+(front?'side':'front');
 const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='18.99';slider.step='.001';slider.setAttribute('aria-label','스님 동작 시점');
 const play=document.createElement('button');play.textContent='일시정지';
 slider.oninput=()=>{scrub=Number(slider.value);play.textContent='재생';};
 play.onclick=()=>{if(scrub===null){scrub=monkTime();play.textContent='재생';}else{monkStart=performance.now()-scrub*1000;scrub=null;play.textContent='일시정지';}};
 bar.append(other,slider,play);
 const direction=front?new Vector3(.57,0,.82):new Vector3(.94,0,-.34);
 const centre=new Vector3(-1.44,2.62,43.05);
 camera.lowerRadiusLimit=.65;camera.minZ=front?1.55:1.3;
 camera.setTarget(centre);camera.setPosition(centre.add(direction.scale(2.55)).add(new Vector3(0,.40,0)));
 const fill=new HemisphericLight('monk-review-fill',direction.add(new Vector3(0,.5,0)),scene);fill.intensity=.38;
 scene.onBeforeRenderObservable.add(()=>{if(scrub===null)slider.value=String(monkTime());});
}
const render=()=>scene.render();
function visibility(){if(document.hidden)engine.stopRenderLoop(render);else engine.runRenderLoop(render);}
visibility();document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',()=>{engine.resize();framePreview();});
