import assert from 'node:assert/strict';
import {origin} from './local-candidate.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 const page=await browser.newPage({locale:'ko-KR',reducedMotion:'reduce'});
 const panel=page.locator('#reception-panel'),button=name=>panel.getByRole('button',{name,exact:true});
 let revision=1;
 const submissions=[];
 await page.route('**/service/quote',route=>route.fulfill({json:{offer:{days:7,revision,priceKrw:revision===1?3000:4500}}}));
 await page.route('**/trade/enter',route=>{
  submissions.push(route.request().postDataJSON());revision++;
  return route.fulfill({status:409,json:{error:revision===2?'offer_changed':'offer_stopped'}});
 });
 await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});
 await page.locator('[data-view="officeReception"]').first().click();
 await panel.getByRole('button',{name:/^연등 ·/}).click();
 await panel.getByRole('button',{name:/^7일/}).click();
 await panel.locator('[data-row]:enabled').first().click();await panel.locator('[data-slot]:enabled').first().click();
 const slot=await panel.locator('[name=slot]').inputValue(),msg=panel.locator('textarea'),name=panel.locator('[name=name]');
 await panel.locator('[name=tag]').check();await panel.locator('[name=public]').check();
 const emoji='🌸';
 await name.fill(emoji.repeat(13));await msg.fill('첫 줄\n둘째 줄');await button('신청 내용 확인').click();
 assert.match(await msg.evaluate(el=>el.validationMessage),/한 줄/);
 await msg.fill(emoji.repeat(101));await button('신청 내용 확인').click();
 assert.match(await msg.evaluate(el=>el.validationMessage),/100/);
 await msg.fill(emoji.repeat(100));await button('신청 내용 확인').click();
 assert.match(await name.evaluate(el=>el.validationMessage),/12/);
 assert.equal(submissions.length,0);await name.fill(emoji.repeat(12));await button('신청 내용 확인').click();
 await button('이 자리에 예약').click();await panel.getByText(/변경된 가격.*3,000.*4,500/).waitFor();
 assert.equal(await panel.locator('[name=slot]').inputValue(),slot);assert.equal(await msg.inputValue(),emoji.repeat(100));assert.equal(await name.inputValue(),emoji.repeat(12));
 await button('신청 내용 확인').click();assert.equal(submissions.length,1);await button('이 자리에 예약').click();
 await panel.getByText('이 기간권은 판매가 중지되었습니다.').waitFor();
 assert.deepEqual(submissions.map(item=>item.revision),[1,2]);assert.equal(await button('이 자리에 예약').count(),0);
 console.log('PASS input boundaries, single-line validation, revised quote with same slot and draft, explicit reconfirmation and stopped sale');
}finally{await browser.close();}
