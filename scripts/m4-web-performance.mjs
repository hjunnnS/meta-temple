// Run after npm run candidate. Playwright is a verification tool and is not bundled in the site.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {preview} from 'vite';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const build=resolve('.m3-local/candidate'),output=resolve('evidence/m4-web');
const buildDigest=createHash('sha256').update(await readFile(build+'/index.html')).digest('hex');
const fixtures=new Map();
for(const zone of ['Z02','Z03','Z06','Z07','Z08']){
 const path='/api/service/temples/sample:sasa/zones/'+zone+'/slots';
 const response=await fetch('http://127.0.0.1:4340'+path);
 assert(response.ok,'Start the private candidate before the benchmark.');
 const data=await response.json();
 for(const [i,slot] of data.slots.entries()){
  Object.assign(slot,{owned:i===0,status:'occupied',installed:true,installationId:'perf-'+slot.slotId,name:null,text:null});
 }
 fixtures.set(path,JSON.stringify(data));
}
const fixtureServer=await preview({
 configFile:false,build:{outDir:build},preview:{host:'127.0.0.1',port:4317,strictPort:true},
 plugins:[{name:'full-occupancy-fixtures',configurePreviewServer(server){
  server.middlewares.use((req,res,next)=>{
   if(!req.url.startsWith('/api/'))return next();
   const body=fixtures.get(req.url);
   res.writeHead(body?200:401,{'Content-Type':'application/json','Cache-Control':'no-store'});
   res.end(body??'{}');
  });
 }}],
});
let browser;
try{
 await mkdir(output,{recursive:true});
 browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'no-preference'});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/channel/join'))errors.push(r.status()+' '+r.url());});
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:2500000,uploadThroughput:2500000});
 async function report(){
  await page.click('#diagnostics');await page.click('#stop');
  const result=JSON.parse(await page.locator('#report').innerText());
  await page.click('#close-diagnostics');return result;
 }
 async function save(name,result){
  assert.deepEqual(errors,[]);
  await writeFile(output+'/'+name+'.json',JSON.stringify({buildDigest,...result,errors},null,2)+'\n');
 }
 async function lighting(time){
  await page.click('#settings');await page.selectOption('#time',time);await page.click('#close-settings');
 }
 async function start(){
  await page.click('#diagnostics');await page.click('#measure');await page.click('#close-diagnostics');
 }
 async function finish(name){
  const result=await report();
  assert(result.measurement.valid);assert.equal(result.currentSettings.visibleLanternCount,440);
  await save(name,result);
 }
 const visits=[];
 for(const visit of ['first','return']){
  await page.goto('http://127.0.0.1:4317');
  await page.waitForSelector('body[data-ready=true]',{state:'attached'});
  const {timing,renderer,userAgent,currentSettings}=await report();
  visits.push({visit,timing,renderer,userAgent,currentSettings});
 }
 await save('loading',{origin:'localhost',Mbps:20,latencyMs:80,visits});
 await page.click('#explore');await page.getByText('안내 닫기',{exact:true}).click();
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
}finally{await browser?.close();await new Promise(resolve=>fixtureServer.httpServer.close(resolve));}
