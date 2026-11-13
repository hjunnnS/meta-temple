import test from'node:test';import assert from'node:assert/strict';
import{guideMonkSite,teaMonkSite,walkingMonkFrame,walkingMonkPath,teaMonkLift}from'../src/quiet-npc-layout.ts';
import{insideGround,teaSeats,teaGardenTables,teaTables,interiorWoodland}from'../src/temple-terrain.ts';
test('guide and tea monk stay on dry ground without occupying any visitor seat or table',()=>{
 assert(insideGround(guideMonkSite.x,guideMonkSite.z,.7));assert(Math.abs(guideMonkSite.x)>1.5);assert(insideGround(teaMonkSite.x,teaMonkSite.z,.7));assert(insideGround(teaMonkSite.x,teaMonkSite.tableZ,.7));
 for(const s of teaSeats)assert(Math.hypot(s.x-teaMonkSite.x,s.z-teaMonkSite.z)>1.3);
 for(const t of [...teaTables,...teaGardenTables])assert(Math.hypot(t.x-teaMonkSite.x,t.z-teaMonkSite.tableZ)>1.6);
});
test('slow walking loop is continuous, remains at the path edge, and pauses for turning',()=>{
 let previous=walkingMonkFrame(0);let pauses=0,eastward=false,westward=false;
 for(let i=1;i<=2400;i++){const f=walkingMonkFrame(i*.1);assert(insideGround(f.x,f.z,.7));assert(f.x>=walkingMonkPath.west-1e-8&&f.x<=walkingMonkPath.east+1e-8);assert(Math.abs(f.z-73)>=1);assert(Math.hypot(f.x-previous.x,f.z-previous.z)<=.04001);if(!f.walking)pauses++;if(f.x>previous.x)eastward=true;if(f.x<previous.x)westward=true;for(const t of interiorWoodland)assert(Math.hypot(f.x-t.x,f.z-t.z)>.75);assert(Number.isFinite(f.yaw));previous=f;}
 assert(pauses>=150);assert(eastward&&westward);
});
test('tea lift has a rest, a sip and a smooth return without abrupt loop restart',()=>{let previous=teaMonkLift(0),raised=false;for(let i=1;i<=4000;i++){const lift=teaMonkLift(i*.01);assert(lift>=0&&lift<=1);assert(Math.abs(lift-previous)<.02);if(lift>.95)raised=true;previous=lift;}assert(raised);assert.equal(teaMonkLift(0),0);assert.equal(teaMonkLift(18),0);});
