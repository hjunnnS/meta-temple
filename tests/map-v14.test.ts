import test from 'node:test';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
import{fixedSlots,hallLampSlots}from'../src/contracts.ts';
import{templePlaces,courtSouthEdge,courtDepth,candleCourt,memorialGarden}from'../src/temple-layout.ts';
import{insideGround,paving,boundaries,teaSeats,pond,eastCourts,sanctuaryWalk,teaApproach,teaGardenWalk,gateApproach}from'../src/temple-terrain.ts';
test('relocation preserves every lantern coordinate and all five item identities and quantities',()=>{
 const slots=fixedSlots(),lanterns=slots.filter(s=>s.accepts==='lantern');
 assert.equal(createHash('sha256').update(JSON.stringify(lanterns)).digest('hex'),'d0253d33a0ccc6cc75bd58805112ce7c3127fc1f77df03761b2e326ca6b4ddcc');
 assert.equal(slots.length,531);assert.equal(new Set(slots.map(s=>s.id)).size,531);
 for(const[kind,count]of[['lantern',440],['votive',12],['memorial',4],['wish-plaque',54],['candle',21]]as const)assert.equal(slots.filter(s=>s.accepts===kind).length,count);
 assert(hallLampSlots('memorial').every(s=>s.position[2]===memorialGarden.z&&s.rotationY===0));
});
test('approved destinations and garden routes stay reachable without crossing walls or water',()=>{
 const p=(id:string)=>templePlaces.find(p=>p.id===id)!;
 assert.equal(p('office').z,-70);assert(p('gwaneum').z>0&&p('gwaneum').z===p('jijang').z);
 assert(candleCourt.z<p('gwaneum').z);assert(memorialGarden.z<p('jijang').z&&memorialGarden.z>-23.5);
 assert.equal(courtSouthEdge+courtDepth,23);assert(p('ilju').z<p('cheonwang').z);
 const routes=[...paving.map(p=>[p.from,p.to]),sanctuaryWalk,teaApproach,teaGardenWalk,gateApproach];
 for(const route of routes)for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=0;d<=length;d+=.2){const t=d/length;assert(insideGround(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,.325),'blocked path');}}
 assert(teaSeats.every(s=>insideGround(s.x,s.z,.4)));assert(pond.z<eastCourts.tower.z);
 assert(boundaries.some(w=>w.from[0]===77&&w.from[1]===-78&&w.to[1]===30));
});
