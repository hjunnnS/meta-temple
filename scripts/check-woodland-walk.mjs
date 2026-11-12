import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {groveTrees} from '../src/woodland-groups.ts';
const {chromium}=await import('/Users/hjunnn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342',out=process.env.GROVE_EVIDENCE??'evidence/woodland-groups/walk';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu']});let page;
try{
 const p=page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('sasa:guide-seen','1');localStorage.setItem('sasa:language','ko');});await p.goto(origin);await p.locator('.enter-temple').click();await p.locator('.entry-overlay').waitFor({state:'detached',timeout:60000});
 if(await p.locator('#trial-notice button').isVisible())await p.locator('#trial-notice button').click();
 await p.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/engineStore-')).name;const store=Object.values(await import(url)).find(x=>Array.isArray(x?.Instances));window.groveScene=store.Instances[0].scenes[0];});
 async function go(id){await p.locator('#spaces-open').click();await p.locator('[data-place='+id+']').click();await p.locator('.service-place-detail>button').click();await p.waitForTimeout(250);}
 await go('walk');
 const nodes=[[-24,73],[-24,65],[-32,65],[-32,68],[-22,86],[6,91],[40,89],[74,86],[74,62],[71,47],[59,47],[59,49]],legs=[];
 for(const goal of nodes){
  const start=await p.evaluate(()=>groveScene.getTransformNodeByName('visitor').position.asArray());const length=Math.hypot(goal[0]-start[0],goal[1]-start[2]);
  await p.evaluate(({start,goal})=>{groveScene.activeCamera.alpha=Math.atan2(start[2]-goal[1],start[0]-goal[0]);groveScene.activeCamera.beta=1.32;},{start,goal});
  await p.locator('#world').focus();await p.keyboard.down('KeyW');
  try{await p.waitForFunction(goal=>{const p=groveScene.getTransformNodeByName('visitor').position;return Math.hypot(p.x-goal[0],p.z-goal[1])<.25;},goal,{timeout:Math.ceil(length/3.3*1000)+3500});}finally{await p.keyboard.up('KeyW');}
  const position=await p.evaluate(()=>groveScene.getTransformNodeByName('visitor').position.asArray());legs.push({goal,start,position,length});console.log('PASS woodland walking leg '+goal);
 }
 for(const id of ['yaksa','munsu','bohyeon','geukrak']){await go(id);await p.locator('#practice-context').click();await p.locator('#practice-bow').click();await p.waitForTimeout(150);assert.equal(await p.locator('#walk-pad').getAttribute('data-practice'),'bow');await p.locator('#prayer-point').click();}
 const roots=await p.evaluate(()=>groveScene.meshes.filter(m=>m.name==='meditation-tree'&&!m.isVisible).map(m=>({x:m.position.x,z:m.position.z})));
 for(const expected of groveTrees)assert(roots.some(p=>Math.hypot(p.x-expected.x,p.z-expected.z)<.001),'physical grouped trunk '+expected.group);
 assert.deepEqual(errors,[]);await writeFile(out+'/check.json',JSON.stringify({passed:true,origin,walkingMetres:legs.reduce((s,l)=>s+l.length,0),legs,fourShrinesUsable:true,allGroupedTrunksHaveColliders:true,errors},null,2)+'\n');console.log('PASS full rear loop and four hall prayer approaches');
}catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await browser.close();}
