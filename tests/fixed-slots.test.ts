import test from 'node:test';
import assert from 'node:assert/strict';
import {fixedSlots,offeringZones} from '../src/contracts.ts';
import {parseReviewSlots} from '../src/review-slots.ts';
import {zoneLayout} from '../server/review-layout.mjs';

test('approved layout keeps unique identities and installation compatibility in every zone',()=>{
 const all=offeringZones.flatMap(zone=>parseReviewSlots(zoneLayout(zone),zone));
 assert.equal(all.length,531);
 assert.equal(new Set(all.map(s=>s.id)).size,531);
 const installed=all.filter(s=>s.installationId);
 assert.equal(new Set(installed.map(s=>s.installationId)).size,515);
 assert.equal(all.find(s=>s.id==='sample:Z02:lantern:0023')?.installationId,'sample:installation:23');
 const positions=new Map(fixedSlots().map(s=>[s.id,s.position]));
 assert.deepEqual(all.map(s=>s.position),all.map(s=>positions.get(s.id)));
});
test('rejects duplicate slots, altered positions or directions, incompatible items and stale layouts',()=>{
 for(const change of [(d:any)=>d.slots[1]=d.slots[0],(d:any)=>d.slots[0].position[0]++,
  (d:any)=>d.slots[0].rotationY++,(d:any)=>d.slots[0].sampleInstallation.productKind='lantern',
  (d:any)=>d.layoutVersion='old']){
  const data=zoneLayout('Z03');change(data);assert.throws(()=>parseReviewSlots(data,'Z03'));
 }
});
