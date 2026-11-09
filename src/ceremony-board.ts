import {scheduleAt} from './daily-schedule';
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
 let attending=0,playing='',failed=false;
 const buffers=new Map<string,Promise<AudioBuffer>>();
 function stop(){
  attending=0;playing='';buffers.clear();source?.stop();source=null;gain=null;
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
   node.onended=()=>node.disconnect();node.start(0,active.seconds%buffer.duration);source=node;
  }catch{if(ctx===context){stop();failed=true;render();}}
 }
 function render(){
  if(document.hidden)return;
  void syncClock();
  const {current,next}=scheduleAt(now());
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
  try{context=new AudioContext();gain=context.createGain();gain.gain.value=volume();gain.connect(context.destination);await context.resume();}
  catch{stop();failed=true;}
  render();
 };
 window.setInterval(render,500);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else{lastSync=-Infinity;render();}});
 window.addEventListener('pagehide',()=>{stop();});
 render();
 return {stop,updateVolume(){if(gain)gain.gain.value=volume();}};
}
