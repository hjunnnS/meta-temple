export {};
const nav=document.querySelector('nav')!,section=document.querySelector('section')!,status=document.querySelector('[role=status]')!;
async function api(area:string,input?:object){
 const res=await fetch('/api/service/staff/'+area,{method:input?'POST':'GET',headers:{'content-type':'application/json'},body:input?JSON.stringify(input):undefined,cache:'no-store'});
 if(!res.ok)throw Error();return res.json();
}
const areas=[['desk','alerts','장애 알림'],['desk','orders','접수·환불'],['catalog','offers','상품 운영'],['moderation','content','공개 문구 감수']];
let generation=0,activeArea='';
async function openArea(area:string,term=''){
 activeArea=area;const current=++generation;section.replaceChildren();
 try{
  if(area==='orders'){
   const search=document.createElement('form'),field=document.createElement('input'),submit=document.createElement('button');field.placeholder='주문 번호 · 상태 · 판매 중지';field.value=term;submit.textContent='주문 검색';search.append(field,submit);section.append(search);
   search.onsubmit=e=>{e.preventDefault();void openArea(area,field.value);};
  }
  const {rows}=await api(area+(term?'?q='+encodeURIComponent(term):''));if(current!==generation)return;
  for(const row of rows){
   const form=document.createElement('form'),title=document.createElement('p');form.append(title);section.append(form);
   title.textContent=[row.id,row.status,row.slot_id,row.kind,row.name,row.text,row.categories?.join(', '),row.enabled===false?'판매 중지':''].filter(Boolean).join(' · ');
   const price=document.createElement('input'),enabled=document.createElement('select');
   if(area==='offers'){
    price.type='number';price.min='1';price.required=true;price.value=String(row.price_krw);price.setAttribute('aria-label','시험 가격');
    enabled.add(new Option('판매 중','true'));enabled.add(new Option('판매 중지','false'));enabled.value=String(row.enabled);form.append(price,enabled);
   }
   if(area==='alerts'){const hint=document.createElement('p');hint.textContent=row.acknowledged_at?'담당자 확인 완료':'주문 검색에서 거래 상태를 확인하고 대응 사유를 기록하세요.';form.append(hint);if(row.acknowledged_at)continue;}
   if(area==='orders'&&!['recovering','refund_pending','refund_failed'].includes(row.status))continue;
   const action=document.createElement('select');
   if(area==='content'){for(const [value,label] of [['hide','공개 숨김'],['delete','문구·이름 삭제'],['dismiss','신고 종결']])action.add(new Option(label,value));form.append(action);}
   const reason=document.createElement('input'),button=document.createElement('button');reason.required=true;reason.maxLength=200;reason.placeholder='조치 사유';reason.setAttribute('aria-label','조치 사유');
   button.textContent=area==='alerts'?'담당자 확인':area==='offers'?'판매 설정 저장':area==='orders'?'복구·환불 재시도':'검토 결과 저장';form.append(reason,button);
   form.onsubmit=async event=>{event.preventDefault();button.disabled=true;
    try{await api(area,{kind:row.kind,id:row.id,action:action.value,reason:reason.value,price:Number(price.value),enabled:enabled.value==='true',revision:row.revision});status.textContent='조치를 기록했습니다.';await openArea(area,term);}
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
   if(area==='alerts'){
    let previous='';
    async function monitor(){
     if(document.hidden)return;
     try{const {rows}=await api('alerts');const next=JSON.stringify(rows);button.textContent=label+' ('+rows.length+')';
      if(next!==previous&&activeArea==='alerts'&&!section.contains(document.activeElement))await openArea(area);
      previous=next;
     }catch{button.textContent=label+' · 연결 확인';}
    }
    window.setInterval(monitor,2000);
   }
  }
  if(!nav.childElementCount)throw Error();(nav.firstElementChild as HTMLButtonElement).click();
 }catch{status.textContent='권한이 있는 시험 계정으로 로그인하세요.';}
}
void init();
