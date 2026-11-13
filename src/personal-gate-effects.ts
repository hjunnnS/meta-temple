import type {Scene} from '@babylonjs/core/scene';
import {ParticleSystem} from '@babylonjs/core/Particles/particleSystem';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {Vector3,Matrix} from '@babylonjs/core/Maths/math.vector';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {personalGate} from './temple-terrain';
import {personalGateColour} from './personal-gate-colour';
import {reducedMotion} from './practice-light';

export function personalGateEffects(scene:Scene,site:{x:number;z:number;yaw?:number}=personalGate){
 const g={x:0,z:0},anchor=new TransformNode('gate-effect-anchor',scene);anchor.position.set(site.x,0,site.z);anchor.rotation.y=site.yaw??0;const transform=Matrix.RotationY(site.yaw??0).multiply(Matrix.Translation(site.x,0,site.z));
 const texture=new DynamicTexture('personal-gate-smoke',128,scene,false),c=texture.getContext() as CanvasRenderingContext2D;
 c.clearRect(0,0,128,128);
 for(let i=0;i<7;i++){
  const x=64+Math.sin(i*2.4)*20,y=64+Math.cos(i*2.4)*24,r=24+i%3*5;
  const gradient=c.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba(255,255,255,.55)');gradient.addColorStop(.45,'rgba(255,255,255,.20)');gradient.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);
 }
 texture.hasAlpha=true;texture.update();
 const smoke=new ParticleSystem('personal-gate-border-smoke',72,scene);smoke.particleTexture=texture;smoke.emitter=new Vector3(site.x,0,site.z);
 const updateParticles=smoke.updateFunction.bind(smoke);
 smoke.updateFunction=particles=>{
  updateParticles(particles);const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
  for(const particle of particles){particle.position.x+=Math.sin(particle.age*2.8+particle.id)*.08*dt;particle.position.z+=Math.cos(particle.age*2.1+particle.id)*.06*dt;}
 };
 smoke.emitRate=0;smoke.minLifeTime=2.0;smoke.maxLifeTime=3.4;smoke.minSize=.24;smoke.maxSize=.52;smoke.minScaleX=.8;smoke.maxScaleX=1.1;smoke.minScaleY=1.2;smoke.maxScaleY=1.8;
 smoke.minAngularSpeed=-.16;smoke.maxAngularSpeed=.16;smoke.minEmitPower=1;smoke.maxEmitPower=1;smoke.gravity=Vector3.Zero();smoke.blendMode=ParticleSystem.BLENDMODE_STANDARD;
 smoke.color1=new Color4(.62,.3,.92,.40);smoke.color2=new Color4(.48,.22,.8,.23);smoke.colorDead=new Color4(.62,.3,.92,0);
 smoke.addSizeGradient(0,.45);smoke.addSizeGradient(.45,1);smoke.addSizeGradient(1,1.35);
 smoke.startPositionFunction=(_matrix,position)=>{
  const edge=Math.random()*3;
  position.set(g.x-.18+(Math.random()-.5)*.10,edge<2?.25+Math.random()*2.6:2.94,g.z+(edge<2?(edge<1?-1.23:1.23):(Math.random()-.5)*2.46));Vector3.TransformCoordinatesToRef(position,transform,position);
 };
 smoke.startDirectionFunction=(_matrix,direction)=>direction.set((Math.random()-.5)*.045,.12+Math.random()*.13,(Math.random()-.5)*.065);
 const material=new StandardMaterial('personal-gate-aura',scene);material.diffuseColor=Color3.Black();material.emissiveColor=new Color3(.62,.3,.92);material.alpha=.35;material.disableLighting=true;
 for(const path of [
  [new Vector3(g.x-.14,.22,g.z-1.23),new Vector3(g.x-.14,2.94,g.z-1.23)],
  [new Vector3(g.x-.14,2.94,g.z-1.23),new Vector3(g.x-.14,2.94,g.z+1.23)],
  [new Vector3(g.x-.14,.22,g.z+1.23),new Vector3(g.x-.14,2.94,g.z+1.23)],
 ]){const tube=MeshBuilder.CreateTube('personal-gate-aura',{path,radius:.018,tessellation:8},scene);tube.material=material;tube.isPickable=false;tube.parent=anchor;}
 let age=0;smoke.start();
 scene.onBeforeRenderObservable.add(()=>{
  const near=!!scene.activeCamera&&Vector3.DistanceSquared(scene.activeCamera.globalPosition,new Vector3(site.x,1.5,site.z))<35*35;
  const reduced=reducedMotion();smoke.emitRate=near&&!reduced?20:0;
  if(!near)return;if(!reduced)age+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
  const [r,green,blue]=personalGateColour(reduced?0:age);
  material.emissiveColor.set(r,green,blue);smoke.color1.set(r,green,blue,.40);smoke.color2.set(r*.8,green*.8,blue*.8,.23);smoke.colorDead.set(r,green,blue,0);
 });
}
