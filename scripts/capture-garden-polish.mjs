import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
import {enterTrial,exposeScene} from './trial-helpers.mjs';
const phase=process.argv[2]??'after',out='evidence/garden-polish/'+phase;await mkdir(out,{recursive:true});
const browser=await launchBrowser({channel:'chrome'});try{const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await enterTrial(p);await exposeScene(p);
const frames={bell:[[-17,3.3,-37],[-33,1,-51]],wall:[[-17,2.5,-47],[-35,1.2,-47]],east:[[39,6,-17],[70,1.4,-3]],memorial:[[21,2,-11],[27,1,-6]],bamboo:[[42,4.8,31],[27,3,52]],rear:[[12,4.2,61],[-12,2,73]],overview:[[21,155,-110],[15,0,0]]};
await p.locator('#place').evaluate(el=>{el.value='wide';el.dispatchEvent(new Event('change'));});
const clean=await p.addStyleTag({content:'header,#service-dock,#context-actions,#trial-notice,.ceremony-board,footer,.stage,.place-picker,#inspection-exit{visibility:hidden!important}'});
for(const[name,[eye,target]]of Object.entries(frames)){await p.evaluate(({eye,target})=>{const s=trialScene,c=s.activeCamera,V=c.position.constructor;c.fov=.88;c.setTarget(new V(...target));c.setPosition(new V(...eye));}, {eye,target});await p.waitForTimeout(500);await p.screenshot({path:out+'/'+name+'.jpg',quality:92});}
await writeFile(out+'/frames.json',JSON.stringify(frames,null,2));await clean.evaluate(el=>el.remove());}finally{await browser.close();}
