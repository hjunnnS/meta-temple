import{guardWorldTap,worldTapAllowed}from'./tap-guard';
import type{Scene}from'@babylonjs/core/scene';
import{PointerEventTypes}from'@babylonjs/core/Events/pointerEvents';
/** A tap is movement only on a visible upward-facing walk surface, never an item or drag. */
export function pointInput(scene:Scene,canvas:HTMLCanvasElement,active:()=>boolean,choose:(point:readonly[number,number,number])=>void){
 guardWorldTap(canvas);
 let start:{x:number;y:number;id:number}|null=null,dragged=false;const pointers=new Set<number>();
 const observer=scene.onPointerObservable.add(info=>{const e=info.event as PointerEvent;
  if(info.type===PointerEventTypes.POINTERDOWN){pointers.add(e.pointerId);if(pointers.size===1){start={x:e.clientX,y:e.clientY,id:e.pointerId};dragged=false;}else dragged=true;}
  if(info.type===PointerEventTypes.POINTERMOVE&&start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)dragged=true;
  if(info.type===PointerEventTypes.POINTERUP)pointers.delete(e.pointerId);
  if(info.type!==PointerEventTypes.POINTERTAP||!active()||!worldTapAllowed(canvas,e)||dragged||!start||e.button!==0||document.querySelector('dialog[open]'))return;
  start=null;const pick=scene.pick(scene.pointerX,scene.pointerY,m=>m.isEnabled()&&m.isVisible&&m.isPickable);
  if(!pick?.hit||!pick.pickedPoint||pick.pickedMesh?.metadata?.applicationId||pick.pickedMesh?.metadata?.applicationIds)return;
  if(pick.pickedMesh?.metadata?.guideMonk||pick.pickedMesh?.metadata?.sweeperNpc)return;
  const normal=pick.getNormal(true);if(!normal||normal.y<.65)return;
  canvas.focus();choose(pick.pickedPoint.asArray() as[number,number,number]);
 });
 return()=>scene.onPointerObservable.remove(observer);
}
