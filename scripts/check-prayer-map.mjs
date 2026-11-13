import assert from 'node:assert/strict';import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';import {enterTrial,exposeScene,monitor} from './trial-helpers.mjs';
import {languages} from '../src/locales/languages.ts';import {prayerPlaceInfo} from '../src/prayer-place-info.ts';import {rearPrayerHalls,prayerHallPoint,prayerAisleX} from '../src/prayer-halls.ts';import {templePlaces} from '../src/temple-layout.ts';
const out=process.env.PRAYER_MAP_EVIDENCE??'evidence/prayer-map';await mkdir(out,{recursive:true});const browser=await launchBrowser({channel:'chrome'}),results=[];let page;
try{
for(const [language,touch] of [...languages.map(([id])=>[id,id!=='ko']),['ko',true]]){
 const context=await browser.newContext({viewport:{width:touch?320:1440,height:touch?740:960},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
 page=await context.newPage();const checks=monitor(page),dictionary=language==='ko'?{}:JSON.parse(await readFile(new URL('../src/locales/'+language+'.json',import.meta.url),'utf8')),tr=s=>dictionary[s]??s;
 await enterTrial(page,language);await exposeScene(page);await page.locator('#guide-free').click();
 assert.equal(await page.evaluate(async()=>(await fetch('/api/service/me')).status),401);
 const keys=JSON.parse(await readFile(new URL('../docs/prayer-map-translation-keys.json',import.meta.url),'utf8'));
 for(const key of keys)if(language!=='ko')assert(dictionary[key]?.trim(),language+' '+key);
 for(const [index,[id,info]] of Object.entries(prayerPlaceInfo).entries()){
  await page.locator('#spaces-open').click();const list=page.locator('.service-place-list [data-place="'+id+'"]');assert((await list.innerText()).includes(tr(info.topic)));
  if(index%2)await page.locator('[data-map-place="'+id+'"]').click();else await list.click();
  assert((await page.locator('.service-place-detail h3').innerText()).includes(tr(info.deity)));
  assert.equal(await page.locator('.service-place-detail p').innerText(),tr(info.description));
  assert((await page.locator('.service-prayer-topic').innerText()).includes(tr('대표적인 기도 주제')));
  if(language!=='ko')assert(!/[가-힣]/u.test(await page.locator('.service-place-detail').innerText()));
  for(const selector of ['#spaces-panel','.service-place-list','.service-place-detail'])assert(await page.locator(selector).evaluate(e=>e.scrollWidth<=e.clientWidth+1),language+' overflow '+selector);
  if(id==='yaksa'&&['ko','de','en'].includes(language))await page.screenshot({path:out+'/'+language+'-'+(touch?'touch':'desktop')+'.jpg',quality:90});
  await page.locator('.service-place-detail>button').click();await page.locator('#spaces-panel').waitFor({state:'hidden'});assert.equal(await page.locator('#place').inputValue(),'walk');
  const rear=rearPrayerHalls.find(h=>h.id===id),side=templePlaces.find(h=>h.id===id),expected=rear?prayerHallPoint(rear,prayerAisleX,-1.1):[side.x,side.z-(id==='jijang'?1.125:0)];
  await page.waitForFunction(([x,z])=>{const p=trialScene.getTransformNodeByName('visitor').position;return Math.hypot(p.x-x,p.z-z)<.4;},expected);
 }
 await page.locator('#spaces-open').click();await page.locator('[data-map-place=bell]').click();assert(await page.locator('.service-prayer-topic').isHidden());await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'spaces-open');assert.equal(await page.evaluate(async()=>(await fetch('/api/service/me')).status),401);
 checks.assertClean();results.push({language,touch,sixTopics:true,sixDeities:true,sixDescriptions:true,sixArrivals:true,guest:true,noHorizontalOverflow:true,errors:checks.errors});console.log('PASS prayer map',language,touch?'320px touch':'desktop');await context.close();
}
await writeFile(out+'/check.json',JSON.stringify({passed:true,results},null,2));
}catch(e){await page?.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}finally{await browser.close();}
