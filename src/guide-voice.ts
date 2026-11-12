import {locale}from'./locales';
export function guideVoice(volume:()=>number){
 const audio=new Audio();audio.preload='none';let token=0;
 function stop(){token++;audio.pause();audio.removeAttribute('src');audio.load();}
 return{stop,level(){audio.volume=Math.max(0,Math.min(1,volume()));},async speak(key:string){
  stop();if(locale!=='ko'||volume()<=0||document.hidden)return;
  const version=token;audio.src='/guide/'+key+'.mp3';audio.volume=Math.max(0,Math.min(1,volume()));
  try{await audio.play();if(version!==token)return;}catch{/* Captions remain available; repeat is an explicit user action. */}
 },get playing(){return !audio.paused;},dispose(){stop();}};
}
