import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
import {enterTrial,exposeScene,go,monitor} from './trial-helpers.mjs';
import {groveTrees} from '../src/woodland-groups.ts';
const url=process.env.TRIAL_URL;
assert(url&&url.startsWith('https://'),'Set the deployed HTTPS URL');
const out='evidence/woodland-groups/published';await mkdir(out,{recursive:true});
const browser=await launchBrowser({channel:'chrome'}),results=[];
try{
 for(const touch of [false,true]){
  const context=await browser.newContext({viewport:{width:touch?390:1440,height:touch?800:1000},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
  const p=await context.newPage(),checks=monitor(p);await enterTrial(p,touch?'en':'ko');await exposeScene(p);
  const initial=await p.evaluate(()=>({materials:trialScene.materials.map(m=>m.name),walls:trialScene.meshes.filter(m=>m.name==='architecture-warm-wall-plaster').map(m=>{m.computeWorldMatrix(true);return m.getBoundingInfo().boundingBox.maximumWorld.asArray();})}));
  assert(initial.materials.includes('garden-grove-litter'),'grove ground material');
  const roots=await p.evaluate(()=>trialScene.meshes.filter(m=>m.name==='meditation-tree').map(m=>m.position.asArray()));
  assert.equal(roots.length,33);for(const t of groveTrees)assert(roots.some(p=>Math.abs(p[0]-t.x)<.01&&Math.abs(p[2]-t.z)<.01),'grove root '+t.group);
  for(const id of ['yaksa','munsu','bohyeon','geukrak'])assert(initial.materials.includes(id+'-gilded-bronze'),'new shrine material '+id);
  assert(initial.walls.some(max=>max[0]>95&&max[2]>115),'expanded enclosing wall');
  await p.locator('#spaces-open').click();assert.equal(await p.locator('[data-map-place]').count(),22);await p.screenshot({path:out+'/'+(touch?'touch':'desktop')+'-map.jpg',quality:90});await p.keyboard.press('Escape');
  const visits=[];
  for(const id of ['yaksa','munsu','bohyeon','geukrak']){
   await go(p,id);const position=await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray());assert(position[1]>.8,'hall floor '+id);
   await p.locator('#practice-context').waitFor({state:'visible'});await p.locator('#practice-context').click();await p.locator('#practice-bow').click();await p.waitForTimeout(150);assert.equal(await p.locator('#walk-pad').getAttribute('data-practice'),'bow');await p.locator('#prayer-point').click();
   visits.push({id,position,guestPrayer:true});
  }
  await p.locator('#place').evaluate(el=>{el.value='rearPrayerNorth';el.dispatchEvent(new Event('change'));});await p.waitForTimeout(400);await p.screenshot({path:out+'/'+(touch?'touch':'desktop')+'-walk.jpg',quality:91});
  checks.assertClean();results.push({touch,locale:touch?'en':'ko',markerCount:22,expandedWall:true,fourNewShrines:true,guestVisits:visits,apiNetworkRequests:checks.requests,pageErrors:checks.errors,failedAssets:checks.failedAssets});await context.close();
 }
 await writeFile(out+'/check.json',JSON.stringify({passed:true,url,results},null,2)+'\n');console.log('PASS published 33 grouped trees, grove ground, map and four-hall guest prayer on desktop/touch');
}finally{await browser.close();}
