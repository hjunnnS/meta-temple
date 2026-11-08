import test from 'node:test';
import assert from 'node:assert/strict';
import {safeStep,walkRoute} from '../src/walk-route.ts';
test('guidance routes around a wall using its walkable opening',()=>{
 const terrain={floor:()=>0,blocked:(x:number,_y:number,z:number)=>Math.abs(x)>5||Math.abs(z)>5||(Math.abs(x)<.3&&z<2)};
 const start={x:-2,z:0},end={x:2,z:0};
 assert.equal(safeStep(terrain,start,end),false);
 const path=walkRoute(terrain,start,end);assert.deepEqual(path.at(-1),end);
 for(let i=0;i<path.length;i++)assert(safeStep(terrain,i?path[i-1]:start,path[i]));
});
test('guidance stops at a step beyond the avatar climbing limit',()=>{
 const terrain={floor:(x:number)=>x>0?1:0,blocked:(x:number,_y:number,z:number)=>Math.abs(x)>2||Math.abs(z)>2};
 assert.deepEqual(walkRoute(terrain,{x:-1,z:0},{x:1,z:0}),[]);
});
