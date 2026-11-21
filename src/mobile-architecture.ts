import{switchStaticGeometry}from'./switch-static-geometry';
import type{Scene}from'@babylonjs/core/scene';import{Mesh}from'@babylonjs/core/Meshes/mesh';import{VertexData}from'@babylonjs/core/Meshes/mesh.vertexData';import{Geometry}from'@babylonjs/core/Meshes/geometry';import type{Vector3}from'@babylonjs/core/Maths/math.vector';
import{clusteredGeometry}from'./cluster-geometry';
/** Upload fine distant geometry only on approach; coarse silhouettes remain present at all distances. */
export function mobileArchitecture(scene:Scene){
 const items:{mesh:Mesh;fine:VertexData;coarse:Geometry;high:Geometry|null;center:Vector3;radius:number;near:boolean;lastNear:number}[]=[];let last=-Infinity;
 function add(mesh:Mesh){
  if(mesh.getTotalVertices()<12000||mesh.material?.alpha!==1)return;
  const fine=VertexData.ExtractFromMesh(mesh);if(!fine.positions||!fine.indices)return;
  // MergeMeshes may share a large index buffer. Keep only this mesh's actual submesh ranges.
  const originalIndices=fine.indices,indices=new Uint32Array(mesh.subMeshes.reduce((n,s)=>n+s.indexCount,0));let index=0;for(const s of mesh.subMeshes)for(let i=s.indexStart;i<s.indexStart+s.indexCount;i++)indices[index++]=originalIndices[i];fine.indices=indices;
  const coarseData=clusteredGeometry({positions:fine.positions,indices:fine.indices,normals:fine.normals,uvs:fine.uvs,colors:fine.colors},.065);
  if(coarseData.indices.length>fine.indices.length*.80)return;
  const data=new VertexData();Object.assign(data,coarseData);const high=mesh.geometry!,coarse=new Geometry(mesh.name+'-mobile-coarse',scene,data);switchStaticGeometry(mesh,coarse);high.dispose();mesh.refreshBoundingInfo();
  const sphere=mesh.getBoundingInfo().boundingSphere;items.push({mesh,fine,coarse,high:null,center:sphere.centerWorld.clone(),radius:sphere.radiusWorld,near:false,lastNear:0});mesh.metadata={...mesh.metadata,mobileFineIndices:fine.indices.length,mobileCoarseIndices:coarseData.indices.length,mobileFine:false};
 }
 function update(eye:Vector3,now:number){if(now-last<200)return;last=now;let uploaded=false;
  for(const a of items){const distance=Math.hypot(eye.x-a.center.x,eye.y-a.center.y,eye.z-a.center.z)-a.radius,wanted=distance<(a.near?34:27);if(wanted){a.lastNear=now;if(!a.near&&!uploaded){a.high??=new Geometry(a.mesh.name+'-mobile-fine',scene,a.fine);switchStaticGeometry(a.mesh,a.high);a.near=true;uploaded=true;}}else if(a.near){switchStaticGeometry(a.mesh,a.coarse);a.near=false;}if(!wanted&&a.high&&now-a.lastNear>15000){a.high.dispose();a.high=null;}a.mesh.metadata.mobileFine=a.near;}
  scene.metadata??={};scene.metadata.mobileArchitecture={groups:items.length,fine:items.filter(x=>x.near).length,residentFine:items.filter(x=>x.high).length,coarseIndices:items.reduce((n,x)=>n+(x.mesh.metadata.mobileCoarseIndices??0),0),fineIndices:items.reduce((n,x)=>n+(x.mesh.metadata.mobileFineIndices??0),0)};
 }
 scene.onDisposeObservable.addOnce(()=>{for(const a of items){a.high?.dispose();a.coarse.dispose();}items.length=0;});return{add,update};
}
