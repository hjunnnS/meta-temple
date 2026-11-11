import test from 'node:test';import assert from 'node:assert/strict';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {CreateBox} from '@babylonjs/core/Meshes/Builders/boxBuilder.js';
import {uprightBoxLettering} from '../src/sign-lettering.ts';
test('separate indoor/outdoor labels keep the original lettered face and remove every projecting backing triangle',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);
 try{for(const face of ['front','back'] as const){
  const sign=CreateBox(face,{width:3.2,height:.8,depth:.12},scene),original=Array.from(sign.getVerticesData('position')!);
  uprightBoxLettering(sign,face);assert.deepEqual(Array.from(sign.getVerticesData('position')!),original);
  const indices=sign.getIndices()!,normals=sign.getVerticesData('normal')!,uv=sign.getVerticesData('uv')!,side=face==='front'?-1:1;
  assert.equal(indices.length,6);for(const i of indices)assert(normals[i*3+2]*side>.9);
  const used=[...new Set(indices)];assert.equal(used.length,4);
  const top=used.filter(i=>original[i*3+1]>0),bottom=used.filter(i=>original[i*3+1]<0);
  assert(Math.min(...top.map(i=>uv[i*2+1]))>Math.max(...bottom.map(i=>uv[i*2+1])));
  const right=used.filter(i=>original[i*3]*-side>0),left=used.filter(i=>original[i*3]*-side<0);
  assert(Math.min(...right.map(i=>uv[i*2]))>Math.max(...left.map(i=>uv[i*2])));
 }}finally{scene.dispose();engine.dispose();}
});
test('ordinary two-sided gate signs keep their complete geometry',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);try{const sign=CreateBox('gate',{},scene),indices=Array.from(sign.getIndices()!);uprightBoxLettering(sign);assert.deepEqual(Array.from(sign.getIndices()!),indices);}finally{scene.dispose();engine.dispose();}
});
