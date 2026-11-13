import test from'node:test';import assert from'node:assert/strict';import{guardWorldTap,worldTapAllowed}from'../src/tap-guard.ts';
test('shared gesture gate rejects drags, multi-touch, cancelled gestures and modal interaction',()=>{
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const host=new EventTarget(),canvas=new EventTarget() as HTMLCanvasElement;let modal=false;
 Object.defineProperty(globalThis,'window',{configurable:true,value:host});Object.defineProperty(globalThis,'document',{configurable:true,value:{querySelector:()=>modal?{}:null}});
 const event=(type:string,id=1,x=0,y=0,button=0)=>Object.assign(new Event(type),{pointerId:id,clientX:x,clientY:y,button}) as PointerEvent;
 const tap=()=>worldTapAllowed(canvas,event('pointerup'));
 try{guardWorldTap(canvas);canvas.dispatchEvent(event('pointerdown'));host.dispatchEvent(event('pointerup'));assert(tap());
 canvas.dispatchEvent(event('pointerdown'));canvas.dispatchEvent(event('pointermove',1,15));host.dispatchEvent(event('pointerup'));assert(!tap());
 canvas.dispatchEvent(event('pointerdown'));canvas.dispatchEvent(event('pointerdown',2));host.dispatchEvent(event('pointerup',2));host.dispatchEvent(event('pointerup'));assert(!tap());
 canvas.dispatchEvent(event('pointerdown'));canvas.dispatchEvent(event('pointercancel'));assert(!tap());
 canvas.dispatchEvent(event('pointerdown'));host.dispatchEvent(event('pointerup'));modal=true;assert(!tap());modal=false;assert(tap());
 canvas.dispatchEvent(event('pointerdown',1,0,0,2));assert(!tap());
 }finally{if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');}
});
