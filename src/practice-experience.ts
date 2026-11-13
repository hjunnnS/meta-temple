import{audioFocusLevel,setAudioFocus,watchAudioFocus}from'./audio-focus';
import type {Scene} from '@babylonjs/core/scene';import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {goldRing,prayerLight,reducedMotion} from './practice-light';import type {PracticeEvent} from './practice-events';import {t} from './locales';
/** Original temporary sound design. No remote audio, extra lights, or persistent practice data. */
export function practiceExperience(scene:Scene,pose:()=>{position:number[];bowProgress:number;animation?:string},volume:()=>number,space:'public'|'private'='public',stop?:()=>void){
 const panel=document.createElement('section');panel.id=space==='private'?'private-practice-feedback':'practice-feedback';panel.className='practice-feedback';panel.hidden=true;panel.setAttribute('aria-label',t('수행'));
 const title=document.createElement('strong'),status=document.createElement('p'),breath=document.createElement('span');breath.className='practice-breath';breath.setAttribute('aria-hidden','true');panel.append(title,status,breath);document.body.append(panel);
 let active:PracticeEvent|null=null,elapsed=0,tail=0,lastBeat=-1,context:AudioContext|null=null,gain:GainNode|null=null;
 let light:ReturnType<typeof prayerLight>|undefined,ring:ReturnType<typeof goldRing>|undefined;
 const audioOwner={};
 const finish=document.createElement('button');finish.type='button';finish.id=space+'-practice-return';finish.textContent=t('수행 마치기');finish.style.pointerEvents='auto';finish.onclick=()=>{stop?.();};if(stop)panel.append(finish);
 const nodes=new Set<AudioScheduledSourceNode>();
 function silence(){for(const n of nodes)try{n.stop();}catch{}nodes.clear();if(context){void context.close().catch(()=>{});context=null;gain=null;}panel.dataset.audio='stopped';}
 function reset(){setAudioFocus(audioOwner,'practice',false);active=null;light?.cancel();light=undefined;ring?.mesh.dispose();ring?.material.dispose(false,true);ring=undefined;tail=0;panel.hidden=true;silence();}
 async function sound(){if(context||document.hidden||volume()<=0)return;const c=new AudioContext();context=c;gain=c.createGain();gain.gain.value=volume()*.22*audioFocusLevel('practice');gain.connect(c.destination);try{await c.resume();if(context===c)panel.dataset.audio='playing';}catch{if(context===c)silence();}}
 function knock(){if(!context||!gain||volume()<=0)return;const c=context,b=c.createBuffer(1,Math.floor(c.sampleRate*.4),c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++){const time=i/c.sampleRate;a[i]=Math.sin(2*Math.PI*520*time)*Math.exp(-time*28)*.5+Math.sin(2*Math.PI*870*time)*Math.exp(-time*42)*.18;}const s=c.createBufferSource();s.buffer=b;s.connect(gain);nodes.add(s);s.onended=()=>nodes.delete(s);s.start();}
 function nature(){if(!context||!gain)return;const c=context,b=c.createBuffer(1,c.sampleRate*8,c.sampleRate),a=b.getChannelData(0);let seed=93,value=0;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;value=.996*value+.004*(seed/2147483648-1);a[i]=value*.7*Math.sin(Math.PI*i/a.length)**2;}const s=c.createBufferSource();s.buffer=b;s.loop=true;s.connect(gain);nodes.add(s);s.start();}
 const onPractice=(event:Event)=>{const e=(event as CustomEvent<PracticeEvent>).detail;if((e.space??'public')!==space)return;
  if(e.status==='started'){reset();active=e;setAudioFocus(audioOwner,'practice',true);finish.hidden=false;elapsed=0;lastBeat=-1;panel.hidden=false;panel.dataset.kind=e.kind;panel.dataset.state='active';if(e.kind!=='108'){const p=Vector3.FromArray(pose().position);light=prayerLight(scene,p,e.kind==='meditation'?.22:.45);}void sound().then(()=>{if(active?.id===e.id){if(e.kind==='meditation')nature();else knock();}});return;}
  if(active?.id!==e.id)return;light?.cancel();light=undefined;silence();setAudioFocus(audioOwner,'practice',false);active=null;finish.hidden=true;
  if(e.status==='cancelled'){reset();return;}
  panel.dataset.state='completed';title.textContent=t('마음을 돌보는 시간을 가지셨습니다');status.textContent=t('잠시 여운을 느껴 보세요.');tail=2.8;
  // The 108-bow session retains its existing larger rainbow completion.
  if(e.kind!=='108'){ring=goldRing(scene,3);ring.mesh.position.copyFrom(Vector3.FromArray(pose().position));ring.mesh.position.y+=.12;}
 };
 window.addEventListener('sasa:practice-event',onPractice);
 const hide=()=>{if(document.hidden){silence();light?.cancel();light=undefined;panel.hidden=true;}else if(active){const id=active.id;panel.hidden=false;if(active.kind!=='108')light=prayerLight(scene,Vector3.FromArray(pose().position),active.kind==='meditation'?.22:.45);void sound().then(()=>{if(active?.id===id&&active.kind==='meditation')nature();});}};document.addEventListener('visibilitychange',hide);
 const onSpace=()=>reset();window.addEventListener('sasa:space',onSpace);window.addEventListener('sasa:relocate',onSpace);
 const level=()=>{if(volume()<=0)silence();else if(gain&&context)gain.gain.setTargetAtTime(volume()*.22*audioFocusLevel('practice'),context.currentTime,.05);else if(active&&!document.hidden){const id=active.id;void sound().then(()=>{if(active?.id===id){if(active.kind==='meditation')nature();else knock();}});}};document.querySelector('#master-mute')?.addEventListener('change',level);document.querySelector('#audio-volume')?.addEventListener('input',level);
 const unwatch=watchAudioFocus(()=>{if(gain&&context)gain.gain.setTargetAtTime(volume()*.22*audioFocusLevel('practice'),context.currentTime,.12);});
 const observer=scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);if(!active){if(tail>0){tail-=dt;if(ring){ring.mesh.scaling.setAll(reducedMotion()?1:1+(2.8-tail)*.3);ring.material.alpha=Math.min(1,tail);}if(tail<=0)reset();}return;}
  elapsed+=dt;const phase=pose().bowProgress;panel.dataset.phase=active.kind==='meditation'?'breathing':phase<.2?'palms':phase<.4?'kneeling':phase<.8?'bowing':'rising';
  title.textContent=t(active.kind==='meditation'?'명상하기':active.kind==='108'?'수행':'참배')+(active.kind==='108'?' · 108':'');
  status.textContent=active.kind==='108'&&pose().animation!=='worship'?t('절하기')+' · '+(document.querySelector('#bow-count')?.textContent??''):active.kind==='meditation'?t(elapsed%8<4?'천천히 숨을 들이쉬세요.':'천천히 숨을 내쉬세요.')+' · '+Math.floor(elapsed)+'s':t(phase<.2?'합장하고 있습니다.':phase<.4?'무릎을 꿇고 있습니다.':phase<.8?'절을 올리고 있습니다.':'몸을 일으키고 있습니다.')+(active.kind==='108'?' · '+(document.querySelector('#bow-count')?.textContent??''):'');
  breath.style.transform='scale('+(reducedMotion()?1:.8+.2*Math.sin(elapsed*Math.PI/4-Math.PI/2))+')';
  if(active.kind!=='meditation'&&Math.floor(elapsed/4.8)!==lastBeat){lastBeat=Math.floor(elapsed/4.8);if(elapsed>.5)knock();}
 });
 scene.onDisposeObservable.add(()=>{reset();unwatch();scene.onBeforeRenderObservable.remove(observer);window.removeEventListener('sasa:practice-event',onPractice);document.removeEventListener('visibilitychange',hide);window.removeEventListener('sasa:space',onSpace);window.removeEventListener('sasa:relocate',onSpace);document.querySelector('#master-mute')?.removeEventListener('change',level);document.querySelector('#audio-volume')?.removeEventListener('input',level);panel.remove();});
}
