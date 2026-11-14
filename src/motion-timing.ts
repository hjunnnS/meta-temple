export const BOW_SECONDS=6.8;
export const smoothMotion=(n:number)=>{const u=Math.max(0,Math.min(1,n));return u*u*(3-2*u);};
/** Preserve approved contact poses; add anticipation, support and a short low pause. */
export function bowPhase(time:number){
 const points=[[0,0],[.13,.105],[.20,.13],[.39,.36],[.51,.51],[.62,.59],[.80,.79],[.93,.90],[1,1]];
 const p=Math.max(0,Math.min(1,time));for(let i=1;i<points.length;i++){const[a,v]=points[i-1],[b,w]=points[i];if(p<=b)return v+(w-v)*smoothMotion((p-a)/(b-a));}return 1;
}
export function practiceClock(seconds:number){const n=Math.max(0,Math.floor(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
export function turnTowards(current:number,target:number,dt:number,rate=8){return current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*(1-Math.exp(-Math.max(0,dt)*rate));}
