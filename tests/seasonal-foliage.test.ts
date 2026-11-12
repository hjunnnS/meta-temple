import test from 'node:test';import assert from 'node:assert/strict';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';import {Scene} from '@babylonjs/core/scene.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';import type {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {seasonalTrees,treeSeason} from '../src/seasonal-tree.ts';
test('autumn canopy uses opaque folded leaves and far LOD reduces leaf geometry',t=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-11-12T03:00:00Z')});
 const engine=new NullEngine(),scene=new Scene(engine);try{
  const bark=new StandardMaterial('test-bark',scene),counts=[];
  for(const stride of [1,3,8]){const parts:Mesh[]=[];seasonalTrees(scene,parts,bark,stride)(0,0,3.8);const leaves=parts.filter(p=>p.name==='seasonal-lobed-leaves');assert(leaves.length>0);assert(!parts.some(p=>p.name==='seasonal-crown'));assert(leaves.every(p=>(p.material as StandardMaterial).alpha===1&&!p.material?.opacityTexture));counts.push(leaves.reduce((s,p)=>s+p.getTotalVertices(),0));}
  assert(counts[0]<=13000&&counts[0]>8000);assert(counts[1]<counts[0]/2);assert(counts[2]<counts[0]/5);
  assert.equal(treeSeason(new Date('2026-04-01T03:00:00Z')),'spring');assert.equal(treeSeason(new Date('2026-01-01T03:00:00Z')),'winter');
 }finally{scene.dispose();engine.dispose();}
});
