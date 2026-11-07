import { offerings, readApplication, storagePrefix, type Offering } from './reception.ts';
import { renderWhileViewing } from './preview-rendering.ts';
import './style.css';
import { templePlaces } from './temple-layout.ts';
import { createTemple, type TimeOfDay, type Quality } from './scene.ts';
import { Measurement } from './metrics.ts';
import { SCENE_VERSION, OWNED_INDICES } from './contracts.ts';
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`
<canvas id="world" aria-label="사찰 3D 장면. 드래그로 시점 회전, 휠이나 두 손가락으로 확대." tabindex="0"></canvas>
<header><a class="brand" href="#" aria-label="사사 처음 시점"><span class="seal">山</span><span>사사<small>SASA · A MOMENT OF STILLNESS</small></span></a><span class="stage">사찰 배치 검토 <i></i> 두 문 사이 진입길</span><button id="settings" class="circle" aria-label="환경 설정 열기">☷</button></header>
<section class="intro"><span class="eyebrow">잠시, 일상에서 한 걸음</span><h1>빛을 따라,<br>마음이 머무는 곳.</h1><p>처마 아래 스며드는 빛과<br>조용히 흔들리는 마음을 바라봅니다.</p><button id="explore" class="primary">사찰 둘러보기 <span>↗</span></button></section>
<div id="loading" role="status">사사의 빛을 준비하고 있어요…</div>
<aside id="settings-panel" hidden aria-label="환경 설정"><div class="panel-title"><h2>머무는 방식</h2><button id="close-settings" aria-label="환경 설정 닫기">×</button></div><label>시간대<select id="time"><option value="day" selected>햇살 가득한 낮</option><option value="dusk">해질녘</option><option value="night">밤</option></select></label><label>화면 품질<select id="quality"><option value="high">섬세하게</option><option value="low">가볍게</option></select></label><label class="check"><input type="checkbox" id="reduced">반짝임 완화</label><label>내 연등 이름표<input id="lantern-name" maxlength="24" placeholder="이름 입력 · 최대 12자"></label><button id="apply-name" class="primary">이름표 미리보기</button><p id="name-status" class="note" role="status">현재 선택한 내 연등에 표시됩니다. 미리보기 이름은 서버에 저장하지 않습니다.</p><p class="note">무음 장면입니다. 내 연등은 모든 품질에서 같은 위치에 표시됩니다.</p></aside>
<footer><div class="location"><span class="eyebrow">01 / 대웅전</span><p>고요를 담은 빛</p></div><nav aria-label="장면 보기"><button data-view="officeReception">등·소원 접수처</button><button data-view="wide" aria-pressed="false">전체 풍경</button><button data-view="front" aria-pressed="false">대웅전</button><button data-view="canopy" aria-pressed="false">연등 아래</button><button data-view="detail" aria-pressed="false">단청</button><button data-view="lantern" aria-pressed="false">내 연등 <span class="dot"></span></button></nav><button id="diagnostics">검증 기록 ↗</button></footer>
<label class="place-picker">공간 둘러보기 <select id="place"><option value="wide">전체 풍경</option><option value="map">배치도 · 위에서 보기</option><option value="plazaCourt">연등 광장에서 본 중앙 마당</option><option value="plazaHall">연등 광장에서 본 대웅전</option><option value="courtHall">중앙 마당에서 본 대웅전</option><option value="eavesHall">대웅전 처마 아래</option><option value="gwaneumDoor">관음전 열린 입구</option><option value="gwaneumAltar">관음보살 불단</option><option value="gwaneumSeats">관음전 기도 자리</option><option value="gateArrival">일주문 앞 · 정면 담</option><option value="templeApproach">일주문부터 대웅전까지</option><option value="gateWalk">천왕문 통과하기</option><option value="gateEave">천왕문 처마와 첫 연등</option><option value="guardianGallery">천왕문 안 · 사천왕</option><option value="gatePassage" selected>두 문 사이 진입길</option><option value="courtWall">중앙 마당 가장자리</option><option value="votiveShelves">인등전 안 · 인등 선반</option><option value="memorialLamps">지장전 안 · 추모등</option><option value="indeungApproach">서쪽 길에서 본 인등전</option><option value="pagodaCourt">관음전 옆 석탑</option><option value="stoneLanterns">대웅전 앞 석등</option><option value="candleCourt">석탑 앞과 양옆 봉헌초</option><option value="wishGarden">소원패 정원 · 나무 걸이대</option><option value="wishAisle">소원패 정원 · 줄 사이</option><option value="officeReception">종무소 · 등·소원 접수처</option><option value="lanternReception">연등광장 · 신청 자리</option><option value="entryRowMap">배치도 · 범종각과 종무소</option><option value="gateExitOffice">천왕문 출구 · 오른쪽 종무소</option><option value="officeApproach">진입로에서 본 종무소</option><option value="bellApproach">천왕문 길에서 본 범종각</option><option value="bellDetail">범종과 당목 가까이</option><option value="jijangPlaza">연등 광장에서 본 지장전</option><option value="jijangInterior">지장전 안 · 추모 기도 자리</option><option value="entrance">마당에서 본 열린 법당</option><option value="sanctuary">대웅전 안 · 예불 자리</option><option value="seating">법당 안 · 50명 배치</option><option value="shrine">불단 가까이</option><option value="face">불상 얼굴 가까이</option><option value="chime">처마 끝 풍경</option>${templePlaces.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label>
<section id="reception-panel" hidden aria-label="등·소원 접수처"></section>
<dialog id="application"><form><div class="panel-title"><h2 id="request-title"></h2><button type="button" id="cancel-request" aria-label="신청 닫기">×</button></div>
<p id="slot-location"></p><label>기간<select id="request-term"><option value="week">일주일</option><option value="month">한 달</option></select></label>
<label id="request-label"><span></span><input id="request-text" maxlength="12"></label>
<p class="note">미리보기 신청은 이 브라우저에 저장됩니다. 결제 금액은 없습니다.</p>
<button class="primary" type="submit">이 자리에 신청</button><p id="request-error" role="status"></p></form></dialog>
<div id="application-status" role="status"></div><div class="hint">드래그하여 둘러보기 · 휠 / 두 손가락으로 확대</div>
<dialog id="diagnostic-dialog"><div class="panel-title"><h2>M1 장면 검증</h2><button id="close-diagnostics" aria-label="검증 기록 닫기">×</button></div><p>측정은 현재 기기의 결과이며, 모바일 실기기 또는 시각 품질 승인으로 자동 간주하지 않습니다.</p><label>기기 모델 (직접 입력)<input id="device" placeholder="미입력 · 실기기 미확인"></label><label>연등 후보 수<select id="density"><option>100</option><option>300</option><option>500</option><option value="1000" selected>전체 배치 · 작은 틈</option></select></label><label>내 연등 선택<select id="owned">${OWNED_INDICES.map((x,i)=>`<option value="${x}">내 연등 ${i+1} · 슬롯 ${x}</option>`).join('')}</select></label><p class="note">샘플 소유 표시입니다. 계정·결제·실제 소유권은 연결하지 않았습니다. 갈색 발판 길 위의 후보만 표시합니다.</p><output id="live" aria-live="off">준비 중</output><div class="actions"><button id="measure">측정 시작</button><button id="stop">측정 종료</button><button id="export">기록 저장</button></div><p class="note">시작 후 2초 예열. 정식 판정은 승인된 기기·밀도·동선·예열·측정 시간으로 별도 실행합니다. 측정 중 설정 변경·탭 숨김·화면 크기 변경 시 기록을 무효화합니다.</p><pre id="report" aria-live="polite">아직 측정하지 않았습니다.</pre></dialog>`;
const $=<T extends HTMLElement=HTMLElement>(q:string)=>document.querySelector<T>(q)!;
const canvas=$<HTMLCanvasElement>('#world');
const measure=new Measurement();let app:ReturnType<typeof createTemple>;
const initStart=performance.now();
try {app=createTemple(canvas);}catch(error){$('#loading').textContent='3D를 시작하지 못했습니다. WebGL을 지원하는 브라우저에서 다시 열어 주세요.';console.error(error);throw error;}
let firstFrameMs:number|null=null;let last=performance.now();let tick=0;let latest:Record<string,unknown>|null=null;let recordedSettings:unknown=null;let startCamera:unknown=null;
renderWhileViewing(app.engine,()=>{const now=performance.now();const dt=now-last;last=now;app.scene.render();if(firstFrameMs===null && app.scene.isReady()){firstFrameMs=performance.now();$('#loading').hidden=true;document.body.dataset.ready='true';}measure.frame(dt);if(++tick%30===0){$('#live').textContent=`${app.engine.getFps().toFixed(0)} FPS · 연등 ${app.settings.visibleLanternCount}/${app.settings.canopyCapacity}자리 · ${app.scene.getActiveMeshes().length} 활성 메시 · ${app.engine.getRenderWidth()}×${app.engine.getRenderHeight()}`;if(measure.active)$('#report').textContent=JSON.stringify(measure.report(),null,2);}}, () => {
 if(measure.active) invalidate('측정 중 미리보기 일시 정지');
}, () => { last=performance.now(); }, () => firstFrameMs !== null);
function invalidate(reason:string){measure.invalidate(reason);if(measure.invalidReason)$('#report').textContent=JSON.stringify(measure.report(),null,2);}
window.addEventListener('resize',()=>{invalidate('측정 중 화면 크기 변경');app.engine.resize();});

canvas.addEventListener('webglcontextlost',()=>{invalidate('WebGL context lost');$('#loading').hidden=false;$('#loading').textContent='그래픽 연결이 중단되었습니다. 페이지를 새로고침해 주세요.';});
$('#settings').onclick=()=>{const panel=$('#settings-panel');panel.hidden=!panel.hidden;if(!panel.hidden)$('#time').focus();};
$('#close-settings').onclick=()=>{$('#settings-panel').hidden=true;$('#settings').focus();};
$('#explore').onclick=()=>{app.view('gateWalk');$<HTMLSelectElement>('#place').value='gateWalk';document.body.classList.add('exploring');canvas.focus();};
$('.brand').onclick=e=>{e.preventDefault();app.view('gatePassage');$<HTMLSelectElement>('#place').value='gatePassage';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));document.body.classList.remove('exploring');};
$('#apply-name').onclick=()=>{invalidate('이름표 변경');const field=$<HTMLInputElement>('#lantern-name');field.value=app.setName(field.value);$('#name-status').textContent=field.value?'이름표에 반영했습니다. 새로고침하면 초기화됩니다.':'이름표를 제거했습니다.';app.view('lantern');document.body.classList.add('exploring');for(const b of document.querySelectorAll<HTMLElement>('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view==='lantern'));$('#settings-panel').hidden=true;};
$('#time').onchange=()=>{invalidate('시간대 변경');app.time($<HTMLSelectElement>('#time').value as TimeOfDay);};
$('#quality').onchange=()=>{invalidate('품질 변경');app.setQuality($<HTMLSelectElement>('#quality').value as Quality);};
$<HTMLInputElement>('#reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
app.setReduced($<HTMLInputElement>('#reduced').checked);
$('#reduced').onchange=()=>{invalidate('효과 변경');app.setReduced($<HTMLInputElement>('#reduced').checked);};
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-view]'))button.onclick=()=>{app.view(button.dataset.view!);document.body.classList.add('exploring');for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b===button));};
const dialog=$<HTMLDialogElement>('#diagnostic-dialog');$('#diagnostics').onclick=()=>dialog.showModal();$('#close-diagnostics').onclick=()=>dialog.close();dialog.onclose=()=>$('#diagnostics').focus();
$('#density').onchange=()=>{invalidate('연등 밀도 변경');app.rebuildLanterns(Number($<HTMLSelectElement>('#density').value));};
$('#owned').onchange=()=>{invalidate('선택 상품 변경');app.setSelected(Number($<HTMLSelectElement>('#owned').value));app.view('lantern');document.body.classList.add('exploring');for(const b of document.querySelectorAll<HTMLElement>('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view==='lantern'));};
$('#measure').onclick=()=>{measure.start();latest=null;recordedSettings={...app.settings};startCamera={alpha:app.camera.alpha,beta:app.camera.beta,radius:app.camera.radius,target:app.camera.target.asArray()};$('#report').textContent='2초 예열 후 현재 설정으로 측정합니다.';};
function report(){const p=performance as Performance & {memory?:{usedJSHeapSize:number}};return {schemaVersion:1,sceneVersion:SCENE_VERSION,createdAt:new Date().toISOString(),device:$<HTMLInputElement>('#device').value||'미확인',userAgent:navigator.userAgent,physicalDeviceVerified:false,acceptance:'unreviewed',settings:recordedSettings??app.settings,currentSettings:app.settings,startCamera,camera:{alpha:app.camera.alpha,beta:app.camera.beta,radius:app.camera.radius,target:app.camera.target.asArray()},renderer:app.engine.getGlInfo(),timing:{navigationToFirstRenderedFrameMs:firstFrameMs,sceneConstructionToFirstFrameMs:firstFrameMs===null?null:firstFrameMs-initStart},jsHeapBytes:p.memory?.usedJSHeapSize??null,memoryCaveat:'JS heap only if exposed; not GPU or total process memory',measurement:measure.report()};}
$('#stop').onclick=()=>{measure.stop();latest=report();$('#report').textContent=JSON.stringify(latest,null,2);};
$('#export').onclick=()=>{if(measure.active)measure.stop();latest=report();$('#report').textContent=JSON.stringify(latest,null,2);const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`sasa-${SCENE_VERSION}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open&&!$('#settings-panel').hidden){$('#settings-panel').hidden=true;$('#settings').focus();}});

$('#place').onchange=()=>{invalidate('검토 공간 변경');app.view($<HTMLSelectElement>('#place').value);document.body.classList.add('exploring');for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');};

const receptionPanel=$('#reception-panel'),requestDialog=$<HTMLDialogElement>('#application');
const placePicker=$<HTMLSelectElement>('#place');
const productKinds=Object.keys(offerings) as Offering[];
let currentPanel='',pendingId='';
function goToPlace(view:string){
 placePicker.value=view;
 placePicker.dispatchEvent(new Event('change'));
}
function panelButton(label:string,act:()=>void){
 const button=document.createElement('button');button.textContent=label;button.onclick=act;
 receptionPanel.append(button);
}
function receptionView(view:string){
 const placeName=[...placePicker.options].find(option=>option.value===view)?.textContent;
 const navName=document.querySelector<HTMLElement>('[data-view="'+view+'"]')?.textContent;
 $('.stage').textContent=placeName??navName??'사찰 둘러보기';
 currentPanel=view;receptionPanel.replaceChildren();
 const kind=productKinds.find(k=>offerings[k].view===view);
 receptionPanel.hidden=view!=='officeReception'&&!kind;
 if(receptionPanel.hidden)return;
 const title=document.createElement('h2');
 title.textContent=kind?offerings[kind].place+' · 빈자리':'등·소원 접수처';
 receptionPanel.append(title);
 if(kind){
  const slots=[...app.applicationSlots].filter(([,s])=>s.kind===kind);
  const available=slots.filter(([id])=>!readApplication(id));
  const hint=document.createElement('p');hint.textContent=available.length?'현장의 + 표시 또는 자리 번호를 선택하세요.':'이 공간의 신청 자리가 모두 찼습니다.';receptionPanel.append(hint);
  for(const [id] of available)panelButton((slots.findIndex(([key])=>key===id)+1)+'번 자리',()=>openRequest(id));
 }else{
  for(const k of productKinds)panelButton(offerings[k].label+' · '+offerings[k].place,()=>goToPlace(offerings[k].view));
 }
}
function openRequest(id:string){
 const slot=app.applicationSlots.get(id);if(!slot||readApplication(id))return;
 const item=offerings[slot.kind];pendingId=id;
 const number=[...app.applicationSlots].filter(([,s])=>s.kind===slot.kind).findIndex(([key])=>key===id)+1;
 $('#request-title').textContent=item.label+' 신청';
 $('#slot-location').textContent=item.place+' · '+number+'번 자리';
 $('#request-label span').textContent=slot.kind==='plaque'?'소원 문구':'이름 (선택)';
 const input=$<HTMLInputElement>('#request-text');input.value='';input.required=slot.kind==='plaque';
 $('#request-error').textContent='';requestDialog.showModal();
}
app.onSlotClick(openRequest);
$('#cancel-request').onclick=()=>requestDialog.close();
requestDialog.onclose=()=>{pendingId='';};
function refreshSlot(id:string){app.refreshApplication(id);receptionView(currentPanel);}
$('form').onsubmit=async event=>{
 event.preventDefault();const id=pendingId,slot=app.applicationSlots.get(id);if(!slot)return;
 const text=$<HTMLInputElement>('#request-text').value.trim();
 if(slot.kind==='plaque'&&!text){$('#request-error').textContent='소원 문구를 입력해 주세요.';return;}
 const expires=new Date();
 if($<HTMLSelectElement>('#request-term').value==='week')expires.setDate(expires.getDate()+7);
 else{const day=expires.getDate();expires.setDate(1);expires.setMonth(expires.getMonth()+1);const end=new Date(expires.getFullYear(),expires.getMonth()+1,0).getDate();expires.setDate(Math.min(day,end));}
 const save=()=>{
  if(readApplication(id)){refreshSlot(id);$('#request-error').textContent='이미 신청된 자리입니다. 다른 자리를 선택해 주세요.';return;}
  localStorage.setItem(storagePrefix+id,JSON.stringify({text,expires:expires.getTime()}));
  refreshSlot(id);requestDialog.close();
  $('#application-status').textContent=offerings[slot.kind].label+' 신청 완료 · '+$('#slot-location').textContent;
 };
 try{if(navigator.locks)await navigator.locks.request(storagePrefix+id,save);else save();}
 catch{$('#request-error').textContent='신청을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.';}
};
window.addEventListener('storage',event=>{if(event.key?.startsWith(storagePrefix))refreshSlot(event.key.slice(storagePrefix.length));});
placePicker.addEventListener('change',()=>{$('#application-status').textContent='';receptionView(placePicker.value);});
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-view]'))button.addEventListener('click',()=>{
 const view=button.dataset.view!;if(view==='officeReception')placePicker.value=view;
 $('#application-status').textContent='';receptionView(view);
});
for(const selector of ['.brand','#explore','#apply-name','#owned'])$(selector).addEventListener(selector==='#owned'?'change':'click',()=>{receptionView('');$('#application-status').textContent='';});
