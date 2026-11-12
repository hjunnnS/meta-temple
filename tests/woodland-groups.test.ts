import test from 'node:test';
import assert from 'node:assert/strict';
import {woodlandGroups,groveTrees,inOpenRearCourt} from '../src/woodland-groups.ts';
import {interiorWoodland,paving,sanctuaryWalk,rearPrayerWalk,prayerHallApproaches,teaApproach,teaGardenWalk,gateApproach,distanceToSegment,insideGround} from '../src/temple-terrain.ts';
import {templePlaces,daeungDimensions} from '../src/temple-layout.ts';

test('expanded groves keep species separate and concentrate five additional maples around the sweeper',()=>{
 assert.equal(woodlandGroups.length,15);assert.equal(groveTrees.length,74);assert.equal(interiorWoodland.length,74);
 assert.equal(interiorWoodland.filter(p=>p.kind==='bamboo').length,33);assert.equal(interiorWoodland.filter(p=>p.kind==='seasonal').length,41);
 const aroundMonk=groveTrees.filter(t=>t.group==='sweeper-maples');assert.equal(aroundMonk.length,5);assert(aroundMonk.every(t=>t.z<=70&&Math.hypot(t.x+21,t.z-70.8)>3));
 assert.equal(new Set(groveTrees.map(p=>p.x+','+p.z)).size,74);
 for(const bamboo of groveTrees.filter(t=>t.kind==='bamboo'))for(const maple of groveTrees.filter(t=>t.kind==='seasonal'))assert(Math.hypot(bamboo.x-maple.x,bamboo.z-maple.z)>=5,'separate species buffer');
 for(const group of woodlandGroups){
  const members=groveTrees.filter(t=>t.group===group.id);assert(members.length>=3);
  assert(members.every(t=>t.kind===group.kind));
  for(const p of members)assert(members.some(q=>q!==p&&Math.hypot(q.x-p.x,q.z-p.z)<=5),'no isolated tree within '+group.id);
 }
});

test('grouped plants retain open centre, paid-item approaches and safe walking clearances',()=>{
 const routes=[...paving.map(p=>[p.from,p.to]),sanctuaryWalk,rearPrayerWalk,...prayerHallApproaches.map(a=>a.route),teaApproach,teaGardenWalk,gateApproach];
 for(const p of interiorWoodland){
  assert(!inOpenRearCourt(p.x,p.z),'open centre '+JSON.stringify(p));
  assert(insideGround(p.x,p.z,2.5),'crown/ground wall clearance '+JSON.stringify(p));
  for(const route of routes)for(let i=1;i<route.length;i++)assert(distanceToSegment(p.x,p.z,route[i-1],route[i])>=2.7,'route clearance '+JSON.stringify(p));
  for(const hall of templePlaces.filter(p=>p.kind==='hall')){
   const newHall=['yaksa','munsu','bohyeon','geukrak'].includes(hall.id),yaw='yaw'in hall?hall.yaw:0;
   const w=hall.id==='daeung'?23*daeungDimensions.x:newHall?14:23*hall.scale;
   const d=hall.id==='daeung'?11.8*daeungDimensions.z:newHall?12:11.8*hall.scale;
   const hx=(Math.abs(Math.cos(yaw))*w+Math.abs(Math.sin(yaw))*d)/2;
   const hz=(Math.abs(Math.sin(yaw))*w+Math.abs(Math.cos(yaw))*d)/2;
   assert(Math.abs(p.x-hall.x)>hx+2.2||Math.abs(p.z-hall.z)>hz+2.2,'hall clearance '+hall.id+' '+JSON.stringify(p));
  }
 }
});
