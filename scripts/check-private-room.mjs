import {ensurePrivateTestAccess} from './private-test-access.mjs';
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342',mail=process.env.SASA_TEST_MAIL??'.m3-local/standalone/mail';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):[0-9]+$/,'Run only against the local test candidate');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
const email='room-'+randomUUID()+'@example.test';
async function tokenFor(email){
 const messages=await Promise.all((await readdir(mail)).map(file=>readFile(mail+'/'+file,'utf8')));
 const text=messages.find(text=>text.startsWith(email+'\n'));assert(text,'local login mail exists');return new URL(text.split('\n')[1]).hash.slice(7);
}
try{
 const a=await browser.newContext({viewport:{width:1500,height:1000},locale:'ko-KR'}),page=await a.newPage();const errors=[],moves=[],publicIds=new Set();page.on('response',async r=>{if(r.url().endsWith('/channel/join')&&r.ok()){try{publicIds.add((await r.json()).self);}catch{}}});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/channel/move'))moves.push(r.postDataJSON());});
 await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});await page.waitForTimeout(3300);
 if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').first().click();
 await page.locator('#place').evaluate(el=>{el.value='personalGateWalk';el.dispatchEvent(new Event('change'));});await page.waitForTimeout(400);await page.screenshot({path:'evidence/private-room/gate.jpg',quality:93});
 await page.locator('#world').focus();await page.keyboard.down('w');try{await page.locator('dialog[open] input[type=email]').waitFor();}finally{await page.keyboard.up('w');}
 const dialog=page.locator('dialog[open]');await dialog.locator('input[type=email]').fill(email);
 const sent=page.waitForResponse(r=>r.url().endsWith('/login-link')&&r.status()===202);await dialog.locator('form button').click();await sent;
 const token=await tokenFor(email);await page.evaluate(token=>{location.hash='login='+token;},token);await dialog.locator('[data-confirm]').waitFor();
 const entered=page.waitForResponse(r=>r.url().endsWith('/private-room/enter')&&r.ok());await dialog.locator('[data-confirm]').click();await page.locator('#private-access-dialog').waitFor();await page.locator('#private-access-checkout').click();await page.locator('#private-access-pay').waitFor();await page.locator('#private-access-pay').click();const roomA=(await (await entered).json()).roomId;
 await page.locator('#private-room-controls').waitFor();await page.waitForTimeout(500);await page.screenshot({path:'evidence/private-room/inside.jpg',quality:93});
 await page.waitForTimeout(400);const moveCount=moves.length;await page.locator('#world').focus();await page.keyboard.down('w');await page.waitForTimeout(1000);await page.keyboard.up('w');await page.waitForTimeout(400);
 assert.equal(moves.length,moveCount,'private walking is never broadcast');
 await page.screenshot({path:'evidence/private-room/walking.jpg',quality:93});
 const headers={Origin:origin};
 assert.equal((await a.request.post(origin+'/api/service/channel/join',{headers,data:{channel:1}})).status(),409,'private session cannot rejoin public');
 const b=await browser.newContext(),emailB='room-b-'+randomUUID()+'@example.test';
 assert.equal((await b.request.post(origin+'/api/service/login-link',{headers,data:{email:emailB}})).status(),202);
 assert.equal((await b.request.post(origin+'/api/service/login',{headers,data:{token:await tokenFor(emailB)}})).status(),200);
 const joined=await (await b.request.post(origin+'/api/service/channel/join',{headers,data:{channel:1}})).json();
 const guests=await (await b.request.post(origin+'/api/service/channel/move',{headers,data:{self:joined.self,sequence:1,position:[66.5,.01,36],yaw:0,animation:'idle'}})).json();
 assert(guests.participants.every(p=>!publicIds.has(p.sessionId)),'private visitor is absent from public channel');
 await ensurePrivateTestAccess(b,origin);
 const roomB=await (await b.request.post(origin+'/api/service/private-room/enter',{headers,data:{roomId:roomA}})).json();assert.notEqual(roomB.roomId,roomA,'another account cannot select my room');
 assert.equal((await b.request.post(origin+'/api/service/private-room/heartbeat',{headers,data:{roomId:roomA}})).status(),409);
 assert.equal((await b.request.post(origin+'/api/service/private-room/heartbeat',{headers,data:{roomId:roomB.roomId}})).status(),200);
 await b.request.post(origin+'/api/service/private-room/leave',{headers,data:{}});await b.close();
 await page.locator('#private-room-exit').click();await page.locator('#private-room-controls').waitFor({state:'hidden'});await page.waitForResponse(r=>r.url().endsWith('/channel/join')&&r.ok());await page.waitForTimeout(300);
 await page.screenshot({path:'evidence/private-room/return.jpg',quality:93});
 const again=page.waitForResponse(r=>r.url().endsWith('/private-room/enter')&&r.ok());await page.locator('#private-gate-action').click();assert.equal((await (await again).json()).roomId,roomA);await page.locator('#private-room-controls').waitFor();
 // Leaving through the actual room doorway also restores the public gate position.
 await page.locator('#world').focus();await page.keyboard.down('s');try{await page.locator('#private-room-controls').waitFor({state:'hidden'});}finally{await page.keyboard.up('s');}await page.waitForTimeout(600);
 await page.locator('#private-gate-action').click();await page.locator('#private-room-controls').waitFor();
 await page.evaluate(async()=>{await fetch('/api/service/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});window.dispatchEvent(new Event('sasa:account'));});
 await page.locator('#private-room-controls').waitFor({state:'hidden'});assert.equal((await a.request.post(origin+'/api/service/private-room/enter',{headers,data:{}})).status(),401);
 assert.deepEqual(errors,[]);
 const result={passed:true,guestPortalLoginResume:true,separateAccountRooms:true,foreignRoomDenied:true,noPrivateMotionBroadcast:true,publicChannelRemoved:true,reentrySameRoom:true,buttonExit:true,doorwayExit:true,logoutExit:true,pageErrors:errors};
 await writeFile('evidence/private-room/check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
