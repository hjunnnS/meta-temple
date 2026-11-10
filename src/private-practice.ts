import {Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector';
import type {visitorMesh} from './walking';
import {privatePracticeState} from './private-practice-state';
import {reducedMotion} from './practice-light';

export function privateMeditationPose(body:ReturnType<typeof visitorMesh>,seated:number,time:number){
 body.bow(0);body.hips.position.y=.63-.51*seated;body.chest.rotation.x=.035*seated;body.head.rotation.x=.08*seated;
 body.chest.scaling.y=1+(reducedMotion()?0:.006*Math.sin(time*1.05))*seated;
 for(let i=0;i<2;i++){
  const side=i===0?-1:1,thigh=Quaternion.Identity(),shin=Quaternion.Identity();
  // Spread the knees and fold the feet inward above the cushion, rather than
  // bending the lower legs down through it.
  Quaternion.FromUnitVectorsToRef(Vector3.Down(),new Vector3(side*.24,-.08,.25).normalize(),thigh);
  Quaternion.FromUnitVectorsToRef(Vector3.Down(),new Vector3(-side*.42,-.005,-.04).normalize(),shin);
  body.legs[i].rotationQuaternion=Quaternion.Slerp(Quaternion.Identity(),thigh,seated);
  body.shins[i].rotationQuaternion=Quaternion.Slerp(Quaternion.Identity(),thigh.conjugate().multiply(shin),seated);
  const arm=body.arms[i],elbow=body.forearms[i],target=Vector3.Lerp(new Vector3(arm.position.x,arm.position.y-.50,0),new Vector3(side*.065,.12,.24),seated);
  const axis=target.subtract(arm.position),length=Math.min(.504,axis.length());axis.normalize();
  const hint=new Vector3(side*.65,-.8,-.1),bend=hint.subtract(axis.scale(Vector3.Dot(hint,axis))).normalize(),along=(.255*.255-.25*.25+length*length)/(2*length);
  const upper=axis.scale(along).add(bend.scale(Math.sqrt(Math.max(0,.255*.255-along*along)))),lower=axis.scale(length).subtract(upper),a=Quaternion.Identity(),b=Quaternion.Identity();
  Quaternion.FromUnitVectorsToRef(Vector3.Down(),upper.normalize(),a);Quaternion.FromUnitVectorsToRef(Vector3.Down(),lower.normalize(),b);arm.rotationQuaternion=a;elbow.rotationQuaternion=a.conjugate().multiply(b);
 }
}

export function privatePractice(body:ReturnType<typeof visitorMesh>,canvas:HTMLCanvasElement,onStart:()=>void){
 const state=privatePracticeState(),panel=document.querySelector('#private-room-controls')!,section=document.createElement('div');section.id='private-practice';section.setAttribute('aria-label','개인 수행');
 section.innerHTML='<button id="private-bow">불단 앞에서 절하기</button><button id="private-meditate">방석에 앉아 명상</button><button id="private-practice-stop" hidden>수행 마치기</button><output id="private-practice-status" aria-live="polite" style="display:block;margin:8px 0;max-width:320px;line-height:1.4"></output>';
 panel.append(section);
 const bow=section.querySelector<HTMLButtonElement>('#private-bow')!,meditate=section.querySelector<HTMLButtonElement>('#private-meditate')!,stop=section.querySelector<HTMLButtonElement>('#private-practice-stop')!,status=section.querySelector<HTMLOutputElement>('#private-practice-status')!;
 let wasActive=false,clock=0,lastStatus='';
 function reset(){for(const leg of body.legs){leg.rotationQuaternion=null;leg.rotation.setAll(0);}for(const shin of body.shins){shin.rotationQuaternion=null;shin.rotation.setAll(0);}body.bow(0);body.chest.scaling.y=1;}
 function start(kind:'bow'|'meditate'){
  if(!state.start(kind))return;onStart();reset();body.root.position.set(0,kind==='bow'?.178:.275,kind==='bow'?2.75:4.55);body.root.rotation.y=0;wasActive=true;clock=0;canvas.focus();
 }
 bow.onclick=()=>start('bow');meditate.onclick=()=>start('meditate');stop.onclick=()=>{state.stop();canvas.focus();};
 const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&state.active)state.stop();};canvas.addEventListener('keydown',escape);
 return {stop:state.stop,get active(){return state.active;},get cameraHeight(){return state.mode==='bow'?1.05:1.2-.4*state.seated;},
 update(dt:number,moving:boolean){
  if(moving&&state.active)state.stop();state.tick(Math.min(.1,dt));clock+=Math.min(.1,dt);
  if(state.mode==='bow'){reset();body.bow(state.bowProgress);}
  else if(state.active)privateMeditationPose(body,state.seated,clock);
  else if(wasActive){reset();wasActive=false;}
  const seconds=Math.floor(state.meditationTime),time=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  const text=state.mode==='bow'?(state.stopping?'현재 절을 마무리하고 일어납니다.':'합장하고 불단 앞에 절을 올립니다.'):state.mode==='lowering'?'방석에 앉고 있습니다.':state.mode==='meditating'?'명상 중 · '+time:state.mode==='rising'?'천천히 일어나고 있습니다.':state.count?'절 '+state.count+'회 완료 · 자유롭게 머무르세요.':'절하거나 방석에 앉아 잠시 마음을 쉬어 보세요.';
  if(text!==lastStatus){lastStatus=text;status.textContent=text;}section.dataset.mode=state.mode;section.dataset.bowCount=String(state.count);
  bow.disabled=meditate.disabled=state.active;stop.hidden=!state.active;stop.disabled=state.mode==='rising';
  return state.active;
 },dispose(){canvas.removeEventListener('keydown',escape);section.remove();}};
}
