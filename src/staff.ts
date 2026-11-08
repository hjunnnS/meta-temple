export {};
const nav=document.querySelector('nav')!,section=document.querySelector('section')!,status=document.querySelector('[role=status]')!;
async function api(area:string,input?:object){
 const res=await fetch('/api/service/staff/'+area,{method:input?'POST':'GET',headers:{'content-type':'application/json'},body:input?JSON.stringify(input):undefined,cache:'no-store'});
 if(!res.ok)throw Error();return res.json();
}
const areas=[['desk','orders','접수·환불'],['catalog','offers','상품 운영'],['moderation','content','공개 문구 감수']];
let generation=0;
async function openArea(area:string){
 const current=++generation;section.replaceChildren();
 try{
  const {rows}=await api(area);if(current!==generation)return;
  for(const row of rows){
   const form=document.createElement('form'),title=document.createElement('p');form.append(title);section.append(form);
   title.textContent=[row.id,row.status,row.slot_id,row.kind].filter(Boolean).join(' · ');
   const price=document.createElement('input'),enabled=document.createElement('select');
   if(area==='offers'){
    price.type='number';price.min='1';price.required=true;price.value=String(row.price_krw);price.setAttribute('aria-label','시험 가격');
    enabled.add(new Option('판매 중','true'));enabled.add(new Option('판매 중지','false'));enabled.value=String(row.enabled);form.append(price,enabled);
   }
   if(area==='orders'&&!['recovering','refund_pending','refund_failed'].includes(row.status))continue;
   const reason=document.createElement('input'),button=document.createElement('button');reason.required=true;reason.maxLength=200;reason.placeholder='조치 사유';reason.setAttribute('aria-label','조치 사유');
   button.textContent=area==='offers'?'판매 설정 저장':area==='orders'?'복구·환불 재시도':'공개 중단';form.append(reason,button);
   form.onsubmit=async event=>{event.preventDefault();button.disabled=true;
    try{await api(area,{id:row.id,reason:reason.value,price:Number(price.value),enabled:enabled.value==='true',revision:row.revision});status.textContent='조치를 기록했습니다.';await openArea(area);}
    catch{status.textContent='조치를 완료하지 못했습니다. 목록을 다시 확인하세요.';button.disabled=false;}
   };
  }
  if(!rows.length)status.textContent='해당 항목이 없습니다.';
 }catch{section.replaceChildren();status.textContent='조회 권한과 로그인 상태를 확인하세요.';}
}
async function init(){
 try{
  const {roles}=await api('roles');
  for(const [role,area,label] of areas)if(roles.includes(role)){
   const button=document.createElement('button');button.textContent=label;button.onclick=()=>void openArea(area);nav.append(button);
  }
  if(!nav.childElementCount)throw Error();(nav.firstElementChild as HTMLButtonElement).click();
 }catch{status.textContent='권한이 있는 시험 계정으로 로그인하세요.';}
}
void init();
