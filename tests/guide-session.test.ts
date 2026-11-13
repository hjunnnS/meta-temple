import test from'node:test';import assert from'node:assert/strict';import{GuideSession}from'../src/guide-session.ts';
test('free course requires real arrival and prayer result, and optional stages can be skipped',()=>{
 const g=new GuideSession();g.start('health');assert(g.advance(false));assert(!g.advance(false));assert(g.advance(true));assert(!g.advance(true));g.result('prayer','completed');assert(g.advance(true));assert(g.skip());assert(!g.skip());assert.equal(g.stage,'finish');assert.equal(g.prayer,'completed');assert.equal(g.practice,'skipped');assert.equal(g.offering,'skipped');assert(g.previous());assert.equal(g.stage,'practice');assert(g.advance(true));assert.equal(g.stage,'finish');
});
test('old stage results and course changes do not complete a new step',()=>{
 const g=new GuideSession();g.start('health');assert(!g.result('offering','completed'));g.advance(false);g.advance(true);g.result('prayer','completed');g.start('family');assert.equal(g.prayer,'pending');assert.equal(g.stage,'prepare');assert(!g.previous());g.exit();assert(!g.skip());assert(!g.advance(true));
});
