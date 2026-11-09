import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import type {Scene} from '@babylonjs/core/scene';
import type {Vector3} from '@babylonjs/core/Maths/math.vector';
import {prayerLight,reducedMotion} from './practice-light';
import {t} from './locales';

export function rainbow(scene:Scene,position:Vector3){
 const texture=new DynamicTexture('bow-completion-rosette',512,scene,false);
 const ctx=texture.getContext() as CanvasRenderingContext2D;
 ctx.translate(256,256);
 const glow=ctx.createRadialGradient(0,0,0,0,0,244);
 glow.addColorStop(0,'rgba(255,216,143,.20)');glow.addColorStop(.56,'rgba(231,159,176,.35)');
 glow.addColorStop(.90,'rgba(112,84,181,.43)');glow.addColorStop(1,'transparent');
 ctx.fillStyle=glow;ctx.fillRect(-256,-256,512,512);
 // Soft, overlapping radial panes leave the floor visible between the colours.
 const tones=['255,126,111','139,111,255','255,193,103','174,141,255'];
 for(const [petals,radius,length,width,offset] of [[16,163,73,22,.04],[10,92,72,27,.21]]){
  for(let i=0;i<petals;i++){
   const rgb=tones[i%tones.length];
   ctx.save();ctx.rotate(i*2*Math.PI/petals+offset);ctx.translate(radius,0);ctx.scale(length,width);
   const pane=ctx.createRadialGradient(0,0,0,0,0,1);
   pane.addColorStop(0,'rgba('+rgb+',.95)');pane.addColorStop(.60,'rgba('+rgb+',.83)');pane.addColorStop(1,'rgba('+rgb+',0)');
   ctx.fillStyle=pane;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
 }
 const rim=ctx.createRadialGradient(0,0,206,0,0,252);
 rim.addColorStop(0,'transparent');rim.addColorStop(.39,'rgba(255,238,191,.90)');
 rim.addColorStop(.53,'#fff5d7');rim.addColorStop(.72,'rgba(255,228,177,.36)');rim.addColorStop(1,'transparent');
 ctx.fillStyle=rim;ctx.fillRect(-256,-256,512,512);
 texture.hasAlpha=true;texture.update();
 const material=new StandardMaterial('bow-rainbow-light',scene);material.disableLighting=true;
 material.emissiveColor=Color3.White();material.diffuseTexture=material.emissiveTexture=texture;material.useAlphaFromDiffuseTexture=true;material.disableDepthWrite=true;
 const ring=MeshBuilder.CreateGround('bow-rainbow-ring',{width:4,height:4},scene);
 ring.material=material;ring.isPickable=false;ring.position.copyFrom(position);ring.position.y+=.104;
 const reduced=reducedMotion();
 let elapsed=0;
 const observer=scene.onBeforeRenderObservable.add(()=>{
  elapsed+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
  const progress=Math.min(1,elapsed/3.45);
  // Match the finishing rim to the radius of the resting gold halo.
  const unfold=Math.min(1,Math.max(0,elapsed-.25)/1.65);
  const eased=unfold*unfold*(3-2*unfold);
  ring.scaling.setAll(reduced?.59:.59+.74*eased);
  const appear=Math.min(1,elapsed/.65);
  const tail=Math.min(1,(1-progress)*2.8);
  material.alpha=appear*appear*(3-2*appear)*tail*tail*(3-2*tail);
  if(progress===1){scene.onBeforeRenderObservable.remove(observer);ring.dispose();material.dispose(false,true);}
 });
}

export function bowPractice(scene:Scene,position:Vector3,faceAltar:()=>void,pose:(depth:number)=>void){
 const button=document.querySelector<HTMLButtonElement>('#bow-start')!,stop=document.querySelector<HTMLButtonElement>('#bow-stop')!;
 const status=document.querySelector<HTMLElement>('#bow-count')!;
 let id='',count=0,elapsed=-1,busy=false,generation=0,visible=false;
 let light:ReturnType<typeof prayerLight>|undefined;
 function draw(){
  button.hidden=!visible;button.disabled=busy||elapsed>=0;
  button.textContent=t(id?'절하기':'108배 시작');stop.hidden=!visible||!id;stop.textContent=t('취소');
 }
 async function request(action:string,data:object){
  const result=await fetch('/api/service/practice/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  if(!result.ok)throw new Error(String(result.status));return result.json();
 }
 function cancel(){
  light?.cancel();light=undefined;
  const old=id;generation++;id='';count=0;elapsed=-1;busy=false;status.textContent='';pose(0);draw();
  if(old)void request('cancel',{id:old}).catch(()=>{});
 }
 function failed(error:unknown){
  if(error instanceof Error&&['401','409'].includes(error.message)){
   cancel();
   if(error.message==='401')window.dispatchEvent(new Event('sasa:practice-login'));
  }
  status.textContent=t(error instanceof Error&&error.message==='401'?'계정 메뉴에서 먼저 로그인하세요.':'다시 시도해 주세요.');
 }
 button.onclick=async()=>{
  if(!visible||busy||elapsed>=0)return;
  if(id){faceAltar();elapsed=0;draw();return;}
  const version=generation;busy=true;draw();
  try{
   const run=await request('start',{});
   if(version!==generation){void request('cancel',{id:run.id}).catch(()=>{});return;}
   faceAltar();light=prayerLight(scene,position);id=run.id;count=0;status.textContent='0 / 108';
  }catch(error){if(version===generation)failed(error);}
  finally{if(version===generation){busy=false;draw();}}
 };
 async function record(){
  const version=generation;busy=true;draw();
  try{
   const result=await request('bow',{id,count:count+1});if(version!==generation)return;
   count=result.count;status.textContent=count+' / 108';
   if(count===108){id='';status.textContent=t('108배 완료');light?.fade();light=undefined;rainbow(scene,position);}
  }catch(error){if(version===generation)failed(error);}
  finally{if(version===generation){busy=false;draw();}}
 }
 window.addEventListener('sasa:resume-practice',()=>{if(visible&&!id&&!busy)button.click();});
 stop.onclick=cancel;window.addEventListener('sasa:account',cancel);
 return {cancel,get active(){return !!id||busy;},get progress(){return Math.max(0,Math.min(1,elapsed/4.8));},get bowing(){return elapsed>=0;},
  show(value:boolean){if(value===visible)return;visible=value;if(!value)cancel();else draw();},
  update(dt:number){if(elapsed<0)return;elapsed+=Math.min(.1,dt);
   const phase=Math.min(1,elapsed/4.8);pose(phase);
   if(phase===1){elapsed=-1;pose(0);void record();}
  }};
}
