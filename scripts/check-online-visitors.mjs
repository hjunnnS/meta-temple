import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
import {enterTrial,exposeScene,go} from './trial-helpers.mjs';
const out=process.env.ONLINE_EVIDENCE??'evidence/online-visitors/local';await mkdir(out,{recursive:true});
const browsers=[],contexts=[],pages=[],errors=[];
const badge=p=>p.locator('#online-visitors');
async function count(p,n){await p.bringToFront();await p.waitForFunction(n=>document.querySelector('#online-visitors')?.textContent===n+'명 접속 중',n,{timeout:20000});}
async function layout(p){const boxes=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};};return{badge:rect('#online-visitors'),brand:rect('.brand'),menu:rect('#menu-open'),width:innerWidth};});assert(boxes.badge.x>=0&&boxes.badge.right<=boxes.width);assert(boxes.badge.x>=boxes.brand.right);assert(boxes.badge.right<=boxes.menu.x);return boxes;}
try{
 for(let i=0;i<3;i++){
  const b=await launchBrowser({channel:'chrome'});browsers.push(b);const c=await b.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});contexts.push(c);const p=await c.newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));await enterTrial(p);if(await p.locator('#guide-free').isVisible())await p.locator('#guide-free').click();await exposeScene(p);
  await p.locator('#menu-open').click();await p.locator('#settings').click();await p.locator('#settings-panel select').filter({has:p.locator('option[value="3"]')}).selectOption('3');await p.locator('#close-settings').click();await count(p,i+1);console.log('Visible real channel count:',i+1);
 }
 for(const p of pages)await count(p,3);await layout(pages[0]);assert.equal(await pages[0].evaluate(()=>trialScene.metadata.ambientPopulation.target),17);
 await pages[0].screenshot({path:out+'/desktop.jpg',quality:90});
 await contexts[1].setOffline(true);await pages[1].waitForFunction(()=>document.querySelector('#online-visitors')?.dataset.state==='connecting');assert(!/명 접속 중/.test(await badge(pages[1]).textContent()));await count(pages[0],2);await contexts[1].setOffline(false);await count(pages[0],3);await count(pages[1],3);
 await contexts[2].close();await count(pages[0],2);await contexts[1].close();await count(pages[0],1);
 const mobile=[];for(const size of[{width:320,height:740},{width:390,height:844},{width:740,height:320}]){await pages[0].setViewportSize(size);await pages[0].waitForTimeout(250);mobile.push({size,boxes:await layout(pages[0])});await pages[0].screenshot({path:out+'/'+size.width+'x'+size.height+'.jpg',quality:90});}
 await pages[0].setViewportSize({width:1280,height:800});await go(pages[0],'private');await pages[0].locator('#private-gate-action').click();await pages[0].locator('#trial-start').click();await pages[0].locator('#private-room-exit').waitFor();await badge(pages[0]).waitFor({state:'hidden'});await pages[0].locator('#private-room-exit').click();await count(pages[0],1);
 assert.deepEqual(errors,[]);await writeFile(out+'/result.json',JSON.stringify({passed:true,counts:[1,2,3,2,1],ambientExcluded:true,includesSelf:true,offlineShowsStatus:true,reconnect:true,privateHidden:true,privateReturn:true,mobile,errors},null,2));console.log('PASS online badge: 1/2/3, departure, offline, private space and narrow layouts');
}finally{await Promise.allSettled(contexts.map(c=>c.close()));await Promise.allSettled(browsers.map(b=>b.close()));}
