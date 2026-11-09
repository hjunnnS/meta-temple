import {origin} from './local-candidate.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 const p=await browser.newPage({viewport:{width:320,height:720},locale:'ko-KR'});
 let all=false;
 await p.route('**/api/service/temples/sample:sasa/zones/Z02/slots',async r=>{
 const resp=await r.fetch(),body=await resp.json(),x=body.slots[0].position[0];
 for(const s of body.slots){s.status=all||s.position[0]===x?'reserved':'free';s.installationId=null;s.owned=false;}
 await r.fulfill({json:body});
 });
 await p.route('**/api/service/time',r=>r.fulfill({json:{time:Date.parse('2026-11-08T18:06:02+09:00')}}));
 await p.goto(origin);await p.locator('.enter-temple').click();await p.locator('.entry-overlay').waitFor({state:'detached'});await p.getByText(/저녁 예불.*6분 남음/).waitFor();
 const panel=p.locator('#reception-panel');
 async function open(){await p.locator('[data-view="officeReception"]').first().click();await panel.getByRole('button',{name:/^연등 ·/}).click();await panel.getByRole('button',{name:/^7일/}).click();await panel.locator('.lantern-plan button').first().waitFor();}
 await open();assert.equal(await panel.locator('.lantern-plan button:disabled').count(),1);
 assert(await panel.locator('.lantern-plan button:enabled').count()>0);
 all=true;await panel.getByText('모든 자리가 찼습니다.').waitFor();assert.equal(await panel.locator('.lantern-plan button:enabled').count(),0);assert(await panel.locator('.lantern-plan button:disabled').count()>1);
 all=false;await panel.locator('.lantern-plan button:enabled').first().waitFor();
 console.log('Partial and full rows, no reservation while full, Korean ceremony time');
 const callback=await browser.newPage();
 await callback.route('**/api/service/auth/methods',r=>r.abort(),{times:1});await callback.goto(origin+'/auth.html');await callback.getByText('연결 상태를 확인해 주세요.').waitFor();await callback.getByRole('button').click();await callback.getByText('링크가 만료되었거나 이미 사용됐습니다. 새 링크를 받아 주세요.').waitFor();
 console.log('Return page network retry and invalid link');
}finally{await browser.close();}
