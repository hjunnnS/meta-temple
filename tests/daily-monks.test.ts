import test from'node:test';import assert from'node:assert/strict';
import{dailyMonkSites,dailyMonkFrame,dailyGreeting}from'../src/daily-monk-layout.ts';
import{insideGround,coinThrowBank,distanceToSegment,interiorWoodland,rearPrayerWalk}from'../src/temple-terrain.ts';
import{hallLampSlots}from'../src/contracts.ts';
test('four daily monks use separate dry sites and keep the coin bank, paths, trees and paid lamps clear',()=>{
 assert.equal(new Set(dailyMonkSites.map(s=>s.role)).size,4);
 for(const s of dailyMonkSites)for(let i=0;i<1800;i++){
  const f=dailyMonkFrame(s,i*.1);assert(insideGround(f.x,f.z,.7));
  for(const tree of interiorWoodland)assert(Math.hypot(tree.x-f.x,tree.z-f.z)>.95);
  if(s.role==='pond')for(let j=1;j<coinThrowBank.length;j++)assert(distanceToSegment(f.x,f.z,coinThrowBank[j-1],coinThrowBank[j])>3.4);
  if(s.role==='reader')for(let j=1;j<rearPrayerWalk.length;j++)assert(distanceToSegment(f.x,f.z,rearPrayerWalk[j-1],rearPrayerWalk[j])>2.4);
  if(s.role==='lamps')for(const slot of hallLampSlots('votive'))assert(Math.hypot(slot.position[0]-f.x,slot.position[2]-f.z)>.65);
 }
});
test('daily routes alternate work and walking with smooth bounded steps, while reader stays seated',()=>{
 for(const s of dailyMonkSites){let before=dailyMonkFrame(s,0),walked=false,worked=false;for(let i=1;i<3000;i++){
  const f=dailyMonkFrame(s,i*.1);assert(Math.hypot(f.x-before.x,f.z-before.z)<.055);assert(Number.isFinite(f.yaw));assert(f.blend>=0&&f.blend<=1);walked||=f.walking;worked||=f.work>0;before=f;
 }assert(worked);assert.equal(walked,s.role!=='reader');}
});
test('greeting raises palms once, holds and returns to the paused activity',()=>{
 assert.equal(dailyGreeting(0),0);assert.equal(dailyGreeting(4),0);assert.equal(dailyGreeting(2),1);
 let before=0;for(let i=0;i<=400;i++){const value=dailyGreeting(i/100);assert(value>=0&&value<=1);assert(Math.abs(value-before)<.02);before=value;}
});
