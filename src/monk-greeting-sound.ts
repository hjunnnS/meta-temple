export function monkGreetingSound(){
 let context:AudioContext|undefined,gain:GainNode|undefined,buffer:Promise<AudioBuffer>|undefined,voice:AudioBufferSourceNode|undefined,version=0;
 function level(distance=0){if(gain&&context){const muted=document.querySelector<HTMLInputElement>('#master-mute')?.checked;gain.gain.setTargetAtTime((muted?0:Number(document.querySelector<HTMLInputElement>('#audio-volume')?.value??35)/100)/(1+(distance/8)**2),context.currentTime,.04);}}
 async function prepare(){
  try{
   context??=new AudioContext();gain??=context.createGain();gain.disconnect();gain.connect(context.destination);level();
   const resumed=context.resume();
   buffer??=fetch('/ceremonies/monk-greeting.mp3').then(async response=>{if(!response.ok)throw Error('voice');return context!.decodeAudioData(await response.arrayBuffer());});
   await resumed;await buffer;return true;
  }catch{buffer=undefined;return false;}
 }
 function stop(){version++;if(voice){voice.onended=null;try{voice.stop();}catch{}voice.disconnect();voice=undefined;}}
 return {prepare,level,stop,async speak(stillGreeting:()=>boolean){
  const token=version;
  try{const sample=await buffer;if(!sample||!context||!gain||token!==version||!stillGreeting()||document.hidden)return false;
   const node=context.createBufferSource();node.buffer=sample;node.connect(gain);voice=node;node.onended=()=>{node.disconnect();if(voice===node)voice=undefined;};node.start();return true;
  }catch{return false;}
 },get playing(){return !!voice;},dispose(){stop();if(context)void context.close();}};
}
