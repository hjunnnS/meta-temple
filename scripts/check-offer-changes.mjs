import assert from 'node:assert/strict';
import {languages,dictionary,fitsWidth} from './locale-checks.mjs';
import {origin} from './local-candidate.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 for(const [code] of languages){
  const t=await dictionary(code);
  const page=await browser.newPage({locale:code,reducedMotion:'reduce',viewport:{width:320,height:740}});
  const panel=page.locator('#reception-panel'),button=name=>panel.getByRole('button',{name:t(name),exact:true});
  let revision=1;
  const submissions=[];
  await page.route('**/service/quote',route=>route.fulfill({json:{offer:{days:7,revision,priceKrw:revision===1?3000:4500}}}));
  await page.route('**/trade/enter',route=>{
   submissions.push(route.request().postDataJSON());revision++;
   return route.fulfill({status:409,json:{error:revision===2?'offer_changed':'offer_stopped'}});
  });
  await page.goto(origin);await page.locator('[data-locale="'+code+'"]').click();await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});
  await page.locator('[data-view="officeReception"]').first().click();
  await panel.getByRole('button',{name:t('연등')+' · '+t('연등광장'),exact:true}).click();
  await panel.locator('section button').first().click();
  await panel.locator('[data-row]:enabled').first().click();await panel.locator('[data-slot]:enabled').first().click();
  const slot=await panel.locator('[name=slot]').inputValue(),msg=panel.locator('textarea'),name=panel.locator('[name=name]');
  await panel.locator('[name=tag]').check();await panel.locator('[name=public]').check();
  const emoji='🌸';
  await name.fill(emoji.repeat(13));await msg.fill('첫 줄\n둘째 줄');await button('신청 내용 확인').click();
  assert.equal(await msg.evaluate(el=>el.validationMessage),t('한 줄로 입력해 주세요.'));
  await msg.fill(emoji.repeat(101));await button('신청 내용 확인').click();
  assert.equal(await msg.evaluate(el=>el.validationMessage),t('최대 {limit}자까지 입력할 수 있습니다.').replace('{limit}','100'));
  await msg.fill(emoji.repeat(100));await button('신청 내용 확인').click();
  assert.equal(await name.evaluate(el=>el.validationMessage),t('최대 {limit}자까지 입력할 수 있습니다.').replace('{limit}','12'));
  assert.equal(submissions.length,0);await name.fill(emoji.repeat(12));await button('신청 내용 확인').click();
  await button('이 자리에 예약').click();const price=panel.locator('p').filter({hasText:t('변경된 가격을 확인해 주세요.')});
  await price.waitFor();await fitsWidth(price);
  const priceDigits=(await price.innerText()).replace(/[^0-9]/g,'');
  assert(priceDigits.includes('3000')&&priceDigits.includes('4500'));
  await fitsWidth(button('신청 내용 확인'));
  assert.equal(await panel.locator('[name=slot]').inputValue(),slot);assert.equal(await msg.inputValue(),emoji.repeat(100));assert.equal(await name.inputValue(),emoji.repeat(12));
  await button('신청 내용 확인').click();assert.equal(submissions.length,1);await fitsWidth(button('이 자리에 예약'));await button('이 자리에 예약').click();
  await panel.getByText(t('이 기간권은 판매가 중지되었습니다.')).waitFor();
  assert.deepEqual(submissions.map(item=>item.revision),[1,2]);assert.equal(await button('이 자리에 예약').count(),0);
  await page.close();console.log(code,'offer checks passed');
 }
 console.log('PASS input boundaries, single-line validation, revised quote with same slot and draft, explicit reconfirmation and stopped sale');
}finally{await browser.close();}
