import test from 'node:test';
import assert from 'node:assert/strict';
import {bellCycle,bellFrame,bellSamples,bellPoint,BELL_DURATION,BELL_IMPACT} from '../src/bell-cycle.ts';
import {channels} from '../server/service/channels.mjs';

test('one ring has exactly one contact, rejects duplicate starts and cancellation prevents a delayed sound',()=>{
 let hits=0;const cycle=bellCycle(()=>hits++);
 assert.equal(cycle.start(),true);assert.equal(cycle.start(),false);
 cycle.update(BELL_IMPACT-.01);assert.equal(hits,0);cycle.update(.02);assert.equal(hits,1);
 cycle.update(10);assert.equal(hits,1);assert.equal(cycle.active,false);
 cycle.start();cycle.update(.8);cycle.cancel();cycle.update(10);assert.equal(hits,1);
 cycle.start();cycle.update(BELL_DURATION);assert.equal(hits,2);
});

test('striker travels back before its single forward contact and settles without exceeding its suspension',()=>{
 assert.ok(Math.abs(bellFrame(0).offset)<1e-8);assert.ok(Math.abs(bellFrame(1).offset)<1e-8);
 assert.equal(bellFrame(1.15/BELL_DURATION).offset,-.75);
 assert.ok(Math.abs(bellFrame(BELL_IMPACT/BELL_DURATION).offset-.35)<.0001);
 for(let p=0;p<=1;p+=.001){const f=bellFrame(p);assert.ok(Number.isFinite(f.lift)&&f.lift>=0);assert.ok(f.offset<=.351&&f.offset>=-.751);}
 const spot=bellPoint(-3.05,.245);assert.ok(spot[0]<-26&&spot[2]<-48);
});

test('original bronze tone is finite, has a smooth onset and a fading tail',()=>{
 const samples=bellSamples();assert.equal(samples.length,24000*12);assert.equal(samples[0],0);
 let peak=0,early=0,late=0;
 for(let i=0;i<samples.length;i++){assert.ok(Number.isFinite(samples[i]));peak=Math.max(peak,Math.abs(samples[i]));if(i<24000)early+=samples[i]**2;if(i>samples.length-24000)late+=samples[i]**2;}
 assert.ok(peak>.1&&peak<1);assert.ok(late<early*.05);
});

test('guest ringing pose and contact count reach a second visitor and malformed progress is rejected',()=>{
 const api=channels();const self=api('guest-a','session-a','join',{channel:1})[1].self;
 const pose={self,sequence:1,position:bellPoint(-3.05,.245),yaw:0,animation:'bell',bellProgress:.5,bellHit:1};
 assert.equal(api('guest-a','session-a','move',pose)[0],200);
 const other=api('guest-b','session-b','join',{channel:1})[1].self;
 const peer=api('guest-b','session-b','move',{...pose,self:other,bellHit:0})[1].participants[0];
 assert.equal(peer.animation,'bell');assert.equal(peer.bellProgress,.5);assert.equal(peer.bellHit,1);
 for(const change of [{bellProgress:NaN},{bellProgress:1.01},{bellHit:-1},{bellHit:.5}])assert.equal(api('guest-a','session-a','move',{...pose,...change,sequence:2})[0],400);
});
