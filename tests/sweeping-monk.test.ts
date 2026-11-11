import assert from 'node:assert/strict';
import test from 'node:test';
import {sweepingMonkCycle} from '../src/sweeping-monk-cycle.ts';
import {sweepingMonkSite,sanctuaryWalk,distanceToSegment,insideGround} from '../src/temple-terrain.ts';
test('repeated clicks cannot restart the greeting or overlap speech',()=>{
 const state=sweepingMonkCycle();assert(state.greet());let utterances=0;
 for(let i=0;i<100;i++){if(i<80)assert.equal(state.greet(),false);if(state.tick(.1))utterances++;}
 assert.equal(utterances,1);assert.equal(state.active,false);assert(state.greet());
});
test('the broom is put aside before joining palms, then greeting returns to sweeping',()=>{
 const state=sweepingMonkCycle();state.greet();for(let i=0;i<12;i++)state.tick(.1);
 assert.equal(state.frame().release,1);assert.equal(state.frame().palms,0);
 for(let i=0;i<20;i++)state.tick(.1);assert.equal(state.frame().palms,1);assert.equal(state.frame().speech,true);
 state.cancel();assert.equal(state.frame().speech,false);assert.equal(state.frame().phase,'sweeping');
});
test('the monk stays off the rear walking path and inside the temple boundary',()=>{
 const {x,z}=sweepingMonkSite;
 assert(insideGround(x,z,.75));
 const distance=Math.min(...sanctuaryWalk.slice(1).map((p,i)=>distanceToSegment(x,z,sanctuaryWalk[i],p)));
 assert(distance>1.8&&distance<4);
});
