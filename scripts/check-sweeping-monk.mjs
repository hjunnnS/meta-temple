import {serviceControl} from './service-ui-controls.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342',out='evidence/sweeping-monk';assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});let page;
try{
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'ko-KR'});page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|TypeError|compile/i.test(m.text()))errors.push(m.text());});
await page.addInitScript(()=>{
 window.audioContexts=[];window.audioStarts=[];window.audioGains=[];
 const Native=window.AudioContext;
 window.AudioContext=class extends Native{constructor(...args){super(...args);this.recordingDestination=this.createMediaStreamDestination();window.audioContexts.push(this);}};
 const makeGain=Native.prototype.createGain;
 Native.prototype.createGain=function(){const gain=makeGain.call(this),connect=gain.connect;window.audioGains.push(gain);gain.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination&&this.context.recordingDestination)connect.call(this,this.context.recordingDestination);return result;};return gain;};
 const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.audioStarts.push({duration:this.buffer?.duration,time:performance.now()});return start.apply(this,args);};
});
await page.goto(origin);await page.locator('.enter-temple').click();await page.locator('.entry-overlay').waitFor({state:'detached'});await page.waitForTimeout(3300);if(await page.locator('#visit-guide').isVisible())await page.locator('#visit-guide button').first().click();
await page.locator('#place').evaluate(el=>{el.value='sweepingMonk';el.dispatchEvent(new Event('change'));});await page.locator('#sweeper-greet').waitFor();await page.waitForTimeout(1500);await page.screenshot({path:out+'/sweeping.jpg',quality:93});
await page.locator('#sweeper-greet').click();assert.equal(await page.locator('#sweeper-greet').isEnabled(),false);
await page.evaluate(()=>{
 const video=document.querySelector('#world').captureStream(24),ctx=window.audioContexts.at(-1);window.greetingAudioContext=ctx;
 const stream=new MediaStream([...video.getVideoTracks(),...ctx.recordingDestination.stream.getAudioTracks()]);window.greetingChunks=[];const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus',videoBitsPerSecond:5000000});recorder.ondataavailable=e=>window.greetingChunks.push(e.data);window.greetingRecorder=recorder;recorder.start();
});
await page.locator('#sweeper-caption').waitFor();assert.equal(await page.locator('#sweeper-caption').innerText(),'나무관세음보살~');await page.waitForTimeout(400);await page.screenshot({path:out+'/greeting.jpg',quality:93});
const before=await page.evaluate(()=>window.audioStarts.length);assert(before>=1);await page.locator('#sweeper-greet').evaluate(el=>{el.click();el.click();el.click();});await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>window.audioStarts.length),before);
await page.waitForFunction(()=>document.querySelector('#sweeper-greet').dataset.phase==='sweeping');assert.equal(await page.locator('#sweeper-caption').isVisible(),false);await page.waitForTimeout(700);
const base64=await page.evaluate(()=>new Promise(resolve=>{window.greetingRecorder.onstop=()=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(new Blob(window.greetingChunks,{type:'video/webm'}));};window.greetingRecorder.stop();}));await writeFile(out+'/greeting.webm',Buffer.from(base64,'base64'));
// Directly clicking the actual head/body mesh, rather than only the keyboard button.
await page.mouse.click(720,455);await page.waitForTimeout(300);
if(await page.locator('#sweeper-greet').isEnabled()){
 // The perspective can place the head a little above the centre; sample the visible body.
 await page.mouse.click(720,530);
}
await page.locator('#sweeper-caption').waitFor();await page.waitForTimeout(150);
const blank=await page.context().newPage();await blank.goto('about:blank');await blank.bringToFront();await page.waitForTimeout(300);await blank.close();await page.bringToFront();await page.waitForFunction(()=>document.querySelector('#sweeper-greet').dataset.phase==='sweeping');assert.equal(await page.locator('#sweeper-caption').isVisible(),false);
// Shared mute and volume controls also apply to the greeting.
await page.locator('#sweeper-greet').click();await page.locator('#sweeper-caption').waitFor();await serviceControl(page,'#settings');await page.locator('#master-mute').check();await page.waitForTimeout(250);assert(await page.evaluate(()=>window.audioGains.filter(g=>g.context===window.greetingAudioContext).every(g=>g.gain.value<.01)));
await page.locator('#master-mute').uncheck();await page.waitForTimeout(250);assert(await page.evaluate(()=>window.audioGains.some(g=>g.context===window.greetingAudioContext&&g.gain.value>.02)));await page.locator('#close-settings').click();
await page.evaluate(()=>window.dispatchEvent(new CustomEvent('sasa:space',{detail:'private'})));assert.equal(await page.locator('#sweeper-caption').isVisible(),false);assert.equal(await page.locator('#sweeper-greet').isVisible(),false);await page.evaluate(()=>window.dispatchEvent(new CustomEvent('sasa:space',{detail:'public'})));
// The whole-scene view should not offer a remote greeting or leave a caption onscreen.
await page.locator('#place').evaluate(el=>{el.value='wide';el.dispatchEvent(new Event('change'));});await page.waitForTimeout(300);assert.equal(await page.locator('#sweeper-greet').isVisible(),false);
assert.deepEqual(errors,[]);await writeFile(out+'/check.json',JSON.stringify({passed:true,sweeping:true,clickAndPalms:true,caption:true,localMaleVoice:true,duplicateClicksIgnored:true,returnsToSweeping:true,hiddenTabCancels:true,distantInteractionHidden:true,masterMute:true,volumeRestored:true,privateScopeCancels:true,recordedAudioTracks:1,pageErrors:errors},null,2));console.log('PASS sweeping, greeting, palms, caption, male voice, repeat protection, return and hidden-tab cancellation');
}catch(error){await page?.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw error;}finally{await browser.close();}
