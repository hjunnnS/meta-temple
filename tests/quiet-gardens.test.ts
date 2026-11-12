import test from 'node:test';import assert from 'node:assert/strict';
import{quietGardenBeds,quietShrubClusters}from'../src/quiet-garden-layout.ts';
import{courtHalfWidth,courtSouthEdge,courtDepth}from'../src/temple-layout.ts';
import{insideGround,paving,sanctuaryWalk,rearPrayerWalk,prayerHallApproaches,teaApproach,teaGardenWalk,gateApproach,coinThrowBank,distanceToSegment,teaSeats}from'../src/temple-terrain.ts';
test('new planting remains outside the open central courtyard and safe for seats, coin throwing and routes',()=>{
 const routes=[...paving.map(p=>[p.from,p.to]),sanctuaryWalk,rearPrayerWalk,...prayerHallApproaches.map(a=>a.route),teaApproach,teaGardenWalk,gateApproach];
 for(const g of quietGardenBeds){assert(g.x+g.rx < -32 || !(g.x-g.rx<courtHalfWidth&&g.x+g.rx>-courtHalfWidth&&g.z-g.rz<courtSouthEdge+courtDepth&&g.z+g.rz>courtSouthEdge),'court bed '+g.id);assert(insideGround(g.x,g.z,.4),g.id);}
 for(const [x,z]of quietShrubClusters){assert(insideGround(x,z,.5),'ground '+[x,z]);for(const r of routes)for(let i=1;i<r.length;i++)assert(distanceToSegment(x,z,r[i-1],r[i])>2.0,'route '+[x,z]);for(let i=1;i<coinThrowBank.length;i++)assert(distanceToSegment(x,z,coinThrowBank[i-1],coinThrowBank[i])>1.9,'coin bank '+[x,z]);assert(teaSeats.every(s=>Math.hypot(x-s.x,z-s.z)>1.8),'seat '+[x,z]);}
});
