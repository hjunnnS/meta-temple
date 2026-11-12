import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import('/Users/hjunnn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const origin=process.env.SASA_URL??'http://127.0.0.1:4355';
const out='evidence/rear-prayer-expansion';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu']});let p;
try{
 p=await b.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1,reducedMotion:'reduce'});
 const errors=[],apiRequests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push(r.url());});
 await p.addInitScript(()=>{localStorage.setItem('sasa:guide-seen','1');localStorage.setItem('sasa:language','ko');});
 await p.goto(origin);await p.locator('.enter-temple').click();await p.locator('.entry-overlay').waitFor({state:'detached',timeout:60000});await p.waitForFunction(()=>document.body.dataset.ready==='true');if(await p.locator('#trial-notice button').isVisible())await p.locator('#trial-notice button').click();
 await p.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/engineStore-')).name;const mod=await import(url);const store=Object.values(mod).find(x=>Array.isArray(x?.Instances));window.rearScene=store.Instances[0].scenes[0];});
 async function view(name){await p.evaluate(name=>{const s=document.querySelector('#place');s.value=name;if(s.value!==name)throw Error('missing view '+name);s.dispatchEvent(new Event('change',{bubbles:true}));},name);await p.waitForTimeout(650);}
 await view('map');await p.locator('#world').screenshot({path:out+'/map.png'});
 for(const name of ['rearPrayerWest','rearPrayerMunsu','rearPrayerNorth','rearPrayerEast','yaksaInterior','munsuInterior','bohyeonInterior','geukrakInterior']){await view(name);await p.locator('#world').screenshot({path:out+'/'+name+'.png'});}
 const results=[];
 for(const hall of [{id:'yaksa',yaw:-Math.PI/2},{id:'munsu',yaw:0},{id:'bohyeon',yaw:0},{id:'geukrak',yaw:Math.PI/2}]){
  await p.locator('#spaces-open').click();await p.locator('[data-place='+hall.id+']').click();await p.locator('.service-place-detail>button').click();await p.waitForTimeout(200);
  const start=await p.evaluate(()=>rearScene.getTransformNodeByName('visitor').position.asArray());
  assert(start[1]>.8,'must arrive on the actual hall floor');
  await p.locator('#practice-context').waitFor({state:'visible'});await p.locator('#practice-context').click();await p.locator('#practice-bow').click();await p.waitForTimeout(200);
  assert.equal(await p.locator('#walk-pad').getAttribute('data-practice'),'bow');await p.locator('#prayer-point').click();
  await p.evaluate(alpha=>{rearScene.activeCamera.alpha=alpha;rearScene.activeCamera.beta=1.35;},-Math.PI/2-hall.yaw);
  await p.locator('#world').focus();await p.keyboard.down('KeyS');await p.waitForTimeout(3000);await p.keyboard.up('KeyS');
  const outside=await p.evaluate(()=>rearScene.getTransformNodeByName('visitor').position.asArray());assert(outside[1]<.3,'exit via actual stairs: '+hall.id+' '+outside);
  const click=await p.evaluate(at=>{const c=rearScene.activeCamera,V=c.target.constructor,M=rearScene.getTransformMatrix().constructor;const q=V.Project(new V(...at),M.Identity(),rearScene.getTransformMatrix(),c.viewport.toGlobal(rearScene.getEngine().getRenderWidth(),rearScene.getEngine().getRenderHeight()));return {x:q.x,y:q.y};},start);
  await p.mouse.click(click.x,click.y);
  await p.waitForFunction(at=>{const p=rearScene.getTransformNodeByName('visitor').position;return Math.hypot(p.x-at[0],p.z-at[2])<.3;},start,{timeout:12000});await p.waitForTimeout(100);
  const returned=await p.evaluate(()=>rearScene.getTransformNodeByName('visitor').position.asArray());assert(returned[1]>.8,'reenter via actual stairs: '+hall.id+' '+returned);
  assert(Math.hypot(returned[0]-start[0],returned[2]-start[2])<1.5,'return to same aisle');
  await p.mouse.move(800,550);await p.mouse.wheel(0,5000);await p.waitForTimeout(100);
  const cameraSamples=await p.evaluate(async()=>{
   const c=rearScene.activeCamera,results=[];
   for(const alpha of [-Math.PI/2,0,Math.PI/2,Math.PI])for(const beta of [.16,.35,.7,1.1,1.5,2.0]){
    c.alpha=alpha;c.beta=beta;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));results.push({alpha,beta,position:c.position.asArray(),radius:c.radius});
   }return results;
  });
  assert(cameraSamples.every(s=>s.position.every(Number.isFinite)&&s.radius>0&&s.radius<=11.01&&s.position[1]<4.7),'camera must stay below the roof underside');
  await p.evaluate(alpha=>{rearScene.activeCamera.alpha=alpha;rearScene.activeCamera.beta=1.35;},-Math.PI/2-hall.yaw);
  results.push({id:hall.id,arrival:start,exit:outside,return:returned,cameraSamples});console.log('PASS stairs, prayer, zoom: '+hall.id);
 }
 await p.evaluate(()=>{const s=document.querySelector('#time');s.value='night';s.dispatchEvent(new Event('change',{bubbles:true}));});
 for(const name of ['rearPrayerWest','rearPrayerNorth','yaksaInterior','geukrakInterior']){await view(name);await p.locator('#world').screenshot({path:out+'/night-'+name+'.png'});}
 await p.evaluate(()=>{const s=document.querySelector('#time');s.value='day';s.dispatchEvent(new Event('change',{bubbles:true}));});
 const state=await p.evaluate(()=>({camera:rearScene.activeCamera.position.asArray(),meshes:rearScene.meshes.length,vertices:rearScene.getTotalVertices(),materials:rearScene.materials.map(m=>m.name),fps:rearScene.getEngine().getFps()}));
 assert.deepEqual(errors,[]);assert.deepEqual(apiRequests,[]);await writeFile(out+'/first-view.json',JSON.stringify({passed:true,results,state,errors,apiRequests},null,2));console.log(JSON.stringify({passed:true,meshes:state.meshes,vertices:state.vertices,fps:state.fps}));
}catch(e){await p?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await b.close();}
