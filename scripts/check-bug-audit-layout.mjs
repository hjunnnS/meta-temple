import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {launchBrowser} from './browser.mjs';import {enterTrial,monitor} from './trial-helpers.mjs';
const out=process.env.LAYOUT_EVIDENCE??'evidence/bug-audit-v24/layout';await mkdir(out,{recursive:true});const browser=await launchBrowser({channel:'chrome'}),results=[];let page;
try{for(const locale of ['ko','en','de','ru']){
 const context=await browser.newContext({viewport:{width:430,height:932},hasTouch:true,isMobile:true,reducedMotion:'reduce'});page=await context.newPage();const checks=monitor(page);await enterTrial(page,locale);await page.locator('#guide-free').click();
 for(const [width,height] of [[320,740],[390,844],[430,932],[768,1024],[844,390]]){
  await page.setViewportSize({width,height});await page.locator('#spaces-open').click();await page.locator('[data-map-place=yaksa]').click();
  const r=await page.locator('#spaces-panel').evaluate(panel=>{const list=panel.querySelector('.service-place-list');return{horizontalOverflow:panel.scrollWidth>panel.clientWidth+1,listHeight:list.clientHeight,largestButton:Math.max(...[...list.querySelectorAll('button')].map(b=>b.clientHeight)),columns:getComputedStyle(list).gridTemplateColumns};});
  if(width===430||width===844)await page.screenshot({path:out+'/'+locale+'-'+width+'.jpg',quality:88});
  assert(!r.horizontalOverflow);assert(r.largestButton<=r.listHeight,'Unreadable map row '+locale+' '+width+' '+JSON.stringify(r));
  await page.locator('.service-place-detail>button').click();await page.locator('#spaces-panel').waitFor({state:'hidden'});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.activeElement.id),'world');results.push({locale,width,height,...r});
 }
 checks.assertClean();await context.close();console.log('PASS layout',locale);
}await writeFile(out+'/check.json',JSON.stringify({passed:true,results},null,2));}catch(e){await page?.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}finally{await browser.close();}
