import test from 'node:test';
import assert from 'node:assert/strict';
import { lanternSlots, visibleLanternSlots, canopyLanternSlots, OWNED_INDICES, zones, LANTERN_PALETTE, lanternColourIndex, normalizeLanternName } from '../src/contracts.ts';
import { frameSummary, Measurement } from '../src/metrics.ts';
test('density changes preserve existing slot identities and positions',()=>{const low=lanternSlots(100),high=lanternSlots(1000);assert.deepEqual(low,high.slice(0,100));assert.equal(new Set(high.map(x=>x.id)).size,1000);for(const i of OWNED_INDICES)assert.deepEqual(low[i],high[i]);});
test('reject malformed density rather than moving or dropping slots',()=>{for(const n of [-1,0,1001,1.5,NaN])assert.throws(()=>lanternSlots(n));});
test('all 12 planned spaces have unique identifiers and valid extents',()=>{assert.equal(zones.length,12);assert.equal(new Set(zones.map(z=>z.id)).size,12);assert.ok(zones.every(z=>z.center.every(Number.isFinite)&&z.size.every(n=>n>0)));});
test('frame aggregation uses elapsed time and worst 1% frame durations',()=>{const s=frameSummary([...Array(99).fill(10),100])!;assert.ok(Math.abs(s.meanFps-100000/1090)<.001);assert.equal(s.onePercentLowFps,10);assert.equal(s.maxFrameMs,100);assert.equal(frameSummary([]),null);});
test('a suspended or changed run is invalid and cannot collect more frames',()=>{const m=new Measurement();m.start(0);m.frame(16);m.invalidate('hidden');m.frame(100);assert.equal(m.frames.length,1);assert.equal(m.report().valid,false);assert.equal(m.report().invalidReason,'hidden');});
test('changing settings after stop invalidates old measurement and preserves duration',()=>{const m=new Measurement();m.start(0);m.frame(20);const a=m.stop();const b=m.report();assert.equal(a.elapsedSeconds,b.elapsedSeconds);m.invalidate('quality changed');assert.equal(m.report().valid,false);assert.equal(m.report().elapsedSeconds,b.elapsedSeconds);});

test('sample rows run toward the hall and density does not rearrange them',()=>{const slots=lanternSlots(100);assert.equal(new Set(slots.slice(0,32).map(s=>s.position[0])).size,1);assert.equal(new Set(slots.slice(0,32).map(s=>s.position[2])).size,32);assert.ok(slots.every(s=>s.position[2]<2));});

test('reference palette has five spatial bands independent of density',()=>{assert.equal(LANTERN_PALETTE.length,5);const slots=lanternSlots(1000);assert.equal(new Set(slots.map(s=>lanternColourIndex(s.position))).size,5);for(const s of slots){const other=slots.find(x=>x.position[2]===s.position[2])!;assert.equal(lanternColourIndex(s.position),lanternColourIndex(other.position));}});
test('name preview removes control characters and caps Unicode code points',()=>{assert.equal(normalizeLanternName('  김\n사사  '),'김사사');assert.equal(Array.from(normalizeLanternName('가'.repeat(20))).length,12);assert.equal(normalizeLanternName(' '),'');assert.equal(normalizeLanternName('🪷'.repeat(13)),'🪷'.repeat(12));});

test('only lanterns wholly over the paved approach render without relocating slots',()=>{for(const count of [100,300,500,1000]){const original=lanternSlots(count);const visible=visibleLanternSlots(count);assert.equal(new Set(visible.map(s=>lanternColourIndex(s.position))).size,5);assert.ok(visible.length>0&&visible.length<count);for(const s of visible){assert.ok(Math.abs(s.position[0])+.5<=7.93);assert.ok(s.position[2]-.5>=-21.725);assert.ok(s.position[2]+.5<=1.5);assert.deepEqual(s,original.find(x=>x.id===s.id));}for(const i of OWNED_INDICES)assert.ok(visible.some(s=>s.id===original[i].id));}});

test('spaced canopy preserves owned positions and small light gaps',()=>{
 const base=visibleLanternSlots(1000),dense=canopyLanternSlots(1000);
 assert.equal(dense.length,384);assert.equal(new Set(dense.map(s=>s.id)).size,dense.length);
 for(const slot of base)assert.deepEqual(dense.find(s=>s.id===slot.id),slot);
 for(const slot of dense){const [x,,z]=slot.position;assert.ok(Math.abs(x)+.5<=7.93);assert.ok(z-.5>=-21.725&&z+.5<=1.5);}
 for(const slot of base){const nearest=Math.min(...dense.filter(s=>s.id!==slot.id).map(s=>Math.hypot(s.position[0]-slot.position[0],s.position[2]-slot.position[2])));assert.ok(nearest>=.899&&nearest<=.901);}
 assert.equal(new Set(dense.map(s=>lanternColourIndex(s.position))).size,5);
});
