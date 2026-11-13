import {inscriptionError,inscriptionLimits} from './inscription.ts';
import {locale,t,translateMarkup} from './locales';
import type {Offering} from './reception.ts';
import {lanternMap,type MapSlot} from './lantern-map';
const spot=(id:string)=>id.split(':').at(-1)??id;
interface Offer {id:string;kind:string;days:number;priceKrw:number}
const zones:Record<Offering,string>={lantern:'Z02',votive:'Z07',memorial:'Z06',plaque:'Z08',candle:'Z03'};
async function service(path:string,body?:object){
 const response=await fetch('/api/service/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
 if(!response.ok){
  const result=await response.json().catch(()=>({}));
  throw Object.assign(new Error(t(response.status===401?'계정 메뉴에서 먼저 로그인하세요.':'요청을 완료하지 못했습니다. 자리와 예약 상태를 다시 확인하세요.')),{code:result.error});
 }
 return response.json();
}
export async function displayOffers(section:HTMLElement,kind:Offering,initialSlot?:string){
 const note=document.createElement('p'),controls=document.createElement('div');note.setAttribute('role','status');controls.className='offer-controls';section.append(note,controls);section.dataset.kind=kind;
 const stage=(value:string)=>{section.dataset.stage=value;window.dispatchEvent(new Event('sasa:offer-stage'));};
 let catalogue:Offer[]=[];const checkoutOrders=new Set<string>();
 function terms(selected:Offer,preferred?:string,draft?:FormData){const choices=document.createElement('div');choices.className='offer-terms';const label=document.createElement('h3');label.textContent=t('기간');choices.append(label);for(const item of catalogue){const btn=document.createElement('button');btn.type='button';btn.textContent=pass(item.days,item.priceKrw);btn.setAttribute('aria-pressed',String(item.id===selected.id));btn.onclick=async()=>{btn.disabled=true;try{await select(item,section.querySelector<HTMLSelectElement>('select[name=slot]')?.value||preferred,section.querySelector('form')?new FormData(section.querySelector('form')!):draft);}catch(e){note.textContent=(e as Error).message;}finally{btn.disabled=false;}};choices.append(btn);}return choices;}

 function button(label:string,action:()=>Promise<void>){
  const btn=document.createElement('button');btn.textContent=t(label);if(['신청 내용 확인','이 자리에 예약','주문 확인','시험 결제하기'].includes(label))btn.className='offer-main-action';controls.append(btn);
  btn.onclick=async()=>{if(label!=='신청 내용 확인'&&!navigator.onLine){note.textContent=t('연결 상태를 확인해 주세요.');stage('offline');return;}btn.disabled=true;try{await action();}catch(error){stage('error');note.textContent=(error as Error).message;}finally{btn.disabled=false;}};
  return btn;
 }
 const duration=(days:number)=>new Intl.NumberFormat(locale,{style:'unit',unit:'day',unitDisplay:'long'}).format(days);
 const amount=(value:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'KRW',maximumFractionDigits:0}).format(value);
 const pass=(days:number,price:number)=>locale==='ko'?days+'일 · '+price.toLocaleString('ko-KR')+'원':duration(days)+' · '+amount(price);
 async function held(retry?:()=>Promise<void>){
  const result=await service('trade/hold');stage('reserved');controls.replaceChildren();
  if(result.waiting){stage('waiting');note.textContent=t('동시 신청을 확인하고 있습니다.');button('결과 확인',()=>held(retry));return;}
  if(!result.hold){stage('expired');if(retry){await retry();return;}note.textContent=t('현재 예약한 자리가 없습니다.');button(t('기간권 보기'),restart);return;}
  const h=result.hold;
  const checkout=button('주문 확인',async()=>{
   let order;
   try{order=await service('trade/checkout',{holdId:h.id});}
   catch(error){if((error as {code?:string}).code==='expired_hold'){await held();return;}throw error;}
   checkoutOrders.add(order.id);controls.replaceChildren();
   if(order.status!=='pending'){followOrder(order.id,h.slotId,order.status);return;}
   payment(order.id,h.slotId,order.amount_krw);
  });
  if(h.paymentLock){stage('pending');note.textContent=spot(h.slotId)+' · '+t('결제 확인 중');return;}
  const cancel=button('예약 취소',async()=>{await service('trade/cancel',{});await restart();});
  const deadline=Date.now()+Date.parse(h.expiresAt)-(result.serverTime??Date.now());
  let checkingExpiry=false;
  async function tick(){
   if(!checkout.isConnected)return;
   const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
   if(seconds>0){
    const time=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    note.textContent=spot(h.slotId)+' · '+t('{time} 남음').replace('{time}',time);
   }else if(checkingExpiry||(!checkout.disabled&&!cancel.disabled)){
    checkingExpiry=true;
    checkout.disabled=true;cancel.disabled=true;
    note.textContent=t('확인 중입니다.');
    try{await held();window.dispatchEvent(new Event('sasa:installations'));return;}
    catch{note.textContent=t('연결 상태를 확인해 주세요.');}
   }
   window.setTimeout(tick,1000);
  }
  void tick();
 }
 function payment(id:string,slot:string,price:number){
  controls.replaceChildren();stage('payment');
  note.textContent=spot(slot)+' · '+t('결제 확인 중')+' · '+amount(price);
  button('시험 결제 취소',async()=>{await service('trade/test-cancel',{orderId:id});controls.replaceChildren();note.textContent=t('시험 결제를 취소하고 자리를 해제했습니다.');button('기간권 보기',restart);});
  button('시험 결제하기',async()=>{
   controls.replaceChildren();
   let status='unknown';
   try{status=(await service('trade/test-pay',{orderId:id})).status;}catch{/* Check the original order if the response was lost. */}
   followOrder(id,slot,status,price);
  });
 }
 function followOrder(id:string,slot:string,initial:string,price?:number){
  const statusLine=document.createElement('span');controls.replaceChildren();note.replaceChildren(statusLine);
  const labels:Record<string,string>={installed:'시험 결제 및 설치 완료',refunded:'환불 완료',refund_pending:'환불 중',refund_failed:'환불 확인 중',cancelled:'결제 취소',expired:'기간 만료',unknown:'결제 확인 중'};
  async function show(status:string){
   if(!statusLine.isConnected)return;stage(status);
   statusLine.textContent=spot(slot)+' · '+t(labels[status]??'결제 완료 · 같은 자리 설치 확인 중');
   if(['installed','refunded','cancelled','expired'].includes(status)){
    if(status==='installed'&&checkoutOrders.delete(id))window.dispatchEvent(new CustomEvent('sasa:offering-installed',{detail:{orderId:id,slotId:slot,kind}}));
    window.dispatchEvent(new Event('sasa:installations'));if(status==='installed')button('사찰로 돌아가기',async()=>{window.dispatchEvent(new Event('sasa:offering-return'));});button('기간권 보기',restart);return;
   }
   if(status==='pending'&&price!==undefined){payment(id,slot,price);return;}
   window.setTimeout(async()=>{
    if(!statusLine.isConnected)return;
    try{await show((await service('trade/reconcile',{orderId:id})).status);}
    catch{await show('unknown');}
   },2000);
  }
  void show(initial);
 }
 function stopped(){
  stage('stopped');controls.replaceChildren();note.textContent=t('이 기간권은 판매가 중지되었습니다.');button('기간권 보기',restart);
 }
 async function select(offer:Offer,preferred=initialSlot,draft?:FormData,automatic=false,reselect=false,previous?:Offer){
  let quote:Offer & {revision:number};
  try{quote=(await service('quote',{offerId:offer.id})).offer;}
  catch(error){if((error as {code?:string}).code==='not_available'){stopped();return;}throw error;}
  const data=await service('temples/sample:sasa/zones/'+zones[kind]+'/slots');
  stage('rows');controls.replaceChildren();note.textContent=t('시험 기간권')+' · '+pass(quote.days,quote.priceKrw);
  controls.append(terms(quote,preferred,draft));
  const free=data.slots.filter((s:{status:string})=>s.status==='free');
  if(!free.length&&kind!=='lantern'){
   stage('full');note.textContent=t('모든 자리가 찼습니다.');
   button('취소',restart);return;
  }
  if(automatic&&free.length)preferred=free[Math.floor(Math.random()*free.length)].slotId;
  const available=free.some((s:{slotId:string})=>s.slotId===preferred);
  if(reselect||(preferred&&!available))note.textContent=t('다른 자리를 선택하세요');
  if(previous&&previous.priceKrw!==quote.priceKrw){
   note.textContent=t('변경된 가격을 확인해 주세요.')+' '+amount(previous.priceKrw)+' → '+pass(quote.days,quote.priceKrw)
    +(available?'':' · '+t('다른 자리를 선택하세요'));
  }
  const chosen=document.createElement('p');chosen.className='offer-selection';controls.append(chosen);
  const form=document.createElement('form');form.className='offer-form';
  form.innerHTML='<label>설치 자리<select name="slot"></select></label>';
  if(kind==='lantern')form.insertAdjacentHTML('beforeend','<label>표시 이름<input name="name"></label><label><input name="tag" type="checkbox"> 이름표 신청</label>');
  form.insertAdjacentHTML('beforeend','<label>소원·추모 문구<textarea name="message"></textarea></label><label><input name="public" type="checkbox"> 문구 공개에 동의</label>');
  translateMarkup(form);
  const choice=form.querySelector('select')!;for(const s of data.slots){const option=new Option(s.slotId.split(':').at(-1)+' · '+t(({free:'빈자리',reserved:'예약 중',occupied:'설치됨'}[s.status as string]??'확인 중')),s.slotId);option.disabled=s.status!=='free';choice.add(option);}
  choice.value=available?preferred!:preferred?'':(free[0]?.slotId??'');
  if(draft){
   for(const field of form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea')){
    if(field instanceof HTMLInputElement&&field.type==='checkbox')field.checked=draft.has(field.name);
    else field.value=String(draft.get(field.name)??'');
   }
  }
  controls.append(form);form.onsubmit=e=>e.preventDefault();
  if(kind!=='lantern')stage('form');
  if(choice.value)stage('form');
  function validate(){
   const tag=form.querySelector<HTMLInputElement>('[name=tag]')?.checked;
   for(const field of form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('[name=message],[name=name]')){
    const key=field.name==='name'?'name':'text';
    const error=key==='name'&&!tag?null:inscriptionError(field.value,key);
    field.setCustomValidity(error?t(error).replace('{limit}',String(inscriptionLimits[key])):'');
   }
  }
  form.addEventListener('input',validate);
  const confirm=button('신청 내용 확인',async()=>{
   validate();if(!form.reportValidity())return;
   const d=new FormData(form),tag=d.has('tag'),name=tag?String(d.get('name')??'').trim():'',text=String(d.get('message')??'').trim(),publish=d.has('public');
   if(tag&&(!name||!publish)){note.textContent=t('이름표에는 표시 이름과 공개 동의가 필요합니다.');return;}
   if(!choice.value){note.textContent=t('다른 자리를 선택하세요');return;}
   const payload={revision:quote.revision,offerId:offer.id,slotId:choice.value,name,tag,text,public:publish};
   stage('confirm');controls.replaceChildren();note.textContent=t('신청 내용 확인');
   const summary=document.createElement('dl');summary.className='offer-summary';
   for(const [label,value]of [[t('설치 자리'),spot(choice.value)],[t('기간'),duration(quote.days)],[t('금액'),amount(quote.priceKrw)],[t('표시 이름'),name||'—'],[t('문구 공개에 동의'),t(publish?'공개':'비공개')],[t('소원·추모 문구'),text||'—']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;summary.append(dt,dd);}controls.append(summary);
   const edit=button('신청 내용 수정',()=>select(offer,payload.slotId,d,false,false,quote));edit.className='offer-edit';
   button('취소',restart);const reserve=button('이 자리에 예약',async()=>{
    const retry=()=>select(offer,payload.slotId,d,false,true,quote);
    try{await service('trade/enter',payload);}catch(error){
     if((error as {code?:string}).code==='login_required'){
      window.dispatchEvent(new CustomEvent('sasa:reservation-login',{detail:()=>{if(reserve.isConnected)reserve.click();}}));
      return;
     }
     if((error as {code?:string}).code==='offer_stopped'){stopped();return;}
     if((error as {code?:string}).code==='offer_changed'){await select(offer,payload.slotId,d,false,false,quote);return;}
     if((error as {code?:string}).code==='unavailable'){await retry();return;}
     throw error;
    }
    stage('waiting');controls.replaceChildren();note.textContent=t('동시 신청을 확인하고 있습니다.');
    await new Promise(resolve=>setTimeout(resolve,1100));if(section.isConnected)await held(retry);
   });
  });
  const pickFree=button('빈자리 자동 선택',()=>select(offer,undefined,new FormData(form),true));
  if(kind==='lantern'){
   choice.parentElement!.hidden=true;
   const fields=[...form.querySelectorAll('label')].slice(1);
   const map=lanternMap(data.slots,preferred,id=>{
    choice.value=id;confirm.disabled=!id;form.dataset.selected=String(!!id);chosen.textContent=id?t('설치 자리')+' · '+spot(id):'';stage(id?'form':'rows');
    for(const field of fields)field.hidden=!id;
   });
   form.prepend(map.root);
   const syncStage=()=>{if(section.dataset.stage==='rows')stage(map.root.querySelector('[data-slot]')?'seats':'rows');};
   new MutationObserver(syncStage).observe(map.root,{childList:true});syncStage();
   const passNote=note.textContent;
   function showAvailability(hasFree:boolean){
    pickFree.disabled=!hasFree;
    if(!hasFree){stage('full');note.textContent=t('모든 자리가 찼습니다.');}
    else if(note.textContent===t('모든 자리가 찼습니다.')){note.textContent=passNote;stage(choice.value?'form':map.root.querySelector('[data-slot]')?'seats':'rows');}
   }
   showAvailability(free.length>0);
   let lastAvailability='';
   let disconnected=false;
   function unavailable(){
    disconnected=true;lastAvailability='';stage('offline');
    note.textContent=t('연등 배치도')+' · '+t('확인 중입니다.');
    confirm.disabled=true;pickFree.disabled=true;
    for(const button of map.root.querySelectorAll<HTMLButtonElement>('[data-row],[data-slot]')){
     button.disabled=true;button.querySelector('small')!.textContent=t('확인 중입니다.');
    }
    map.root.inert=true;
   }
   map.root.addEventListener('sasa:slots-unavailable',unavailable);
   if(!navigator.onLine)unavailable();
   map.root.addEventListener('sasa:slot-status',event=>{
    const statuses=(event as CustomEvent<Map<string,MapSlot['status']>>).detail;
    const availability=JSON.stringify(Array.from(statuses));
    if(availability===lastAvailability)return;
    lastAvailability=availability;
    if(disconnected){note.textContent=passNote;map.root.inert=false;disconnected=false;stage(choice.value?'form':map.root.querySelector('[data-slot]')?'seats':'rows');}
    const previous=choice.value;
    map.update(statuses);
    if(previous&&statuses.get(previous)!=='free')note.textContent=t('다른 자리를 선택하세요');
    for(const option of choice.options)option.disabled=statuses.get(option.value)!=='free';
    confirm.disabled=!choice.value||statuses.get(choice.value)!=='free';
    showAvailability([...statuses.values()].includes('free'));
   });
  }
  button(t('취소'),restart);
 }
 async function restart(){
  const data=await service('offers');stage('loading');controls.replaceChildren();note.textContent=t('시험 가격 · 선택한 자리에 기간 동안 설치 · 실제 결제 없음');
  catalogue=(data.offers as Offer[]).filter(o=>o.kind===(kind==='plaque'?'wish-plaque':kind));
  if(catalogue.length)await select(catalogue[0]);else{stage('stopped');note.textContent=t('이 기간권은 판매가 중지되었습니다.');}
  button('내 예약 확인',held);
 }
 try{await restart();}catch(error){stage('error');note.textContent=t('연결 상태를 확인해 주세요.');button('다시 시도해 주세요.',restart);}
}
