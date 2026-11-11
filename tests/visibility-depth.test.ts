import test from 'node:test';import assert from 'node:assert/strict';
import {sceneNearPlane,courtPathLift,courtHalfWidth,courtSouthEdge,courtDepth} from '../src/temple-layout.ts';
test('distant views distinguish nearby soil and valley depths without changing close camera clipping',()=>{
 for(const distance of [.045,2.5,6.6,11])assert.equal(sceneNearPlane(distance),.1);
 for(const distance of [100,180,210,260]){
  const near=sceneNearPlane(distance),far=10000,depth=(d:number)=>far/(far-near)-far*near/((far-near)*d);
  assert((depth(distance+.051)-depth(distance))*(2**24-1)>=8,'not enough depth steps for separated ground surfaces');
  assert(near<=1&&near<distance);
 }
});
test('court flagstones clear the court top while all ordinary paths retain their existing height',()=>{
 for(const[x,z]of[[0,courtSouthEdge+.5],[20,14],[-20,14],[18,0]])assert(.088-.005+courtPathLift(x,z)>.09+.025);
 for(const[x,z]of[[40,0],[0,-40],[0,courtSouthEdge-.1],[0,courtSouthEdge+courtDepth+.1],[courtHalfWidth+.1,14]])assert.equal(courtPathLift(x,z),0);
});
