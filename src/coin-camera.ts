import type{Scene}from'@babylonjs/core/scene';
import type{ArcRotateCamera}from'@babylonjs/core/Cameras/arcRotateCamera';
import{Vector3}from'@babylonjs/core/Maths/math.vector';
/** Frame the whole throw, then return the saved walking view. User input immediately takes over. */
export function coinCamera(app:{scene:Scene;camera:ArcRotateCamera;pondLife:{phase:string;flightSource:Vector3;flightEnd:Vector3};captureWalkView:()=>unknown;restoreWalkView:(view:any)=>void;settings:{reduced:boolean}},canvas:HTMLCanvasElement){
 let saved:unknown=null,cancelled=false,last='idle',eye:Vector3|null=null,target:Vector3|null=null;
 const cancel=()=>{if(saved){app.restoreWalkView(saved);saved=null;}cancelled=true;};
 canvas.addEventListener('pointerdown',cancel);canvas.addEventListener('wheel',cancel);canvas.addEventListener('keydown',cancel);
 app.scene.onBeforeRenderObservable.add(()=>{const phase=app.pondLife.phase;
  if(phase==='wishing'&&last==='idle'){cancelled=false;saved=app.captureWalkView();eye=app.camera.position.clone();target=app.camera.target.clone();}
  if(saved&&!cancelled&&!app.settings.reduced&&phase!=='idle'){
   const a=app.pondLife.flightSource,b=app.pondLife.flightEnd,mid=Vector3.Lerp(a,b,.5);mid.y=1.25;
   const v=b.subtract(a),length=Math.hypot(v.x,v.z),aspect=app.scene.getEngine().getRenderWidth()/app.scene.getEngine().getRenderHeight(),distance=Math.max(7,(length*.5+1.1)/(Math.tan(app.camera.fov/2)*Math.min(1.7,aspect))),desiredEye=mid.add(new Vector3(-v.z/(length||1)*distance,distance*.40,v.x/(length||1)*distance));
   const dt=Math.min(.05,app.scene.getEngine().getDeltaTime()/1000),blend=1-Math.exp(-4*dt);target=Vector3.Lerp(target!,mid,blend);eye=Vector3.Lerp(eye!,desiredEye,blend);app.camera.setTarget(target.clone());app.camera.setPosition(eye);
  }
  if(saved&&(phase==='idle'||document.body.classList.contains('in-private-room'))){app.restoreWalkView(saved);saved=null;}
  if(phase==='idle')cancelled=false;last=phase;
 });
}
