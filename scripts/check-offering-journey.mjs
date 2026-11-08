// Run against the local candidate and its test mailbox. No checkout is performed.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin='http://127.0.0.1:4340';
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try {
 for(const label of ['연등','소원패','인등','추모등','봉헌초']){
  const context=await browser.newContext({locale:'ko-KR',reducedMotion:'reduce',viewport:{width:1100,height:800}});
  try {
   const page=await context.newPage();
   const email='reserve-'+randomUUID()+'@example.test';
   const attempts=[];
   page.on('request',r=>{if(r.url().endsWith('/trade/enter'))attempts.push(r.postDataJSON());});
   await page.goto(origin);
   await page.locator('.enter-temple').click();
   await page.locator('.entry-overlay').waitFor({state:'detached'});
   await page.locator('[data-view="officeReception"]').first().click();
   const panel=page.locator('#reception-panel');
   await panel.getByRole('button',{name:new RegExp('^'+label+' ·')}).click();
   await panel.getByRole('button',{name:/^7일/}).click();
   const choice=panel.locator('select[name=slot]');
   if(label==='연등'){
    await panel.locator('.lantern-plan button').nth(1).click();
    await panel.locator('.lantern-seats button:enabled').last().click();
   }else{
    const available=choice.locator('option:enabled');
    await choice.selectOption(await available.last().getAttribute('value'));
   }
   const selected=await choice.inputValue();
   const message=label+' 시험 신청';
   await panel.locator('textarea').fill(message);
   await panel.getByRole('button',{name:'신청 내용 확인'}).click();
   assert((await panel.innerText()).includes(selected));
   assert.equal(attempts.length,0);
   assert.equal(await page.locator('dialog[open]').count(),0);

   const guest=page.waitForResponse(r=>r.url().endsWith('/trade/enter'));
   await panel.getByRole('button',{name:'이 자리에 예약'}).click();
   assert.equal((await guest).status(),401);
   const account=page.locator('dialog[open]').filter({has:page.locator('input[name=email]')});
   const existing=new Set(await readdir('.m3-local/mail'));
   await account.locator('input').fill(email);
   await account.locator('form button').click();
   await account.getByText('이 Mac의 시험 우편함에 로그인 링크를 보냈습니다.').waitFor();
   let link;
   for(const file of await readdir('.m3-local/mail')){
    if(existing.has(file))continue;
    const [recipient,url]=(await readFile('.m3-local/mail/'+file,'utf8')).split('\n');
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
   assert((await panel.innerText()).includes(selected));
   assert.equal(attempts.length,2);
   assert.deepEqual(attempts[1],attempts[0]);
   assert.equal(attempts[1].text,message);
   assert.equal(attempts[1].slotId,selected);
   const released=page.waitForResponse(r=>r.url().endsWith('/trade/cancel'));
   await cancel.click();
   assert((await released).ok());
   console.log(label,selected,'예약 확인 및 해제');
  } finally {await context.close();}
 }
} finally {await browser.close();}
