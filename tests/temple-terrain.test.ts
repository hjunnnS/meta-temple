import test from 'node:test';
import assert from 'node:assert/strict';
import { insideGround, paving, boundaries, pond, shoreRadius, coinThrowBank, canThrowCoin, type GroundPoint } from '../src/temple-terrain.ts';
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
  assert.ok(paving.filter(path=>path.name!=='forest-court').every(path=>path.to[1]<=7));
});

test('visitors can circle the pond between the office and pagoda',()=>{
  for(let degree=0;degree<360;degree+=5){
    const angle=degree*Math.PI/180;
    const r=shoreRadius(angle);
    assert.ok(insideGround(pond.x+(pond.width/2*r+1)*Math.cos(angle),pond.z+(pond.depth/2*r+1)*Math.sin(angle),.325));
    assert.ok(!insideGround(pond.x+(pond.width/2*r-.1)*Math.cos(angle),pond.z+(pond.depth/2*r-.1)*Math.sin(angle),.325));
  }
});

test('the south wall runs straight from Iljumun to the far pagoda corner',()=>{
  assert.ok(boundaries.some(w=>w.from[0]===4 && w.from[1]===-68 && w.to[0]===72 && w.to[1]===-68));
  for(let x=35;x<=70;x+=.25)assert.ok(insideGround(x,-62,.325));
  for(let z=-65;z<=-55;z+=.25)assert.ok(insideGround(67,z,.325));
});


test('coin throwing follows one continuous U-shaped bank and excludes the water and northern opening',()=>{
 for(const [x,z] of coinThrowBank)assert.ok(canThrowCoin(x,z));
 for(let i=1;i<coinThrowBank.length;i++){
  const a=coinThrowBank[i-1],b=coinThrowBank[i];
  assert.ok(canThrowCoin((a[0]+b[0])/2,(a[1]+b[1])/2));
 }
 assert.equal(canThrowCoin(pond.x,pond.z),false);
 assert.equal(canThrowCoin(0,-52),false);
 const a=Math.PI/2,r=shoreRadius(a);
 assert.equal(canThrowCoin(pond.x,pond.z+r*pond.depth*.5+1),false);
});
