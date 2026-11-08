import {locale,t,translateMarkup} from './locales';
import type {Offering} from './reception.ts';
import {lanternMap} from './lantern-map';
interface Offer {id:string;kind:string;days:number;priceKrw:number}
const zones:Record<Offering,string>={lantern:'Z02',votive:'Z07',memorial:'Z06',plaque:'Z08',candle:'Z03'};
async function service(path:string,body?:object){
 const response=await fetch('/api/service/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
 if(!response.ok)throw Error(t(response.status===401?'계정 메뉴에서 먼저 로그인하세요.':'요청을 완료하지 못했습니다. 자리와 예약 상태를 다시 확인하세요.'));
 return response.json();
}
export async function displayOffers(section:HTMLElement,kind:Offering,initialSlot?:string){
 const note=document.createElement('p'),controls=document.createElement('div');section.append(note,controls);
 function button(label:string,action:()=>Promise<void>){
  const btn=document.createElement('button');btn.textContent=t(label);controls.append(btn);
  btn.onclick=async()=>{btn.disabled=true;try{await action();}catch(error){note.textContent=(error as Error).message;}finally{btn.disabled=false;}};
  return btn;
 }
 const duration=(days:number)=>new Intl.NumberFormat(locale,{style:'unit',unit:'day',unitDisplay:'long'}).format(days);
 const amount=(value:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'KRW',maximumFractionDigits:0}).format(value);
 const pass=(days:number,price:number)=>locale==='ko'?days+'일 · '+price.toLocaleString('ko-KR')+'원':duration(days)+' · '+amount(price);
 async function held(){
  const result=await service('trade/hold');controls.replaceChildren();
  if(result.waiting){note.textContent=t('동시 신청을 확인하고 있습니다.');button('결과 확인',held);return;}
  if(!result.hold){note.textContent=t('현재 예약한 자리가 없습니다.');button(t('기간권 보기'),restart);return;}
  const h=result.hold;note.textContent=h.slotId+' · '+(h.paymentLock?t('결제 확인 중'):t('예약 만료')+' '+new Date(h.expiresAt).toLocaleTimeString(locale));
  if(!h.paymentLock)button('예약 취소',async()=>{await service('trade/cancel',{});await restart();});
  button('주문 확인',async()=>{
   const order=await service('trade/checkout',{holdId:h.id});controls.replaceChildren();
   note.textContent=t('설치 자리')+' '+h.slotId+' · '+t('시험 결제하기')+' '+amount(order.amount_krw);
   button('시험 결제 취소',async()=>{await service('trade/test-cancel',{orderId:order.id});controls.replaceChildren();note.textContent=t('시험 결제를 취소하고 자리를 해제했습니다.');button('기간권 보기',restart);});
   button('시험 결제하기',async()=>{const r=await service('trade/test-pay',{orderId:order.id});controls.replaceChildren();if(r.status==='installed'){note.textContent=t('시험 결제 및 설치 완료');window.dispatchEvent(new Event('sasa:installations'));button('기간권 보기',restart);}else{note.textContent=t('결제 완료 · 같은 자리 설치 확인 중');button('설치 다시 확인',async()=>{const next=await service('trade/reconcile',{orderId:order.id});if(next.status==='installed'){window.dispatchEvent(new Event('sasa:installations'));await restart();}});}});
  });
 }
 async function select(offer:Offer){
  const {offer:quote}=await service('quote',{offerId:offer.id});
  const data=await service('temples/sample:sasa/zones/'+zones[kind]+'/slots');
  controls.replaceChildren();note.textContent=t('시험 기간권')+' · '+pass(quote.days,quote.priceKrw);
  const free=data.slots.filter((s:{status:string})=>s.status==='free');
  if(!free.length){note.textContent=t('모든 자리가 찼습니다.');return;}
  if(initialSlot&&!free.some((s:{slotId:string})=>s.slotId===initialSlot)){
   note.textContent=t('요청을 완료하지 못했습니다. 자리와 예약 상태를 다시 확인하세요.');return;
  }
  const form=document.createElement('form');
  form.innerHTML='<label>설치 자리<select name="slot"></select></label><label>소원·추모 문구<textarea name="message" maxlength="100"></textarea></label><label><input name="public" type="checkbox"> 문구 공개에 동의</label>';
  if(kind==='lantern')form.insertAdjacentHTML('beforeend','<label><input name="tag" type="checkbox"> 이름표 신청</label><label>표시 이름<input name="name" maxlength="12"></label>');
  translateMarkup(form);
  const choice=form.querySelector('select')!;for(const s of data.slots){const option=new Option(s.slotId.split(':').at(-1)+' · '+t(({free:'빈자리',reserved:'예약 중',occupied:'설치됨'}[s.status as string]??'확인 중')),s.slotId);option.disabled=s.status!=='free';choice.add(option);}
  choice.value=initialSlot??free[0].slotId;
  controls.append(form);form.onsubmit=e=>e.preventDefault();
  const confirm=button('신청 내용 확인',async()=>{
   const d=new FormData(form),tag=d.has('tag'),name=tag?String(d.get('name')??'').trim():'',text=String(d.get('message')??'').trim(),publish=d.has('public');
   if(tag&&(!name||!publish)){note.textContent=t('이름표에는 표시 이름과 공개 동의가 필요합니다.');return;}
   const payload={revision:quote.revision,offerId:offer.id,slotId:choice.value,name,tag,text,public:publish};
   controls.replaceChildren();note.textContent=[choice.value,pass(quote.days,quote.priceKrw),t(publish?'공개':'비공개'),name,text].filter(Boolean).join(' · ');
   button('취소',restart);button('이 자리에 예약',async()=>{
    await service('trade/enter',payload);controls.replaceChildren();note.textContent=t('동시 신청을 확인하고 있습니다.');
    await new Promise(resolve=>setTimeout(resolve,1100));if(section.isConnected)await held();
   });
  });
  if(kind==='lantern'){
   choice.parentElement!.hidden=true;
   const fields=[...form.querySelectorAll('label')].slice(1);
   const map=lanternMap(data.slots,initialSlot,id=>{
    choice.value=id;confirm.disabled=!id;
    for(const field of fields)field.hidden=!id;
   });
   form.prepend(map);
  }
  button(t('취소'),restart);
 }
 async function restart(){
  const data=await service('offers');controls.replaceChildren();note.textContent=t('시험 가격 · 선택한 자리에 기간 동안 설치 · 실제 결제 없음');
  for(const offer of (data.offers as Offer[]).filter(o=>o.kind===(kind==='plaque'?'wish-plaque':kind)))button(pass(offer.days,offer.priceKrw),()=>select(offer));
  button('내 예약 확인',held);
 }
 try{await restart();}catch(error){note.textContent=(error as Error).message;}
}
