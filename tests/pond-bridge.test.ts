import test from 'node:test';
import assert from 'node:assert/strict';
import {pondBridge,pondBridgeHeight,onPondBridge} from '../src/pond-bridge-layout.ts';
import {insideGround,pond,teaPavilion,pondBridgeApproaches,canThrowCoin} from '../src/temple-terrain.ts';
import {templePlaces} from '../src/temple-layout.ts';
import {walkingPath} from '../src/point-navigation.ts';
test('bridge has smooth ramps, dry landings, protected sides and no coin throwing on its deck',()=>{
 const b=pondBridge;
 for(let z=b.south;z<=b.north;z+=.05){
  assert(insideGround(b.x,z,.325));assert.equal(canThrowCoin(b.x,z),false);
  const y=pondBridgeHeight(b.x,z)!;assert(y>=.029&&y<=b.height);
  if(z+.05<b.north)assert(Math.abs(pondBridgeHeight(b.x,z+.05)!-y)<.013);
 }
 for(const z of [b.south-.4,b.north+.4])assert(insideGround(b.x,z,.325));
 assert.equal(pondBridgeHeight(b.x+b.width,pond.z),null);
 assert(!insideGround(b.x+b.width,pond.z,.325));assert(!onPondBridge(b.x+b.width/2-.1,pond.z,.325));
 assert.equal(pondBridgeHeight(b.x,pond.z),b.height);
 const route=walkingPath([b.x,b.south-1],[b.x,b.north+1],(_a,p)=>insideGround(...p,.325));assert(route.length>0);
});
test('office aligns with cafe, faces north and bridge approaches clear the enlarged water',()=>{
 const office=templePlaces.find(p=>p.id==='office')!;
 assert.equal(office.z,teaPavilion.z);assert.equal(office.yaw,Math.PI);
 assert(pond.width*pond.depth>27*15*1.5);
 for(const path of pondBridgeApproaches)for(let i=1;i<path.length;i++)for(let j=0;j<=100;j++){
  const a=path[i-1],b=path[i],x=a[0]+(b[0]-a[0])*j/100,z=a[1]+(b[1]-a[1])*j/100;
  assert(insideGround(x,z,.325),'dry bridge approach '+[x,z]);
 }
});
