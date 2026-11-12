import {rearPrayerWalk,sanctuaryWalk,prayerHallApproaches,interiorWoodland,insideGround,distanceToSegment,type GroundPoint} from './temple-terrain.ts';
import {templePlaces,daeungDimensions} from './temple-layout.ts';
import {rearPrayerHalls,prayerHallDimensions} from './prayer-halls.ts';
export const forestLampSpacing=14;
const routes=[rearPrayerWalk,[[-24,73],[23,73]] as GroundPoint[]];
const protectedRoutes=[rearPrayerWalk,sanctuaryWalk,...prayerHallApproaches.map(a=>a.route)];
function clear(x:number,z:number){
 if(!insideGround(x,z,.6)||interiorWoodland.some(t=>Math.hypot(t.x-x,t.z-z)<1.7))return false;
 if(protectedRoutes.some(r=>r.some((p,i)=>i>0&&distanceToSegment(x,z,r[i-1],p)<1.7)))return false;
 for(const hall of templePlaces.filter(p=>p.kind==='hall')){
  const yaw='yaw'in hall?hall.yaw:0,dx=x-hall.x,dz=z-hall.z,lx=dx*Math.cos(yaw)-dz*Math.sin(yaw),lz=dx*Math.sin(yaw)+dz*Math.cos(yaw);
  const dim=hall.id==='daeung'?daeungDimensions:rearPrayerHalls.some(h=>h.id===hall.id)?prayerHallDimensions:{x:hall.scale,z:hall.scale};
  if(Math.abs(lx)<11.5*dim.x+.8&&Math.abs(lz)<5.9*dim.z+.8)return false;
 }
 return true;
}
export const forestLampSites:(GroundPoint)[]=[];
for(const route of routes){
 let next=7,along=0,index=0;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  while(next<=along+length){
   const t=(next-along)/length;
   for(const side of [index%2?1:-1,index%2?-1:1]){
    const x=a[0]+dx*t+side*dz/length*2.05,z=a[1]+dz*t-side*dx/length*2.05;
    if(clear(x,z)&&forestLampSites.every(p=>Math.hypot(p[0]-x,p[1]-z)>=10)){forestLampSites.push([x,z]);break;}
   }
   next+=forestLampSpacing;index++;
  }
  along+=length;
 }
}
