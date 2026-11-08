// Run after npm run candidate. Playwright is a verification tool and is not bundled in the site.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {preview} from 'vite';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const build=resolve('.m3-local/candidate'),output=resolve('evidence/m4-web-lotus'+(process.argv.includes('--full')?'-full':''));
const buildDigest=createHash('sha256').update(await readFile(build+'/index.html')).digest('hex');
const full=process.argv.includes('--full');
const origin=full?'http://127.0.0.1:4317':'http://127.0.0.1:4340';
const fixtures=new Map();
if(full)for(const zone of ['Z02','Z03','Z06','Z07','Z08']){
 const path='/api/service/temples/sample:sasa/zones/'+zone+'/slots';
 const response=await fetch('http://127.0.0.1:4340'+path);
 assert(response.ok,'Start the private candidate before the benchmark.');
 const data=await response.json();
 for(const [i,slot] of data.slots.entries()){
  Object.assign(slot,{owned:i===0,status:'occupied',installed:true,installationId:'perf-'+slot.slotId,name:null,text:null});
 }
 fixtures.set(path,JSON.stringify(data));
}
const fixtureServer=full?await preview({
 configFile:false,build:{outDir:build},preview:{host:'127.0.0.1',port:4317,strictPort:true},
 plugins:[{name:'full-occupancy-fixtures',configurePreviewServer(server){
  server.middlewares.use((req,res,next)=>{
   if(!req.url.startsWith('/api/'))return next();
   const body=fixtures.get(req.url);
   res.writeHead(body?200:401,{'Content-Type':'application/json','Cache-Control':'no-store'});
   res.end(body??'{}');
  });
 }}],
}):null;
let browser;
try{
 await mkdir(output,{recursive:true});
 browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'no-preference'});
 let position;
 page.on('request',r=>{if(r.url().endsWith('/channel/move'))position=r.postDataJSON().position;});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/channel/join'))errors.push(r.status()+' '+r.url());});
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:2500000,uploadThroughput:2500000});
 async function closeDiagnostics(){
  await Promise.all([
   page.evaluate(()=>new Promise(resolve=>document.querySelector('#diagnostic-dialog').addEventListener('close',()=>resolve(true),{once:true}))),
   page.click('#close-diagnostics')
  ]);
 }
 async function report(){
  await page.click('#diagnostics');await page.click('#stop');
  const result=JSON.parse(await page.locator('#report').innerText());
  await closeDiagnostics();return result;
 }
 async function save(name,result){
  assert.deepEqual(errors,[]);
  await writeFile(output+'/'+name+'.json',JSON.stringify({buildDigest,...result,errors},null,2)+'\n');
 }
 async function lighting(time){
  await page.click('#settings');await page.selectOption('#time',time);await page.click('#close-settings');
 }
 async function start(){
  await page.click('#diagnostics');await page.click('#measure');await closeDiagnostics();
 }
 async function finish(name){
  const result=await report();
  assert(result.measurement.valid);assert.equal(result.currentSettings.visibleLanternCount,440);
  await save(name,result);
 }
 await page.addInitScript(()=>{
  document.addEventListener('click',event=>{
   if(event.target.closest?.('.enter-temple'))performance.mark('lotus-tap');
  },true);
  const observer=new MutationObserver(()=>{
   const pad=document.querySelector('#walk-pad');
   if(pad&&!pad.hidden&&!document.querySelector('.entry-overlay')){
    performance.mark('walking-ready');observer.disconnect();
   }
  });
  observer.observe(document,{attributes:true,childList:true,subtree:true});
 });
 const visits=[];
 for(const visit of ['first','return']){
  await page.goto(origin,{waitUntil:'commit'});
  await page.getByRole('button',{name:'한국어',exact:true}).click();
  await page.locator('.enter-temple').click();
  await page.waitForFunction(()=>performance.getEntriesByName('walking-ready').length>0);
  const marks=await page.evaluate(()=>({
   lotusTapMs:performance.getEntriesByName('lotus-tap')[0].startTime,
   walkingReadyMs:performance.getEntriesByName('walking-ready')[0].startTime
  }));
  const {timing,renderer,userAgent,currentSettings}=await report();
  visits.push({visit,timing:{...timing,...marks,tapToWalkingMs:marks.walkingReadyMs-marks.lotusTapMs},renderer,userAgent,currentSettings});
 }
 await save('loading',{origin,Mbps:20,latencyMs:80,visits});
 if(full){
  await lighting('night');await page.click('[data-view=canopy]');
  await start();await page.waitForTimeout(15000);await finish('night-led');
  await lighting('day');await page.click('[data-view=wide]');await page.waitForTimeout(120000);
  for(const [i,time] of ['day','dusk','night'].entries()){
   await lighting(time);await page.selectOption('#place','templeApproach');
   await start();await page.waitForTimeout(60000);
   for(const view of ['officeReception','canopy','front','detail']){
    await page.click('[data-view='+view+']');await page.waitForTimeout(60000);
   }
   await finish('route-'+(i+1));
  }
 }else{
  // Walk beside the central column so the route crosses the hall entrance.
  await page.locator('#world').focus();
  console.log('Walking from',position);
  await page.keyboard.down('d');
  try{await page.waitForRequest(r=>r.url().endsWith('/channel/move')&&r.postDataJSON().position[0]>=1.15);}
  finally{await page.keyboard.up('d');console.log('Path offset',position,await page.evaluate(()=>document.activeElement?.id),errors.slice(-4));}
  await page.waitForTimeout(120000);
  for(const light of ['day','dusk','night']){
   await lighting(light);await start();await page.locator('#world').focus();
   let key=position[2]<0?'w':'s',minZ=position[2],maxZ=minZ,turns=0,distance=0,lastZ=minZ;
   const end=Date.now()+300000;console.log('Starting',light,position);
   await page.keyboard.down(key);
   try{
    while(Date.now()<end){
     await page.waitForTimeout(150);
     const z=position[2];minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
     distance+=Math.abs(z-lastZ);lastZ=z;
     if((key==='w'&&z>=37)||(key==='s'&&z<=-64)){
      await page.keyboard.up(key);key=key==='w'?'s':'w';await page.keyboard.down(key);turns++;
     }
    }
   }finally{await page.keyboard.up(key);}
   const result=await report();
   assert(result.measurement.valid);assert.equal(result.currentSettings.visibleLanternCount,440);
   console.log(light,{minZ,maxZ,turns,distance},result.measurement);
   assert(minZ<=-64&&maxZ>=37&&turns>=8,'Walking route incomplete');
   await save('walk-'+light,{...result,route:{minZ,maxZ,turns,distanceMetres:distance}});
  }
 }
}finally{await browser?.close();if(fixtureServer)await new Promise(resolve=>fixtureServer.httpServer.close(resolve));}
