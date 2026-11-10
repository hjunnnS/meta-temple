import test from 'node:test';
import assert from 'node:assert/strict';
import {privateDisplayPositions,validDisplayPlacements,compatibleDisplay} from '../src/private-display-layout.ts';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
test('all five item kinds have fixed display positions without changing public slots',()=>{
 assert.equal(new Set(privateDisplayPositions.map(p=>p.id)).size,privateDisplayPositions.length);
 for(const kind of ['lantern','wish-plaque','votive','memorial','candle'])assert.ok(privateDisplayPositions.some(s=>(s.accepts as readonly string[]).includes(kind)));
});
test('display layout rejects duplicate purchases, duplicate positions, arbitrary coordinates and excessive entries',()=>{
 assert(validDisplayPlacements([{slotId:'left-1-1',orderId:a}]));assert(validDisplayPlacements([]));
 for(const value of [null,{},[{slotId:'outside-room',orderId:a}],[{slotId:'left-1-1',orderId:'bad'}],[{slotId:'left-1-1',orderId:a},{slotId:'left-1-2',orderId:a}],[{slotId:'left-1-1',orderId:a},{slotId:'left-1-1',orderId:b}],Array.from({length:19},()=>({slotId:'left-1-1',orderId:a}))])assert.equal(validDisplayPlacements(value),false);
});
test('only a purchase in the owner catalog with a compatible item type can be displayed',()=>{
 const placements=[{slotId:'left-1-1',orderId:a}];assert(compatibleDisplay(placements,[{orderId:a,kind:'lantern'}]));
 assert(!compatibleDisplay(placements,[{orderId:b,kind:'lantern'}]));assert(!compatibleDisplay(placements,[{orderId:a,kind:'candle'}]));
 assert(compatibleDisplay([{slotId:'right-1-1',orderId:a}],[{orderId:a,kind:'wish-plaque'}]));
});
