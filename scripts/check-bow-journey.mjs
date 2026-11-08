// Run against the private candidate with its local test mailbox. Allow ten minutes.
import assert from 'node:assert/strict';
import {mkdir, readFile, readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const origin = 'http://127.0.0.1:4340';
const mailbox = '.m3-local/mail';
const evidence = 'evidence/bow-journey';
const email = 'bow-' + randomUUID() + '@example.test';
const before = new Set(await readdir(mailbox));
await mkdir(evidence, {recursive:true});
const browser = await chromium.launch({channel:'chrome', args:['--enable-gpu']});
try {
 const context = await browser.newContext({locale:'ko-KR', viewport:{width:960,height:650}});
 const hall = await context.newPage();
 const counts = [];
 let granted = 0, denied = 0;
 hall.on('response', async response => {
  if(response.url().endsWith('/practice/start')){
   if(response.status() === 401) denied++;
   if(response.ok()) granted++;
  }
  if(response.url().endsWith('/practice/bow') && response.ok()) counts.push((await response.json()).count);
 });
 await hall.goto(origin);
 await hall.locator('.enter-temple').click();
 await hall.locator('.entry-overlay').waitFor({state:'detached'});
 await hall.locator('#walk-pad').waitFor();
 await hall.locator('#world').focus();

 // Enter beside the central timber column through the open front of the hall.
 await hall.keyboard.down('d');
 try {
  await hall.waitForRequest(request => request.url().endsWith('/channel/move') && request.postDataJSON().position[0] >= 1.1);
 } finally { await hall.keyboard.up('d'); }
 await hall.keyboard.down('w');
 const start = hall.locator('#bow-start');
 try { await start.waitFor({timeout:120000}); } finally { await hall.keyboard.up('w'); }
 await hall.screenshot({path:evidence+'/guest-hall.jpg'});

 await start.click();
 const account = hall.locator('dialog[open]').filter({has:hall.locator('input[name=email]')});
 await account.locator('[data-close]').click();
 await start.click();
 await account.locator('input').fill(email);
 await account.locator('form button').click();
 await account.getByText('이 Mac의 시험 우편함에 로그인 링크를 보냈습니다.').waitFor();
 let link;
 for(const file of await readdir(mailbox)){
  if(before.has(file)) continue;
  const [recipient,url] = (await readFile(mailbox+'/'+file,'utf8')).split('\n');
  if(recipient === email){ link = new URL(url); break; }
 }
 assert.equal(link?.origin,origin);
 const confirmation = await context.newPage();
 await confirmation.goto(link.href);
 await confirmation.locator('[data-confirm]').click();
 await confirmation.getByText('법당이 열린 탭으로 돌아가 절하기를 눌러 주세요.').waitFor();
 await confirmation.close();
 await hall.bringToFront();
 const count = hall.locator('#bow-count');
 await hall.waitForFunction(() => document.querySelector('#bow-count').textContent === '0 / 108');
 assert.equal(denied,2);
 assert.equal(granted,1);

 for(let n=1;n<=108;n++){
  await start.click();
  const expected = n === 108 ? '108배 완료' : n+' / 108';
  await count.filter({hasText:new RegExp('^'+expected+'$')}).waitFor({timeout:30000});
 }
 assert.deepEqual(counts,Array.from({length:108},(_,i)=>i+1));
 await hall.waitForTimeout(500);
 await hall.screenshot({path:evidence+'/completed.jpg'});
 console.log('Verified guest entry, login return, and all 108 completed bows.');
} finally { await browser.close(); }
