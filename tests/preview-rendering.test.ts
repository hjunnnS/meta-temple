import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWhileViewing } from '../src/preview-rendering.ts';

test('a background preview starts on return, stops offscreen and resumes exactly once', () => {
  const page = Object.assign(new EventTarget(), {hidden:true, hasFocus:()=>focused});
  const win = new EventTarget();
  let focused = false;
  Object.assign(globalThis, {document:page, window:win});
  const frames = new Set<()=>void>();
  let starts=0, stops=0;
  const render=()=>{};
  renderWhileViewing({
    runRenderLoop(fn){assert.equal(fn,render);starts++;frames.add(fn);},
    stopRenderLoop(fn){assert.equal(fn,render);stops++;frames.delete(fn);}
  },render);
  assert.equal(frames.size,0);
  page.hidden=false;page.dispatchEvent(new Event('visibilitychange'));
  focused=true;win.dispatchEvent(new Event('focus'));
  win.dispatchEvent(new Event('pageshow'));
  assert.equal(starts,1);
  focused=false;win.dispatchEvent(new Event('blur'));
  page.hidden=true;page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(frames.size,0);assert.equal(stops,1);
  focused=true;win.dispatchEvent(new Event('focus'));
  assert.equal(starts,1);
  page.hidden=false;page.dispatchEvent(new Event('visibilitychange'));
  win.dispatchEvent(new Event('pagehide'));assert.equal(frames.size,0);
  win.dispatchEvent(new Event('pageshow'));assert.equal(frames.size,1);
  assert.equal(starts,3);assert.equal(stops,2);
});

test('a visible unfocused preview draws its first ready frame, then pauses',()=>{
 let focused=false, ready=false, renders=0;
 const page=Object.assign(new EventTarget(),{hidden:true,hasFocus:()=>focused});
 const win=new EventTarget();
 Object.assign(globalThis,{document:page,window:win});
 const frames=new Set<()=>void>();
 renderWhileViewing({
  runRenderLoop:fn=>frames.add(fn),stopRenderLoop:fn=>frames.delete(fn)
 },()=>{renders++;},undefined,undefined,()=>ready);
 assert.equal(frames.size,0);
 page.hidden=false;page.dispatchEvent(new Event('visibilitychange'));
 frames.forEach(fn=>fn());assert.equal(renders,1);assert.equal(frames.size,1);
 ready=true;frames.forEach(fn=>fn());assert.equal(renders,2);assert.equal(frames.size,0);
 focused=true;win.dispatchEvent(new Event('focus'));assert.equal(frames.size,1);
 focused=false;win.dispatchEvent(new Event('blur'));assert.equal(frames.size,0);
});
