export const dailyMonkSites=[
 {id:'pond-keeper',role:'pond',x:49.8,z:-40.8,to:[50.5,-42.4],y:.01,yaw:2.9,rest:13,speed:.35},
 {id:'lamp-keeper',role:'lamps',x:-27.82,z:-26.6,to:[-27.82,-28.3],y:.911625,yaw:-Math.PI/2,rest:16,speed:.30},
 {id:'garden-keeper',role:'garden',x:10,z:102,to:[15,102],y:.01,yaw:0,rest:15,speed:.34},
 {id:'scripture-reader',role:'reader',x:-28,z:61,to:[-28,61],y:.39,yaw:-Math.PI/2,rest:30,speed:0},
] as const;
export type DailyMonkSite=typeof dailyMonkSites[number];
export const ease=(v:number)=>{const u=Math.max(0,Math.min(1,v));return u*u*(3-2*u);};
export const turn=(from:number,to:number,mix:number)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*mix;
/** Work at both ends, turn before walking, and ease to a stop without teleporting. */
export function dailyMonkFrame(site:DailyMonkSite,time:number){
 const [tx,tz]=site.to,dx=tx-site.x,dz=tz-site.z,length=Math.hypot(dx,dz);
 if(!length)return{x:site.x,z:site.z,yaw:site.yaw,walking:false,blend:0,work:time%site.rest};
 const travel=length/site.speed,half=site.rest+travel+2.4,cycle=half*2,t=((time%cycle)+cycle)%cycle,back=t>=half,u=back?t-half:t;
 const start=back?[tx,tz]:[site.x,site.z],end=back?[site.x,site.z]:[tx,tz],heading=Math.atan2(end[0]-start[0],end[1]-start[1]);
 let progress=0,yaw=site.yaw,walking=false,blend=0;
 if(u>=site.rest&&u<site.rest+1.2)yaw=turn(site.yaw,heading,ease((u-site.rest)/1.2));
 else if(u>=site.rest+1.2&&u<site.rest+1.2+travel){const f=(u-site.rest-1.2)/travel;progress=ease(f);yaw=heading;walking=true;blend=Math.min(1,f*8,(1-f)*8);}
 else if(u>=site.rest+1.2+travel){progress=1;yaw=turn(heading,site.yaw,ease((u-site.rest-1.2-travel)/1.2));}
 return{x:start[0]+(end[0]-start[0])*progress,z:start[1]+(end[1]-start[1])*progress,yaw,walking,blend,work:u<site.rest?u:0};
}
export function dailyGreeting(time:number){return ease(time/.8)*(1-ease((time-2.7)/1.3));}
