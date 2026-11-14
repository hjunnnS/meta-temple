import test from'node:test';import assert from'node:assert/strict';import{allVisitorJourneys,stopPose}from'../src/ambient-journeys.ts';import{insideGround,pond}from'../src/temple-terrain.ts';
test('nineteen visitors alternate destinations and activities without moving the reserved meditation visitor',()=>{
 const journeys=allVisitorJourneys();assert.equal(journeys.length,20);assert.equal(journeys.filter(j=>j.stops.length>1).length,19);
 for(const j of journeys){for(const s of j.stops){assert(insideGround(s.x,s.z,.35),j.id);assert(((s.x-pond.x)/(pond.width/2))**2+((s.z-pond.z)/(pond.depth/2))**2>1,j.id);assert(s.seconds>=5);assert(Number.isFinite(s.yaw));}if(j.id!=='hall-b')assert(j.stops.some(s=>Math.hypot(s.x-j.stops[0].x,s.z-j.stops[0].z)>1.4));}
});
test('meditating visitors rise before leaving and a prayer cycle reaches the full bow',()=>{
 const all=allVisitorJourneys().flatMap(j=>j.stops);for(const s of all.filter(s=>s.action==='meditation')){assert.equal(stopPose(s,0).seated,0);assert.equal(stopPose(s,s.seconds).seated,0);assert.equal(stopPose(s,3).seated,1);}for(const s of all.filter(s=>s.action==='prayer')){assert(stopPose(s,5.3).bow>.5);assert(stopPose(s,8.99).bow>.99);}
});
