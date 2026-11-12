import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import('/Users/hjunnn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const origin=process.env.SASA_URL??'http://127.0.0.1:4364',phase=process.env.GROVE_PHASE??'after';
const out='evidence/woodland-groups/'+phase;await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu']});let page;
try{
 const p=page=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('sasa:guide-seen','1');localStorage.setItem('sasa:language','ko');});
 await p.goto(origin);await p.locator('.enter-temple').click();await p.locator('.entry-overlay').waitFor({state:'detached',timeout:60000});
 if(await p.locator('#trial-notice button').isVisible())await p.locator('#trial-notice button').click();
 await p.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/engineStore-')).name;const store=Object.values(await import(url)).find(x=>Array.isArray(x?.Instances));window.groveScene=store.Instances[0].scenes[0];});
 async function shot(name,frame){
  await p.locator('#place').evaluate((s,name)=>{s.value=name;s.dispatchEvent(new Event('change'));},frame?'front':'map');
  if(frame)await p.evaluate(a=>{const c=groveScene.activeCamera,V=c.target.constructor;c.fov=.92;c.setTarget(new V(a[3],a[4],a[5]));c.setPosition(new V(a[0],a[1],a[2]));},frame);
  await p.waitForTimeout(600);const raw=await p.locator('#world').evaluate(c=>c.toDataURL('image/png').split(',')[1]);await writeFile(out+'/'+name+'.png',Buffer.from(raw,'base64'));
 }
 await shot('map');
 for(const[name,frame]of[
  ['daeung-bamboo',[-30.5,1.8,66,-20.5,2.8,59]],
  ['north-maples',[6,1.8,91,6,3.0,104]],
  ['east-maples',[74,1.8,61,88.5,2.7,49]],
  ['east-court',[40,1.8,-7,63,2.7,3]],
 ])await shot(name,frame);
 const result=await p.evaluate(()=>({totalVertices:groveScene.getTotalVertices(),meshes:groveScene.meshes.length,gardenBatches:groveScene.meshes.filter(m=>m.name.startsWith('architecture-garden-')).map(m=>({name:m.name,vertices:m.getTotalVertices()})),treeInstances:groveScene.meshes.filter(m=>m.name.startsWith('interior-seasonal-tree-lod-')).map(m=>({name:m.name,instances:m.thinInstanceCount,vertices:m.getTotalVertices()}))}));
 assert.deepEqual(errors,[]);await writeFile(out+'/check.json',JSON.stringify({passed:true,phase,origin,errors,...result},null,2));console.log(JSON.stringify({passed:true,phase,vertices:result.totalVertices,gardenBatches:result.gardenBatches.length}));
}catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await b.close();}
