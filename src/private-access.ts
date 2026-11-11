import {t,translateMarkup} from './locales';
export function privateRoomAccess(gate:HTMLButtonElement,onReady:()=>void){
 const dialog=document.createElement('dialog');dialog.id='private-access-dialog';dialog.setAttribute('aria-labelledby','private-access-title');
 dialog.innerHTML=`<h2 id="private-access-title">개인 공간 이용권</h2><p>로컬 시험 상품 · 실제 과금 없음</p><p>실제 가격과 이용 기간은 추후 결정됩니다.</p><p id="private-access-info" role="status"></p><button id="private-access-checkout">시험 주문 확인</button><button id="private-access-pay" hidden>시험 결제 완료</button><button id="private-access-cancel" hidden>주문 취소</button><button id="private-access-close">닫기</button>`;
 translateMarkup(dialog);document.body.append(dialog);
 const checkout=dialog.querySelector<HTMLButtonElement>('#private-access-checkout')!,pay=dialog.querySelector<HTMLButtonElement>('#private-access-pay')!,cancel=dialog.querySelector<HTMLButtonElement>('#private-access-cancel')!,info=dialog.querySelector<HTMLElement>('#private-access-info')!;
 let orderId='',busy=false,version=0;
 const message=(text:string)=>{info.textContent=t(text);};
 function buttons(){checkout.hidden=!!orderId;pay.hidden=cancel.hidden=!orderId;checkout.disabled=pay.disabled=cancel.disabled=busy;}
 async function request(body?:object){
  const response=await fetch('/api/service/private-room/access',{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error('access');return response.json();
 }
 async function run(work:()=>Promise<void>){if(busy)return;const token=version;busy=true;buttons();try{await work();}catch{if(token===version)message('처리하지 못했습니다. 다시 열어 상태를 확인해 주세요.');}finally{if(token===version){busy=false;buttons();}}}
 checkout.onclick=()=>{const token=version;void run(async()=>{const data=await request({action:'checkout',offerId:'private-room-local-test',revision:1});if(token!==version)return;if(data.hasAccess){dialog.close();onReady();return;}orderId=data.order.id;message('주문이 준비되었습니다. 실제 금액은 청구되지 않습니다.');});};
 pay.onclick=()=>{const token=version;void run(async()=>{await request({action:'test-pay',orderId});if(token!==version)return;orderId='';dialog.close();onReady();});};
 cancel.onclick=()=>{const token=version;void run(async()=>{await request({action:'cancel',orderId});if(token!==version)return;orderId='';message('시험 주문을 취소했습니다.');});};
 dialog.querySelector<HTMLButtonElement>('#private-access-close')!.onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{version++;busy=false;gate.focus();});
 return {open(){if(dialog.open)return;version++;busy=false;const token=version;orderId='';message('이용 권한을 확인하고 있습니다.');dialog.showModal();void run(async()=>{const data=await request();if(token!==version)return;if(data.hasAccess){dialog.close();onReady();return;}orderId=data.orders.find((o:{status:string})=>o.status==='pending')?.id??'';message(orderId?'결제 대기 중인 시험 주문이 있습니다.':'시험 주문 후 개인 공간에 입장할 수 있습니다.');});},reset(){version++;busy=false;orderId='';if(dialog.open)dialog.close();}};
}
