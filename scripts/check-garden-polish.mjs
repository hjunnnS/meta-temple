import assert from 'node:assert/strict';import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';import {enterTrial,exposeScene,go,monitor} from './trial-helpers.mjs';
const out=process.env.GARDEN_EVIDENCE??'evidence/garden-polish',browser=await launchBrowser({channel:'chrome'});await mkdir(out,{recursive:true});let page;const results=[];
try{
for(const touch of[false,true]){
 const c=await browser.newContext({viewport:{width:touch?390:1440,height:touch?800:900},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});page=await c.newPage();const checks=monitor(page);await enterTrial(page);await exposeScene(page);await go(page,'bell');await page.locator('#visit-point[data-view=bellDetail]').waitFor();
 await page.evaluate(()=>{const c=trialScene.activeCamera;c.alpha=.62;c.beta=1.2;});await page.waitForTimeout(200);
 const pose=()=>page.evaluate(()=>({at:trialScene.getTransformNodeByName('visitor').position.asArray(),yaw:trialScene.getTransformNodeByName('visitor').rotation.y,alpha:trialScene.activeCamera.alpha,beta:trialScene.activeCamera.beta,radius:trialScene.activeCamera.radius}));
 const before=await pose();await page.locator('#visit-point').click();await page.locator('#inspection-exit').waitFor();assert.equal(await page.locator('#walk-pad').isVisible(),false);await page.waitForTimeout(250);await page.screenshot({path:out+'/'+(touch?'touch':'desktop')+'-inspection.jpg',quality:90});
 await page.locator('#inspection-exit').click();await page.locator('#walk-pad').waitFor();await page.waitForTimeout(200);const after=await pose();for(const key of['yaw','alpha','beta','radius'])assert(Math.abs(before[key]-after[key])<.015,key+' did not restore');assert.deepEqual(after.at,before.at);assert.equal(await page.evaluate(()=>document.activeElement.id),'world');
 for(const view of['forestBuddha','shrine','jijangInterior']){await page.locator('#place').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('change'));},view);await page.locator('#inspection-exit').waitFor();await page.locator('#inspection-exit').focus();await page.keyboard.press('Enter');await page.locator('#walk-pad').waitFor();assert.deepEqual((await pose()).at,before.at);}
 // Real ray/triangle intersections against actual merged plaques, not name-only proxy tests.
 const tests=[];
 for(const id of['daeung','gwaneum','jijang','indeung','office','sanctuary','gwaneumAltar','jijangInterior','votiveShelves']){
  if(['daeung','gwaneum','jijang','indeung','office'].includes(id))await go(page,id);else await page.locator('#place').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('change'));},id);if(await page.locator('#reception-panel').isVisible())await page.locator('#offering-close').click();await page.locator('#world').focus();for(let n=0;n<5;n++)await page.mouse.wheel(0,900);await page.waitForTimeout(100);
  const sample=await page.evaluate(async(id)=>{
   const s=trialScene,c=s.activeCamera,root=s.getTransformNodeByName('visitor'),V=c.position.constructor;
   const meshes=s.meshes.filter(m=>/architecture-(sign-material|plaque-)/.test(m.name));
   const triangles=meshes.flatMap(m=>{const p=m.getVerticesData('position'),ix=m.getIndices();const matrix=m.computeWorldMatrix(true);const t=[];for(let i=0;i<ix.length;i+=3)t.push([0,1,2].map(j=>V.TransformCoordinates(V.FromArray(p,ix[i+j]*3),matrix)));return t;});
   function hit(a,b,t){const d=b.subtract(a),e1=t[1].subtract(t[0]),e2=t[2].subtract(t[0]),p=V.Cross(d,e2),det=V.Dot(e1,p);if(Math.abs(det)<1e-8)return false;const q=a.subtract(t[0]),u=V.Dot(q,p)/det,r=V.Cross(q,e1),v=V.Dot(d,r)/det,f=V.Dot(e2,r)/det;return u>=0&&v>=0&&u+v<=1&&f>.001&&f<.999;}
   const original=root.position.clone(),states=[];
   // Use the actual entrance location and a nearby interior offset for each hall.
   for(const offset of[0,.7]){root.position.set(original.x,original.y,original.z+offset);
    for(const beta of[.18,.4,.8,1.2,1.55,2.0])for(let n=0;n<12;n++){
     c.alpha=n*Math.PI/6;c.beta=beta;c.radius=11;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
     const origin=c.target.clone(),eye=c.position.clone();states.push({alpha:c.alpha,beta:c.beta,radius:c.radius,position:eye.asArray(),hits:triangles.some(t=>hit(origin,eye,t))});
    }}root.position.copyFrom(original);return {id,samples:states.length,intersections:states.filter(x=>x.hits),minRadius:Math.min(...states.map(x=>x.radius))};
  },id);tests.push(sample);assert.deepEqual(sample.intersections,[],id+' camera crossed a plaque');console.log('PASS camera',id,sample.samples);
 }
 await go(page,'daeung');await page.evaluate(()=>{trialScene.activeCamera.alpha=Math.PI/2;trialScene.activeCamera.beta=1.26;});await page.locator('#world').focus();await page.keyboard.down('KeyW');await page.waitForTimeout(4500);await page.keyboard.up('KeyW');const exit=await pose();assert(exit.at[2]<29.5,'Main hall exit blocked');
 if(process.env.SASA_CANONICAL==='1'){assert.deepEqual(checks.errors,[]);assert.deepEqual(checks.failedAssets.filter(x=>!new URL(x.url).pathname.startsWith('/api/')),[]);}else checks.assertClean();results.push({touch,inspectionBefore:before,inspectionAfter:after,inspectionRestoresPositionDirectionZoom:true,otherInspectionsReturn:true,keyboardReturn:true,halls:tests,mainHallExit:exit.at,errors:checks.errors});await c.close();
}
await writeFile(out+'/check.json',JSON.stringify({passed:true,results},null,2));
}catch(e){await page?.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}finally{await browser.close();}
