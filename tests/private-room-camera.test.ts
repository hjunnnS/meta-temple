import assert from 'node:assert/strict';
import test from 'node:test';
import {canWalkPrivateRoom} from '../src/private-room-layout.ts';
import {privateCameraBounds,privateCameraRadius} from '../src/private-room-camera.ts';

test('zooming out behind the spawn point stays in front of the entrance wall',()=>{
 const target=[0,1.32,-4.5],alpha=-Math.PI/2,beta=1.24;
 const radius=privateCameraRadius(target,alpha,beta,7);
 assert.ok(radius<3.3&&radius>2.8);
 assert.ok(target[2]+Math.sin(alpha)*Math.sin(beta)*radius>privateCameraBounds.min[2]);
});
test('camera arm clears every wall, ceiling and floor at all walkable boundary corners',()=>{
 for(const x of [-5.5,0,5.5])for(const z of [-7.3,0,7.3])for(const beta of [.35,.7,1.24,1.6])for(let alpha=-Math.PI;alpha<Math.PI;alpha+=Math.PI/24){
  if(!canWalkPrivateRoom(x,z))continue;
  const target=[x,1.32,z],radius=privateCameraRadius(target,alpha,beta,7);
  const direction=[Math.cos(alpha)*Math.sin(beta),Math.cos(beta),Math.sin(alpha)*Math.sin(beta)];
  for(let i=0;i<3;i++){
   const point=target[i]+direction[i]*radius;
   assert.ok(point>privateCameraBounds.min[i]&&point<privateCameraBounds.max[i]);
  }
 }
});
test('obstruction clears as the character walks away and intentional zoom-in is preserved',()=>{
 const near=privateCameraRadius([-5.5,1.32,-5],Math.PI,Math.PI/2,7);
 const far=privateCameraRadius([0,1.32,-5],Math.PI,Math.PI/2,7);
 assert.ok(near<.25);assert.ok(far>5.5);
 assert.equal(privateCameraRadius([0,1.32,0],0,Math.PI/2,1.5),1.5);
});


test('room connects to the veranda and garden while display shelves, altar and pond stay solid',()=>{
 for(let x=0;x<=16;x+=.1)assert.ok(canWalkPrivateRoom(x,0),'garden approach '+x);
 for(const [x,z] of [[-5,0],[5,-4],[0,6.6],[13.4,3.1],[6,2.6],[18,0]])assert.equal(canWalkPrivateRoom(x,z),false);
 assert.ok(privateCameraRadius([5.2,1.32,0],0,Math.PI/2,7)>4,'camera can see through the open garden bay');
 assert.ok(privateCameraRadius([5.2,1.32,-7],0,Math.PI/2,7)<1,'closed wall still blocks camera');
});
