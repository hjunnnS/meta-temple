import assert from 'node:assert/strict';
import test from 'node:test';
import {privatePracticeState,PRIVATE_BOW_DURATION} from '../src/private-practice-state.ts';

test('one bow completes once and stopping lets the current bow finish standing',()=>{
 const state=privatePracticeState();
 assert.equal(state.start('bow'),true);
 assert.equal(state.start('meditate'),false);
 state.tick(2);state.stop();
 assert.equal(state.mode,'bow');assert.equal(state.stopping,true);
 state.tick(PRIVATE_BOW_DURATION-2);
 assert.equal(state.active,false);assert.equal(state.count,1);
 state.tick(30);assert.equal(state.count,1);
 assert.equal(state.start('bow'),true);state.tick(PRIVATE_BOW_DURATION);
 assert.equal(state.count,2);
});

test('interrupted sitting rises from the current pose without jumping or restarting',()=>{
 const state=privatePracticeState();state.start('meditate');state.tick(.5);
 const seated=state.seated;assert.ok(seated>0&&seated<1);
 state.stop();assert.equal(state.seated,seated);
 state.tick(.1);const rising=state.seated;state.stop();
 assert.equal(state.seated,rising);assert.ok(rising<seated);
 state.tick(1);assert.equal(state.active,false);assert.equal(state.seated,0);
});

test('meditation stays seated until stopped and can start again after standing',()=>{
 const state=privatePracticeState();state.start('meditate');state.tick(1.25);
 state.tick(10);assert.equal(state.mode,'meditating');assert.equal(state.seated,1);
 assert.equal(state.meditationTime,10);assert.equal(state.count,0);
 state.stop();state.tick(1);assert.equal(state.mode,'idle');
 assert.equal(state.start('meditate'),true);assert.equal(state.meditationTime,0);
});
