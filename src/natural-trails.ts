import type {Scene} from '@babylonjs/core/scene';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {sanctuaryWalk,rearPrayerWalk,prayerHallApproaches,teaApproach,teaGardenWalk,gateApproach,paving,insideGround,distanceToSegment,type GroundPoint} from './temple-terrain';
import {courtHalfWidth,courtSouthEdge,courtDepth} from './temple-layout';
/** Visual only: retain every route centre and the existing flat pedestrian floor. */
export function naturalTrails(scene:Scene){
 const west=-60,south=-81,width=158,depth=200,w=1024,h=1280;
 const mask=new DynamicTexture('natural-trail-union-mask',{width:w,height:h},scene,false),c=mask.getContext() as CanvasRenderingContext2D;
 c.clearRect(0,0,w,h);c.setTransform(w/width,0,0,h/depth,-west*w/width,-south*h/depth);c.lineCap='round';c.lineJoin='round';
 const routes:{points:GroundPoint[];width:number}[]=[{points:sanctuaryWalk,width:1.8},{points:rearPrayerWalk,width:2.5},...prayerHallApproaches.map(a=>({points:a.route,width:1.8})),{points:teaApproach,width:1.5},{points:teaGardenWalk,width:1.5},{points:gateApproach,width:1.6}];
 // Paint the union once, so crossings cannot create stacked coplanar ribbons.
 c.strokeStyle='#ffffff';c.filter='blur(2.8px)';
 for(const route of routes){
  let along=0;
  for(let i=1;i<route.points.length;i++){
   const a=route.points[i-1],b=route.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(length));
   for(let n=0;n<steps;n++){
    const t=n/steps,u=(n+1)/steps,at=along+(n+.5)*length/steps;
    const offset=.065*Math.sin(at*.63)+.04*Math.sin(at*1.71),dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;
    c.lineWidth=route.width*(1+.075*Math.sin(at*.48))+.30;
    c.beginPath();c.moveTo(a[0]+(b[0]-a[0])*t+dz*offset,a[1]+(b[1]-a[1])*t-dx*offset);c.lineTo(a[0]+(b[0]-a[0])*u+dz*offset,a[1]+(b[1]-a[1])*u-dx*offset);c.stroke();
   }
   along+=length;
  }
 }
 c.resetTransform();c.filter='none';const pixels=c.getImageData(0,0,w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=(y*w+x)*4;if(!pixels.data[k+3])continue;
  const px=west+(x+.5)/w*width,pz=south+(y+.5)/h*depth;
  const court=Math.abs(px)<=courtHalfWidth&&pz>=courtSouthEdge&&pz<=courtSouthEdge+courtDepth;
  const slab=paving.some(p=>distanceToSegment(px,pz,p.from,p.to)<(p.lanes===3?1.94:.83));
  if(court||slab||!insideGround(px,pz,0)){pixels.data[k+3]=0;continue;}
  const noise=.93+.07*Math.sin(px*8.7+pz*5.9)*Math.sin(pz*10.3-px*4.1);
  pixels.data[k+3]=Math.round(pixels.data[k+3]*noise*.86);
 }
 c.putImageData(pixels,0,0);mask.hasAlpha=true;mask.update(false);
 const grain=new DynamicTexture('natural-trail-worn-earth',256,scene,true),g=grain.getContext() as CanvasRenderingContext2D;
 g.fillStyle='#c4af94';g.fillRect(0,0,256,256);let seed=72;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<9000;i++){g.fillStyle=i%3?'#eddbba44':'#68534333';g.fillRect(rnd()*256,rnd()*256,.4+rnd()*1.2,.4+rnd()*1.2);}grain.update();grain.uScale=width/2.8;grain.vScale=depth/2.8;
 const trail=new StandardMaterial('forest-walk-earth',scene);trail.diffuseColor=Color3.FromHexString('#5c5851');trail.specularColor=Color3.Black();trail.diffuseTexture=grain;trail.opacityTexture=mask;trail.transparencyMode=2;trail.disableDepthWrite=true;trail.backFaceCulling=false;
 const mesh=MeshBuilder.CreateGround('natural-soil-trails',{width,height:depth,subdivisions:48},scene);mesh.position.set(west+width/2,.025,south+depth/2);mesh.material=trail;mesh.receiveShadows=true;mesh.isPickable=true;
 const positions=mesh.getVerticesData('position')!,uvs=mesh.getVerticesData('uv')!,colors:number[]=[];
 for(let i=0;i<positions.length;i+=3){const x=positions[i]+mesh.position.x,z=positions[i+2]+mesh.position.z,j=i/3*2;uvs[j]=(x-west)/width;uvs[j+1]=(z-south)/depth;const n=.94+.06*Math.sin(x*.35+z*.21)*Math.cos(z*.39);colors.push(n,n,n,1);}
 mesh.setVerticesData('uv',uvs);mesh.setVerticesData('color',colors);mesh.useVertexColors=true;mesh.metadata={visualOnly:true,flat:true};
 return mesh;
}
