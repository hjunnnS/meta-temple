import assert from'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';
import{launchBrowser}from'./browser.mjs';import{enterTrial,exposeScene,go,monitor}from'./trial-helpers.mjs';
const out=process.env.BRIDGE_EVIDENCE??'evidence/office-pond-bridge/published';await mkdir(out,{recursive:true});const results=[],b=await launchBrowser({channel:'chrome'});
try{for(const touch of [false,true]){
 const c=await b.newContext({viewport:{width:touch?390:1440,height:touch?844:1000},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'}),p=await c.newPage(),checks=monitor(p);await enterTrial(p);await exposeScene(p);
 assert(await p.evaluate(()=>!!trialScene.getMaterialByName('pond-bridge-timber')),'new bridge source');await go(p,'office');
 const office=await p.evaluate(()=>({position:trialScene.getTransformNodeByName('visitor').position.asArray(),alpha:trialScene.activeCamera.alpha}));assert(Math.abs(office.position[2]+63.9)<.05);assert(Math.abs(office.alpha-Math.PI/2)<.02,'face office north entrance');
 await p.locator('#reception-panel').getByRole('button',{name:/^연등 ·/}).waitFor();await p.screenshot({path:out+'/'+(touch?'touch':'desktop')+'-office.jpg',quality:90});await p.locator('#offering-close').click();
 // The full route is separately walked from the office; this fixture isolates touch picking on the bridge.
 await p.evaluate(()=>{const v=trialScene.getTransformNodeByName('visitor');v.position.set(44,.78,-55);trialScene.activeCamera.alpha=-Math.PI/2;trialScene.activeCamera.beta=.86;});await p.waitForTimeout(250);
 const goal=[44,.78,-51.5],screen=await p.evaluate(goal=>{const s=trialScene,c=s.activeCamera,V=c.target.constructor,M=c.getWorldMatrix().constructor,q=V.Project(new V(...goal),M.Identity(),s.getTransformMatrix(),c.viewport.toGlobal(s.getEngine().getRenderWidth(),s.getEngine().getRenderHeight())),r=document.querySelector('#world').getBoundingClientRect();return{x:r.x+q.x*r.width/s.getEngine().getRenderWidth(),y:r.y+q.y*r.height/s.getEngine().getRenderHeight()};},goal);
 if(touch)await p.touchscreen.tap(screen.x,screen.y);else await p.mouse.click(screen.x,screen.y);
 await p.waitForFunction(()=>document.querySelector('#world').dataset.pointWalk==='moving');await p.waitForFunction(()=>trialScene.getTransformNodeByName('visitor').position.z>-51.8,{},{timeout:6000});
 const bridge=await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray());assert(Math.abs(bridge[1]-.78)<.02);
 await p.screenshot({path:out+'/'+(touch?'touch':'desktop')+'-bridge.jpg',quality:90});
 if(!touch){await p.locator('#place').evaluate(s=>{s.value='front';s.dispatchEvent(new Event('change'));});await p.evaluate(()=>{const c=trialScene.activeCamera,V=c.target.constructor;c.fov=.94;c.setTarget(new V(54,1,-49));c.setPosition(new V(36,3.2,-62));});await p.locator('#time').evaluate(el=>{el.value='night';el.dispatchEvent(new Event('change'));});await p.waitForTimeout(500);const raw=await p.locator('#world').evaluate(c=>c.toDataURL('image/png').split(',')[1]);await writeFile(out+'/night.png',Buffer.from(raw,'base64'));}
 checks.assertClean();results.push({touch,office,bridge,clickWalk:true,errors:checks.errors,failedAssets:checks.failedAssets,apiNetworkRequests:checks.requests});await c.close();
}await writeFile(out+'/check.json',JSON.stringify({passed:true,url:process.env.TRIAL_URL??'local',results},null,2)+'\n');console.log('PASS PC/touch office reception, north entrance view, bridge click walk and night scene');}finally{await b.close();}
