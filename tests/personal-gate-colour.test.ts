import test from 'node:test';
import assert from 'node:assert/strict';
import {personalGateColour} from '../src/personal-gate-colour.ts';
test('gate smoke slowly cycles purple, blue and orange, with no jump on the loop',()=>{
 assert.deepEqual(personalGateColour(0),[.62,.30,.92]);assert.deepEqual(personalGateColour(6),[.20,.52,.98]);assert.deepEqual(personalGateColour(12),[1,.48,.20]);assert.deepEqual(personalGateColour(18),personalGateColour(0));
 for(let i=0;i<180;i++){const a=personalGateColour(i*.1),b=personalGateColour(i*.1+.01);for(let c=0;c<3;c++){assert(a[c]>=0&&a[c]<=1);assert(Math.abs(a[c]-b[c])<.005);}}
});
