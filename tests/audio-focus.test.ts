import test from 'node:test';import assert from 'node:assert/strict';
import{audioFocusLevel,setAudioFocus,watchAudioFocus}from'../src/audio-focus.ts';
test('narration takes priority; ending one owner preserves other active sounds',()=>{
 const ceremony={},practice={},voice={};let updates=0;const dispose=watchAudioFocus(()=>updates++);
 assert.equal(audioFocusLevel('ambience'),1);setAudioFocus(ceremony,'ceremony',true);assert.equal(audioFocusLevel('ambience'),.25);
 setAudioFocus(practice,'practice',true);assert.equal(audioFocusLevel('ceremony'),.25);
 setAudioFocus(voice,'narration',true);assert.equal(audioFocusLevel('ambience'),.12);assert.equal(audioFocusLevel('practice'),.35);assert.equal(audioFocusLevel('ceremony'),.18);
 setAudioFocus(practice,'practice',false);assert.equal(audioFocusLevel('ambience'),.12);
 setAudioFocus(voice,'narration',false);assert.equal(audioFocusLevel('ambience'),.25);assert.equal(audioFocusLevel('ceremony'),1);
 setAudioFocus(ceremony,'ceremony',false);assert.equal(audioFocusLevel('ambience'),1);assert.equal(updates,6);dispose();
});
