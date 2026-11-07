import test from 'node:test';
import assert from 'node:assert/strict';
import { canopyLanternSlots, OWNED_INDICES, lanternSlots, zones } from '../src/contracts.ts';
import { templePlaces, courtHalfWidth, courtDepth } from '../src/temple-layout.ts';

test('review zones and the rendered halls use one world-coordinate frame',()=>{
 const buildings={Z04:'daeung',Z05:'gwaneum',Z06:'jijang',Z07:'indeung',Z10:'office',Z11:'bell',Z12:'forest'};
 for(const [zone,building] of Object.entries(buildings)){
  const place=templePlaces.find(p=>p.id===building)!;
  assert.deepEqual(zones.find(z=>z.id===zone)!.center,[place.x,0,place.z]);
 }
 assert.deepEqual(zones.find(z=>z.id==='Z03')!.size,[2*courtHalfWidth,courtDepth]);
});

test('visible sample installations belong to their declared zone at all four densities',()=>{
 const plaza=zones.find(z=>z.id==='Z02')!;
 for(const count of [100,300,500,1000]){
  const slots=canopyLanternSlots(count);
  for(const slot of slots){
   assert.equal(slot.zoneId,plaza.id);
   assert.ok(Math.abs(slot.position[0]-plaza.center[0])<=plaza.size[0]/2);
   assert.ok(Math.abs(slot.position[2]-plaza.center[2])<=plaza.size[1]/2);
  }
  for(const i of OWNED_INDICES)assert.ok(slots.some(s=>s.id===lanternSlots(100)[i].id));
 }
});
