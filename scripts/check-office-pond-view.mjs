import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
import {enterTrial,exposeScene,monitor} from './trial-helpers.mjs';
const phase=process.env.BRIDGE_PHASE??'after',out='evidence/office-pond-bridge/'+phase;await mkdir(out,{recursive:true});
const b=await launchBrowser({channel:'chrome'});
try{
 const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),checks=monitor(p);await enterTrial(p);await exposeScene(p);
 async function shot(name,a){await p.locator('#place').evaluate(s=>{s.value='front';s.dispatchEvent(new Event('change'));});await p.evaluate(a=>{const c=trialScene.activeCamera,V=c.target.constructor;c.fov=.94;c.setTarget(new V(...a.slice(3)));c.setPosition(new V(...a.slice(0,3)));},a);await p.waitForTimeout(500);const raw=await p.locator('#world').evaluate(c=>c.toDataURL('image/png').split(',')[1]);await writeFile(out+'/'+name+'.png',Buffer.from(raw,'base64'));}
 await shot('layout',[46,86,-59,44,0,-49]);await shot('pond',[36,3.2,-62,54,1,-49]);await shot('entrance',[6,1.7,-45,43,2.5,-53]);await shot('bridge',[44,2,-66,46,1.1,-47]);checks.assertClean();await writeFile(out+'/check.json',JSON.stringify({passed:true,phase,errors:checks.errors},null,2));
}finally{await b.close();}
