import type{Mesh}from'@babylonjs/core/Meshes/mesh';
import type{Scene}from'@babylonjs/core/scene';
import{MeshBuilder}from'@babylonjs/core/Meshes/meshBuilder';import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';
import{visitorMesh}from'./walking';import{visitorRobe}from'./visitor-robe';import{teaGesture,teaCup}from'./tea-break';import{reducedMotion}from'./practice-light';
import{teaMonkSite,walkingMonkFrame,teaMonkLift}from'./quiet-npc-layout';
export function quietMonks(scene:Scene,visitor:()=>readonly number[]|null,timber:StandardMaterial){
 const tea=visitorMesh(scene,'tea-monk',true),walker=visitorMesh(scene,'walking-monk',true);
 for(const body of [tea,walker]){visitorRobe(scene,body).setWearing(true);for(const m of new Set(body.root.getChildMeshes().map(mesh=>mesh.material)))if(m instanceof StandardMaterial)m.diffuseColor=m.diffuseColor.toLinearSpace();for(const mesh of body.root.getChildMeshes()){mesh.isPickable=false;mesh.metadata={quietMonk:true};}}
 tea.root.position.set(teaMonkSite.x,teaMonkSite.y,teaMonkSite.z);tea.root.rotation.y=teaMonkSite.yaw;
 const furniture:Mesh[]=[];const table=MeshBuilder.CreateCylinder('tea-monk-private-table',{diameter:1.02,height:.09,tessellation:20},scene);table.position.set(teaMonkSite.x,.77,teaMonkSite.tableZ);table.material=timber;furniture.push(table);
 const leg=MeshBuilder.CreateCylinder('tea-monk-table-leg',{diameter:.14,height:.71,tessellation:10},scene);leg.position.set(teaMonkSite.x,.365,teaMonkSite.tableZ);leg.material=timber;furniture.push(leg);
 const seat=MeshBuilder.CreateCylinder('tea-monk-chair-seat',{diameter:.51,height:.08,tessellation:16},scene);seat.position.set(teaMonkSite.x,.43,teaMonkSite.z);seat.material=timber;furniture.push(seat);
 for(const dx of [-.16,.16])for(const dz of [-.15,.15]){const foot=MeshBuilder.CreateCylinder('tea-monk-chair-leg',{diameter:.045,height:.39,tessellation:6},scene);foot.position.set(teaMonkSite.x+dx,.215,teaMonkSite.z+dz);foot.material=timber;furniture.push(foot);}
 for(const mesh of furniture)mesh.isPickable=false;
 const cup=teaCup(scene,tea,'tea-monk-drink');cup.update(true,0,false);for(const mesh of cup.root.getChildMeshes())mesh.isPickable=false;
 teaGesture(tea,0);tea.root.computeWorldMatrix(true);cup.update(true,0,false);
 let age=0,walkAge=5,privateSpace=false;const place=walkingMonkFrame(walkAge);walker.root.position.set(place.x,.01,place.z);walker.root.rotation.y=place.yaw;
 function publicSpace(event:Event){privateSpace=(event as CustomEvent).detail==='private';for(const body of [tea,walker])body.root.setEnabled(!privateSpace);for(const mesh of furniture)mesh.setEnabled(!privateSpace);cup.update(!privateSpace,0,false);}
 window.addEventListener('sasa:space',publicSpace);
 const observer=scene.onBeforeRenderObservable.add(()=>{
  if(privateSpace||document.hidden)return;const camera=scene.activeCamera;if(!camera)return;const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000),p=visitor();
  const teaNear=Math.hypot(camera.globalPosition.x-tea.root.position.x,camera.globalPosition.z-tea.root.position.z)<45;
  if(teaNear&&!reducedMotion()){age+=dt;const lift=teaMonkLift(age);teaGesture(tea,lift);tea.head.rotation.y=.08*Math.sin(age*.16);tea.root.computeWorldMatrix(true);cup.update(true,lift,false);}
  const walkNear=Math.hypot(camera.globalPosition.x-walker.root.position.x,camera.globalPosition.z-walker.root.position.z)<55;
  const giveWay=!!p&&Math.hypot(p[0]-walker.root.position.x,p[2]-walker.root.position.z)<1.6;
  if(walkNear&&!giveWay)walkAge+=dt;const f=walkingMonkFrame(walkAge);walker.root.position.set(f.x,.01,f.z);walker.root.rotation.y=f.yaw;walker.bow(f.walking&&!giveWay?.09:.12);
  const stepping=walkNear&&!giveWay&&f.walking;for(const[i,limb]of walker.legs.entries())limb.rotation.x=stepping?(reducedMotion()?.10:.17)*Math.sin(walkAge*3.6+i*Math.PI):0;
 });
 scene.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(observer);window.removeEventListener('sasa:space',publicSpace);cup.dispose();});
 return{tea,walker,furniture,obstacles(){return[{x:teaMonkSite.x,z:teaMonkSite.z,radius:.36},{x:teaMonkSite.x,z:teaMonkSite.tableZ,radius:.53},{x:walker.root.position.x,z:walker.root.position.z,radius:.34}];}};
}
