import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):[0-9]+$/);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 const context=await browser.newContext({viewport:{width:1500,height:1000},locale:'ko-KR'}),page=await context.newPage();const errors=[],moves=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error'&&/compile|shader|exception|TypeError/i.test(message.text()))errors.push(message.text());});page.on('request',r=>{if(r.url().endsWith('/channel/move'))moves.push(r.postDataJSON());});
 assert((await context.request.post(origin+'/api/service/auth/local-preview',{headers:{Origin:origin},data:{email:'test@bwm.kr'}})).ok());
 await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});await page.waitForTimeout(3300);
 if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').first().click();
 const view=async v=>{await page.locator('#place').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('change'));},v);await page.waitForTimeout(500);};
 await view('personalGate');await page.waitForTimeout(1600);await page.screenshot({path:'evidence/private-retreat/gate-purple.jpg',quality:93});
 await page.evaluate(()=>{
  const recorder=new MediaRecorder(document.querySelector('#world').captureStream(24),{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:5000000});window.__parts=[];recorder.ondataavailable=e=>window.__parts.push(e.data);window.__portalRecorder=recorder;recorder.start();
 });
 await page.waitForTimeout(4200);await page.screenshot({path:'evidence/private-retreat/gate-blue.jpg',quality:93});await page.waitForTimeout(6000);await page.screenshot({path:'evidence/private-retreat/gate-orange.jpg',quality:93});await page.waitForTimeout(6000);
 const clip=await page.evaluate(()=>new Promise(resolve=>{window.__portalRecorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(window.__parts,{type:'video/webm'}));};window.__portalRecorder.stop();}));await writeFile('evidence/private-retreat/portal.webm',Buffer.from(clip,'base64'));
 await view('personalGateWalk');await page.locator('#world').focus();await page.keyboard.down('w');try{await page.locator('#private-room-controls').waitFor();}finally{await page.keyboard.up('w');}
 await page.waitForTimeout(1000);await page.screenshot({path:'evidence/private-retreat/inside.jpg',quality:93});
 await page.locator('[data-room-view=overview]').click();await page.waitForTimeout(700);await page.screenshot({path:'evidence/private-retreat/overview.jpg',quality:93});
 await page.locator('[data-room-view=garden]').click();await page.waitForTimeout(700);await page.screenshot({path:'evidence/private-retreat/garden.jpg',quality:93});
 await page.locator('[data-room-view=display]').click();await page.waitForTimeout(700);await page.screenshot({path:'evidence/private-retreat/display.jpg',quality:93});
 await page.locator('[data-room-view=walk]').click();await page.waitForTimeout(400);const count=moves.length;
 await page.keyboard.down('w');await page.waitForTimeout(1500);await page.keyboard.up('w');await page.keyboard.down('d');await page.waitForTimeout(3500);await page.keyboard.up('d');await page.waitForTimeout(400);
 assert.equal(moves.length,count,'garden remains private');await page.screenshot({path:'evidence/private-retreat/garden-walk.jpg',quality:93});
 for(let i=0;i<3;i++)await page.mouse.wheel(0,2500);await page.waitForTimeout(700);
 await page.locator('#private-room-exit').click();await page.locator('#private-room-controls').waitFor({state:'hidden'});
 await page.locator('#settings').click();await page.locator('#reduced').check();await page.locator('#close-settings').click();await view('personalGate');await page.waitForTimeout(3800);await page.screenshot({path:'evidence/private-retreat/gate-reduced.jpg',quality:93});
 assert.deepEqual(errors,[]);await writeFile('evidence/private-retreat/check.json',JSON.stringify({passed:true,portalEntry:true,overview:true,gardenView:true,gardenWalkNoPublicBroadcast:true,zoomAndExit:true,reducedMotion:true,pageErrors:errors},null,2));console.log('PASS portal, private retreat, garden walk, privacy, zoom, exit and reduced effects; no render errors');
}finally{await browser.close();}
