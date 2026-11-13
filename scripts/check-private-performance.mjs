import {privateViews} from './service-ui-controls.mjs';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ensurePrivateTestAccess} from './private-test-access.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342';assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
const context=await browser.newContext({viewport:{width:1280,height:720}});assert.equal((await context.request.post(origin+'/api/service/auth/local-preview',{headers:{Origin:origin},data:{email:'test@bwm.kr'}})).status(),200);await ensurePrivateTestAccess(context,origin);
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(page);await cdp.send('HeapProfiler.enable');
await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});await page.waitForTimeout(3300);if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').first().click();
async function enter(){await page.locator('#place').evaluate(el=>{el.value='personalGateWalk';el.dispatchEvent(new Event('change'));});await page.locator('#private-gate-action').click();await page.locator('#private-room-controls').waitFor();await page.waitForTimeout(400);}
async function exit(){await page.locator('#private-room-exit').click();await page.locator('#private-room-controls').waitFor({state:'hidden'});await page.waitForTimeout(300);}
async function memory(){await cdp.send('HeapProfiler.collectGarbage');return (await cdp.send('Runtime.getHeapUsage')).usedSize;}
// Warm all lazy room code and resources before comparing repeated entries.
await enter();await exit();const before=await memory();const cycles=[];
for(let i=0;i<10;i++){await enter();await page.locator('#private-meditate').click();await page.waitForTimeout(1500);await page.locator('#private-practice-return:visible, #private-practice-stop:visible').first().click();await page.waitForTimeout(1100);await exit();cycles.push({cycle:i+1,heapBytes:await memory()});}
await enter();await privateViews(page);await page.locator('[data-room-view=garden]').click();await page.waitForTimeout(2000);await privateViews(page);await page.locator('[data-room-view=walk]').click();await page.locator('#private-meditate').click();await page.waitForTimeout(1800);
await page.evaluate(()=>{document.querySelector('#diagnostics').click();document.querySelector('#measure').click();document.querySelector('#close-diagnostics').click();document.querySelector('#world').focus();});await page.waitForTimeout(60000);
const measured=await page.evaluate(()=>{document.querySelector('#diagnostics').click();document.querySelector('#stop').click();const data=JSON.parse(document.querySelector('#report').textContent);document.querySelector('#close-diagnostics').click();document.querySelector('#world').focus();return data;});const stats=measured.measurement;assert(stats.valid&&stats.samples>1000);await page.screenshot({path:'evidence/local-expansion/private-performance.jpg',quality:90});await exit();const after=await memory();assert.deepEqual(errors,[]);assert(after-before<32*1024*1024,'room entry retained over 32 MiB after garbage collection');
const result={passed:true,viewport:[1280,720],cycles:10,warmup:'one complete entry/exit before baseline; explicit GC for heap comparison',heapBeforeBytes:before,heapAfterBytes:after,heapDeltaBytes:after-before,heapAllowanceBytes:32*1024*1024,entries:cycles,privateMeditationSeconds:60,frameStatistics:stats,memoryCaveat:'JavaScript heap only; excludes GPU and total process memory',errors};await writeFile('evidence/local-expansion/private-performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
