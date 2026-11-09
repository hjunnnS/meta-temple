import {origin} from './local-candidate.mjs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 const a=await browser.newContext({locale:'ko-KR'}),b=await browser.newContext({locale:'ko-KR'});
 const p=await a.newPage(),q=await b.newPage();
 async function enter(page){await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});}
 await enter(q);await enter(p);
 const guide=p.locator('#visit-guide');await guide.waitFor();await p.locator('#world').focus();
 await p.keyboard.press('ArrowUp');await guide.getByText(/휠/).waitFor();
 await p.mouse.move(640,360);await p.mouse.wheel(0,100);await guide.getByText(/함께 듣기/).waitFor();
 await guide.getByRole('button').click();

 async function pick(face){await p.locator('#face-picker').click();await p.locator('[data-face='+face+']').click();}
 function sees(face){return q.waitForResponse(async r=>r.url().endsWith('/channel/move')&&r.ok()&&(await r.json()).participants.some(peer=>peer.face===face));}
 const tiger=sees('tiger');await pick('tiger');await tiger;
 await enter(p);assert(await guide.isHidden());await p.locator('#face-picker').click();assert.equal(await p.locator('[data-face=tiger]').getAttribute('aria-pressed'),'true');
 const human=sees('human');await p.locator('[data-face=human]').click();await human;
 await enter(p);assert(await guide.isHidden());await p.locator('#face-picker').click();assert.equal(await p.locator('[data-face=human]').getAttribute('aria-pressed'),'true');
 async function walkToHall(page){
  await page.bringToFront();const world=page.locator('#world');await world.focus();
  await page.keyboard.down('d');
  try{await page.waitForRequest(r=>r.url().endsWith('/channel/move')&&r.postDataJSON().position[0]>=1.1);}
  finally{await page.keyboard.up('d');}
  await page.keyboard.down('w');
  try{await page.locator('#bow-start').waitFor({timeout:120000});}finally{await page.keyboard.up('w');}
 }
 await p.locator('.face-dialog button').first().click();
 await q.locator('#visit-guide button').click();await walkToHall(q);await walkToHall(p);
 const channel=q.locator('#settings-panel select').last();
 async function switchChannel(n){await channel.evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change'));},String(n));}
 await switchChannel(2);
 const middle=p.waitForRequest(r=>r.url().endsWith('/channel/move')&&r.postDataJSON().bowProgress>.33);
 await p.getByRole('button',{name:/대웅전 · 참배 시작/}).click();await middle;
 const observed=q.waitForResponse(async r=>{
  if(!r.url().endsWith('/channel/move')||!r.ok())return false;
  return (await r.json()).participants.some(peer=>peer.animation==='worship'&&peer.bowProgress>.3&&peer.bowProgress<1);
 });
 await switchChannel(1);await observed;
 await p.bringToFront();
 await p.route('**/practice/start',r=>r.fulfill({json:{id:'recovery-run',count:107}}));
 const recorded=[];
 await p.route('**/practice/bow',async r=>{
  recorded.push(r.request().postDataJSON());
  if(recorded.length===1)await r.abort();else await r.fulfill({json:{count:108}});
 });
 const start=p.locator('#bow-start');
 await start.click();await p.locator('#bow-count').filter({hasText:'107 / 108'}).waitFor();
 await start.click();await p.locator('#bow-count').filter({hasText:'108배 완료'}).waitFor();
 assert.deepEqual(recorded,[{id:'recovery-run',count:108},{id:'recovery-run',count:108}]);
 console.log('Final bow confirmed after lost response without repeating its animation.');
 console.log('First visit, returning face, peer appearance and mid-bow arrival passed.');
}finally{await browser.close();}
