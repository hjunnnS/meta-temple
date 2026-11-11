import {ensurePrivateTestAccess} from './private-test-access.mjs';
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342',headers={Origin:origin},mail=process.env.SASA_TEST_MAIL??'.m3-local/standalone/mail';
assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):[0-9]+$/);
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});const emails=[],cleanup=[];
async function post(context,path,data){return context.request.post(origin+'/api/service/'+path,{headers,data});}
async function account(){
 const context=await browser.newContext({viewport:{width:1500,height:1000},locale:'ko-KR'}),email='display-'+randomUUID()+'@example.test';emails.push(email);cleanup.push(context);
 assert.equal((await post(context,'login-link',{email})).status(),202);const messages=await Promise.all((await readdir(mail)).map(file=>readFile(mail+'/'+file,'utf8'))),message=messages.find(m=>m.startsWith(email+'\n'));
 assert(message);const token=new URL(message.split('\n')[1]).hash.slice(7);assert.equal((await post(context,'login',{token})).status(),200);await ensurePrivateTestAccess(context,origin);return context;
}
async function purchase(context,kind){
 const zone={lantern:'Z02','wish-plaque':'Z08',votive:'Z07',memorial:'Z06',candle:'Z03'}[kind];
 const slots=(await (await context.request.get(origin+'/api/service/temples/sample:sasa/zones/'+zone+'/slots')).json()).slots;
 const slot=slots.find(s=>s.accepts===kind&&s.status==='free');assert(slot,'free '+kind);
 const offers=(await (await context.request.get(origin+'/api/service/offers')).json()).offers,offer=offers.find(o=>o.kind===kind&&o.days===7);assert(offer);
 const response=await post(context,'trade/enter',{slotId:slot.slotId,offerId:offer.id,revision:offer.revision,text:kind==='wish-plaque'?'나만의 소원 <b>평안</b>':'개인 전시 검수',tag:false,public:false});assert.equal(response.status(),202,await response.text());
 let hold;for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,120));const state=await (await context.request.get(origin+'/api/service/trade/hold')).json();if(state.hold){hold=state.hold;break;}}assert(hold,'reservation settled');
 const checkout=await post(context,'trade/checkout',{holdId:hold.id});assert.equal(checkout.status(),200,await checkout.text());const order=await checkout.json();
 const paid=await post(context,'trade/test-pay',{orderId:order.id});assert.equal(paid.status(),200,await paid.text());assert.equal((await paid.json()).status,'installed');return {orderId:order.id,slotId:slot.slotId,kind};
}
try{
 const a=await account(),b=await account(),bought=[];
 for(const kind of ['lantern','wish-plaque','votive','memorial','candle'])bought.push(await purchase(a,kind));
 const foreign=await purchase(b,'candle');
 const page=await a.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/compile|shader|TypeError/i.test(m.text()))errors.push(m.text());});
 await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});await page.waitForTimeout(3300);if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').first().click();
 async function enter(){await page.locator('#place').evaluate(el=>{el.value='personalGateWalk';el.dispatchEvent(new Event('change'));});await page.locator('#private-gate-action').waitFor();const response=page.waitForResponse(r=>r.url().endsWith('/private-room/enter')&&r.ok());await page.locator('#private-gate-action').click();const data=await (await response).json();await page.locator('#private-room-controls').waitFor();return data.roomId;}
 const roomId=await enter();await page.locator('#private-display-open').click();await page.locator('#private-display-item option').first().waitFor({state:'attached'});assert.equal(await page.locator('#private-display-item option').count(),5);
 const placements=[];const positions={lantern:'left-2-1','wish-plaque':'right-2-1',votive:'left-2-2',memorial:'left-2-3',candle:'right-2-2'};
 for(const item of bought){
  await page.locator('#private-display-item').selectOption(item.orderId);await page.locator('#private-display-position').selectOption(positions[item.kind]);const saved=page.waitForResponse(r=>r.url().endsWith('/private-room/display')&&r.request().method()==='POST');await page.locator('#private-display-place').click();const response=await saved;assert.equal(response.status(),200,await response.text());placements.push({slotId:positions[item.kind],orderId:item.orderId});
 }
 const get=()=>a.request.get(origin+'/api/service/private-room/display?roomId='+roomId);let snapshot=await (await get()).json();assert.equal(snapshot.placements.length,5);
 await page.locator('#private-display-close').click();await page.locator('[data-room-view=display]').click();await page.waitForTimeout(900);await page.screenshot({path:'evidence/private-display/lamps.jpg',quality:94});
 await page.locator('#private-display-open').click();await page.locator('#private-display-item').selectOption(bought.find(i=>i.kind==='candle').orderId);await page.locator('#private-display-position').selectOption('right-2-2');await page.locator('#private-display-close').click();await page.waitForTimeout(700);await page.screenshot({path:'evidence/private-display/plaque-candle.jpg',quality:94});
 // Other owners, fake positions and duplicate purchases cannot be persisted.
 const bRoom=(await (await post(b,'private-room/enter',{})).json()).roomId;
 assert.equal((await b.request.get(origin+'/api/service/private-room/display?roomId='+roomId)).status(),409);
 assert.equal((await post(a,'private-room/display',{roomId,revision:snapshot.revision,placements:[{slotId:'right-1-1',orderId:foreign.orderId}]})).status(),409);
 assert.equal((await post(a,'private-room/display',{roomId,revision:snapshot.revision,placements:[{slotId:'arbitrary-floor',orderId:bought[0].orderId}]})).status(),400);
 assert.equal((await post(a,'private-room/display',{roomId,revision:snapshot.revision,placements:[{slotId:'left-1-1',orderId:bought[0].orderId},{slotId:'left-1-2',orderId:bought[0].orderId}]})).status(),400);
 const bState=await (await b.request.get(origin+'/api/service/private-room/display?roomId='+bRoom)).json();assert.equal(bState.items.length,1);assert.equal(bState.placements.length,0);
 // A stale editor cannot overwrite the latest revision.
 assert.equal((await post(a,'private-room/display',{roomId,revision:snapshot.revision,placements:snapshot.placements})).status(),200);
 assert.equal((await post(a,'private-room/display',{roomId,revision:snapshot.revision,placements:[]})).status(),409);
 await post(b,'private-room/leave',{});await post(b,'me/delete',{confirm:true});await b.close();
 await page.locator('#private-room-exit').click();await page.locator('#private-room-controls').waitFor({state:'hidden'});await page.waitForTimeout(500);assert.equal(await enter(),roomId);
 snapshot=await (await get()).json();assert.equal(snapshot.placements.length,5);await page.locator('#private-display-open').click();await page.locator('#private-display-item option').first().waitFor({state:'attached'});
 // Move one item rather than duplicating it, then remove and put it back.
 await page.locator('#private-display-item').selectOption(bought[0].orderId);await page.locator('#private-display-position').selectOption('left-3-1');let save=page.waitForResponse(r=>r.url().endsWith('/private-room/display')&&r.request().method()==='POST');await page.locator('#private-display-place').click();assert.equal((await save).status(),200);
 snapshot=await (await get()).json();assert.equal(snapshot.placements.filter(p=>p.orderId===bought[0].orderId).length,1);assert(snapshot.placements.some(p=>p.orderId===bought[0].orderId&&p.slotId==='left-3-1'));
 save=page.waitForResponse(r=>r.url().endsWith('/private-room/display')&&r.request().method()==='POST');await page.locator('#private-display-remove').click();assert.equal((await save).status(),200);assert.equal((await (await get()).json()).placements.length,4);
 save=page.waitForResponse(r=>r.url().endsWith('/private-room/display')&&r.request().method()==='POST');await page.locator('#private-display-place').click();assert.equal((await save).status(),200);await page.locator('#private-display-close').click();
 await page.locator('#private-room-exit').click();await page.locator('#private-room-controls').waitFor({state:'hidden'});await page.reload();await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});await page.waitForTimeout(3300);assert.equal(await enter(),roomId);
 await page.locator('#private-display-open').click();await page.locator('#private-display-item option').first().waitFor({state:'attached'});assert.equal((await (await get()).json()).placements.length,5);await page.screenshot({path:'evidence/private-display/restored.jpg',quality:94});
 // Original public installations have not been moved or removed.
 const originals=(await (await a.request.get(origin+'/api/service/me/offerings')).json()).items;for(const item of bought){const row=originals.find(r=>r.orderId===item.orderId);assert.equal(row.status,'installed');assert.equal(row.slotId,item.slotId);}
 assert.deepEqual(errors,[]);const result={passed:true,allFivePurchasedKinds:true,save:true,reentryRestores:true,pageReloadRestores:true,moveWithoutDuplicate:true,remove:true,foreignPurchaseDenied:true,foreignRoomDenied:true,invalidPositionDenied:true,duplicateDenied:true,staleRevisionDenied:true,originalInstallationsUnchanged:true,pageErrors:errors};await writeFile('evidence/private-display/check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{for(const context of cleanup){try{await post(context,'me/delete',{confirm:true});}catch{}}await browser.close();}
