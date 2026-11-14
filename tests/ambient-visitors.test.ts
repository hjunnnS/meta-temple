import test from 'node:test';import assert from 'node:assert/strict';
import {ambientPlaces,ambientBudget,ambientWalk} from '../src/ambient-layout.ts';
import {insideGround,pond} from '../src/temple-terrain.ts';
import {practiceSeat,monkPlace} from '../src/hall-seats.ts';
test('twenty virtual places are dispersed without taking the user or monk seat',()=>{assert.equal(ambientPlaces.length,20);assert.equal(new Set(ambientPlaces.map(p=>p.id)).size,20);assert(new Set(ambientPlaces.map(p=>p.place)).size>=12);for(const p of ambientPlaces){assert(insideGround(p.x,p.z,.4));assert(Math.hypot(p.x-practiceSeat.x,p.z-practiceSeat.z)>1.4);assert(Math.hypot(p.x-monkPlace.x,p.z-monkPlace.z)>1.4);assert(((p.x-pond.x)/(pond.width/2))**2+((p.z-pond.z)/(pond.depth/2))**2>1);}});
test('real channel population replaces fillers but never alters real admission',()=>{assert.equal(ambientBudget(1),19);assert.equal(ambientBudget(5),15);assert.equal(ambientBudget(10),10);assert.equal(ambientBudget(20),0);assert.equal(ambientBudget(50),0);assert.equal(ambientBudget(NaN),19);});
test('walking loops stay continuous and slow within their assigned short route',()=>{for(const p of ambientPlaces.filter(p=>p.end)){let old=ambientWalk(p,0);for(let t=.1;t<150;t+=.1){const f=ambientWalk(p,t);assert(Math.hypot(f.x-old.x,f.z-old.z)<.043);assert(insideGround(f.x,f.z,.4));old=f;}}});

// Keep moved viewers out of circulation and the existing coin-throw interaction bank.
test('relocated viewers leave the tea connection, coin bank and wish rack approach clear',async()=>{const{coinThrowBank,distanceToSegment,paving}=await import('../src/temple-terrain.ts');const{plaqueSlot}=await import('../src/contracts.ts');const pondViewer=ambientPlaces.find(p=>p.id==='pond-a')!,votive=ambientPlaces.find(p=>p.id==='votive')!,wish=ambientPlaces.find(p=>p.id==='pagoda-a')!;assert(distanceToSegment(pondViewer.x,pondViewer.z,[35,-64.25],[58.7,-64.25])>1.5);assert(Math.min(...coinThrowBank.map(p=>Math.hypot(p[0]-pondViewer.x,p[1]-pondViewer.z)))>2);assert(votive.x>-22);assert.equal(wish.place,'소원패 정원');for(let rack=0;rack<3;rack++)for(let i=0;i<9;i++){const slot=plaqueSlot(rack,0,i);assert(Math.hypot(slot.position[0]-wish.x,slot.position[2]-wish.z)>1.3);}const path=paving.find(p=>p.name==='wish-garden')!;assert(distanceToSegment(wish.x,wish.z,path.from,path.to)>1.5);});

test('every actor has a place-appropriate activity and worship reaches a full bow',async()=>{
 const{ambientActivity}=await import('../src/ambient-layout.ts');const actions=new Set<string>();
 for(const p of ambientPlaces){for(let t=0;t<=96;t+=.25){const f=ambientActivity(p,t);assert(Number.isFinite(f.progress)&&f.progress>=0&&f.progress<=1);assert(Number.isFinite(f.pitch));actions.add(f.action);if(p.role==='meditation')assert.equal(f.pose,'meditation');}}
 for(const expected of ['산책','연등 감상','절하기','명상','소원 빌기','연못 감상','가벼운 스트레칭','석상 참배','인등 감상'])assert(actions.has(expected),expected);
 const prayer=ambientPlaces.find(p=>p.role==='prayer')!;assert(ambientActivity(prayer,14.9).progress>.98);assert.equal(ambientActivity(prayer,16).action,'합장 참배');
});
