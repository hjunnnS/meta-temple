import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {origin} from './local-candidate.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 const page=await browser.newPage({locale:'ko-KR',reducedMotion:'reduce'});
 const id=randomUUID(),item={orderId:id,kind:'lantern',slotId:'sample:Z02:lantern:0013',status:'recovering',amountKrw:3000};
 const refundItem={...item,orderId:randomUUID(),status:'refund_pending'};
 await page.route('**/service/me',route=>route.fulfill({json:{email:'desk@example.test'}}));
 await page.route('**/service/me/offerings',route=>route.fulfill({json:{items:[item,refundItem]}}));
 await page.route('**/service/staff/roles',route=>route.fulfill({json:{roles:['desk']}}));
 await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});
 await page.locator('#service-account').click();
 for(const [order,state,label] of [[item,'installed','설치됨'],[refundItem,'refunded','환불 완료']]){
  const details=page.locator('dialog[open] details').filter({hasText:order.orderId});
  await details.locator('summary').click();
  order.status=state;await details.locator('summary').filter({hasText:label}).waitFor();
  assert.equal(await details.getAttribute('open'),'');assert((await details.innerText()).includes(order.orderId));
 }
 console.log('Open purchase details updated for installation and refund');
 let available=true;
 await page.route('**/service/shared/*',route=>available?route.fulfill({json:{kind:'lantern',name:'시험',text:'공개 문구'}}):route.fulfill({status:404,json:{error:'unavailable'}}));
 await page.goto(origin+'/shared.html?id='+id);await page.getByText('공개 문구').waitFor();
 await page.context().setOffline(true);await page.getByText('연결 상태를 확인해 주세요.').waitFor();
 assert.equal(await page.locator('#name').textContent(),'');assert.equal(await page.locator('#message').textContent(),'');
 available=false;await page.context().setOffline(false);await page.getByText('현재 볼 수 없는 봉헌입니다.').waitFor();
 assert(await page.locator('form').isHidden());
 available=true;await page.getByText('공개 문구').waitFor();
 console.log('Shared content cleared offline and permission rechecked on return');
 await page.route('**/staff/alerts',route=>route.fulfill({json:{rows:[{id,kind:'install_failure'},{id:randomUUID(),kind:'reservation_delay'}]}}));
 await page.route('**/staff/orders?*',route=>{
  assert.equal(new URL(route.request().url()).searchParams.get('q'),id);
  return route.fulfill({json:{rows:[{id,status:'recovering'}]}});
 });
 await page.goto(origin+'/staff.html');
 await page.getByRole('button',{name:'해당 주문 보기'}).click();
 await page.getByText(id+' · recovering',{exact:true}).waitFor();
 assert.equal(await page.getByPlaceholder(/주문 번호/).inputValue(),id);
 console.log('Order alert opened the matching order and recovery action');
}finally{await browser.close();}
