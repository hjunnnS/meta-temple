import test from 'node:test';
import assert from 'node:assert/strict';
import {wishToss} from '../src/wish-toss.ts';
test('wish waits three seconds, samples one outcome, and locks until the result ends',()=>{
 for(const draw of [0,.249999,.25,.999999]){
  const toss=wishToss();
  assert.ok(toss.start(1000,draw));
  assert.equal(toss.start(1500,0),false);
  assert.equal(toss.frame(3999).phase,'wishing');
  assert.equal(toss.frame(4000).phase,'flying');
  assert.equal(toss.frame(4850).phase,draw<.25?'success':'miss');
  assert.equal(toss.frame(8100).phase,'idle');
  assert.ok(toss.start(8101,0));
 }
});
