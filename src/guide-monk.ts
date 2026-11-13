import{Vector3,Matrix}from'@babylonjs/core/Maths/math.vector';
import{PointerEventTypes}from'@babylonjs/core/Events/pointerEvents';
import type{Scene}from'@babylonjs/core/scene';import type{ArcRotateCamera}from'@babylonjs/core/Cameras/arcRotateCamera';
import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';
import type{DirectionalLight}from'@babylonjs/core/Lights/directionalLight';import{ShadowGenerator}from'@babylonjs/core/Lights/Shadows/shadowGenerator';
import{visitorMesh}from'./walking';import{visitorRobe}from'./visitor-robe';
import{guideDestination,type GuideCourseId}from'./guide-courses';
export function guideMonk(scene:Scene,camera:ArcRotateCamera,canvas:HTMLCanvasElement,position:()=>readonly number[]|null,open:()=>void){
 const body=visitorMesh(scene,'guide-monk',true);visitorRobe(scene,body).setWearing(true);body.root.position.set(2.2,.01,-62.5);
 for(const m of new Set(body.root.getChildMeshes().map(m=>m.material)))if(m instanceof StandardMaterial)m.diffuseColor=m.diffuseColor.toLinearSpace();
 for(const mesh of body.root.getChildMeshes()){mesh.isPickable=true;mesh.metadata={guideMonk:true,blocksOfferingPick:true};}
 const shadows=(scene.getLightByName('sun')as DirectionalLight|null)?.getShadowGenerator();
 if(shadows instanceof ShadowGenerator)for(const mesh of body.root.getChildMeshes())shadows.addShadowCaster(mesh);
 const bubble=document.createElement('div');bubble.id='guide-monk-caption';bubble.hidden=true;bubble.setAttribute('aria-hidden','true');document.body.append(bubble);
 let title='',active=false,paused=false;
 const pointer=scene.onPointerObservable.add(e=>{if(e.type===PointerEventTypes.POINTERTAP&&e.pickInfo?.pickedMesh?.metadata?.guideMonk){const p=position();if(p&&Math.hypot(p[0]-body.root.position.x,p[2]-body.root.position.z)<8)open();}});
 const observer=scene.onAfterRenderObservable.add(()=>{
  const p=position();if(p)body.root.rotation.y=Math.atan2(p[0]-body.root.position.x,p[2]-body.root.position.z);
  body.bow(active?.085:0);
  const projected=Vector3.Project(body.root.position.add(new Vector3(0,1.95,0)),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(scene.getEngine().getRenderWidth(),scene.getEngine().getRenderHeight()));
  bubble.hidden=paused||!body.root.isEnabled()||!title||projected.z<=0||projected.z>=1||!p||Math.hypot(p[0]-body.root.position.x,p[2]-body.root.position.z)>10;
  if(!bubble.hidden){const r=canvas.getBoundingClientRect();bubble.style.left=Math.max(95,Math.min(innerWidth-95,r.left+projected.x*r.width/scene.getEngine().getRenderWidth()))+'px';bubble.style.top=Math.max(90,r.top+projected.y*r.height/scene.getEngine().getRenderHeight())+'px';}
 });
 return{set(course:GuideCourseId|null,show:boolean,text:string){
  active=show;title=text;bubble.textContent=text;
  if(course&&show){const d=guideDestination(course);body.root.position.set(d.x+2.2*Math.cos(d.yaw)+.7*Math.sin(d.yaw),d.floor,d.z-2.2*Math.sin(d.yaw)+.7*Math.cos(d.yaw));}
  else if(!course)body.root.position.set(2.2,.01,-62.5);
  body.root.setEnabled(!paused&&show);
 },pause(value:boolean){paused=value;if(value){body.root.setEnabled(false);bubble.hidden=true;}},dispose(){scene.onPointerObservable.remove(pointer);scene.onAfterRenderObservable.remove(observer);body.root.dispose(false,true);bubble.remove();}};
}
