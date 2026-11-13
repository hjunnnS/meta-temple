import test from 'node:test';
import assert from 'node:assert/strict';
import {renderProfile} from '../src/mobile-profile.ts';
test('desktop high and low preserve the approved render settings',()=>{assert.deepEqual(renderProfile(false,'high',1920,1080,false),{scale:1,shadow:4096,glow:true,reflection:2});assert.equal(renderProfile(false,'high',390,844,true).shadow,2048);assert.equal(renderProfile(false,'low',1920,1080,false).glow,false);});
test('portrait mobile actually reduces render size and preserves glow',()=>{for(const q of ['high','balanced','low'] as const){const p=renderProfile(true,q,390,844,false);assert(p.glow);assert(p.shadow<=2048);}assert(renderProfile(true,'balanced',390,844,false).scale>1);});
test('mobile orientation respects the same pixel budget',()=>{assert.deepEqual(renderProfile(true,'balanced',390,844,true),renderProfile(true,'balanced',844,390,true));const p=renderProfile(true,'low',2048,1536,false);assert(2048*1536/p.scale**2<=320001);});
