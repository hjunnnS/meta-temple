import assert from 'node:assert/strict';
import {prayerPlaceInfo} from '../src/prayer-place-info.ts';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {languages} from '../src/locales/languages.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342',out=process.env.SASA_EVIDENCE??'evidence/map-followup/selection';
const all=process.argv.includes('--locales'),trial=process.env.SASA_TRIAL==='1';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']}),results=[];let page;
try{
for(const [code,touch] of all?languages.map(([code])=>[code,code!=='ko']):[['ko',false],['ko',true]]){
 const context=await browser.newContext({viewport:{width:touch?320:1440,height:touch?740:900},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 page=await context.newPage();const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('/api/'))failed.push({url:r.url(),status:r.status()});});
 async function enter(first){await page.goto(origin);await page.locator('[data-locale="'+code+'"]').click();await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached',timeout:60000});if(await page.locator('#trial-notice button').isVisible())await page.locator('#trial-notice button').click();if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').click();}
 await enter(true);await page.locator('#spaces-open').click();
 const markers=page.locator('[data-map-place]');assert.equal(await markers.count(),22);
 const ids=await markers.evaluateAll(elements=>elements.map(el=>el.dataset.mapPlace));
 async function check(id){const marker=page.locator('[data-map-place="'+id+'"]'),list=page.locator('.service-place-list [data-place="'+id+'"]');
 assert.equal(await marker.getAttribute('aria-pressed'),'true');assert.equal(await list.getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('[data-map-place][aria-pressed=true]').count(),1);assert.equal(await page.locator('.service-place-list [aria-pressed=true]').count(),1);
 const label=await marker.getAttribute('aria-label');assert.equal(await list.textContent(),label);const titleText=await page.locator('.service-place-detail h3').textContent(),name=label.replace(/^\d+ · /,'');if(prayerPlaceInfo[id])assert(titleText.startsWith(name.slice(0,name.lastIndexOf(' · '))+' · '));else assert.equal(titleText,name);
 if(code!=='ko')assert(!/[가-힣]/.test(label),code+' untranslated marker');}
 for(const id of ids){const marker=page.locator('[data-map-place="'+id+'"]');await marker.scrollIntoViewIfNeeded();if(touch)await marker.tap();else await marker.click();await check(id);assert(await page.locator('#spaces-panel').isVisible());}
 for(const key of ['Enter',' ']){const marker=page.locator('[data-map-place=daeung]');await marker.focus();await page.keyboard.press(key);await check('daeung');}
 await page.locator('.service-place-list [data-place=tower]').click();await check('tower');
 await page.locator('[data-map-place=daeung]').scrollIntoViewIfNeeded();if(touch)await page.locator('[data-map-place=daeung]').tap();else await page.locator('[data-map-place=daeung]').click();await check('daeung');
 const dimensions=await page.locator('#spaces-panel').evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));assert(dimensions.scrollWidth<=dimensions.clientWidth+1);
 await page.screenshot({path:out+'/'+code+'-'+(touch?'touch':'desktop')+'.jpg',quality:88});
 await page.locator('.service-place-detail>button').click();await page.locator('#spaces-panel').waitFor({state:'hidden'});await page.waitForTimeout(150);assert.equal(await page.locator('#place').inputValue(),'walk');assert.equal(await page.evaluate(()=>document.activeElement.id),'world');await page.locator('#bow-start').waitFor({state:'attached'});
 await page.reload();assert.equal(await page.locator('[data-locale="'+code+'"]').getAttribute('aria-pressed'),'true');await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached',timeout:60000});if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').click();await page.locator('#spaces-open').click();await page.locator('[data-map-place=tower]').click();await check('tower');await page.keyboard.press('Escape');await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.activeElement.id),'spaces-open');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({locale:code,touch,markerCount:ids.length,allMarkersSelect:true,listAndMarkerAgree:true,keyboardEnterAndSpace:true,noNavigationUntilConfirmed:true,navigationAndFocus:true,languageRestored:true,returnVisitSelection:true,horizontalOverflow:false,errors,failed});console.log('PASS map',code,touch?'touch':'desktop');await context.close();
}
const html=await(await fetch(origin)).text();await writeFile(out+'/check.json',JSON.stringify({passed:true,origin,trial,entryDigest:createHash('sha256').update(html).digest('hex'),results},null,2));
}catch(e){await page?.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}finally{await browser.close();}
