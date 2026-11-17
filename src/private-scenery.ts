import{privateViewWorld}from'./private-view-world';
import type{Scene}from'@babylonjs/core/scene';
import type{Mesh}from'@babylonjs/core/Meshes/mesh';
import{MeshBuilder}from'@babylonjs/core/Meshes/meshBuilder';
import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';
import{Color3,Color4}from'@babylonjs/core/Maths/math.color';
import{t}from'./locales';
export{sceneryChoices,validScenery}from'./scenery-layout';
export type{Scenery}from'./scenery-layout';
import{sceneryChoices,validScenery,type Scenery}from'./scenery-layout';
export function privateScenery(scene:Scene,furnishings:Mesh[],onView:()=>void,_onReturn:()=>void){
 const key='sasa:private-scenery:v1';let current:Scenery='pond';try{const saved=localStorage.getItem(key);if(validScenery(saved))current=saved;}catch{}
 const world=privateViewWorld(scene);
 const railMaterial=new StandardMaterial('private-view-railing',scene);railMaterial.diffuseColor=Color3.FromHexString('#726652');
 const rails:Mesh[]=[];const plaster=new StandardMaterial('private-balcony-plaster',scene);plaster.diffuseColor=Color3.FromHexString('#c9bfaa');for(const z of [-1.28,6.48]){const wing=MeshBuilder.CreateBox('private-balcony-side-wall',{width:3.15,height:1.05,depth:.16},scene);wing.position.set(7.47,.56,z);wing.material=plaster;rails.push(wing);}const skirt=MeshBuilder.CreateBox('private-balcony-foundation',{width:3.3,height:6,depth:7.92},scene);skirt.position.set(7.45,-3,2.6);skirt.material=plaster;rails.push(skirt);for(const z of [-1.2,2.6,6.4]){const m=MeshBuilder.CreateBox('private-view-post',{width:.10,height:.9,depth:.1},scene);m.position.set(8.92,.57,z);m.material=railMaterial;rails.push(m);}const rail=MeshBuilder.CreateBox('private-view-rail',{width:.12,height:.10,depth:7.7},scene);rail.position.set(8.92,1.01,2.6);rail.material=railMaterial;rails.push(rail);
 const dialog=document.createElement('dialog');dialog.id='private-scenery-dialog';dialog.setAttribute('aria-label',t('창밖 풍경'));dialog.style.cssText='max-width:min(440px,calc(100vw - 24px));padding:24px;color:#244336;background:#f6f1e3;border:1px solid #a99b70;border-radius:16px';
 const heading=document.createElement('h2');heading.textContent=t('창밖 풍경');dialog.append(heading);const hint=document.createElement('p');hint.textContent=t('원하는 풍경을 선택하세요. 선택은 다음 방문에도 유지됩니다.');dialog.append(hint);
 const buttons=new Map<Scenery,HTMLButtonElement>();for(const[id,label]of sceneryChoices){const b=document.createElement('button');b.textContent=t(label);b.style.cssText='padding:12px;margin:4px;border:1px solid #73836d;border-radius:9px';b.onclick=()=>{current=id;try{localStorage.setItem(key,id);}catch{}draw();dialog.close();onView();};buttons.set(id,b);dialog.append(b);}
 const close=document.createElement('button');close.textContent=t('닫기');close.style.cssText='display:block;margin:16px 4px 0;padding:10px 20px';close.onclick=()=>dialog.close();dialog.append(close);document.body.append(dialog);
 const open=document.createElement('button');open.id='private-scenery-open';open.textContent=t('창밖 풍경');open.onclick=()=>dialog.showModal();document.querySelector('#private-room-actions')!.append(open);
 const baseClear=scene.clearColor.clone();
 function draw(){const pond=current==='pond',night=['city','sea'].includes(current);world.select(current);for(const m of furnishings)if(m.metadata?.privateLandscape)m.setEnabled(pond);for(const m of rails)m.setEnabled(!pond);scene.clearColor=pond?baseClear:night?new Color4(.14,.20,.29,1):current==='river'?new Color4(.80,.60,.43,1):new Color4(.7,.8,.85,1);scene.fogMode=pond?0:3;scene.fogStart=current==='city'?140:current==='river'?260:120;scene.fogEnd=current==='city'?470:current==='river'?900:current==='sea'?950:760;scene.fogColor=new Color3(scene.clearColor.r,scene.clearColor.g,scene.clearColor.b);for(const[id,b]of buttons)b.setAttribute('aria-pressed',String(id===current));dialog.dataset.scenery=current;if(pond)return;
 }
 draw();return{get current(){return current;},setLooking(_value:boolean){open.textContent=t('창밖 풍경');},dispose(){world.dispose();dialog.remove();open.remove();}};
}
