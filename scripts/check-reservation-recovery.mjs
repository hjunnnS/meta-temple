import {serviceControl} from './service-ui-controls.mjs';
import {origin} from './local-candidate.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 const page=await browser.newPage({locale:'ko-KR',reducedMotion:'reduce'});
 const panel=page.locator('#reception-panel');
 const btn=name=>panel.getByRole('button',{name,exact:true});
 let hold,checks=0,status='recovering',offline=false,chosen='',taken=false;
 const order='same-test-order';
 await page.route('**/trade/hold',route=>route.fulfill({json:{hold:hold?.(),serverTime:Date.now()}}));
 await page.route('**/trade/checkout',route=>route.fulfill({json:{id:order,status:'pending',amount_krw:3000}}));
 await page.route('**/trade/test-pay',route=>route.fulfill({json:{status:'recovering'}}));
 await page.route('**/trade/reconcile',route=>{
  assert.equal(route.request().postDataJSON().orderId,order);checks++;
  return checks===1?route.abort():route.fulfill({json:{status}});
 });
 await page.route('**/zones/Z02/slots',async route=>{
  if(offline)return route.abort();
  const response=await route.fetch(),data=await response.json();
  if(taken)data.slots.find(s=>s.slotId===chosen).status='reserved';
  await route.fulfill({json:data});
 });
 await page.goto(origin);await page.locator('.enter-temple').click();
 await page.locator('.entry-overlay').waitFor({state:'detached'});
 async function open(){
  await serviceControl(page,'#offering-open');
  await panel.getByRole('button',{name:/^연등 ·/}).click();
 }
 await open();
 const makeHold=(seconds,paymentLock=false)=>({id:'test-hold',slotId:'test-slot',paymentLock,expiresAt:new Date(Date.now()+seconds*1000).toISOString()});
 hold=()=>{hold=null;return makeHold(2);};
 await btn('내 예약 확인').click();await panel.getByText(/0:0[12] 남음/).waitFor();
 await panel.getByText('현재 예약한 자리가 없습니다.').waitFor();
 for(const end of ['installed','refunded']){
  await btn('기간권 보기').click();hold=()=>makeHold(-1,true);
  await btn('내 예약 확인').click();await panel.getByText(/결제 확인 중/).waitFor();
  assert.equal(await btn('예약 취소').count(),0);
  await btn('주문 확인').click();checks=0;status=end;
  await btn('시험 결제하기').click();
  await panel.getByText(end==='installed'?/시험 결제 및 설치 완료/:/환불 완료/).waitFor();
  assert.equal(checks,2);
  if(end==='installed'){
   await btn('사찰로 돌아가기').click();
   assert.equal(await panel.isVisible(),false);
   assert.equal(await page.locator('#place').inputValue(),'walk');
   assert.equal(await page.locator('#walk-camera').getAttribute('aria-pressed'),'false');
   await open();
   await panel.getByText(/시험 결제 및 설치 완료/).waitFor();
  }
 }
 await btn('기간권 보기').click();
 await panel.locator('[data-row]:enabled').first().click();
 const seat=panel.locator('[data-slot]:enabled').first();
 chosen=await seat.getAttribute('data-slot');await seat.click();await panel.locator('textarea').fill('작성 중');
 const title=await panel.locator('.lantern-map h3').innerText();
 for(const occupied of [false,true]){
  offline=true;await panel.getByText('연등 배치도 · 확인 중입니다.').waitFor();
  assert(await btn('신청 내용 확인').isDisabled());assert(await btn('빈자리 자동 선택').isDisabled());
  assert.equal(await panel.locator('[data-slot]:enabled').count(),0);
  taken=occupied;offline=false;
  await panel.locator('.lantern-map:not([inert])').waitFor();
  assert.equal(await panel.locator('.lantern-map h3').innerText(),title);
  assert.equal(await panel.locator('button.offer-main-action').isEnabled(),!occupied);
  assert.equal(await panel.locator('textarea').inputValue(),'작성 중');
 }
 console.log('PASS: hold countdown and expiry, payment lock, same-order installation/refund after a lost response, map reconnect with free and newly reserved selections');
}finally{await browser.close();}
