import test from 'node:test';
import assert from 'node:assert/strict';
import { templePlaces } from '../src/temple-layout.ts';
test('reference layout preserves south/north order, west/east placement and non-overlapping hall footprints',()=>{
 const get=(id:string)=>templePlaces.find(p=>p.id===id)!;
 const axis=['ilju','cheonwang','indeung','daeung','samseong'].map(id=>get(id).z);
 assert.ok(axis.every((z,i)=>i===0||z>axis[i-1]));
 for(const [west,east] of [['bell','office'],['gwaneum','jijang'],['sansin','forest']]){
  assert.ok(get(west).x<0&&get(east).x>0);assert.equal(get(west).z,get(east).z);
 }
 const halls=templePlaces.filter(p=>p.kind==='hall');
 for(let i=0;i<halls.length;i++)for(let j=i+1;j<halls.length;j++){
  const a=halls[i],b=halls[j];
  assert.ok(Math.abs(a.x-b.x)>11.5*(a.scale+b.scale)||Math.abs(a.z-b.z)>5.9*(a.scale+b.scale));
 }
 assert.equal(new Set(templePlaces.map(p=>p.id)).size,11);
});
