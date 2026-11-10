import type {createTemple} from './scene';
import {personalGate} from './temple-terrain';
import {privateRoomScene} from './private-room-scene';

export function personalSpace(app:ReturnType<typeof createTemple>,canvas:HTMLCanvasElement,onEnter:()=>void){
 const panel=document.createElement('section');panel.id='private-room-controls';panel.hidden=true;
 panel.innerHTML=`<style>
 body.in-private-room header,body.in-private-room .place-picker,body.in-private-room footer,body.in-private-room #walk-pad,body.in-private-room #pond-toss,body.in-private-room #pond-wish,body.in-private-room #reception-panel,body.in-private-room #tea-break,body.in-private-room .ceremony-board,body.in-private-room #private-gate-action{display:none!important}
 #private-room-controls{position:fixed;bottom:24px;left:24px;z-index:15;padding:18px;border-radius:16px;background:#203d35ee;border:1px solid #bda36d;color:#fff1d1;font:15px sans-serif;max-width:calc(100vw - 48px)}
 #private-room-controls[hidden],#private-gate-action[hidden]{display:none}#private-room-controls strong,#private-room-controls small{display:block;margin-bottom:8px}
 #private-room-controls button,#private-gate-action{border:1px solid #bda36d;background:#f0e5cb;color:#24453b;border-radius:8px;padding:10px;margin:3px;font:inherit}
 #private-gate-action{position:fixed;bottom:22%;left:50%;transform:translateX(-50%);z-index:18}
 </style><strong>시간과 공간의 방</strong><small>나만 입장하는 조용한 공간</small><button id="private-room-exit">사찰로 돌아가기</button><div><button data-room-view="overview">수행실 둘러보기</button><button data-room-view="garden">정원 바라보기</button><button data-room-view="display">전시 공간 보기</button><button data-room-view="walk">직접 걷기</button></div><p>WASD · 방향키로 걷기</p><div>${[['KeyA','←'],['KeyW','↑'],['KeyS','↓'],['KeyD','→']].map(([key,label])=>`<button data-room-key="${key}" aria-label="${label} 방향으로 걷기">${label}</button>`).join('')}</div>`;
 document.body.append(panel);
 const gate=document.createElement('button');gate.id='private-gate-action';gate.hidden=true;gate.textContent='시간과 공간의 방 입장';document.body.append(gate);
 let room:ReturnType<typeof privateRoomScene>|undefined,roomId='',pending=false,armed=true,generation=0,heartbeat=0,leaving=false;
 let login:((resume:()=>void)=>void)|undefined;
 const stage=document.querySelector<HTMLElement>('.stage')!;let previousStage='',previousLabel='';
 async function request(action:string,body:object={},keepalive=false){return fetch('/api/service/private-room/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',keepalive,signal:keepalive?undefined:AbortSignal.timeout(5000)});}
 function scope(value:'private'|'public'){window.dispatchEvent(new CustomEvent('sasa:space',{detail:value}));}
 async function exit(message=''){
  if(leaving||!room)return;leaving=true;generation++;clearInterval(heartbeat);
  const id=roomId;roomId='';room.dispose();room=undefined;panel.hidden=true;document.body.classList.remove('in-private-room');
  canvas.setAttribute('aria-label',previousLabel);stage.textContent=previousStage;
  app.camera.attachControl(canvas,true);app.returnFromPrivateRoom();
  document.querySelector<HTMLSelectElement>('#place')!.value='walk';
  try{await request('leave',{roomId:id});}catch{/* The server lease also expires if the connection was lost. */}
  scope('public');leaving=false;gate.textContent=message||'시간과 공간의 방 입장';canvas.focus();
 }
 async function enter(){
  if(room||pending||leaving)return;pending=true;armed=false;const attempt=++generation;gate.disabled=true;gate.textContent='나만의 공간을 준비하고 있어요…';
  try{
   const response=await request('enter');
   if(attempt!==generation)return;
   if(response.status===401){
    gate.textContent='개인 공간은 로그인 후 입장할 수 있어요.';
    if(login)login(()=>{void enter();});return;
   }
   if(!response.ok)throw Error('개인 공간에 연결하지 못했습니다. 다시 시도해 주세요.');
   const data=await response.json();if(typeof data.roomId!=='string')throw Error('개인 공간을 확인하지 못했습니다.');
   roomId=data.roomId;scope('private');onEnter();app.setWalking(false);app.camera.detachControl();
   previousStage=stage.textContent??'';previousLabel=canvas.getAttribute('aria-label')??'';
   room=privateRoomScene(app.engine,canvas,app.visitorPose.face,app.visitorPose.wearingRobe,()=>{void exit();},roomId);
   panel.hidden=false;document.body.classList.add('in-private-room');stage.textContent='시간과 공간의 방 · 나만의 공간';canvas.setAttribute('aria-label','시간과 공간의 방. 나만 입장하는 개인 공간. 방향키로 걷고 사찰로 돌아가기로 나갑니다.');
   heartbeat=window.setInterval(async()=>{
    if(!room)return;const id=roomId,version=generation;
    try{const check=await request('heartbeat',{roomId:id});if(room&&roomId===id&&generation===version&&!check.ok)await exit('세션이 끝났습니다. 다시 입장해 주세요.');}
    catch{if(room&&roomId===id&&generation===version)await exit('연결 상태를 확인한 뒤 다시 입장해 주세요.');}
   },5000);canvas.focus();
  }catch(error){
   gate.textContent=error instanceof Error?error.message:'개인 공간을 열지 못했습니다.';
   if(room)await exit(gate.textContent);
   else if(roomId){roomId='';try{await request('leave');}catch{}scope('public');app.camera.attachControl(canvas,true);app.returnFromPrivateRoom();}
  }finally{pending=false;gate.disabled=false;}
 }
 gate.onclick=()=>{void enter();};panel.querySelector<HTMLButtonElement>('#private-room-exit')!.onclick=()=>{void exit();};
 window.addEventListener('sasa:account',()=>{if(room)void exit('계정이 변경되어 사찰로 돌아왔습니다.');else if(pending)generation++;});
 window.addEventListener('pagehide',()=>{if(roomId)void request('leave',{roomId},true).catch(()=>{});});
 return {setLogin(handler:(resume:()=>void)=>void){login=handler;},get active(){return !!room;},render(dt:number){room?.render(dt);},
 checkPortal(){
  if(room||leaving)return;
  const p=app.settings.visitor;if(!p){gate.hidden=true;return;}
  const distance=Math.hypot(p[0]-personalGate.x,p[2]-personalGate.z);gate.hidden=distance>4.5;
  if(distance>3){armed=true;if(!pending)gate.textContent='시간과 공간의 방 입장';}
  if(armed&&!pending&&!document.querySelector('dialog[open]')&&Math.abs(p[0]-personalGate.x)<.65&&Math.abs(p[2]-personalGate.z)<1.1)void enter();
 }};
}
