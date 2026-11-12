import test from 'node:test';import assert from 'node:assert/strict';
import {guideCourses,guideDestination,atGuideDestination,enabledGuideCourses}from'../src/guide-courses.ts';
test('five proposed courses reuse distinct existing halls and health is the first reviewed slice',()=>{
 assert.equal(guideCourses.length,5);assert.equal(new Set(guideCourses.map(c=>c.place)).size,5);
 assert.deepEqual(enabledGuideCourses,['health']);assert.equal(guideDestination('health').name,'약사전');
 for(const c of guideCourses){const d=guideDestination(c.id);assert(atGuideDestination(c.id,[d.x,d.floor,d.z]));assert(!atGuideDestination(c.id,[d.x,0,d.z]));assert(!atGuideDestination(c.id,[d.x+4,d.floor,d.z]));assert(!atGuideDestination(c.id,[NaN,d.floor,d.z]));assert(!atGuideDestination(c.id,null));}
});
