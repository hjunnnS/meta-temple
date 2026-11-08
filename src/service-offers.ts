import type {Offering} from './reception.ts';
interface Offer {id:string;kind:string;days:number;priceKrw:number}
export async function displayOffers(section:HTMLElement,kind:Offering){
 const note=document.createElement('p');section.append(note);
 try{
  const response=await fetch('/api/service/offers',{cache:'no-store'});if(!response.ok)throw Error();
  const {offers}=await response.json() as {offers:Offer[]};
  note.textContent='시험 가격 · 실제 결제 없음';
  for(const offer of offers.filter(o=>o.kind===(kind==='plaque'?'wish-plaque':kind))){
   const button=document.createElement('button');button.textContent=offer.days+'일 · '+offer.priceKrw.toLocaleString('ko-KR')+'원';
   button.onclick=async()=>{
    try{
     const result=await fetch('/api/service/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({offerId:offer.id})});
     if(!result.ok)throw Error();const data=await result.json();
     note.textContent='선택한 시험 기간권 · '+data.offer.days+'일 · '+Number(data.offer.priceKrw).toLocaleString('ko-KR')+'원';
    }catch{note.textContent='선택한 기간권을 이용할 수 없습니다.';}
   };
   section.append(button);
  }
 }catch{note.textContent='시험 판매 정보를 불러오지 못했습니다.';}
}
