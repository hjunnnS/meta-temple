import {privateViews} from './service-ui-controls.mjs';
import {ensurePrivateTestAccess} from './private-test-access.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342',out='evidence/private-practice';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):[0-9]+$/);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
const context=await browser.newContext({viewport:{width:1500,height:1000},locale:'ko-KR'});
assert.equal((await context.request.post(origin+'/api/service/auth/local-preview',{headers:{Origin:origin},data:{email:process.env.SASA_TEST_EMAIL??'test@bwm.kr'}})).status(),200);
await ensurePrivateTestAccess(context,origin);
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});await page.waitForTimeout(3300);if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').first().click();
async function enter(){await page.locator('#place').evaluate(el=>{el.value='personalGateWalk';el.dispatchEvent(new Event('change'));});await page.locator('#private-gate-action').waitFor();const resp=page.waitForResponse(r=>r.url().endsWith('/private-room/enter')&&r.ok());await page.locator('#private-gate-action').click();const data=await(await resp).json();await page.locator('#private-bow').waitFor();return data.roomId;}
const roomId=await enter();const layout=await(await context.request.get(origin+'/api/service/private-room/display?roomId='+roomId)).json();let publicMoves=0;page.on('request',r=>{if(r.url().includes('/channel/move'))publicMoves++;});
await page.waitForTimeout(500);
await page.evaluate(()=>{window.practiceChunks=[];const stream=document.querySelector('#world').captureStream(24);window.practiceRecorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:5000000});window.practiceRecorder.ondataavailable=e=>window.practiceChunks.push(e.data);window.practiceRecorder.start();});
await page.locator('#private-bow').click();await page.waitForTimeout(2600);await page.screenshot({path:out+'/bow.jpg',quality:92});
await page.waitForFunction(()=>document.querySelector('#private-practice').dataset.mode==='idle');assert.equal(await page.locator('#private-practice').getAttribute('data-bow-count'),'1');
await page.locator('#private-meditate').click();await page.waitForFunction(()=>document.querySelector('#private-practice').dataset.mode==='meditating');await page.waitForTimeout(1500);await page.screenshot({path:out+'/meditation.jpg',quality:92});
await page.locator('#private-practice-return:visible, #private-practice-stop:visible').first().click();await page.waitForFunction(()=>document.querySelector('#private-practice').dataset.mode==='idle');await page.waitForTimeout(300);
const b64=await page.evaluate(()=>new Promise(resolve=>{window.practiceRecorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(window.practiceChunks,{type:'video/webm'}));};window.practiceRecorder.stop();}));await writeFile(out+'/practice.webm',Buffer.from(b64,'base64'));
// Movement and Escape recover through standing instead of locking the avatar.
await page.locator('#private-meditate').click();await page.waitForTimeout(1800);await page.keyboard.down('KeyS');await page.waitForTimeout(1800);await page.keyboard.up('KeyS');assert.equal(await page.locator('#private-practice').getAttribute('data-mode'),'idle');
await page.locator('#private-bow').click();await page.waitForTimeout(1000);await page.keyboard.press('Escape');assert.equal(await page.locator('#private-practice').getAttribute('data-mode'),'bow');await page.waitForFunction(()=>document.querySelector('#private-practice').dataset.mode==='idle');assert.equal(await page.locator('#private-practice').getAttribute('data-bow-count'),'2');
// Display inspection can interrupt meditation safely.
await page.locator('#private-meditate').click();await page.waitForTimeout(1800);await privateViews(page);await page.locator('[data-room-view=display]').click();await page.waitForFunction(()=>document.querySelector('#private-practice').dataset.mode==='idle');await page.locator('#private-display-open').click();await page.locator('#private-display-dialog').waitFor();await page.locator('#private-display-close').click();
assert.equal(publicMoves,0);const privateMoveRequests=publicMoves;
await page.locator('#private-room-exit').click();await page.locator('#private-room-controls').waitFor({state:'hidden'});await page.waitForTimeout(300);assert.equal(await enter(),roomId);await page.waitForTimeout(300);assert.equal(await page.locator('#private-practice').getAttribute('data-mode'),'idle');assert.equal(await page.locator('#private-practice').getAttribute('data-bow-count'),'0');
const after=await(await context.request.get(origin+'/api/service/private-room/display?roomId='+roomId)).json();assert.deepEqual(after.placements,layout.placements);assert.equal(after.revision,layout.revision);assert.deepEqual(errors,[]);
const result={passed:true,singleBow:true,meditation:true,stop:true,movementStandsUp:true,escapeFinishesBow:true,displayInterrupt:true,reentryIdle:true,existingLayoutUnchanged:true,publicMoveRequests:privateMoveRequests,pageErrors:errors};await writeFile(out+'/check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
