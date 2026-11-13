import{audioFocusLevel,setAudioFocus,watchAudioFocus}from'./audio-focus';
import {scheduleAt,services} from './daily-schedule';
import {locale,t} from './locales';

export function ceremonyBoard(root:HTMLElement,position:()=>number[]|null,view:()=>string,volume:()=>number){
 const panel=document.createElement('aside');
 panel.className='ceremony-board';panel.hidden=true;
 const currentLine=document.createElement('strong'),nextLine=document.createElement('small'),action=document.createElement('button');
 panel.append(currentLine,nextLine,action);root.append(panel);
 const minutes=new Intl.NumberFormat(locale,{style:'unit',unit:'minute',unitDisplay:'long'});
 const localTime=new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const localZone=localTime.resolvedOptions().timeZone;
 let base=Date.now()-performance.now(),synced=false,lastSync=-Infinity,syncing=false;
 const now=()=>base+performance.now();
 async function syncClock(){
  if(import.meta.env.MODE!=='service'||syncing||performance.now()-lastSync<60000)return;
  syncing=true;lastSync=performance.now();
  try{
   const response=await fetch('/api/service/time',{cache:'no-store',signal:AbortSignal.timeout(4000)});
   if(!response.ok)return;
   const {time}=await response.json();
   if(Number.isFinite(time)){base=time-(lastSync+performance.now())/2;synced=true;}
  }catch{/* Retry on the next clock refresh. */}finally{syncing=false;}
 }
 let context:AudioContext|null=null,gain:GainNode|null=null,source:AudioBufferSourceNode|null=null;
 const audioOwner={};const level=()=>{if(gain&&context)gain.gain.setTargetAtTime(volume()*audioFocusLevel('ceremony'),context.currentTime,.12);};
 const unwatch=watchAudioFocus(level);window.addEventListener('pagehide',unwatch,{once:true});
 let attending=0,playing='',failed=false,notified=0;
 const schedule=document.createElement('dialog');schedule.id='schedule-panel';schedule.className='service-panel';schedule.setAttribute('aria-labelledby','schedule-title');root.append(schedule);schedule.addEventListener('close',()=>document.querySelector<HTMLElement>('#menu-open')?.focus());
 function openSchedule(){
  schedule.replaceChildren();const heading=document.createElement('div');heading.className='panel-title';const h=document.createElement('h2');h.id='schedule-title';h.textContent=t('오늘의 일정');const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label',t('닫기'));close.onclick=()=>schedule.close();heading.append(h,close);schedule.append(heading);
  const {current,next}=scheduleAt(now());const currentText=document.createElement('p');currentText.textContent=t(current?'함께 듣기':'자율 수행')+' · '+(current?t(current.title):t('다음 일정')+' '+t(next.title));schedule.append(currentText);
  for(const entry of services){const line=document.createElement('div');line.className='schedule-row';const time=document.createElement('strong'),label=document.createElement('span');time.textContent=String(entry.hour).padStart(2,'0')+':00 KST';label.textContent=t(entry.title);line.append(time,label);schedule.append(line);}
  if(current){const listen=document.createElement('button');listen.className='service-primary';listen.textContent=t(attending?'듣기 중지':'함께 듣기');listen.disabled=import.meta.env.MODE==='service'&&!synced;listen.onclick=()=>{schedule.close();action.click();};schedule.append(listen);}
  schedule.showModal();
 }
 const notification=document.createElement('button');notification.id='schedule-notification';notification.hidden=true;notification.onclick=openSchedule;root.append(notification);
 const buffers=new Map<string,Promise<AudioBuffer>>();
 function stop(){
  setAudioFocus(audioOwner,'ceremony',false);attending=0;playing='';buffers.clear();source?.stop();source=null;gain=null;
  if(context)void context.close().catch(()=>{});context=null;
 }
 async function play(clip:string){
  const ctx=context;if(!ctx||!gain)return;
  playing=clip;source?.stop();source=null;
  try{
   if(!buffers.has(clip))buffers.set(clip,(async()=>{
    const res=await fetch('/ceremonies/'+clip+'.mp3');
    if(!res.ok)throw Error('audio');return ctx.decodeAudioData(await res.arrayBuffer());
   })());
   const buffer=await buffers.get(clip)!;
   const active=scheduleAt(now()).current;
   if(ctx!==context||!gain||playing!==clip||active?.clip!==clip||active.start!==attending)return;
   const node=ctx.createBufferSource();node.buffer=buffer;node.loop=true;node.connect(gain);
   node.onended=()=>node.disconnect();node.start(0,active.seconds%buffer.duration);source=node;setAudioFocus(audioOwner,'ceremony',true);
  }catch{if(ctx===context){stop();failed=true;render();}}
 }
 function render(){
  if(document.hidden)return;
  void syncClock();
  const {current,next}=scheduleAt(now());
  const until=next.start-now();if(until>0&&until<=5*60000&&notified!==next.start){notified=next.start;notification.textContent=String(next.hour).padStart(2,'0')+':00 KST · '+t(next.title);notification.hidden=false;setTimeout(()=>notification.hidden=true,7000);}
  panel.dataset.listening=String(!!attending);
  if(attending&&current?.start!==attending)stop();
  const p=position(),atGate=p?Math.abs(p[0])<11&&p[2]>=-70&&p[2]<=-44:['gatePassage','gateWalk','gateEave','guardianGallery','cheonwang','gateExitOffice'].includes(view());
  const inHall=p?Math.abs(p[0])<17&&Math.abs(p[2]-38)<12:['daeung','sanctuary','shrine','seating'].includes(view());
  panel.hidden=!document.body.classList.contains('exploring')||!(atGate||inHall||attending);
  if(panel.hidden&&!attending)return;
  currentLine.textContent=current?t(current.title)+' · '+t('대웅전')+' · '+t('{time} 남음').replace('{time}',minutes.format(Math.max(0,Math.ceil((current.start+current.minutes*60000-now())/60000)))):t('자율 수행');
  nextLine.textContent=t('다음 일정')+' · '+String(next.hour).padStart(2,'0')+':00 KST · '+t(next.title)+(localZone==='Asia/Seoul'?'':' ('+localTime.format(next.start)+')');
  action.hidden=!current;action.disabled=import.meta.env.MODE==='service'&&!synced;
  action.textContent=t(attending?'듣기 중지':failed?'다시 시도해 주세요.':'함께 듣기');
  if(attending&&current&&context?.state==='running'){
   if(playing!==current.clip)void play(current.clip);
  }
 }
 action.onclick=async()=>{
  if(attending){stop();render();return;}
  const active=scheduleAt(now()).current;if(!active)return;
  failed=false;attending=active.start;
  try{context=new AudioContext();gain=context.createGain();gain.gain.value=volume()*audioFocusLevel('ceremony');gain.connect(context.destination);await context.resume();}
  catch{stop();failed=true;}
  render();
 };
 window.setInterval(render,500);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else{lastSync=-Infinity;render();}});
 window.addEventListener('pagehide',()=>{stop();});
 render();
 return {stop,openSchedule,updateVolume:level};
}
