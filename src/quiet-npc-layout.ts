/** NPC-only layout: existing visitor seats, routes and sale slots are unchanged. */
export const guideMonkSite={x:1.6,y:.09,z:-59}as const;
export const teaMonkSite={x:57.4,z:-68.7,y:-.13,yaw:0,tableZ:-67.8}as const;
export const walkingMonkPath={west:-12,east:9,z:74.1,speed:.4,pause:5}as const;
const smooth=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
export function walkingMonkFrame(time:number){
 const p=walkingMonkPath,travel=(p.east-p.west)/p.speed,cycle=2*(travel+p.pause),t=((time%cycle)+cycle)%cycle;
 if(t<p.pause)return{x:p.west,z:p.z,yaw:1.5*Math.PI+Math.PI*smooth(t/2),walking:false};
 if(t<p.pause+travel)return{x:p.west+(t-p.pause)*p.speed,z:p.z,yaw:Math.PI/2,walking:true};
 if(t<2*p.pause+travel)return{x:p.east,z:p.z,yaw:Math.PI/2+Math.PI*smooth((t-p.pause-travel)/2),walking:false};
 return{x:p.east-(t-2*p.pause-travel)*p.speed,z:p.z,yaw:1.5*Math.PI,walking:true};
}
export function teaMonkLift(time:number){const t=time%18;return smooth((t-5)/1.2)*(1-smooth((t-8)/1.4));}
