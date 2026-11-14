import test from 'node:test';import assert from 'node:assert/strict';
import {ambientPlaces,ambientBudget,ambientWalk} from '../src/ambient-layout.ts';
import {insideGround,pond} from '../src/temple-terrain.ts';
import {practiceSeat,monkPlace} from '../src/hall-seats.ts';
test('twenty virtual places are dispersed without taking the user or monk seat',()=>{assert.equal(ambientPlaces.length,20);assert.equal(new Set(ambientPlaces.map(p=>p.id)).size,20);assert(new Set(ambientPlaces.map(p=>p.place)).size>=12);for(const p of ambientPlaces){assert(insideGround(p.x,p.z,.4));assert(Math.hypot(p.x-practiceSeat.x,p.z-practiceSeat.z)>1.4);assert(Math.hypot(p.x-monkPlace.x,p.z-monkPlace.z)>1.4);assert(((p.x-pond.x)/(pond.width/2))**2+((p.z-pond.z)/(pond.depth/2))**2>1);}});
test('real channel population replaces fillers but never alters real admission',()=>{assert.equal(ambientBudget(1),19);assert.equal(ambientBudget(5),15);assert.equal(ambientBudget(10),10);assert.equal(ambientBudget(20),0);assert.equal(ambientBudget(50),0);assert.equal(ambientBudget(NaN),19);});
test('walking loops stay continuous and slow within their assigned short route',()=>{for(const p of ambientPlaces.filter(p=>p.end)){let old=ambientWalk(p,0);for(let t=.1;t<150;t+=.1){const f=ambientWalk(p,t);assert(Math.hypot(f.x-old.x,f.z-old.z)<.043);assert(insideGround(f.x,f.z,.4));old=f;}}});
