import test from 'node:test';
import assert from 'node:assert/strict';
import { insideGround, paving, boundaries, type GroundPoint } from '../src/temple-terrain.ts';
import { zones } from '../src/contracts.ts';

test('the twelve review zones have a connected outdoor approach inside the ground and walls',()=>{
  for(const zone of zones){
    const [x,,z]=zone.center;
    // The forest and reserved north-east zone are reached around the main hall.
    const points: GroundPoint[]=z>=35 && zone.id!=='Z04'
      ? [[0,-65],[0,18],[22,18],[22,z],[x,z]]
      : [[0,-65],[0,z],[x,z]];
    for(let i=1;i<points.length;i++){
      const [ax,az]=points[i-1], [bx,bz]=points[i];
      const count=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/.1));
      for(let j=0;j<=count;j++)assert.ok(insideGround(ax+(bx-ax)*j/count,az+(bz-az)*j/count,.325),zone.id);
    }
  }
  for(const wall of boundaries){
    assert.ok(!insideGround((wall.from[0]+wall.to[0])/2,(wall.from[1]+wall.to[1])/2,.325));
  }
  assert.ok(paving.every(path=>path.to[1]<=7));
});
