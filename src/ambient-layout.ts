import {templePlaces} from './temple-layout.ts';
import {rearPrayerHalls,prayerHallPoint} from './prayer-halls.ts';
export type AmbientRole='prayer'|'meditation'|'look'|'walk';
export interface AmbientPlace{id:string;place:string;role:AmbientRole;x:number;z:number;yaw:number;end?:readonly[number,number]}
const hall=(id:string,place:string,role:AmbientRole,lx:number,lz:number):AmbientPlace=>{const h=templePlaces.find(p=>p.id===id)!;const yaw='yaw'in h?h.yaw:0;return{id,place,role,x:h.x+Math.cos(yaw)*lx+Math.sin(yaw)*lz,z:h.z-Math.sin(yaw)*lx+Math.cos(yaw)*lz,yaw};};
export const ambientPlaces:readonly AmbientPlace[]=[
 {id:'hall-a',place:'대웅전',role:'prayer',x:-6,z:32.2,yaw:0},
 {id:'hall-b',place:'대웅전',role:'meditation',x:6,z:34.25,yaw:0},
 {id:'hall-c',place:'대웅전',role:'prayer',x:-4.05,z:36.3,yaw:0},
 hall('gwaneum','관음전','meditation',-2.3,0),hall('jijang','지장전','prayer',-2.3,0),
 ...rearPrayerHalls.map(h=>{const[x,z]=prayerHallPoint(h,-2,0);return{id:h.id,place:h.name,role:'meditation' as const,x,z,yaw:h.yaw};}),
 {id:'votive',place:'인등전 앞',role:'look',x:-25,z:-34,yaw:-Math.PI/2},
 {id:'lantern-a',place:'연등길',role:'look',x:-7,z:-32,yaw:.4},
 {id:'lantern-b',place:'연등길',role:'look',x:7,z:-15,yaw:-.4},
 {id:'pagoda-a',place:'구름탑',role:'look',x:50,z:-32,yaw:Math.PI/2},
 {id:'pagoda-b',place:'구름탑',role:'walk',x:67,z:-32,yaw:0,end:[67,-28]},
 {id:'pond-a',place:'연못 남쪽',role:'look',x:43,z:-64.5,yaw:0},
 {id:'pond-b',place:'연못 동쪽',role:'walk',x:74.5,z:-55,yaw:0,end:[74.5,-50]},
 {id:'tea',place:'쉼터 옆마당',role:'look',x:58,z:-73.5,yaw:0},
 {id:'walk-a',place:'뒤 산책길',role:'walk',x:8,z:91,yaw:Math.PI/2,end:[16,90.4]},
 {id:'walk-b',place:'뒤 산책길',role:'walk',x:-16,z:87,yaw:Math.PI/2,end:[-10,88]},
 {id:'statue',place:'미륵보살 석상 앞',role:'look',x:55,z:45,yaw:.38},
];
/** Real count includes the viewer. Fill a channel towards twenty, never affect admission. */
export function ambientBudget(realCount:number){return Math.max(0,20-Math.max(1,Number.isSafeInteger(realCount)?realCount:1));}
export function ambientWalk(place:AmbientPlace,age:number){
 if(!place.end)return{x:place.x,z:place.z,yaw:place.yaw,walking:false};
 const dx=place.end[0]-place.x,dz=place.end[1]-place.z,length=Math.hypot(dx,dz),travel=length/.42,cycle=2*(travel+4),phase=((age%cycle)+cycle)%cycle;
 const back=phase>=travel+4,t=back?phase-travel-4:phase,u=Math.min(1,Math.max(0,(t-4)/travel)),progress=back?1-u:u;
 return{x:place.x+dx*progress,z:place.z+dz*progress,yaw:Math.atan2(back?-dx:dx,back?-dz:dz),walking:t>4};
}
