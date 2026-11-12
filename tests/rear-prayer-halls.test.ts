import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {rearPrayerHalls,prayerHallDimensions,prayerHallPoint,prayerAisleX,validTemplePose} from '../src/prayer-halls.ts';
import {insideGround,insideBoundary,rearPrayerWalk,prayerHallApproaches,boundaries,distanceToSegment} from '../src/temple-terrain.ts';
import {fixedSlots} from '../src/contracts.ts';
import {walkingPath} from '../src/point-navigation.ts';
import {channels} from '../server/service/channels.mjs';

test('approved four rear halls have distinct deities, correct door direction and clear wall margins',()=>{
 assert.deepEqual(rearPrayerHalls.map(h=>[h.name,h.deity]),[['약사전','약사여래불'],['문수전','문수보살'],['보현전','보현보살'],['극락전','아미타불']]);
 for(const hall of rearPrayerHalls){
  const entry=prayerHallPoint(hall,prayerAisleX,-8),altar=prayerHallPoint(hall,prayerAisleX,2.65);
  assert(insideGround(...entry,.325));assert(insideGround(...altar,.325));
  if(hall.id==='yaksa')assert(entry[0]>altar[0]);else if(hall.id==='geukrak')assert(entry[0]<altar[0]);else assert(entry[1]<altar[1]);
  const hw=hall.yaw===0?7:6,hd=hall.yaw===0?6:7;
  for(const dx of [-hw,hw])for(const dz of [-hd,hd])assert(insideBoundary(hall.x+dx,hall.z+dz,2),'roof to wall clearance '+hall.id);
 }
 assert.equal(prayerHallDimensions.y,.82);
});

test('the new loop and each hall approach are continuous dry routes with wall and pedestal clearance',()=>{
 for(const route of [rearPrayerWalk,...prayerHallApproaches.map(a=>a.route)])for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*10));
  for(let j=0;j<=n;j++){
   const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;
   assert(insideGround(x,z,.325),'blocked '+[x,z]);assert(Math.hypot(x-59,z-55)>4.425);
  }
 }
 for(const hall of rearPrayerHalls){
  const approach=prayerHallApproaches.find(a=>a.id===hall.id)!;
  assert(rearPrayerWalk.some((b,i)=>i>0&&distanceToSegment(...approach.route[0],rearPrayerWalk[i-1],b)<2),'loop connection '+hall.id);
 }
 assert(insideBoundary(0,100,.325));assert(!insideBoundary(0,117,.325));assert(!insideBoundary(90,0,.325));
 assert(!boundaries.some(w=>w.from[1]===78&&w.to[1]===78));
});

test('northward point navigation and visitor synchronization accept the new grounds but reject non-finite and out-of-range positions',()=>{
 const goal:readonly[number,number]=[-22,86];
 assert.deepEqual(walkingPath([-23,83],goal,(_a,b)=>insideGround(...b,.325)),[goal]);
 assert(validTemplePose([-22,1.15,99]));assert(!validTemplePose([0,1,119]));assert(!validTemplePose([0,NaN,100]));
 let now=1000;const handle=channels(()=>now);const join=handle('rear-test','session','join',{channel:1});
 assert.equal(join[0],200);const self=join[1].self;
 assert.equal(handle('rear-test','session','move',{self,sequence:1,position:[-22,1.15,99],yaw:0,animation:'idle'})[0],200);
 now+=1000;assert.equal(handle('rear-test','session','move',{self,sequence:2,position:[-20,1.15,99],yaw:0,animation:'walk'})[0],200);
 assert.equal(handle('rear-test','session','move',{self,sequence:3,position:[1000,1,1000],yaw:0,animation:'walk'})[0],400);
});

test('all five existing offering types retain their complete approved slot geometry',()=>{
 const slots=fixedSlots();assert.equal(slots.length,531);
 assert.equal(createHash('sha256').update(JSON.stringify(slots.filter(s=>s.accepts==='lantern'))).digest('hex'),'d0253d33a0ccc6cc75bd58805112ce7c3127fc1f77df03761b2e326ca6b4ddcc');
});
