import{switchStaticGeometry}from'./switch-static-geometry';
import type{Scene}from'@babylonjs/core/scene';import type{Mesh}from'@babylonjs/core/Meshes/mesh';import type{Geometry}from'@babylonjs/core/Meshes/geometry';import type{Vector3}from'@babylonjs/core/Maths/math.vector';
const pending=new WeakMap<Scene,{mesh:Mesh;build:()=>Mesh;coarse:Geometry;fine:Geometry|null;near:boolean;lastNear:number}[]>();
export function deferFineDetail(mesh:Mesh,build:()=>Mesh){let items=pending.get(mesh.getScene());if(!items){items=[];pending.set(mesh.getScene(),items);}items.push({mesh,build,coarse:mesh.geometry!,fine:null,near:false,lastNear:0});mesh.metadata={...mesh.metadata,mobileDeferredDetail:true};}
/** At most one expensive sculpt is prepared per frame, only in its nearby region. */
export function updateFineDetail(scene:Scene,eye:Vector3,now:number){let prepared=false;const items=pending.get(scene)??[];
 for(const a of items){a.mesh.computeWorldMatrix();const s=a.mesh.getBoundingInfo().boundingSphere,d=Math.hypot(eye.x-s.centerWorld.x,eye.y-s.centerWorld.y,eye.z-s.centerWorld.z)-s.radiusWorld,wanted=d<(a.near?32:25);
  if(wanted){a.lastNear=now;if(!a.fine&&!prepared){const temporary=a.build();a.fine=temporary.geometry!;switchStaticGeometry(a.mesh,a.fine);temporary.dispose();prepared=true;a.near=true;}else if(a.fine&&!a.near){switchStaticGeometry(a.mesh,a.fine);a.near=true;}}
  else if(a.near){switchStaticGeometry(a.mesh,a.coarse);a.near=false;}if(!wanted&&a.fine&&now-a.lastNear>15000){a.fine.dispose();a.fine=null;}a.mesh.metadata.mobileFine=a.near;
 }
 scene.metadata??={};scene.metadata.mobileDeferredDetails={total:items.length,prepared:items.filter(a=>!!a.fine).length,near:items.filter(a=>a.near).length};
}

/** Private rooms retain the temple layout, not its unused detailed GPU buffers. */
export function releaseFineDetail(scene:Scene){for(const a of pending.get(scene)??[]){switchStaticGeometry(a.mesh,a.coarse);a.fine?.dispose();a.fine=null;a.near=false;a.mesh.metadata.mobileFine=false;}}
