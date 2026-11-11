import {bellSamples} from './bell-cycle';
export function bellSound(){
 let context:AudioContext|null=null,gain:GainNode|null=null,buffer:AudioBuffer|null=null;
 const voices=new Set<AudioBufferSourceNode>();let previousLevel=-1;
 function volume(){return document.querySelector<HTMLInputElement>('#master-mute')?.checked?0:Number(document.querySelector<HTMLInputElement>('#audio-volume')?.value??35)/100;}
 function level(distance=0){
  const value=volume()/(1+(distance/15)**2);if(!context||!gain||Math.abs(value-previousLevel)<.001)return;
  previousLevel=value;gain.gain.setTargetAtTime(value,context.currentTime,.04);
 }
 function stop(){for(const voice of voices){voice.stop();voice.disconnect();}voices.clear();}
 async function prepare(){
  try{
   if(!context||context.state==='closed'){
    context=new AudioContext();previousLevel=-1;gain=context.createGain();gain.connect(context.destination);
    const samples=bellSamples();buffer=context.createBuffer(1,samples.length,24000);buffer.copyToChannel(samples,0);level();
   }
   await context.resume();return true;
  }catch{return false;}
 }
 function strike(){
  if(!context||!gain||!buffer||document.hidden)return false;
  const voice=context.createBufferSource();voice.buffer=buffer;voice.connect(gain);
  voice.onended=()=>{voices.delete(voice);voice.disconnect();};voices.add(voice);voice.start();return true;
 }
 document.addEventListener('pointerdown',()=>{void prepare();},{once:true});
 document.addEventListener('input',()=>level());document.addEventListener('change',()=>level());
 window.addEventListener('sasa:space',event=>{if((event as CustomEvent<string>).detail==='private')stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',()=>{stop();if(context)void context.close();});
 return {prepare,strike,level,stop};
}
