import test from 'node:test';import assert from 'node:assert/strict';
import {insideGround,coinThrowBank,canThrowCoin,pond} from '../src/temple-terrain.ts';
test('removing the bridge restores the full U-shaped throwing bank and blocks the former water crossing',()=>{
 for(const p of coinThrowBank)assert(canThrowCoin(...p));
 for(let i=1;i<coinThrowBank.length;i++){const a=coinThrowBank[i-1],b=coinThrowBank[i];assert(canThrowCoin((a[0]+b[0])/2,(a[1]+b[1])/2));}
 for(let z=-57;z<=-48;z+=.25)assert.equal(insideGround(44,z,.325),false);
 assert.equal(canThrowCoin(pond.x,pond.z),false);assert.equal(insideGround(pond.x,pond.z,.325),false);
});
