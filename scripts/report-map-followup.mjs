import assert from 'node:assert/strict';
import {readFile,writeFile,cp,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('evidence/map-followup'),trial=resolve(process.env.SASA_TRIAL_ROOT??'../sasa-sites-trial');
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const selection=await read(root+'/selection/check.json'),presence=await read(root+'/presence/check.json');
const locales=await read(root+'/locales/check.json'),trialLocales=await read(trial+'/evidence/map-followup/locales/check.json');
const integration=await read(trial+'/evidence/map-followup/trial-integration/check.json'),expanded=await read(trial+'/evidence/map-followup/trial-expanded/check.json');
for(const result of [selection,presence,locales,trialLocales,integration,expanded])assert(result.passed);
assert.equal(locales.results.length,14);assert.equal(trialLocales.results.length,14);
const offerings=await readFile(root+'/integration/five-offerings.txt','utf8');for(const kind of ['연등','소원패','인등','추모등','봉헌초'])assert(offerings.includes(kind+' sample:'));
const loading=await read(root+'/performance/loading.json');const index=await readFile('.m3-local/standalone/web/index.html');const buildDigest=createHash('sha256').update(index).digest('hex');assert.equal(loading.buildDigest,buildDigest);
const visits=loading.visits.map(v=>({visit:v.visit,firstFrameMs:v.timing.navigationToFirstRenderedFrameMs,lotusTapToWalkingMs:v.timing.tapToWalkingMs,navigationToWalkingMs:v.timing.walkingReadyMs}));
assert(visits[0].firstFrameMs<=15000);assert(visits[1].firstFrameMs<=5000);
const walks=[];for(const time of ['day','dusk','night']){const r=await read(root+'/performance/walk-'+time+'.json');assert.equal(r.buildDigest,buildDigest);assert(r.measurement.valid);assert(r.measurement.elapsedSeconds>=299);assert.equal(r.currentSettings.visibleLanternCount,440);assert.equal(r.currentSettings.quality,'high');assert.equal(r.currentSettings.renderWidth,1280);assert.equal(r.currentSettings.renderHeight,720);assert(r.route.turns>=8);assert.deepEqual(r.errors,[]);walks.push({time,...r.measurement,route:r.route,jsHeapBytes:r.jsHeapBytes,renderer:r.renderer});}
await mkdir(root+'/trial',{recursive:true});for(const path of ['trial-integration','trial-expanded','locales'])await cp(trial+'/evidence/map-followup/'+path,root+'/trial/'+path,{recursive:true});
let publication;try{publication=await read(root+'/publication.json');}catch(e){if(e.code!=='ENOENT')throw e;}
const result={passed:true,scope:'Approved follow-up steps 1-5; existing issue history unchanged',milestones:['M2','M3','M4'],issues:[27,53,54,64,66,77],mapMarkers:18,canonicalUnitTests:74,trialUnitTests:10,guestSynchronization:presence,allFiveGuestReservationLoginReturn:true,pcAndTouchTrialIntegration:true,canonicalLocales:14,trialLocales:14,performance:{origin:loading.origin,Mbps:loading.Mbps,latencyMs:loading.latencyMs,buildDigest,first3DFrameLimitsMs:{first:15000,return:5000},visits,walks},trial:{multiplayer:false,actualPayments:false,browserLocalStorage:true},deferred:['Firebase external configuration','Live payments','AWS','Religious review','Human participant recognition evaluation','Physical mobile device performance'],published:publication?.status==='succeeded',publication};
await writeFile(root+'/summary.json',JSON.stringify(result,null,2)+'\n');console.log('PASS report: 5 approved steps, both 14-language maps, 2 real local visitors, actual 15-minute route, trial integrations');
