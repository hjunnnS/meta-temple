import{audioFocusLevel,watchAudioFocus}from'./audio-focus';
import { templePlaces } from './temple-layout.ts';

type Soundscape='courtyard'|'forest'|'hall'|'bell';
const labels:Record<Soundscape,string>={courtyard:'마당 바람',forest:'숲바람과 새소리',hall:'법당 목탁',bell:'범종 여운'};

export function soundscapeAt(x:number,z:number):Soundscape {
 for(const place of templePlaces){
  const dx=Math.abs(x-place.x),dz=Math.abs(z-place.z);
  if(place.kind==='bell'&&dx<7&&dz<7)return 'bell';
  if(['daeung','gwaneum','jijang','indeung'].includes(place.id)&&
    dx<(place.id==='daeung'?17:5)&&dz<(place.id==='daeung'?12:7))return 'hall';
 }
 return z>54?'forest':'courtyard';
}

// Original mono loops. Short fades at the endpoints avoid clicks at the seam.
function createLoop(context:AudioContext,kind:Soundscape){
 const rate=22050,duration=10,buffer=context.createBuffer(1,rate*duration,rate);
 const samples=buffer.getChannelData(0);
 let noise=0,seed=7813;
 for(let i=0;i<samples.length;i++){
  const t=i/rate;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  noise=.975*noise+.025*(seed/2147483648-1);
  let sample=noise*(.35+.1*Math.sin(t*2*Math.PI/duration));
  if(kind==='bell'){
   const age=t-1;
   if(age>=0)sample+=Math.min(1,age*70)*Math.exp(-age*.68)*(.22*Math.sin(2*Math.PI*132*age)+.09*Math.sin(2*Math.PI*341*age));
  }else if(kind==='hall'){
   const age=(t+1)%2.5;
   sample+=Math.min(1,age*350)*Math.exp(-age*21)*(.26*Math.sin(2*Math.PI*485*age)+.08*Math.sin(2*Math.PI*810*age));
  }else if(kind==='forest'){
   const age=(t+1)%5;
   if(age<.32)sample+=.045*Math.sin(Math.PI*age/.32)**2*Math.sin(2*Math.PI*(1700*age+650*age*age));
  }
  samples[i]=sample*Math.min(1,t*8,(duration-t)*8);
 }
 return buffer;
}

export function templeAudio(onStatus:(enabled:boolean,message:string)=>void){
 let context:AudioContext|null=null,master:GainNode|null=null;
 let source:AudioBufferSourceNode|null=null,level:GainNode|null=null;
 let selected:Soundscape='courtyard',volume=.35,ready=false;
 const updateLevel=()=>{if(context&&master)master.gain.setTargetAtTime(volume*audioFocusLevel('ambience'),context.currentTime,.12);};
 const unwatch=watchAudioFocus(updateLevel);window.addEventListener('pagehide',unwatch,{once:true});
 const loops=new Map<Soundscape,AudioBuffer>();
 function play(){
  if(!context||!master||!ready)return;
  const now=context.currentTime;
  if(source&&level){
   level.gain.cancelScheduledValues(now);level.gain.setValueAtTime(level.gain.value,now);level.gain.linearRampToValueAtTime(0,now+.18);
   source.stop(now+.18);
  }
  if(!loops.has(selected))loops.set(selected,createLoop(context,selected));
  const next=context.createBufferSource(),gain=context.createGain();
  next.buffer=loops.get(selected)!;next.loop=true;next.connect(gain);gain.connect(master);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+.35);
  next.onended=()=>{next.disconnect();gain.disconnect();};
  next.start();source=next;level=gain;
  onStatus(true,labels[selected]);
 }
 function mute(){
  const old=context;context=null;master=null;source=null;level=null;ready=false;loops.clear();
  if(old&&old.state!=='closed')void old.close().catch(()=>{});
  onStatus(false,'무음');
 }
 async function enable(){
  if(context||document.hidden)return;
  let attempt:AudioContext|null=null;
  let timer:number|undefined;
  try{
   attempt=new AudioContext();context=attempt;master=context.createGain();master.gain.value=volume*audioFocusLevel('ambience');master.connect(context.destination);
   onStatus(true,'소리 연결 중');
   await Promise.race([attempt.resume(),new Promise<void>((_,reject)=>{
    timer=window.setTimeout(()=>reject(Error('Audio resume timed out')),4000);
   })]);
   if(context!==attempt)return;
   ready=true;play();
  }catch{
   if(context!==attempt)return;
   mute();onStatus(false,'소리를 켜지 못했습니다. 다시 시도할 수 있습니다.');
  }finally{window.clearTimeout(timer);}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&context)mute();});
 window.addEventListener('pagehide',mute);
 return {enable,mute,get enabled(){return context!==null;},
  update(x:number,z:number){const next=soundscapeAt(x,z);if(next!==selected){selected=next;play();}},
  setVolume(value:number){volume=Math.max(0,Math.min(1,value));updateLevel();}
 };
}
