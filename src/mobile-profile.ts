export type Quality='high'|'balanced'|'low';
export function mobileDevice(){return navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches;}
export function renderProfile(mobile:boolean,quality:Quality,width:number,height:number,night:boolean){
 if(!mobile)return {scale:quality==='low'?Math.max(1,Math.min(width/640,height/720)):1,shadow:quality==='low'?512:night?2048:4096,glow:quality!=='low',reflection:2};
 const edge=quality==='high'?1280:quality==='low'?720:960,budget=quality==='high'?1000000:quality==='low'?320000:550000;
 return {scale:Math.max(quality==='low'?1.4:quality==='balanced'?1.15:1,Math.max(width,height)/edge,Math.sqrt(width*height/budget)),shadow:quality==='high'?(night?1024:2048):quality==='low'?512:night?512:1024,glow:true,reflection:quality==='high'?3:quality==='low'?12:6};
}
