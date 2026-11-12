import test from 'node:test';
import assert from 'node:assert/strict';
import { insideGround, insideBoundary, distanceToSegment, paving, boundaries, rearGardenWalls, pond, shoreRadius, coinThrowBank, canThrowCoin, sanctuaryWalk, teaPavilion, teaTerrace, teaGardenTables, teaGardenWalk, eastCourts, teaSeats, teaApproach, gateApproach, interiorWoodland, type GroundPoint } from '../src/temple-terrain.ts';
import { zones } from '../src/contracts.ts';

test('the twelve review zones have a connected outdoor approach inside the ground and walls',()=>{
  for(const zone of zones){
    const [x,,z]=zone.center;
    // The forest and reserved north-east zone are reached around the main hall.
    const points: GroundPoint[]=zone.id==='Z10'?[[0,-65],[0,-45],[15,-45],[15,-63.9],[x,-63.9],[x,z]]:z>=35 && zone.id!=='Z04'
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
  for(const path of paving){
   for(let i=0;i<=20;i++)assert.ok(insideGround(path.from[0]+(path.to[0]-path.from[0])*i/20,path.from[1]+(path.to[1]-path.from[1])*i/20,.325),path.name);
  }
});

test('visitors can circle the pond between the office and pagoda',()=>{
  for(let degree=0;degree<360;degree+=5){
    const angle=degree*Math.PI/180;
    const r=shoreRadius(angle);
    assert.ok(insideGround(pond.x+(pond.width/2*r+1)*Math.cos(angle),pond.z+(pond.depth/2*r+1)*Math.sin(angle),.325));
    const wx=pond.x+(pond.width/2*r-.1)*Math.cos(angle),wz=pond.z+(pond.depth/2*r-.1)*Math.sin(angle);
    assert.equal(insideGround(wx,wz,.325),false);
  }
});

test('approved enclosing wall leaves the eastern gardens continuous and aligns the entrance with the southern frontage',()=>{
 assert.ok(boundaries.some(w=>w.from[0]===4&&w.from[1]===-78&&w.to[0]===77&&w.to[1]===-78));
 for(let z=-75;z<=75;z+=.5)assert.ok(insideBoundary(72,z,.325));
 for(let z=-77;z<=-60;z+=.25)assert.ok(insideGround(0,z,.325));
 for(let x=35;x<=70;x+=.25)assert.ok(insideGround(x,-34,.325));
});


test('coin throwing follows one continuous U-shaped bank and excludes the water and northern opening',()=>{
 for(const [x,z] of coinThrowBank)assert.equal(canThrowCoin(x,z),true);
 for(let i=1;i<coinThrowBank.length;i++){
  const a=coinThrowBank[i-1],b=coinThrowBank[i];
  const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;assert.equal(canThrowCoin(x,z),true);
 }
 assert.equal(canThrowCoin(pond.x,pond.z),false);
 assert.equal(canThrowCoin(0,-52),false);
 const a=Math.PI/2,r=shoreRadius(a);
 assert.equal(canThrowCoin(pond.x,pond.z+r*pond.depth*.5+1),false);
});


test('a camera may orbit over the pond while the visitor stays on dry land',()=>{
 assert.ok(insideBoundary(pond.x,pond.z,.1));
 assert.equal(insideGround(pond.x,pond.z,.325),false);
 assert.equal(insideBoundary(eastCourts.tower.east,-52,.1),false);
});


test('new walking routes clear the pond, walls, statue pedestal and woodland trunks',()=>{
 for(const route of [sanctuaryWalk,teaApproach,teaGardenWalk,gateApproach]){
  for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   for(let d=0;d<=length;d+=.1){
    const t=d/length,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
    assert.ok(insideGround(x,z,.325),'route blocked at '+[x,z]);
    assert.ok(Math.hypot(x-59,z-55)>4.425,'statue pedestal');
   }
  }
 }
 for(const tree of interiorWoodland){
  for(let i=1;i<sanctuaryWalk.length;i++){
   const a=sanctuaryWalk[i-1],b=sanctuaryWalk[i];
   const t=Math.max(0,Math.min(1,((tree.x-a[0])*(b[0]-a[0])+(tree.z-a[1])*(b[1]-a[1]))/((b[0]-a[0])**2+(b[1]-a[1])**2)));
   assert.ok(Math.hypot(tree.x-a[0]-(b[0]-a[0])*t,tree.z-a[1]-(b[1]-a[1])*t)>2);
  }
 }
});


test('the enlarged pavilion and open terrace have dry seats, clear exit aisles and wall margins',()=>{
 assert.equal(teaPavilion.width*teaPavilion.depth,14*8);
 assert.equal(teaTerrace.width*teaTerrace.depth,14*3.5);
 assert.equal(teaSeats.filter(s=>s.outdoors).length,14);
 assert.equal(teaSeats.filter(s=>!s.outdoors).length,6);
 for(const s of teaSeats){assert.ok(insideGround(s.x,s.z,.4));assert.ok(insideGround(s.x,s.z-1.2,.4));}
 for(const area of [teaPavilion,teaTerrace]){
  for(let x=area.x-area.width/2;x<=area.x+area.width/2;x+=.25)
   for(let z=area.z-area.depth/2;z<=area.z+area.depth/2;z+=.25)
    assert.ok(insideGround(x,z,.25),'tea area '+[x,z]);
 }
 assert.ok(eastCourts.tower.east-(teaPavilion.x+teaPavilion.width/2)>3);
 assert.ok(teaPavilion.z-teaPavilion.depth/2-eastCourts.tower.south>=3);
});


test('side garden tables and chairs preserve the west entry and pond route',()=>{
 assert.equal(teaGardenTables.length,4);assert.equal(teaSeats.filter(s=>s.area==='옆마당').length,8);
 for(let i=0;i<teaGardenTables.length;i++)for(let j=i+1;j<teaGardenTables.length;j++){
  const a=teaGardenTables[i],b=teaGardenTables[j];assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>4);
 }
 for(const table of teaGardenTables){
  assert.ok(insideGround(table.x,table.z,1.4));
  assert.ok(teaPavilion.x-teaPavilion.width/2-(table.x+1.4)>=1.5);
  for(let i=1;i<teaApproach.length;i++)assert.ok(distanceToSegment(table.x,table.z,teaApproach[i-1],teaApproach[i])>2.9);
 }
});


test('rear garden walls clear the walking loop and join the eastern enclosing wall',()=>{
 assert.equal(rearGardenWalls.length,5);
 for(let i=1;i<rearGardenWalls.length;i++)assert.deepEqual(rearGardenWalls[i-1].to,rearGardenWalls[i].from);
 for(const wall of rearGardenWalls){
  assert.equal(wall.height,1.8);
  for(const point of sanctuaryWalk)assert.ok(distanceToSegment(point[0],point[1],wall.from,wall.to)>=(wall===rearGardenWalls[1]?4.5:2.8));
 }
 for(const [x,z] of [[-24,28],[23,61],[0,64],[69,36]])assert.ok(insideGround(x,z,.325));
});


test('the approved rear extension joins the original frontage without interior dividing walls',()=>{
 const west=rearGardenWalls[0];assert.deepEqual(west.from,[-37,30]);assert.deepEqual(west.to,[-58,30]);
 assert.ok(boundaries.some(w=>w.to[0]===west.from[0]&&w.to[1]===west.from[1]&&w.from[0]===-37));
 assert.ok(!boundaries.some(w=>w.from[0]===-28||w.to[0]===-28));
});
