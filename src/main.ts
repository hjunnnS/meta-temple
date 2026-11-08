import {languages,locale,t,translateMarkup} from './locales';
import {translateViews} from './locales/views';
import {watchPublic} from './public-refresh.ts';
import { displayOffers } from './service-offers.ts';
import { setupAccount } from './service-account.ts';
import { templeAudio } from './temple-audio.ts';
import { reviewPresence } from './review-presence.ts';
import { offeringZones } from './contracts.ts';
import { parseReviewSlots } from './review-slots.ts';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
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
<header><a class="brand" href="#" aria-label="사사 처음 시점"><span class="seal">山</span><span>사사<small>SASA · A MOMENT OF STILLNESS</small></span></a><span class="stage">사찰 배치 검토 <i></i> 두 문 사이 진입길</span><button id="settings" class="circle" aria-haspopup="dialog" aria-controls="settings-panel" aria-label="환경 설정 열기">☷</button></header>
<section class="intro"><span class="eyebrow">잠시, 일상에서 한 걸음</span><h1>빛을 따라,<br>마음이 머무는 곳.</h1><p>처마 아래 스며드는 빛과<br>조용히 흔들리는 마음을 바라봅니다.</p><label class="entry-audio"><input id="entry-audio" type="checkbox"> 공간음과 함께 입장</label><button id="explore" class="primary">사찰 둘러보기 <span>↗</span></button></section>
<div id="loading" role="status" tabindex="-1"><span>사찰을 준비하고 있어요…</span><button id="load-retry" hidden>다시 불러오기</button></div>
<dialog id="settings-panel" aria-labelledby="settings-title"><div class="panel-title"><h2 id="settings-title">환경 설정</h2><button id="close-settings" aria-label="환경 설정 닫기">×</button></div><label class="check"><input id="audio-on" type="checkbox"> 공간음 켜기</label><label>소리 크기<input id="audio-volume" type="range" min="0" max="100" value="35"></label><p class="note" id="audio-status" role="status">무음</p><label>시간대<select id="time"><option value="day" selected>햇살 가득한 낮</option><option value="dusk">해질녘</option><option value="night">밤</option></select></label><label>화면 품질<select id="quality"><option value="high">섬세하게</option><option value="low">가볍게</option></select></label><label class="check"><input type="checkbox" id="reduced">반짝임 완화</label><label>내 연등 이름표<input id="lantern-name" maxlength="24" placeholder="이름 입력 · 최대 12자"></label><button id="apply-name" class="primary">이름표 미리보기</button><p id="name-status" class="note" role="status">현재 선택한 내 연등에 표시됩니다. 미리보기 이름은 서버에 저장하지 않습니다.</p><p class="note">내 연등은 모든 품질에서 같은 위치에 표시됩니다.</p></dialog>
<footer><div class="location"><span class="eyebrow">01 / 대웅전</span><p>고요를 담은 빛</p></div><nav aria-label="장면 보기"><button data-view="officeReception">등·소원 접수처</button><button data-view="wide" aria-pressed="false">전체 풍경</button><button data-view="front" aria-pressed="false">대웅전</button><button data-view="canopy" aria-pressed="false">연등 아래</button><button data-view="detail" aria-pressed="false">단청</button></nav><button id="diagnostics">검증 기록 ↗</button></footer>
<label class="place-picker">공간 둘러보기 <select id="place"><option value="walk">아바타로 걷기</option><option value="wide">전체 풍경</option><option value="map">배치도 · 위에서 보기</option><option value="plazaCourt">연등 광장에서 본 중앙 마당</option><option value="plazaHall">연등 광장에서 본 대웅전</option><option value="courtHall">중앙 마당에서 본 대웅전</option><option value="eavesHall">대웅전 처마 아래</option><option value="gwaneumDoor">관음전 열린 입구</option><option value="gwaneumAltar">관음보살 불단</option><option value="gwaneumSeats">관음전 기도 자리</option><option value="gateArrival">일주문 앞 · 정면 담</option><option value="templeApproach">일주문부터 대웅전까지</option><option value="gateWalk">천왕문 통과하기</option><option value="gateEave">천왕문 처마와 첫 연등</option><option value="guardianGallery">천왕문 안 · 사천왕</option><option value="gatePassage" selected>두 문 사이 진입길</option><option value="courtWall">중앙 마당 가장자리</option><option value="votiveShelves">인등전 안 · 인등 선반</option><option value="memorialLamps">지장전 안 · 추모등</option><option value="indeungApproach">서쪽 길에서 본 인등전</option><option value="pagodaCourt">관음전 옆 석탑</option><option value="stoneLanterns">대웅전 앞 석등</option><option value="candleCourt">석탑 앞과 양옆 봉헌초</option><option value="wishGarden">소원패 정원 · 나무 걸이대</option><option value="wishAisle">소원패 정원 · 줄 사이</option><option value="officeReception">종무소 · 등·소원 접수처</option><option value="lanternReception">연등광장 · 신청 자리</option><option value="entryRowMap">배치도 · 범종각과 종무소</option><option value="gateExitOffice">천왕문 출구 · 오른쪽 종무소</option><option value="officeApproach">진입로에서 본 종무소</option><option value="bellApproach">천왕문 길에서 본 범종각</option><option value="bellDetail">범종과 당목 가까이</option><option value="jijangPlaza">연등 광장에서 본 지장전</option><option value="jijangInterior">지장전 안 · 추모 기도 자리</option><option value="entrance">마당에서 본 열린 법당</option><option value="sanctuary">대웅전 안 · 예불 자리</option><option value="seating">법당 안 · 50명 배치</option><option value="shrine">불단 가까이</option><option value="face">불상 얼굴 가까이</option><option value="chime">처마 끝 풍경</option>${templePlaces.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label>
<section id="walk-pad" aria-label="걷기 조작" hidden><span>WASD · 방향키로 걷기</span><button id="visit-point" hidden></button><button id="prayer-point" hidden></button><button id="bow-start" hidden></button><button id="bow-stop" hidden></button><output id="bow-count" aria-live="polite"></output><button id="walk-camera" aria-pressed="false">1인칭 보기</button><div>${[['KeyA','←','왼쪽'],['KeyW','↑','앞'],['KeyS','↓','뒤'],['KeyD','→','오른쪽']].map(([key,text,label])=>`<button data-key="${key}" aria-label="${label}으로 걷기">${text}</button>`).join('')}</div></section>
<section id="reception-panel" hidden aria-label="등·소원 접수처"></section>
<dialog id="application"><form><div class="panel-title"><h2 id="request-title"></h2><button type="button" id="cancel-request" aria-label="신청 닫기">×</button></div>
<p id="slot-location"></p><label>기간<select id="request-term"><option value="week">일주일</option><option value="month">한 달</option></select></label>
<label id="request-label"><span></span><input id="request-text" maxlength="12"></label>
<p class="note">미리보기 신청은 이 브라우저에 저장됩니다. 결제 금액은 없습니다.</p>
<button class="primary" type="submit">이 자리에 신청</button><p id="request-error" role="status"></p></form></dialog>
<div id="application-status" role="status"></div><div class="hint">드래그하여 둘러보기 · 휠 / 두 손가락으로 확대</div>
<dialog id="diagnostic-dialog"><div class="panel-title"><h2>M1 장면 검증</h2><button id="close-diagnostics" aria-label="검증 기록 닫기">×</button></div><p>측정은 현재 기기의 결과이며, 모바일 실기기 또는 시각 품질 승인으로 자동 간주하지 않습니다.</p><label>기기 모델 (직접 입력)<input id="device" placeholder="미입력 · 실기기 미확인"></label><label>연등 후보 수<select id="density"><option>100</option><option>300</option><option>500</option><option value="1000" selected>전체 배치 · 작은 틈</option></select></label><label>내 연등 선택<select id="owned">${OWNED_INDICES.map((x,i)=>`<option value="${x}">내 연등 ${i+1} · 슬롯 ${x}</option>`).join('')}</select></label><p class="note">샘플 소유 표시입니다. 계정·결제·실제 소유권은 연결하지 않았습니다. 갈색 발판 길 위의 후보만 표시합니다.</p><output id="live" aria-live="off">준비 중</output><div class="actions"><button id="measure">측정 시작</button><button id="stop">측정 종료</button><button id="export">기록 저장</button></div><p class="note">시작 후 2초 예열. 정식 판정은 승인된 기기·밀도·동선·예열·측정 시간으로 별도 실행합니다. 측정 중 설정 변경·탭 숨김·화면 크기 변경 시 기록을 무효화합니다.</p><pre id="report" aria-live="polite">아직 측정하지 않았습니다.</pre></dialog>`;
const $=<T extends HTMLElement=HTMLElement>(q:string)=>document.querySelector<T>(q)!;
translateMarkup(root);translateViews($<HTMLSelectElement>('#place'));
const settingsLanguage=document.createElement('button');settingsLanguage.textContent=languages.find(x=>x[0]===locale)![1]+' '+t('언어 선택');
settingsLanguage.onclick=()=>location.reload();$('#settings-panel').append(settingsLanguage);
document.title='사사 · '+t('사찰 둘러보기');
const canvas=$<HTMLCanvasElement>('#world');
const measure=new Measurement();let app:ReturnType<typeof createTemple>;
const audio=templeAudio((enabled,message)=>{
 $<HTMLInputElement>('#audio-on').checked=enabled;
 $('#audio-status').textContent=t(message);
});
$('#audio-on').onchange=()=>{if($<HTMLInputElement>('#audio-on').checked)void audio.enable();else audio.mute();};
$('#audio-volume').oninput=()=>audio.setVolume(Number($<HTMLInputElement>('#audio-volume').value)/100);
const initStart=performance.now();
let loadFailed=false,pendingView:string|null=null;
const loading=$('#loading'),retry=$<HTMLButtonElement>('#load-retry');
let timer=window.setTimeout(()=>loadError('준비 시간이 길어지고 있습니다. 다시 시도해 주세요.'),30000);
function loadError(message:string){
 window.clearTimeout(timer);loadFailed=true;loading.hidden=false;loading.querySelector('span')!.textContent=t(message);
 delete document.body.dataset.ready;retry.hidden=false;retry.focus();
}
retry.onclick=()=>location.reload();
Texture.OnTextureLoadErrorObservable.add(()=>loadError('사찰 재질을 불러오지 못했습니다. 연결을 확인해 주세요.'));
function enterView(name:string){
 if(loadFailed)return;
 if(app.scene.isReady()){app.view(name);return;}
 pendingView=name;loading.hidden=false;loading.querySelector('span')!.textContent=t('사찰을 준비하고 있어요…');loading.focus();
 clearTimeout(timer);timer=window.setTimeout(()=>loadError('공간을 준비하지 못했습니다.'),30000);
}

try {app=createTemple(canvas);}catch(error){loadError('3D를 시작하지 못했습니다. WebGL 설정을 확인해 주세요.');console.error(error);throw error;}
let firstFrameMs:number|null=null;let last=performance.now();let tick=0;let latest:Record<string,unknown>|null=null;let recordedSettings:unknown=null;let startCamera:unknown=null;
renderWhileViewing(app.engine,()=>{const now=performance.now();const dt=now-last;last=now;app.scene.render();if(!loadFailed&&(firstFrameMs===null||pendingView!==null)&&app.scene.isReady()){
 firstFrameMs??=performance.now();clearTimeout(timer);loading.hidden=true;document.body.dataset.ready='true';
 if(pendingView!==null){const name=pendingView;pendingView=null;app.view(name);}
}if(audio.enabled){const p=app.settings.visitor;audio.update(p?.[0]??app.camera.target.x,p?.[2]??app.camera.target.z);}
 measure.frame(dt);if(++tick%30===0){$('#live').textContent=`${app.engine.getFps().toFixed(0)} FPS · 연등 ${app.settings.visibleLanternCount}/${app.settings.canopyCapacity}자리 · ${app.scene.getActiveMeshes().length} 활성 메시 · ${app.engine.getRenderWidth()}×${app.engine.getRenderHeight()}`;if(measure.active)$('#report').textContent=JSON.stringify(measure.report(),null,2);}}, () => {
 if(measure.active) invalidate('측정 중 미리보기 일시 정지');
}, () => { last=performance.now(); }, () => firstFrameMs !== null);
function invalidate(reason:string){measure.invalidate(reason);if(measure.invalidReason)$('#report').textContent=JSON.stringify(measure.report(),null,2);}
window.addEventListener('resize',()=>{invalidate('측정 중 화면 크기 변경');app.engine.resize();});

canvas.addEventListener('webglcontextlost',()=>{invalidate('WebGL context lost');loadError('그래픽 연결이 중단되었습니다. 다시 불러와 주세요.');});
const settingsPanel=$<HTMLDialogElement>('#settings-panel');
$('#settings').onclick=()=>settingsPanel.showModal();
$('#close-settings').onclick=()=>settingsPanel.close();
settingsPanel.onclose=()=>$('#settings').focus();
$('#explore').onclick=()=>{if($<HTMLInputElement>('#entry-audio').checked)void audio.enable();else audio.mute();enterView('walk');$<HTMLSelectElement>('#place').value='walk';document.body.classList.add('exploring');canvas.focus();};
$('.brand').onclick=e=>{e.preventDefault();audio.mute();enterView('gatePassage');$<HTMLSelectElement>('#place').value='gatePassage';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));document.body.classList.remove('exploring');};
$('#apply-name').onclick=()=>{invalidate('이름표 변경');const field=$<HTMLInputElement>('#lantern-name');field.value=app.setName(field.value);$('#name-status').textContent=field.value?t('이름표에 반영했습니다. 새로고침하면 초기화됩니다.'):t('이름표를 제거했습니다.');settingsPanel.close();};
$('#time').onchange=()=>{invalidate('시간대 변경');app.time($<HTMLSelectElement>('#time').value as TimeOfDay);};
const qualityField=$<HTMLSelectElement>('#quality'),motionField=$<HTMLInputElement>('#reduced');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function displayPreference(key:string){
 try{return localStorage.getItem('sasa:display:'+key);}catch{return null;}
}
function saveDisplayPreference(key:string,value:string){
 try{localStorage.setItem('sasa:display:'+key,value);}catch{/* In-memory controls still work. */}
}
const savedQuality=displayPreference('quality');
if(savedQuality==='low'){qualityField.value='low';app.setQuality('low');}
let motionOverride=displayPreference('reduced');
function syncMotion(){
 motionField.checked=motionOverride===null?motionPreference.matches:motionOverride==='true';
 app.setReduced(motionField.checked);
}
syncMotion();motionPreference.addEventListener('change',syncMotion);
qualityField.onchange=()=>{invalidate('품질 변경');app.setQuality(qualityField.value as Quality);saveDisplayPreference('quality',qualityField.value);};
motionField.onchange=()=>{invalidate('효과 변경');motionOverride=String(motionField.checked);saveDisplayPreference('reduced',motionOverride);syncMotion();};
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-view]'))button.onclick=()=>{enterView(button.dataset.view!);document.body.classList.add('exploring');for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b===button));};
const dialog=$<HTMLDialogElement>('#diagnostic-dialog');$('#diagnostics').onclick=()=>dialog.showModal();$('#close-diagnostics').onclick=()=>dialog.close();dialog.onclose=()=>$('#diagnostics').focus();
$('#density').onchange=()=>{invalidate('연등 밀도 변경');app.rebuildLanterns(Number($<HTMLSelectElement>('#density').value));};
$('#owned').onchange=()=>{invalidate('선택 상품 변경');app.setSelected(Number($<HTMLSelectElement>('#owned').value));};
$('#measure').onclick=()=>{measure.start();latest=null;recordedSettings={...app.settings};startCamera={alpha:app.camera.alpha,beta:app.camera.beta,radius:app.camera.radius,target:app.camera.target.asArray()};$('#report').textContent='2초 예열 후 현재 설정으로 측정합니다.';};
function report(){const p=performance as Performance & {memory?:{usedJSHeapSize:number}};return {schemaVersion:1,sceneVersion:SCENE_VERSION,createdAt:new Date().toISOString(),device:$<HTMLInputElement>('#device').value||'미확인',userAgent:navigator.userAgent,physicalDeviceVerified:false,acceptance:'unreviewed',settings:recordedSettings??app.settings,currentSettings:app.settings,startCamera,camera:{alpha:app.camera.alpha,beta:app.camera.beta,radius:app.camera.radius,target:app.camera.target.asArray()},renderer:app.engine.getGlInfo(),timing:{navigationToFirstRenderedFrameMs:firstFrameMs,sceneConstructionToFirstFrameMs:firstFrameMs===null?null:firstFrameMs-initStart},jsHeapBytes:p.memory?.usedJSHeapSize??null,memoryCaveat:'JS heap only if exposed; not GPU or total process memory',measurement:measure.report()};}
$('#stop').onclick=()=>{measure.stop();latest=report();$('#report').textContent=JSON.stringify(latest,null,2);};
$('#export').onclick=()=>{if(measure.active)measure.stop();latest=report();$('#report').textContent=JSON.stringify(latest,null,2);const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`sasa-${SCENE_VERSION}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

$('#place').onchange=()=>{invalidate('검토 공간 변경');enterView($<HTMLSelectElement>('#place').value);document.body.classList.add('exploring');for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');};

const receptionPanel=$('#reception-panel'),requestDialog=$<HTMLDialogElement>('#application');
const placePicker=$<HTMLSelectElement>('#place');
const productKinds=Object.keys(offerings) as Offering[];
let currentPanel='',pendingId='';
function goToPlace(view:string){
 placePicker.value=view;
 placePicker.dispatchEvent(new Event('change'));
}
$('#visit-point').onclick=()=>{const destination=$('#visit-point').dataset.view;if(destination)goToPlace(destination);};
function panelButton(label:string,act:()=>void){
 const button=document.createElement('button');button.textContent=label;button.onclick=act;
 receptionPanel.append(button);
}
let detailSlot='';
function receptionView(view:string){
 detailSlot='';
 const placeName=[...placePicker.options].find(option=>option.value===view)?.textContent;
 const navName=document.querySelector<HTMLElement>('[data-view="'+view+'"]')?.textContent;
 $('.stage').textContent=placeName??navName??'사찰 둘러보기';
 currentPanel=view;receptionPanel.replaceChildren();
 const kind=productKinds.find(k=>offerings[k].view===view);
 receptionPanel.hidden=view!=='officeReception'&&!kind;
 if(receptionPanel.hidden)return;
 const title=document.createElement('h2');
 title.textContent=kind?offerings[kind].place+' · 빈자리':t('등·소원 접수처');
 receptionPanel.append(title);
 if(kind){
  if(import.meta.env.MODE==='service'){
   title.textContent=t(offerings[kind].label)+' · '+t('시험 기간권');
   const section=document.createElement('section');receptionPanel.append(section);
   void displayOffers(section,kind);return;
  }
  const preview=$<HTMLSelectElement>('#display-occupancy')?.value;
  if((kind==='votive'||kind==='memorial'||kind==='plaque')&&preview&&preview!=='current'){
   title.textContent=offerings[kind].place+' · '+(preview==='full'?'만석':'빈 상태');
   return;
  }
  const slots=[...app.applicationSlots].filter(([,s])=>s.kind===kind);
  const available=slots.filter(([id])=>app.reviewSlots.has(id)?!app.reviewSlots.get(id)!.installationId:!readApplication(id));
  const hint=document.createElement('p');hint.textContent=available.length?'현장에서 원하는 아이템을 누르거나 자리 번호를 선택하세요.':'이 공간의 신청 자리가 모두 찼습니다.';receptionPanel.append(hint);
  for(const [id] of available)panelButton((slots.findIndex(([key])=>key===id)+1)+'번 자리',()=>openRequest(id));
 }else{
  if(import.meta.env.MODE==='service')panelButton(t('내 봉헌 내역'),()=>$('#service-account').click());
  for(const k of productKinds)panelButton(t(offerings[k].label)+' · '+t(offerings[k].place),()=>goToPlace(offerings[k].view));
 }
}
function renderOfferingDetail(){
 if(!detailSlot)return;
 const slot=app.reviewSlots.get(detailSlot);
 receptionPanel.hidden=false;receptionPanel.replaceChildren();
 const heading=document.createElement('h2'),message=document.createElement('p');
 if(slot){
  const kind=slot.accepts==='wish-plaque'?'plaque':slot.accepts;
  heading.textContent=t(offerings[kind].label)+' · '+t(offerings[kind].place);
  message.textContent=[t(slot.installationId?'설치됨':slot.reserved?'예약 중':'빈자리'),slot.name,slot.text].filter(Boolean).join(' · ');
 }else message.textContent=t('연결 상태를 확인해 주세요.');
 receptionPanel.append(heading,message);
 if(slot&&!slot.installationId&&!slot.reserved)panelButton(t('기간권 보기'),()=>openRequest(slot.id));
 panelButton(t('닫기'),()=>receptionView(currentPanel));
}
function openRequest(id:string){
 if(import.meta.env.MODE==='service'){
  const slot=app.reviewSlots.get(id);
  if(slot?.installationId||slot?.reserved){detailSlot=id;renderOfferingDetail();return;}
  const kind=slot?.accepts;
  if(kind){const item=kind==='wish-plaque'?'plaque':kind;goToPlace(offerings[item].view);const section=document.createElement('section');receptionPanel.replaceChildren(section);void displayOffers(section,item,id);}
  return;
 }
 const fixture=$<HTMLSelectElement>('#display-occupancy');
 if(fixture&&fixture.value!=='current'&&['plaque','votive','memorial'].includes(app.applicationSlots.get(id)?.kind??'')){ $('#application-status').textContent='신청은 현재 배치에서 가능합니다.';return;}
 if(app.reviewSlots.has(id)){ $('#application-status').textContent='서버 검수용 자리입니다.';return;}
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


if(import.meta.env.MODE==='review'){
 const panel=document.createElement('section');panel.id='review-server';panel.setAttribute('aria-label','로컬 서버 검수');
 const status=document.createElement('span');status.setAttribute('role','status');
 const refresh=document.createElement('button');refresh.textContent='슬롯 다시 조회';
 panel.append(status,refresh);
 const reviewDetails=document.createElement('details');reviewDetails.id='review-tools';reviewDetails.open=matchMedia('(min-width: 701px)').matches;
 const summary=document.createElement('summary');summary.textContent='서버 검수';reviewDetails.append(summary,panel);root.append(reviewDetails);
 async function loadSlots(){
  refresh.disabled=true;status.textContent='슬롯 조회 중';
  try{
   const zones=await Promise.all(offeringZones.map(async zone=>{
    const response=await fetch('/api/review/temples/sample:sasa/zones/'+zone+'/slots',{signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw Error('검수 서버 연결 실패');
    return parseReviewSlots(await response.json(),zone);
   }));
   const slots=zones.flat(), installed=slots.flatMap(s=>s.installationId?[s.installationId]:[]);
   if(new Set(installed).size!==installed.length)throw Error('중복 설치 번호');
   app.applyReviewSlots(slots);receptionView(currentPanel);
   status.textContent='검수 슬롯 '+slots.length+'개 · 설치 '+slots.filter(s=>s.installationId).length+'개';
  }catch(error){status.textContent=error instanceof Error?error.message:'슬롯 조회 실패';}
  finally{refresh.disabled=false;}
 }
 refresh.onclick=loadSlots;void loadSlots();
 const densityLabel=document.createElement('label');densityLabel.textContent='인등·추모등·소원패 ';
 const densitySelect=document.createElement('select');densitySelect.id='display-occupancy';
 for(const [value,title] of [['current','현재 배치'],['empty','모두 빈 상태'],['full','만석']])densitySelect.add(new Option(title,value));
 densitySelect.onchange=()=>{app.showOccupancy(densitySelect.value as 'current'|'empty'|'full');receptionView(currentPanel);};
 densityLabel.append(densitySelect);panel.append(densityLabel);
 const visitors=document.createElement('span');panel.append(visitors);
 reviewPresence(app.scene,()=>app.visitorPose,visitors);
}

if(import.meta.env.MODE==='service'){
 setupAccount();
 const channel=document.createElement('select'),channelLabel=document.createElement('label'),visitors=document.createElement('p');
 channelLabel.textContent=t('방문 채널')+' ';for(const n of [1,2,3])channel.add(new Option(locale==='ko'?n+'채널':String(n),String(n)));
 channelLabel.append(channel);settingsPanel.append(channelLabel,visitors);
 reviewPresence(app.scene,()=>app.visitorPose,visitors,channel);
 window.addEventListener('sasa:select',e=>app.selectOffering((e as CustomEvent<string|null>).detail));
 let lastSnapshot='';
 const syncServiceSlots=watchPublic(async signal=>Promise.all(offeringZones.map(async zone=>{
  const res=await fetch('/api/service/temples/sample:sasa/zones/'+zone+'/slots',{signal,cache:'no-store'});
  if(!res.ok)throw Error();return parseReviewSlots(await res.json(),zone,true);
 })),zones=>{
  const slots=zones.flat(),snapshot=JSON.stringify(slots.map(s=>[s.installationId,s.owned,s.reserved,s.name,s.text]));
  if(snapshot!==lastSnapshot){app.applyReviewSlots(slots);lastSnapshot=snapshot;renderOfferingDetail();}
 },()=>{
  if(lastSnapshot){app.applyReviewSlots([]);lastSnapshot='';renderOfferingDetail();}
 });
 window.addEventListener('sasa:installations',syncServiceSlots);
 window.addEventListener('sasa:account',()=>{app.applyReviewSlots([]);lastSnapshot='';renderOfferingDetail();void syncServiceSlots();});

 const help=document.createElement('dialog');help.setAttribute('aria-label','첫 방문 안내');
 help.innerHTML='<h2>사찰 둘러보기</h2><p>방향키나 화면의 화살표로 걸으세요. 화면을 드래그하면 처마와 연등을 올려다볼 수 있습니다.</p><p>법당 불단 앞에서 참배할 수 있습니다. 내 아이템은 가까이 걸어가 빛을 확인하세요.</p><button>안내 닫기</button>';translateMarkup(help);document.body.append(help);
 const again=document.createElement('button');again.textContent=t('조작 안내 다시 보기');settingsPanel.append(again);
 function openGuide(){
  help.querySelector('p')!.textContent=t(matchMedia('(pointer: coarse)').matches?'화면의 화살표로 걷고 손가락으로 화면을 밀어 둘러보세요.':'방향키로 걷고 마우스로 드래그해 둘러보세요.');
  help.showModal();
 }
 again.onclick=()=>{settingsPanel.close();openGuide();};help.querySelector('button')!.onclick=()=>help.close();
 help.onclose=()=>{try{localStorage.setItem('sasa:guide-seen','1');}catch{}canvas.focus();};
 $('#explore').addEventListener('click',()=>{let seen=false;try{seen=localStorage.getItem('sasa:guide-seen')==='1';}catch{}if(!seen)openGuide();});
}
