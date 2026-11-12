import test from 'node:test';import assert from 'node:assert/strict';
import {forestLampSites,forestLampSpacing} from '../src/forest-lamp-layout.ts';
import {insideGround,distanceToSegment,rearPrayerWalk,sanctuaryWalk,prayerHallApproaches,interiorWoodland} from '../src/temple-terrain.ts';
test('sparse forest lights keep walking routes, trunks and wall clearance without rows of dense lamps',()=>{
 assert.equal(forestLampSpacing,14);assert(forestLampSites.length>=12&&forestLampSites.length<=20);
 for(const [i,p]of forestLampSites.entries()){
  assert(insideGround(...p,.6));assert(p[1]>30);
  for(const q of forestLampSites.slice(i+1))assert(Math.hypot(q[0]-p[0],q[1]-p[1])>=10);
  for(const t of interiorWoodland)assert(Math.hypot(t.x-p[0],t.z-p[1])>=1.7);
  for(const path of [rearPrayerWalk,sanctuaryWalk,...prayerHallApproaches.map(a=>a.route)])for(let k=1;k<path.length;k++)assert(distanceToSegment(...p,path[k-1],path[k])>=1.7);
 }
 assert(forestLampSites.some(p=>p[1]>85));assert(forestLampSites.some(p=>p[0]<0&&p[1]>65));assert(forestLampSites.some(p=>p[0]>65));
});
