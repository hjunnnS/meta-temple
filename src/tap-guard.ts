/** Share one gesture classification across movement, slots and NPCs. */
const guards=new WeakMap<HTMLCanvasElement,{valid:boolean;x:number;y:number;pointers:Set<number>}>();
export function guardWorldTap(canvas:HTMLCanvasElement){
 if(guards.has(canvas))return;
 const state={valid:false,x:0,y:0,pointers:new Set<number>()};guards.set(canvas,state);
 canvas.addEventListener('pointerdown',e=>{state.pointers.add(e.pointerId);state.valid=state.pointers.size===1&&e.button===0;state.x=e.clientX;state.y=e.clientY;},true);
 canvas.addEventListener('pointermove',e=>{if(state.pointers.has(e.pointerId)&&Math.hypot(e.clientX-state.x,e.clientY-state.y)>7)state.valid=false;},true);
 window.addEventListener('pointerup',e=>{state.pointers.delete(e.pointerId);},true);
 canvas.addEventListener('pointercancel',e=>{state.pointers.delete(e.pointerId);state.valid=false;},true);
 window.addEventListener('blur',()=>{state.pointers.clear();state.valid=false;});
}
export function worldTapAllowed(canvas:HTMLCanvasElement,event:PointerEvent){return !!guards.get(canvas)?.valid&&event.button===0&&!document.querySelector('dialog[open]');}
