import test from 'node:test';
import assert from 'node:assert/strict';
import { hallSeats, bowSpace } from '../src/hall-seats.ts';
test('50 bowing spaces fit inside the walls, clear of the altar end and central aisle',()=>{
 assert.equal(hallSeats.length,50);
 for(const [i,s] of hallSeats.entries()){
  assert.ok(Math.abs(s.x)-bowSpace.width/2>=1.5 && Math.abs(s.x)+bowSpace.width/2<13.2);
  assert.ok(s.z-.43>30 && s.z-.43+bowSpace.depth<41.95);
  for(const t of hallSeats.slice(i+1))
   assert.ok(Math.abs(s.x-t.x)>=bowSpace.width || Math.abs(s.z-t.z)>=bowSpace.depth);
 }
});
