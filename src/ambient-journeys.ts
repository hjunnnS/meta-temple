import {ambientPlaces,type AmbientPlace} from './ambient-layout.ts';
import {templePlaces} from './temple-layout.ts';
import {rearPrayerHalls,prayerHallPoint,prayerAisleX} from './prayer-halls.ts';
export type VisitAction='prayer'|'meditation'|'lantern'|'wish'|'look'|'rest'|'stretch';
export interface VisitStop{x:number;z:number;yaw:number;action:VisitAction;seconds:number;seatLift?:number}
export const visitorWalkSpeed=.72;
export function visitorJourney(p:AmbientPlace):readonly VisitStop[]{
 const stop=(x:number,z:number,action:VisitAction,seconds=9,yaw=p.yaw):VisitStop=>({x,z,action,seconds,yaw});
 const home:VisitStop={...p,action:p.role==='meditation'?'meditation':p.role==='prayer'?'prayer':p.id.startsWith('lantern')?'lantern':p.id==='pagoda-a'?'wish':p.id==='tea'?'stretch':'look',seconds:p.role==='meditation'?13:p.role==='prayer'?12:9};
 if(p.id==='hall-b')return[home];
 const rear=rearPrayerHalls.find(h=>h.id===p.id);
 if(rear){const[a,b]=prayerHallPoint(rear,prayerAisleX,-3.3),[c,d]=prayerHallPoint(rear,prayerAisleX,-5.4);return[home,stop(a,b,'prayer',10),stop(c,d,'rest',5,rear.yaw+Math.PI)];}
 if(p.id==='jijang'){const h=templePlaces.find(h=>h.id==='jijang')!,yaw=h.yaw;return[home,stop(h.x+Math.cos(yaw)*2.3-Math.sin(yaw)*2.6,h.z-Math.sin(yaw)*2.3-Math.cos(yaw)*2.6,'rest',7,yaw+Math.PI)];}
 if(p.id==='gwaneum'){const h=templePlaces.find(h=>h.id===p.id)!;const yaw='yaw'in h?h.yaw:0,localX=.9;return[home,stop(h.x+Math.cos(yaw)*localX-Math.sin(yaw)*3.5,h.z-Math.sin(yaw)*localX-Math.cos(yaw)*3.5,'prayer',10),stop(h.x+Math.cos(yaw)*localX-Math.sin(yaw)*2.6,h.z-Math.sin(yaw)*localX-Math.cos(yaw)*2.6,'rest',5,yaw+Math.PI)];}
 const routes:Record<string,readonly VisitStop[]>={
  'hall-a':[stop(-6,28.5,'look',5),stop(-6,30.2,'prayer',10)],
  'hall-c':[stop(-4.05,31.2,'rest',5),stop(-3,32,'prayer',10)],
  'votive':[stop(-17.5,-35,'prayer',10),stop(-17.5,-43,'look',6)],
  'lantern-a':[stop(-7,-23,'lantern',11),stop(-10,-26,'rest',5)],
  'lantern-b':[stop(7,-5,'rest',6),stop(10,-10,'lantern',11)],
  'pagoda-a':[stop(21,-28.5,'rest',5),stop(19,-24,'wish',10)],
  'pagoda-b':[stop(67,-28,'prayer',10),stop(70,-30,'look',6)],
  'pond-a':[stop(49,-68,'rest',7),stop(52,-70,'look',8)],
  'pond-b':[stop(74.5,-50,'look',9),stop(72,-46,'rest',6)],
  'tea':[stop(62,-72,'rest',8),stop(65,-70,'look',8)],
  'walk-a':[stop(16,90.4,'stretch',7),stop(12,86,'prayer',10)],
  'walk-b':[stop(-10,88,'rest',6),stop(-12,82,'look',7)],
  'statue':[stop(52,41,'prayer',10),stop(51,35,'rest',6)],
 };
 return[home,...(routes[p.id]??[])];
}
export const allVisitorJourneys=()=>ambientPlaces.map(place=>({id:place.id,stops:visitorJourney(place)}));
const smooth=(u:number)=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
export function stopPose(s:VisitStop,time:number){
 const rise=smooth(time/.9)*(1-smooth((time-s.seconds+1.1)/1.1));
 const gesture=smooth(time/1.2)*(1-smooth((time-s.seconds+1.2)/1.2));
 return{seated:s.action==='meditation'?rise:0,bow:s.action==='prayer'?(time<1?.105*smooth(time):time<9?(time-1)/8:.105*smooth((time-9)/1.2)):s.action==='wish'?.105*gesture:0,gesture};
}
