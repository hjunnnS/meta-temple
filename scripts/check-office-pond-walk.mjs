import assert from 'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';
import{launchBrowser}from'./browser.mjs';import{enterTrial,exposeScene,go,monitor}from'./trial-helpers.mjs';
const out=process.env.BRIDGE_EVIDENCE??'evidence/office-pond-bridge/walk';await mkdir(out,{recursive:true});
const b=await launchBrowser({channel:'chrome'});
try{
 const p=await b.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),checks=monitor(p);await enterTrial(p);await exposeScene(p);await go(p,'office');
 const initial=await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray());assert(Math.abs(initial[2]+63.9)<.01,'office north landing');
 const legs=[],heightSamples=[];
 await p.evaluate(()=>{window.bridgeHeights=[];trialScene.onAfterRenderObservable.add(()=>{const v=trialScene.getTransformNodeByName('visitor').position;if(v.z>-62.8&&v.z<-40)bridgeHeights.push(v.asArray());});});
 async function walk(goal){const start=await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray()),length=Math.hypot(goal[0]-start[0],goal[1]-start[2]);await p.evaluate(({start,goal})=>{trialScene.activeCamera.alpha=Math.atan2(start[2]-goal[1],start[0]-goal[0]);trialScene.activeCamera.beta=1.32;},{start,goal});await p.locator('#world').focus();await p.keyboard.down('KeyW');try{await p.waitForFunction(g=>{const v=trialScene.getTransformNodeByName('visitor').position;return Math.hypot(v.x-g[0],v.z-g[1])<.18;},goal,{timeout:Math.ceil(length/3.3*1000)+4000});}catch(e){console.log('blocked',await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray()));throw e;}finally{await p.keyboard.up('KeyW');}legs.push({goal,start,position:await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray())});console.log('PASS bridge leg '+goal);}
 for(const g of [[35,-63.9],[44,-64.25],[44,-62],[44,-60],[44,-43],[44,-39],[44,-34],[48,-34],[44,-34],[44,-39],[44,-52]])await walk(g);
 const middle=await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray());assert(Math.abs(middle[1]-.78)<.02,'continuous deck');
 await p.evaluate(()=>{trialScene.activeCamera.alpha=-Math.PI/2;});await p.locator('#world').focus();await p.keyboard.down('KeyD');await p.waitForTimeout(850);await p.keyboard.up('KeyD');
 const rail=await p.evaluate(()=>trialScene.getTransformNodeByName('visitor').position.asArray());assert(rail[0]>44.8&&rail[0]<45.1,'railing blocks falling into pond');assert(Math.abs(rail[1]-.78)<.02);
 await p.screenshot({path:out+'/bridge-railing.jpg',quality:90});
 await walk([44,-52]);
 // Click an unobstructed plank ahead using its actual projected canvas coordinates.
 await p.evaluate(()=>{trialScene.activeCamera.alpha=-Math.PI/2;trialScene.activeCamera.beta=.86;trialScene.activeCamera.radius=6;});await p.waitForTimeout(150);
 const goal=[44,.78,-48.5],screen=await p.evaluate(goal=>{const s=trialScene,c=s.activeCamera,V=c.target.constructor,M=c.getWorldMatrix().constructor;const q=V.Project(new V(...goal),M.Identity(),s.getTransformMatrix(),c.viewport.toGlobal(s.getEngine().getRenderWidth(),s.getEngine().getRenderHeight())),r=document.querySelector('#world').getBoundingClientRect();return{x:r.x+q.x*r.width/s.getEngine().getRenderWidth(),y:r.y+q.y*r.height/s.getEngine().getRenderHeight()};},goal);
 await p.mouse.click(screen.x,screen.y);await p.waitForFunction(()=>document.querySelector('#world').dataset.pointWalk==='moving');await p.waitForFunction(()=>trialScene.getTransformNodeByName('visitor').position.z>-48.9,{},{timeout:6000});
 await p.screenshot({path:out+'/click-walk.jpg',quality:90});
 const samples=await p.evaluate(()=>bridgeHeights);assert(samples.some(p=>p[1]>.77));assert(samples.every(p=>p[1]>=.02));
 checks.assertClean();await writeFile(out+'/check.json',JSON.stringify({passed:true,url:process.env.TRIAL_URL??'local',initial,legs,midDeck:middle,railStops:rail,clickWalk:true,sampledFrames:samples.length,pageErrors:checks.errors,failedAssets:checks.failedAssets,apiNetworkRequests:checks.requests},null,2)+'\n');console.log('PASS office to pagoda walking, smooth bridge, rail clearance and click walking');
}finally{await b.close();}
