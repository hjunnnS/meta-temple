import type {Scene} from '@babylonjs/core/scene';
import type {Mesh} from '@babylonjs/core/Meshes/mesh';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import type {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {pondBridge,pondBridgeHeight} from './pond-bridge-layout';

/** Shared timber, a continuous walking plane and two open rails: no steps or camera bob. */
export function furnishPondBridge(scene:Scene,parts:Mesh[],wood:StandardMaterial){
 const b=pondBridge,deck=wood.clone('pond-bridge-timber');deck.diffuseColor=Color3.FromHexString('#b39671');deck.specularColor=new Color3(.07,.06,.05);
 const beam=wood.clone('pond-bridge-beams');beam.diffuseColor=Color3.FromHexString('#765b40');beam.specularColor=new Color3(.06,.05,.04);
 function box(name:string,w:number,h:number,d:number,x:number,y:number,z:number,material:StandardMaterial){const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=material;m.receiveShadows=true;parts.push(m);return m;}
 const height=(z:number)=>pondBridgeHeight(b.x,z)!;
 const count=Math.ceil((b.north-b.south)/.31),spacing=(b.north-b.south)/count;
 for(let i=0;i<count;i++){
  const z=b.south+(i+.5)*spacing,y=height(z),slope=(height(z+spacing*.45)-height(z-spacing*.45))/(spacing*.9);
  const plank=box('pond-bridge-plank',b.width,.12,spacing-.008,b.x,y-.06,z,deck);plank.rotation.x=-Math.atan(slope);
 }
 const spans=[b.south,b.south+b.ramp,b.north-b.ramp,b.north];
 for(const side of [-1,1]){
  for(let i=1;i<spans.length;i++){
   const a=spans[i-1],z=spans[i],dy=height(z)-height(a),length=Math.hypot(z-a,dy);
   for(const offset of [.52,.96]){
    const rail=box('bridge-rail',.095,.095,length,b.x+side*(b.width/2),height((a+z)/2)+offset,(a+z)/2,beam);rail.rotation.x=-Math.atan2(dy,z-a);
   }
   const joist=box('pond-bridge-stringer',.15,.16,length,b.x+side*.96,height((a+z)/2)-.17,(a+z)/2,beam);joist.rotation.x=-Math.atan2(dy,z-a);
  }
  for(let z=b.south;z<=b.north+.01;z+=2.5){
   box('bridge-post',.14,1.07,.14,b.x+side*(b.width/2),height(z)+.475,z,beam);
   box('pond-bridge-post-cap',.19,.055,.19,b.x+side*(b.width/2),height(z)+1.035,z,deck);
  }
 }
 // Short pairs of piers support the span without filling the water underneath.
 for(const z of [-59,-52,-45])for(const side of [-1,1])box('pond-bridge-pier',.19,.66,.19,b.x+side*.94,.34,z,beam);
}
