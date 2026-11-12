import type {Scene} from '@babylonjs/core/scene';
import type {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {PointLight} from '@babylonjs/core/Lights/pointLight';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {forestLampSites} from './forest-lamp-layout';
export function forestLamps(scene:Scene,parts:Mesh[]){
 function material(name:string,color:string){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();return m;}
 const frame=material('garden-path-lamp-frame','#302d27'),roof=material('garden-path-lamp-roof','#55564d'),base=material('garden-path-lamp-stone','#8b877b'),paper=material('garden-path-lamp-paper','#ecdfbf');
 function box(name:string,w:number,h:number,d:number,x:number,y:number,z:number,m:StandardMaterial){const b=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);b.position.set(x,y,z);b.material=m;b.receiveShadows=true;parts.push(b);return b;}
 const haloTexture=new DynamicTexture('shared-path-lamp-pool',128,scene,true),ctx=haloTexture.getContext() as CanvasRenderingContext2D,g=ctx.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'rgba(255,206,124,.35)');g.addColorStop(.45,'rgba(255,193,94,.16)');g.addColorStop(1,'rgba(255,174,66,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);haloTexture.hasAlpha=true;haloTexture.update();
 const halo=material('garden-path-lamp-ground-glow','#ffffff');halo.diffuseTexture=haloTexture;halo.useAlphaFromDiffuseTexture=true;halo.disableLighting=true;halo.emissiveColor=Color3.FromHexString('#ffd390');halo.disableDepthWrite=true;halo.alpha=0;
 for(const [x,z]of forestLampSites){
  box('path-lamp-base',.58,.08,.58,x,.04,z,base);
  box('path-lamp-bottom',.48,.06,.48,x,.12,z,frame);
  box('path-lamp-glazing',.35,.42,.35,x,.35,z,paper);
  for(const dx of [-.225,.225])for(const dz of [-.225,.225])box('path-lamp-pillar',.045,.49,.045,x+dx,.355,z+dz,frame);
  box('path-lamp-top',.50,.055,.50,x,.615,z,frame);
  const cap=MeshBuilder.CreateCylinder('path-lamp-roof',{height:.11,diameterBottom:.86,diameterTop:.46,tessellation:4},scene);cap.rotation.y=Math.PI/4;cap.position.set(x,.695,z);cap.material=roof;parts.push(cap);
  const pool=MeshBuilder.CreateGround('path-lamp-light-pool',{width:4.3,height:4.3},scene);pool.position.set(x,.042,z);pool.material=halo;pool.isPickable=false;
 }
 // Two shared nearby lights, no additional shadow maps or per-lantern real lights.
 const lights=[0,1].map(i=>{const l=new PointLight('path-lamp-nearby-'+i,new Vector3(0,.5,0),scene);l.diffuse=Color3.FromHexString('#ffcb85');l.specular=Color3.Black();l.range=4.5;l.intensity=.9;l.setEnabled(false);return l;});
 let night=false,last=-Infinity;
 return {paper,bind(){const receivers=scene.meshes.filter(m=>/compacted-soil|forest-walk-earth|temple-ground|ground-earth|valley-floor/.test(m.material?.name??''));for(const m of receivers)if(m.material instanceof StandardMaterial)m.material.maxSimultaneousLights=7;for(const l of lights)l.includedOnlyMeshes=receivers;},time(value:string){night=value!=='day';paper.emissiveColor=Color3.FromHexString('#ffd190').scale(value==='night'?.48:value==='dusk'?.20:0);halo.alpha=value==='night'?.75:value==='dusk'?.25:0;if(!night)for(const l of lights)l.setEnabled(false);last=-Infinity;},update(camera:Vector3,now:number){if(!night||now-last<500)return;last=now;const close=[...forestLampSites].sort((a,b)=>(a[0]-camera.x)**2+(a[1]-camera.z)**2-((b[0]-camera.x)**2+(b[1]-camera.z)**2));for(const[i,l]of lights.entries()){const p=close[i],near=!!p&&Math.hypot(p[0]-camera.x,p[1]-camera.z)<30;l.setEnabled(near);if(near)l.position.set(p[0],.48,p[1]);}}};
}
