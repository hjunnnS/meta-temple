import type {Scene} from '@babylonjs/core/scene';
import {Texture} from '@babylonjs/core/Materials/Textures/texture';
import type {AbstractMesh} from '@babylonjs/core/Meshes/abstractMesh';
import {privateDisplayPositions,displayLabels,validDisplayPlacements,type DisplayItem,type DisplayPlacement,type DisplayPosition} from './private-display-layout';
import {privateDisplayModel} from './private-display-model';
interface Snapshot {roomId:string;revision:number;items:DisplayItem[];placements:DisplayPlacement[]}
export function privateDisplays(scene:Scene,roomId:string,onSelect:(place:DisplayPosition)=>void,onAdd:(mesh:AbstractMesh)=>void,onRemove:(mesh:AbstractMesh)=>void){
 const panel=document.querySelector('#private-room-controls')!,open=document.createElement('button');open.id='private-display-open';open.textContent='내 아이템 배치';panel.append(open);
 const dialog=document.createElement('dialog');dialog.id='private-display-dialog';dialog.setAttribute('aria-labelledby','private-display-title');
 dialog.innerHTML=`<style>#private-display-dialog{inset:70px 18px auto auto;margin:0;width:min(420px,94vw);max-height:80vh;overflow:auto;background:#f4ecdb;color:#2f453a;border:1px solid #ac9462;border-radius:16px;padding:22px;box-sizing:border-box}#private-display-dialog::backdrop{background:#11291d25}#private-display-dialog label{display:block;margin:16px 0}#private-display-dialog select{display:block;width:100%;margin-top:8px;padding:10px;font:inherit}#private-display-dialog button{font:inherit;padding:10px;margin:4px;border-radius:8px;border:1px solid #a28b5d;background:#e2d6b9}#private-display-description{white-space:pre-wrap;overflow-wrap:anywhere;max-height:8em;overflow:auto;font-size:14px}#private-display-status{display:block;margin-top:12px;line-height:1.5}</style>
 <h2 id="private-display-title">내 아이템 전시</h2><button id="private-display-close">닫기</button><label>구매한 아이템<select id="private-display-item"></select></label><p id="private-display-description"></p><label>전시할 자리<select id="private-display-position"></select></label><button id="private-display-place">이 자리에 배치</button><button id="private-display-remove">선택한 자리 비우기</button><output id="private-display-status" role="status"></output><p>개인 공간의 전시본만 바뀌며, 사찰에 설치된 원래 아이템은 유지됩니다.</p>`;
 document.body.append(dialog);
 const itemSelect=dialog.querySelector<HTMLSelectElement>('#private-display-item')!,positionSelect=dialog.querySelector<HTMLSelectElement>('#private-display-position')!,description=dialog.querySelector<HTMLElement>('#private-display-description')!,status=dialog.querySelector<HTMLOutputElement>('#private-display-status')!,placeButton=dialog.querySelector<HTMLButtonElement>('#private-display-place')!,removeButton=dialog.querySelector<HTMLButtonElement>('#private-display-remove')!;
 const fibre=new Texture('/textures/hanji-fibres-generated-v1.png',scene);
 const models=new Map<string,ReturnType<typeof privateDisplayModel>>();let data:Snapshot|undefined,signature='',disposed=false,busy=false,time=0;
 const abort=new AbortController();
 function removeModel(key:string){const model=models.get(key);if(!model)return;for(const mesh of model.root.getChildMeshes())onRemove(mesh);model.dispose();models.delete(key);}
 function apply(next:Snapshot){
  if(next.roomId!==roomId||!validDisplayPlacements(next.placements)||!Array.isArray(next.items))throw Error('개인 공간을 다시 확인해 주세요.');
  const nextSignature=JSON.stringify([next.placements,next.items]);
  if(nextSignature===signature&&data){data=next;return;}
  const oldItem=itemSelect.value,oldSlot=positionSelect.value;data=next;
  itemSelect.replaceChildren();
  for(const item of next.items){
   const option=document.createElement('option');option.value=item.orderId;
   const at=next.placements.find(p=>p.orderId===item.orderId),where=at?privateDisplayPositions.find(p=>p.id===at.slotId)?.label:'';
   option.textContent=displayLabels[item.kind]+' · '+(item.name||item.text?.slice(0,14)||item.orderId.slice(0,8))+(where?' — '+where:'');itemSelect.append(option);
  }
  if(next.items.some(i=>i.orderId===oldItem))itemSelect.value=oldItem;
  positions(oldSlot);
  if(nextSignature!==signature){
   signature=nextSignature;for(const key of [...models.keys()])removeModel(key);
   for(const row of next.placements){
    const item=next.items.find(i=>i.orderId===row.orderId),position=privateDisplayPositions.find(s=>s.id===row.slotId);if(!item||!position)continue;
    const model=privateDisplayModel(scene,item,position,fibre);models.set(row.slotId,model);for(const mesh of model.root.getChildMeshes())onAdd(mesh);
   }
  }
 }
 function positions(selected?:string){
  const item=data?.items.find(i=>i.orderId===itemSelect.value);positionSelect.replaceChildren();
  const candidates=privateDisplayPositions.filter(p=>!item||p.accepts.includes(item.kind));
  for(const position of candidates){const option=document.createElement('option');option.value=position.id;const occupant=data?.placements.find(p=>p.slotId===position.id);const shown=occupant?data?.items.find(i=>i.orderId===occupant.orderId):undefined;option.textContent=position.label+(shown?' · '+displayLabels[shown.kind]+' 전시 중':' · 빈자리');positionSelect.append(option);}
  const current=data?.placements.find(p=>p.orderId===item?.orderId)?.slotId;
  const preferred=selected||current||candidates.find(p=>!data?.placements.some(row=>row.slotId===p.id))?.id;
  if(preferred&&candidates.some(p=>p.id===preferred))positionSelect.value=preferred;
  description.textContent=item?[displayLabels[item.kind],item.name,item.text].filter(Boolean).join('\n'):'구매가 완료된 아이템이 아직 없습니다.';selection();
 }
 function selection(){
  const position=privateDisplayPositions.find(p=>p.id===positionSelect.value),occupied=data?.placements.some(p=>p.slotId===positionSelect.value);
  placeButton.disabled=busy||!data?.items.length||!position;removeButton.disabled=busy||!occupied;
  placeButton.textContent=occupied?'이 자리에 교체':'이 자리에 배치';if(dialog.open&&position)onSelect(position);
 }
 async function call(method:'GET'|'POST',body?:object){
  const response=await fetch('/api/service/private-room/display'+(method==='GET'?'?roomId='+encodeURIComponent(roomId):''),{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(5000)])});
  const result=await response.json();if(!response.ok)throw Error(result.error??'connection');return result as Snapshot;
 }
 async function load(message?:string){
  if(disposed||busy)return;
  try{const next=await call('GET');if(disposed)return;apply(next);if(message)status.textContent=message;else if(!dialog.open||!status.textContent)status.textContent=next.items.length?'아이템과 자리를 골라 배치해 주세요.':'구매 완료된 다섯 종류의 아이템을 여기에서 골라 전시할 수 있습니다.';}
  catch{if(!disposed)status.textContent='구매 내역을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.';}
 }
 async function save(remove=false){
  if(!data||busy)return;const slotId=positionSelect.value,orderId=itemSelect.value;
  const placements=data.placements.filter(p=>p.slotId!==slotId&&(remove||p.orderId!==orderId));if(!remove)placements.push({slotId,orderId});
  busy=true;selection();status.textContent='배치를 저장하고 있습니다.';
  try{const next=await call('POST',{roomId,revision:data.revision,placements});if(disposed)return;apply(next);status.textContent=remove?'자리를 비웠습니다. 저장되었습니다.':'배치가 저장되었습니다. 다시 들어와도 유지됩니다.';}
  catch(error){
   if(disposed)return;busy=false;
   const message=String(error).includes('layout_changed')?'다른 창에서 배치가 바뀌었습니다. 최신 배치를 확인하고 다시 선택해 주세요.':String(error).includes('item_unavailable')?'이 아이템을 전시할 수 없습니다. 구매 상태와 자리를 다시 확인해 주세요.':'저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.';
   await load(message);
  }finally{busy=false;if(!disposed)selection();}
 }
 open.onclick=()=>{dialog.showModal();selection();void load();};dialog.querySelector<HTMLButtonElement>('#private-display-close')!.onclick=()=>dialog.close();
 itemSelect.onchange=()=>positions();positionSelect.onchange=selection;placeButton.onclick=()=>{void save();};removeButton.onclick=()=>{void save(true);};
 void load();const interval=window.setInterval(()=>void load(),5000);
 return {update(dt:number){time+=Math.min(.1,dt);for(const model of models.values())model.update(time);},dispose(){disposed=true;abort.abort();clearInterval(interval);if(dialog.open)dialog.close();dialog.remove();open.remove();for(const key of [...models.keys()])removeModel(key);fibre.dispose();}};
}
