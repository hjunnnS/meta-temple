import{Vector3,Matrix}from'@babylonjs/core/Maths/math.vector';
import type{createTemple}from'./scene';
import{offerings}from'./reception';
import{t}from'./locales';
/** Display only the inscription already authorized and returned by the slots API. */
export function offeringTag(app:ReturnType<typeof createTemple>,canvas:HTMLCanvasElement){
 const tag=document.createElement('aside');tag.id='offering-tag';tag.hidden=true;tag.setAttribute('role','region');tag.setAttribute('aria-label',t('공개 봉헌'));
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',t('닫기'));
 const kind=document.createElement('small'),name=document.createElement('strong'),text=document.createElement('p');text.setAttribute('aria-live','polite');tag.append(close,kind,name,text);document.querySelector('#app')!.append(tag);
 let selected='',signature='',lastX=-1,lastY=-1;
 function hide(){selected='';signature='';tag.hidden=true;}
 close.onclick=hide;
 function refresh(){
  if(!selected)return;const slot=app.reviewSlots.get(selected);
  if(!slot?.installationId||!(slot.name?.trim()||slot.text?.trim())){hide();return;}
  const next=JSON.stringify([slot.accepts,slot.name,slot.text]);if(next===signature)return;signature=next;
  kind.textContent=t(offerings[slot.accepts==='wish-plaque'?'plaque':slot.accepts].label);name.textContent=slot.name??'';name.hidden=!slot.name;text.textContent=slot.text??'';text.hidden=!slot.text;
 }
 function show(id:string){const slot=app.reviewSlots.get(id);if(!slot?.installationId||!(slot.name?.trim()||slot.text?.trim()))return;selected=id;signature='';refresh();}
 app.scene.onAfterRenderObservable.add(()=>{
  if(!selected)return;refresh();const slot=app.reviewSlots.get(selected);if(!slot)return;
  const point=Vector3.FromArray([...slot.position]);if(Vector3.DistanceSquared(app.camera.position,point)>24*24){hide();return;}
  const projected=Vector3.Project(point,Matrix.Identity(),app.scene.getTransformMatrix(),app.camera.viewport.toGlobal(app.engine.getRenderWidth(),app.engine.getRenderHeight()));
  if(projected.z<0||projected.z>1){tag.hidden=true;return;}
  tag.hidden=false;const rect=canvas.getBoundingClientRect(),x=rect.left+projected.x*rect.width/app.engine.getRenderWidth(),y=rect.top+projected.y*rect.height/app.engine.getRenderHeight();
  const left=Math.round(Math.max(12,Math.min(innerWidth-tag.offsetWidth-12,x+14))),top=Math.round(Math.max(88,Math.min(innerHeight-tag.offsetHeight-100,y+18)));
  if(left!==lastX){lastX=left;tag.style.left=left+'px';}if(top!==lastY){lastY=top;tag.style.top=top+'px';}
 });
 window.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});window.addEventListener('sasa:account',hide);window.addEventListener('sasa:space',hide);
 return{show,hide,refresh};
}
