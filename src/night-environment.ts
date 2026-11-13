import type{Mesh}from'@babylonjs/core/Meshes/mesh';
import type{Scene}from'@babylonjs/core/scene';import{MeshBuilder}from'@babylonjs/core/Meshes/meshBuilder';import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';import{DynamicTexture}from'@babylonjs/core/Materials/Textures/dynamicTexture';import{Color3}from'@babylonjs/core/Maths/math.color';import{Vector3}from'@babylonjs/core/Maths/math.vector';import{HemisphericLight}from'@babylonjs/core/Lights/hemisphericLight';
import{templePlaces,daeungDimensions}from'./temple-layout';import{rearPrayerHalls,prayerHallDimensions}from'./prayer-halls';import{boundaries}from'./temple-terrain';
/** Shared static light washes plus one architectural fill; no light per lantern or wall fixture. */
export function nightEnvironment(scene:Scene){
 const texture=new DynamicTexture('night-uplight-gradient',256,scene,false),c=texture.getContext() as CanvasRenderingContext2D,g=c.createRadialGradient(128,245,8,128,240,230);g.addColorStop(0,'rgba(255,219,157,.7)');g.addColorStop(.45,'rgba(255,210,144,.24)');g.addColorStop(1,'rgba(255,190,122,0)');c.fillStyle=g;c.fillRect(0,0,256,256);texture.hasAlpha=true;texture.update();
 const material=new StandardMaterial('night-warm-wall-wash',scene);material.disableLighting=true;material.emissiveColor=Color3.White();material.diffuseTexture=texture;material.useAlphaFromDiffuseTexture=true;material.disableDepthWrite=true;material.backFaceCulling=false;material.alpha=0;
 const floor=new StandardMaterial('night-entrance-pool',scene);floor.disableLighting=true;floor.emissiveColor=Color3.FromHexString('#ffe0ac');floor.diffuseTexture=texture;floor.useAlphaFromDiffuseTexture=true;floor.disableDepthWrite=true;floor.alpha=0;
 const meshes:Mesh[]=[];
 for(const hall of templePlaces.filter(p=>p.kind==='hall')){
  const dimensions=hall.id==='daeung'?daeungDimensions:rearPrayerHalls.some(h=>h.id===hall.id)?prayerHallDimensions:{x:hall.scale,y:hall.scale,z:hall.scale},yaw='yaw'in hall?hall.yaw:0;
  const distance=4.3*dimensions.z,x=hall.x-Math.sin(yaw)*distance,z=hall.z-Math.cos(yaw)*distance;
  for(const side of[-1,1]){const offset=side*7.1*dimensions.x;const wash=MeshBuilder.CreatePlane('building-night-uplight-'+hall.id,{width:4.7*dimensions.x,height:4.4*dimensions.y},scene);wash.position.set(x+Math.cos(yaw)*offset,3.15*dimensions.y,z-Math.sin(yaw)*offset);wash.rotation.y=yaw;wash.material=material;wash.isPickable=false;meshes.push(wash);}
  const pool=MeshBuilder.CreateGround('building-entrance-warmth-'+hall.id,{width:16*dimensions.x,height:4.5},scene);pool.position.set(x-Math.sin(yaw)*2, .145,z-Math.cos(yaw)*2);pool.rotation.y=yaw;pool.material=floor;pool.isPickable=false;meshes.push(pool);
 }
 const fixture=new StandardMaterial('wall-uplight-fixture',scene);fixture.diffuseColor=Color3.FromHexString('#b7ad95');fixture.specularColor=Color3.Black();
 let count=0;
 for(const wall of boundaries){const dx=wall.to[0]-wall.from[0],dz=wall.to[1]-wall.from[1],length=Math.hypot(dx,dz);if(length<18)continue;const n=Math.max(1,Math.floor(length/22));for(let i=0;i<n&&count<28;i++,count++){
  const q=(i+.5)/n,x=wall.from[0]+dx*q,z=wall.from[1]+dz*q,yaw=-Math.atan2(dz,dx);
  let nx=-dz/length,nz=dx/length;if(nx*(15-x)+nz*(25-z)<0){nx=-nx;nz=-nz;}const height=Math.min(2.5,wall.height-.1);const light=MeshBuilder.CreatePlane('wall-night-wash',{width:4,height},scene);light.position.set(x+nx*.31,height/2+.05,z+nz*.31);light.rotation.y=yaw;light.material=material;light.isPickable=false;meshes.push(light);
  const foot=MeshBuilder.CreateCylinder('wall-uplight-foot',{diameter:.22,height:.12,tessellation:8},scene);foot.position.set(x+nx*.5,.10,z+nz*.5);foot.material=fixture;foot.isPickable=false;
 }}
 const fill=new HemisphericLight('night-architectural-fill',new Vector3(0,.4,-1),scene);fill.diffuse=Color3.FromHexString('#ffe2b2');fill.groundColor=Color3.FromHexString('#88745c');fill.intensity=.82;
 fill.includedOnlyMeshes=scene.meshes.filter(m=>m.name.startsWith('architecture-')&&/wood|jade|paint|roof|ridge|paper|gold|plaster|door|sign|standing-buddha/.test(m.material?.name??''));
 const groundFill=new HemisphericLight('night-walking-fill',new Vector3(0,1,0),scene);groundFill.intensity=.28;groundFill.diffuse=Color3.FromHexString('#cbd5de');groundFill.groundColor=Color3.FromHexString('#8c8173');groundFill.includedOnlyMeshes=scene.meshes.filter(m=>/earth|soil|ground|masonry|stone|visitor|sweeping-monk|dog-/.test(m.material?.name??''));
 return{time(value:string){groundFill.setEnabled(value==='night');const strength=value==='night'?1:value==='dusk'?.25:0;fill.setEnabled(value==='night');for(const mesh of meshes)mesh.setEnabled(strength>0);material.alpha=.64*strength;floor.alpha=.27*strength;}};
}
