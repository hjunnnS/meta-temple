import './practice-feedback.css';
import{practiceClock}from'./motion-timing';
import{BOW_SECONDS}from'./motion-timing';
import{practiceOutcome}from'./practice-outcome';
import{audioFocusLevel,setAudioFocus,watchAudioFocus}from'./audio-focus';
import type {Scene} from '@babylonjs/core/scene';import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {goldRing,prayerLight,reducedMotion} from './practice-light';import type {PracticeEvent} from './practice-events';import {t} from './locales';
/** Original temporary sound design. No remote audio, extra lights, or persistent practice data. */
export function practiceExperience(scene:Scene,pose:()=>{position:number[];bowProgress:number;animation?:string},volume:()=>number,space:'public'|'private'='public',stop?:()=>void){
 const panel=document.createElement('section');panel.id=space==='private'?'private-practice-feedback':'practice-feedback';panel.className='practice-feedback';panel.hidden=true;panel.setAttribute('aria-label',t('수행'));
 const title=document.createElement('strong'),status=document.createElement('p'),breath=document.createElement('span');title.className='practice-title';status.className='practice-detail';breath.className='practice-breath';breath.setAttribute('aria-hidden','true');const dot=document.createElement('i');dot.className='practice-status-dot';dot.setAttribute('aria-hidden','true');
 const label=document.createElement('span'),metrics=document.createElement('div'),timer=document.createElement('output'),counter=document.createElement('output'),progress=document.createElement('progress');metrics.className='practice-metrics';timer.className='practice-timer';timer.setAttribute('aria-label',t('경과 시간'));timer.setAttribute('aria-live','off');counter.className='practice-counter';counter.setAttribute('aria-live','polite');counter.setAttribute('aria-label',t('완료한 절'));progress.className='practice-progress';progress.max=108;progress.hidden=true;title.append(dot,label);metrics.append(timer,counter);panel.append(title,metrics,progress,status,breath);document.body.append(panel);
 let active:PracticeEvent|null=null,elapsed=0,tail=0,lastBeat=-1,context:AudioContext|null=null,gain:GainNode|null=null;
 let light:ReturnType<typeof prayerLight>|undefined,ring:ReturnType<typeof goldRing>|undefined;
 const outcome=document.createElement('p');outcome.id=space+'-practice-outcome';outcome.className='practice-outcome';outcome.hidden=true;outcome.setAttribute('role','status');outcome.setAttribute('aria-live','polite');outcome.setAttribute('aria-atomic','true');document.body.append(outcome);let outcomeTimer:number|undefined;
 const clearOutcome=()=>{window.clearTimeout(outcomeTimer);outcome.hidden=true;outcome.textContent='';};
 const audioOwner={};
 const finish=document.createElement('button');finish.type='button';finish.id=space+'-practice-return';finish.textContent=t('수행 마치기');finish.style.pointerEvents='auto';finish.onclick=()=>{stop?.();};if(stop)panel.append(finish);
 const nodes=new Set<AudioScheduledSourceNode>();
 function silence(){for(const n of nodes)try{n.stop();}catch{}nodes.clear();if(context){void context.close().catch(()=>{});context=null;gain=null;}panel.dataset.audio='stopped';}
 function reset(){clearOutcome();setAudioFocus(audioOwner,'practice',false);active=null;light?.cancel();light=undefined;ring?.mesh.dispose();ring?.material.dispose(false,true);ring=undefined;tail=0;panel.hidden=true;silence();}
 async function sound(){if(context||document.hidden||volume()<=0)return;const c=new AudioContext();context=c;gain=c.createGain();gain.gain.value=volume()*.22*audioFocusLevel('practice');gain.connect(c.destination);try{await c.resume();if(context===c)panel.dataset.audio='playing';}catch{if(context===c)silence();}}
 function knock(){if(!context||!gain||volume()<=0)return;const c=context,b=c.createBuffer(1,Math.floor(c.sampleRate*.4),c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++){const time=i/c.sampleRate;a[i]=Math.sin(2*Math.PI*520*time)*Math.exp(-time*28)*.5+Math.sin(2*Math.PI*870*time)*Math.exp(-time*42)*.18;}const s=c.createBufferSource();s.buffer=b;s.connect(gain);nodes.add(s);s.onended=()=>nodes.delete(s);s.start();}
 function nature(){if(!context||!gain)return;const c=context,b=c.createBuffer(1,c.sampleRate*8,c.sampleRate),a=b.getChannelData(0);let seed=93,value=0;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;value=.996*value+.004*(seed/2147483648-1);a[i]=value*.7*Math.sin(Math.PI*i/a.length)**2;}const s=c.createBufferSource();s.buffer=b;s.loop=true;s.connect(gain);nodes.add(s);s.start();}
 const onPractice=(event:Event)=>{const e=(event as CustomEvent<PracticeEvent>).detail;if((e.space??'public')!==space)return;
  if(e.status==='started'){reset();active=e;setAudioFocus(audioOwner,'practice',true);finish.hidden=false;finish.textContent=t(e.kind==='108'?'그만하기':'수행 마치기');elapsed=0;lastBeat=-1;timer.textContent='00:00';counter.hidden=e.kind!=='108';progress.hidden=e.kind!=='108';counter.textContent='0 / 108';progress.value=0;panel.hidden=false;dot.style.background='';panel.dataset.kind=e.kind;panel.dataset.state='active';if(e.kind!=='108'){const p=Vector3.FromArray(pose().position);light=prayerLight(scene,p,e.kind==='meditation'?.22:.45);}void sound().then(()=>{if(active?.id===e.id){if(e.kind==='meditation')nature();else knock();}});return;}
  if(active?.id!==e.id)return;light?.cancel();light=undefined;silence();setAudioFocus(audioOwner,'practice',false);active=null;finish.hidden=true;
  if(e.status==='cancelled'){reset();outcome.textContent=t(practiceOutcome(e.kind,'cancelled'));outcome.hidden=document.hidden;outcomeTimer=window.setTimeout(clearOutcome,3500);return;}
  if(e.kind==='108'){counter.textContent=(e.count??108)+' / 108';progress.value=e.count??108;}
  panel.dataset.state='completed';label.textContent=t(practiceOutcome(e.kind,'completed'));dot.style.background='#d4bc79';status.textContent=t('잠시 여운을 느껴 보세요.');tail=2.8;
  // The 108-bow session retains its existing larger rainbow completion.
  if(e.kind!=='108'){ring=goldRing(scene,3);ring.mesh.position.copyFrom(Vector3.FromArray(pose().position));ring.mesh.position.y+=.12;}
 };
 window.addEventListener('sasa:practice-event',onPractice);
 const hide=()=>{if(document.hidden){clearOutcome();silence();light?.cancel();light=undefined;panel.hidden=true;}else if(active){const id=active.id;panel.hidden=false;if(active.kind!=='108')light=prayerLight(scene,Vector3.FromArray(pose().position),active.kind==='meditation'?.22:.45);void sound().then(()=>{if(active?.id===id&&active.kind==='meditation')nature();});}};document.addEventListener('visibilitychange',hide);
 const onSpace=()=>reset();window.addEventListener('sasa:space',onSpace);window.addEventListener('sasa:relocate',onSpace);
 const level=()=>{if(volume()<=0)silence();else if(gain&&context)gain.gain.setTargetAtTime(volume()*.22*audioFocusLevel('practice'),context.currentTime,.05);else if(active&&!document.hidden){const id=active.id;void sound().then(()=>{if(active?.id===id){if(active.kind==='meditation')nature();else knock();}});}};document.querySelector('#master-mute')?.addEventListener('change',level);document.querySelector('#audio-volume')?.addEventListener('input',level);
 const unwatch=watchAudioFocus(()=>{if(gain&&context)gain.gain.setTargetAtTime(volume()*.22*audioFocusLevel('practice'),context.currentTime,.12);});
 const observer=scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);if(!active){if(tail>0){tail-=dt;if(ring){ring.mesh.scaling.setAll(reducedMotion()?1:1+(2.8-tail)*.3);ring.material.alpha=Math.min(1,tail);}if(tail<=0)reset();}return;}
  const bowState=active.kind==='108'?document.querySelector<HTMLElement>('#bow-count')?.dataset.state:undefined;
  if(bowState!=='paused')elapsed+=dt;panel.dataset.state=bowState==='paused'?'paused':'active';const phase=pose().bowProgress;panel.dataset.phase=active.kind==='meditation'?'breathing':phase<.2?'palms':phase<.4?'kneeling':phase<.8?'bowing':'rising';
  label.textContent=t(active.kind==='meditation'?'명상 중':active.kind==='108'?(bowState==='paused'?'108배 일시정지':'108배 수행 중'):'참배 중');
  const clock=practiceClock(elapsed);if(timer.textContent!==clock)timer.textContent=clock;
  if(active.kind==='108'){const source=document.querySelector<HTMLElement>('#bow-count'),completed=Math.max(0,Math.min(108,Number(source?.dataset.count??0))),text=completed+' / 108';if(counter.textContent!==text)counter.textContent=text;progress.value=completed;}
  status.textContent=active.kind==='108'&&bowState==='paused'?t('계속하기를 누르면 이어집니다.'):active.kind==='108'&&bowState==='pausing'?t('이번 절을 마친 뒤 잠시 쉽니다.'):active.kind==='108'&&bowState==='confirming'?t('완료 횟수를 확인하고 있습니다.'):active.kind==='meditation'?t(elapsed%8<4?'천천히 숨을 들이쉬세요.':'천천히 숨을 내쉬세요.'):t(phase<.2?'합장하고 있습니다.':phase<.4?'무릎을 꿇고 있습니다.':phase<.8?'절을 올리고 있습니다.':'몸을 일으키고 있습니다.');
  breath.style.transform='scale('+(reducedMotion()?1:.8+.2*Math.sin(elapsed*Math.PI/4-Math.PI/2))+')';
  if(bowState!=='paused'&&active.kind!=='meditation'&&Math.floor(elapsed/BOW_SECONDS)!==lastBeat){lastBeat=Math.floor(elapsed/BOW_SECONDS);if(elapsed>.5)knock();}
 });
 scene.onDisposeObservable.add(()=>{reset();unwatch();scene.onBeforeRenderObservable.remove(observer);window.removeEventListener('sasa:practice-event',onPractice);document.removeEventListener('visibilitychange',hide);window.removeEventListener('sasa:space',onSpace);window.removeEventListener('sasa:relocate',onSpace);document.querySelector('#master-mute')?.removeEventListener('change',level);document.querySelector('#audio-volume')?.removeEventListener('input',level);panel.remove();outcome.remove();});
}
