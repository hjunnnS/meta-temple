import test from 'node:test';
import assert from 'node:assert/strict';
import {treeSeason} from '../src/seasonal-tree.ts';
test('trees follow the requested month bands at Korean midnight',()=>{
 for(let month=1;month<=12;month++){
  assert.equal(treeSeason(new Date(Date.UTC(2026,month-1,15))),month>=3&&month<=5?'spring':month>=6&&month<=11?'autumn':'winter');
 }
 assert.equal(treeSeason(new Date('2026-02-28T14:59:59Z')),'winter');
 assert.equal(treeSeason(new Date('2026-02-28T15:00:00Z')),'spring');
});
