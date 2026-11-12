import {serviceControl} from './service-ui-controls.mjs';
import {origin,mailbox} from './local-candidate.mjs';
// Run against the local candidate and its test mailbox. No checkout is performed.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');

const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try {
 for(const label of ['연등','소원패','인등','추모등','봉헌초']){
  const context=await browser.newContext({locale:'ko-KR',reducedMotion:'reduce',viewport:{width:320,height:720}});
  try {
   const page=await context.newPage();
   const email='reserve-'+randomUUID()+'@example.test';
   const attempts=[];
   page.on('request',r=>{if(r.url().endsWith('/trade/enter'))attempts.push(r.postDataJSON());});
   await page.goto(origin);
   await page.locator('.enter-temple').click();
   await page.locator('.entry-overlay').waitFor({state:'detached'});
   await serviceControl(page,'#offering-open');
   const panel=page.locator('#reception-panel');
   await panel.getByRole('button',{name:new RegExp('^'+label+' ·')}).click();

   const choice=panel.locator('select[name=slot]');
   if(label==='연등'){
    const rows=panel.locator('.lantern-plan button');
    await rows.first().waitFor();
    assert.equal((await rows.allTextContents()).reduce((n,text)=>n+Number(text.split('빈자리')[1]??0),0),await choice.locator('option:enabled').count());
    assert.equal(await choice.locator('option').count(),440);
    const row=rows.nth(1);await row.focus();await page.keyboard.press('Enter');
    await panel.getByRole('button',{name:'‹ 연등 배치도'}).focus();await page.keyboard.press('Enter');
    assert(await row.evaluate(el=>el===document.activeElement));await page.keyboard.press('Enter');
    await panel.locator('.lantern-seats button:enabled').last().focus();await page.keyboard.press('Enter');
   }else{
    const available=choice.locator('option:enabled');
    await choice.selectOption(await available.last().getAttribute('value'));
   }
   const selected=await choice.inputValue();
   let observer,watched;
   if(label==='연등'){
    observer=await browser.newPage({locale:'ko-KR',viewport:{width:960,height:720}});
    await observer.goto(origin);await observer.locator('.enter-temple').click();
    await observer.locator('.entry-overlay').waitFor({state:'detached'});
    await serviceControl(observer,'#offering-open');
    const reception=observer.locator('#reception-panel');
    await reception.getByRole('button',{name:/^연등 ·/}).click();
    await reception.locator('.lantern-plan button').nth(1).click();
    watched=reception.locator('[data-slot="'+selected+'"]');await watched.click();
    await reception.locator('textarea').fill('유지할 초안');
   }
   const message=label+' 시험 신청';
   await panel.locator('textarea').fill(message);
   await panel.getByRole('button',{name:'신청 내용 확인'}).click();
   assert((await panel.innerText()).includes(selected.split(':').at(-1)));
   assert.equal(attempts.length,0);
   assert.equal(await page.locator('dialog[open]').count(),0);

   const guest=page.waitForResponse(r=>r.url().endsWith('/trade/enter'));
   await panel.getByRole('button',{name:'이 자리에 예약'}).click();
   assert.equal((await guest).status(),401);
   const account=page.locator('dialog[open]').filter({has:page.locator('input[name=email]')});
   const existing=new Set(await readdir(mailbox));
   await account.locator('input').fill(email);
   if(label==='연등'){
    await page.route('**/api/service/login-link',r=>r.abort(),{times:1});
    await account.locator('form button').click();await account.getByRole('status').filter({hasText:'연결 상태'}).first().waitFor();
   }
   await account.locator('form button').click();
   await account.getByText('이 Mac의 시험 우편함에 로그인 링크를 보냈습니다.').waitFor();
   let link;
   for(const file of await readdir(mailbox)){
    if(existing.has(file))continue;
    const [recipient,url]=(await readFile(mailbox+'/'+file,'utf8')).split('\n');
    if(recipient===email){link=new URL(url);break;}
   }
   assert.equal(link?.origin,origin);
   const loginPage=await context.newPage();
   await loginPage.goto(link.href);
   const resumed=page.waitForResponse(r=>r.url().endsWith('/trade/enter'));
   await loginPage.locator('[data-confirm]').click();
   assert((await resumed).ok());
   await loginPage.close();
   await page.bringToFront();
   const cancel=panel.getByRole('button',{name:'예약 취소'});
   await cancel.waitFor();
   assert((await panel.innerText()).includes(selected.split(':').at(-1)));
   assert.equal(attempts.length,2);
   assert.deepEqual(attempts[1],attempts[0]);
   assert.equal(attempts[1].text,message);
   assert.equal(attempts[1].slotId,selected);
   if(observer){await observer.bringToFront();await watched.getByText('예약 중').waitFor();assert(await watched.isDisabled());}
   const released=page.waitForResponse(r=>r.url().endsWith('/trade/cancel'));
   await cancel.click();
   assert((await released).ok());
   if(observer){
    await observer.bringToFront();await watched.getByText('빈자리').waitFor();await watched.click();
    assert.equal(await observer.locator('#reception-panel textarea').inputValue(),'유지할 초안');await observer.close();
   }
   console.log(label,selected,'예약 확인 및 해제');
  } finally {await context.close();}
 }
} finally {await browser.close();}
