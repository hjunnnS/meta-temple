import test from 'node:test';import assert from 'node:assert/strict';
import {fixedSlots,gateCanopyAnchor} from '../src/contracts.ts';import {lanternDisplayPosition,offeringDisplayPosition} from '../src/lantern-display-profile.ts';
test('lower drape keeps gate start, gradually lowers plaza .85–1m, and keeps other offering anchors',()=>{
 const start=gateCanopyAnchor.z+1.15;
 assert.deepEqual(lanternDisplayPosition([0,5.8,start]),[0,5.8,start]);
 let last=0;for(let z=start;z<=-28;z+=.1){const p=lanternDisplayPosition([0,5.8,z]),drop=5.8-p[1];assert(drop>=last-.000001);assert(drop-last<.01);last=drop;}
 for(const s of fixedSlots()){
  const p=offeringDisplayPosition(s);assert.equal(p[0],s.position[0]);assert.equal(p[2],s.position[2]);
  if(s.accepts!=='lantern')assert.deepEqual(p,s.position);
  else {assert(p[1]-.43>3.8);if(p[2]>=-28){const drop=s.position[1]-p[1];assert(drop>=.85-.0001&&drop<=1.0001);}}
 }
 assert(lanternDisplayPosition([0,5.8,-20])[1]<lanternDisplayPosition([12,5.8,-20])[1]);
});
