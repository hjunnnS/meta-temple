import test from 'node:test';
import assert from 'node:assert/strict';
import { templePlaces, daeungDimensions, meditationTrees } from '../src/temple-layout.ts';
test('reference layout preserves south/north order, west/east placement and non-overlapping hall footprints',()=>{
 const get=(id:string)=>templePlaces.find(p=>p.id===id)!;
 const axis=['ilju','cheonwang','indeung','daeung','forest'].map(id=>get(id).z);
 assert.ok(axis.every((z,i)=>i===0||z>axis[i-1]));
 for(const [west,east] of [['bell','office'],['gwaneum','jijang']]){
  assert.ok(get(west).x<0&&get(east).x>0);
 }
 const westRow=['bell','indeung','gwaneum'].map(get);
 assert.ok(westRow.every(p=>p.x===westRow[0].x));
 assert.ok(westRow[0].z<westRow[1].z && westRow[1].z<westRow[2].z);
 assert.equal(get('office').z,get('bell').z);
 assert.equal(get('office').x,get('jijang').x);
 assert.equal(get('gwaneum').z,get('jijang').z);
 const halls=templePlaces.filter(p=>p.kind==='hall');
 for(let i=0;i<halls.length;i++)for(let j=i+1;j<halls.length;j++){
  const a=halls[i],b=halls[j];
  assert.ok(Math.abs(a.x-b.x)>11.5*((a.id==='daeung'?daeungDimensions.x:a.scale)+(b.id==='daeung'?daeungDimensions.x:b.scale))||Math.abs(a.z-b.z)>5.9*((a.id==='daeung'?daeungDimensions.z:a.scale)+(b.id==='daeung'?daeungDimensions.z:b.scale)));
 }
 assert.equal(new Set(templePlaces.map(p=>p.id)).size,13);
});

test('rear and side woodland stays outside expanded main hall',()=>{
 const hall=templePlaces.find(p=>p.id==='daeung')!;
 for(const t of meditationTrees)assert.ok(Math.abs(t.x)>11.5*daeungDimensions.x+2.25||Math.abs(t.z-hall.z)>5.9*daeungDimensions.z+2.25);
 assert.ok(meditationTrees.some(t=>t.x<0)&&meditationTrees.some(t=>t.x>0));
 assert.ok(meditationTrees.some(t=>t.z>hall.z+20));
});
