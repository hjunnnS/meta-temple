import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
import {enterTrial,exposeScene,go,monitor} from './trial-helpers.mjs';
const out=process.env.M6_INTEGRATION_EVIDENCE??'evidence/m5-integration';await mkdir(out,{recursive:true});
const b=await launchBrowser({channel:'chrome'});let p;
try{
 p=await b.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce',recordVideo:{dir:out+'/video',size:{width:1280,height:854}}});const checks=monitor(p);
 await enterTrial(p);await exposeScene(p);
 await p.locator('#guide-with-monk').click();await p.locator('#guide-course-health').click();
 await p.locator('#guide-next').click();await p.locator('#guide-map').click();await p.locator('.service-place-detail>button').click();
 await p.waitForFunction(()=>!document.querySelector('#guide-next').disabled);await p.locator('#guide-next').click();await p.locator('#guide-skip').click();
 await p.locator('#guide-108').click();await p.locator('#trial-start').click();await p.waitForFunction(()=>/^0 \/ 108/.test(document.querySelector('#bow-count').textContent));
 await p.locator('#guide-stop-practice').click();
 await p.evaluate(()=>{const original=window.fetch;window.lateStarts=[];window.lateCancels=[];window.fetch=async function(input,init){const url=String(input);const response=await original.call(this,input,init);if(url.endsWith('/practice/start')){const data=await response.clone().json();lateStarts.push(data.id);await new Promise(r=>setTimeout(r,650));}if(url.endsWith('/practice/cancel'))lateCancels.push(JSON.parse(init.body).id);return response;};});
 await p.locator('#guide-108').click();await p.locator('#guide-exit').click();
 await p.waitForFunction(()=>lateStarts.length===1&&lateCancels.includes(lateStarts[0]));assert(await p.locator('#guide-card').isHidden());
 await p.locator('#menu-open').click();await p.locator('#guide-open').click();await p.locator('#guide-course-family').click();
 await go(p,'private');await p.locator('#private-gate-action').click();await p.locator('#private-room-exit').waitFor();
 assert(await p.locator('#guide-card').isHidden());assert(await p.locator('#guide-monk-caption').isHidden());
 await p.screenshot({path:out+'/private-suspended.jpg',quality:90});
 await p.locator('#private-room-exit').click();await p.locator('#guide-card').waitFor();
 assert.equal(await p.locator('#guide-card').getAttribute('data-course'),'family');assert.equal(await p.locator('#guide-card').getAttribute('data-stage'),'prepare');
 await p.locator('#guide-exit').click();checks.assertClean();
 await writeFile(out+'/check.json',JSON.stringify({passed:true,late108StartCancelled:true,privateRoomSuspendsGuide:true,returnPreservesCourseAndStage:true,errors:checks.errors},null,2));
 console.log('PASS late 108 response cancellation and private room guide suspension/resume');
}catch(e){await p?.screenshot({path:out+'/failure.jpg'});throw e;}finally{await b.close();}
