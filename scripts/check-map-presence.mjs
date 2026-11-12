// Latest-layout regression against the real local API and PostgreSQL, with isolated fixtures.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {pool} from '../server/service/database.mjs';
import {fixedSlots,layoutDraft} from '../src/contracts.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.SASA_URL??'http://127.0.0.1:4342',out='evidence/map-followup/presence';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']}),contexts=[],states=new Map(),errors=[],unexpected=[],moves=[];
let account,order,installation,page;
const wait=async(fn,message,ms=12000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100));}throw Error(message);};
async function scene(p){await p.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/engineStore-'))?.name;if(!url)throw Error('Missing engine');window.qaScene=Object.values(await import(url)).find(x=>Array.isArray(x?.Instances)).Instances[0].scenes[0];});}
async function enter(p){await p.goto(origin);await p.locator('[data-locale=ko]').click();await p.locator('.enter-temple').click();await p.locator('.entry-overlay').waitFor({state:'detached'});if(await p.locator('#visit-guide').isVisible())await p.locator('#visit-guide button').click();await scene(p);}
async function go(p,id){await p.bringToFront();if(await p.locator('#reception-panel').isVisible())await p.locator('#offering-close').click();await p.locator('#spaces-open').click();await p.locator('[data-map-place="'+id+'"]').click();await p.locator('.service-place-detail>button').click();await p.waitForTimeout(250);}
async function channel(p,value){await p.locator('#settings-panel select').last().evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('change'));},value);}
async function pair(p,q){await wait(()=>{const a=states.get(p),b=states.get(q);return a?.participants.some(x=>x.sessionId===b?.self)&&b?.participants.some(x=>x.sessionId===a?.self);},'Both guest visitors must see each other');}
try{
 for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});contexts.push(c);const p=await c.newPage();page=p;p.on('pageerror',e=>errors.push(e.message));p.on('response',async r=>{try{if(r.url().endsWith('/channel/move')||r.url().endsWith('/channel/join')){if(r.ok())states.set(p,await r.json());else if(![410].includes(r.status()))unexpected.push({url:r.url(),status:r.status()});}}catch{}});await enter(p);}
 const [p,q]=contexts.map(c=>c.pages()[0]);await pair(p,q);assert.equal((await contexts[0].request.get(origin+'/api/service/me')).status(),401);assert.equal((await contexts[1].request.get(origin+'/api/service/me')).status(),401);
 for(const id of ['gwaneum','jijang','wish','candle','office','tower','buddha','pond','walk','daeung']){
  await go(p,id);await go(q,id);await pair(p,q);
  const a=states.get(p),b=states.get(q);assert.equal(a.layoutVersion,layoutDraft.version);assert.equal(b.layoutVersion,layoutDraft.version);
  const own=await p.evaluate(()=>qaScene.getTransformNodeByName('visitor').position.asArray());const seen=b.participants.find(x=>x.sessionId===a.self);assert(Math.hypot(own[0]-seen.position[0],own[2]-seen.position[2])<.15);
  await q.bringToFront();await q.waitForFunction(id=>!!qaScene.getTransformNodeByName(id),a.self);moves.push({destination:id,position:own,peerPosition:seen.position});console.log('PASS guest destination',id);
 }
 await p.bringToFront();await p.locator('#practice-open').click();await p.locator('#practice-bow').click();
 await wait(()=>states.get(q)?.participants.some(x=>x.sessionId===states.get(p)?.self&&x.animation==='worship'&&x.bowProgress>0),'Guest bow must synchronize');
 await q.bringToFront();await q.screenshot({path:out+'/guest-peer-bowing.jpg',quality:90});
 await p.bringToFront();await p.locator('#world').focus();await p.keyboard.press('Escape');await p.locator('#walk-pad[data-practice=idle]').waitFor();await pair(p,q);console.log('PASS guest bow');
 await channel(q,2);await wait(()=>states.get(q)?.channelId==='2'&&!states.get(q)?.participants.length,'Channel isolation');await channel(q,1);await pair(p,q);
 const old=states.get(p).self;await contexts[0].setOffline(true);await wait(()=>states.get(q)?.participants.every(x=>x.sessionId!==old),'Stale guest removed',26000);await contexts[0].setOffline(false);await pair(p,q);assert.notEqual(states.get(p).self,old);assert.equal(states.get(q).participants.filter(x=>x.sessionId===states.get(p).self).length,1);console.log('PASS channel and reconnect');
 // Verify persisted DB coordinates, not merely browser-local fixtures.
 const databaseSlots=(await pool.query("SELECT id,x,y,z,rotation_y,layout_version FROM slots WHERE temple_id='sample:sasa' ORDER BY id")).rows;
 assert.equal(databaseSlots.length,531);for(const expected of fixedSlots()){const found=databaseSlots.find(s=>s.id===expected.id);assert(found);assert.deepEqual([found.x,found.y,found.z],expected.position);assert.equal(found.layout_version,layoutDraft.version);}
 const {rows:[free]}=await pool.query("SELECT id FROM slots s WHERE kind='memorial' AND NOT EXISTS(SELECT 1 FROM installations i WHERE i.slot_id=s.id AND i.removed_at IS NULL) AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.slot_id=s.id AND r.released_at IS NULL) LIMIT 1");assert(free,'One isolated memorial fixture slot needed');
 account=randomUUID();await pool.query('INSERT INTO accounts(id,email) VALUES($1,$2)',[account,'map-sync-'+account+'@example.test']);
 const {rows:[hold]}=await pool.query("INSERT INTO reservations(account_id,slot_id,kind,expires_at,released_at) VALUES($1,$2,'memorial',now(),now()) RETURNING id",[account,free.id]);
 const {rows:[o]}=await pool.query("INSERT INTO orders(reservation_id,account_id,slot_id,amount_krw,term_days,status,inscription) VALUES($1,$2,$3,3000,7,'installed',$4) RETURNING id",[hold.id,account,free.id,{public:true,tag:true,name:'검수 전용',text:'공개 상태 동기화 시험'}]);order=o.id;
 const {rows:[i]}=await pool.query("INSERT INTO installations(order_id,account_id,slot_id,starts_at,ends_at) VALUES($1,$2,$3,now(),now()+interval '7 days') RETURNING id",[order,account,free.id]);installation=i.id;
 const observed=new Map();for(const x of[p,q])x.on('response',async r=>{if(r.url().endsWith('/zones/Z06/slots')&&r.ok())try{observed.set(x,(await r.json()).slots.find(s=>s.slotId===free.id));}catch{}});
 await channel(q,2);await wait(()=>[p,q].every(x=>observed.get(x)?.text==='공개 상태 동기화 시험'),'Both channels receive installed public item');
 const expected=fixedSlots().find(s=>s.id===free.id);assert.equal(expected.position[2],-6);for(const x of[p,q])assert.deepEqual(observed.get(x).position,expected.position);
 let start=Date.now();await pool.query("UPDATE orders SET inscription=jsonb_set(inscription,'{public}','false') WHERE id=$1",[order]);await wait(()=>[p,q].every(x=>observed.get(x)?.text===null&&!observed.get(x)?.name),'Public withdrawal convergence',5000);const hideMs=Date.now()-start;
 await pool.query("UPDATE orders SET inscription=jsonb_set(inscription,'{public}','true') WHERE id=$1",[order]);await wait(()=>[p,q].every(x=>observed.get(x)?.text==='공개 상태 동기화 시험'),'Re-publish fixture');
 start=Date.now();await pool.query("UPDATE installations SET ends_at=now()-interval '1 second' WHERE id=$1",[installation]);await wait(()=>[p,q].every(x=>observed.get(x)?.installationId===null),'Expiry convergence',5000);const expiryMs=Date.now()-start;
 await channel(q,1);await pair(p,q);await q.bringToFront();await q.screenshot({path:out+'/reconnected-guests.jpg',quality:90});assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 await writeFile(out+'/check.json',JSON.stringify({passed:true,origin,layoutVersion:layoutDraft.version,guestVisitors:2,bothGuest:true,destinations:moves,renderedPeer:true,bowSynchronized:true,channelIsolation:true,offlineRecovery:true,noDuplicateAvatar:true,databaseSlots:531,memorialPosition:expected.position,publicWithdrawalMs:hideMs,expiryMs,pageErrors:errors,unexpected,realExternalServices:false},null,2));console.log('PASS actual local 2-guest movement/bow/channel/reconnect and 531 DB positions, public hide/expiry',hideMs,expiryMs);
}catch(e){await page?.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}finally{
 for(const c of contexts)await c.close();await browser.close();
 if(account){await pool.query('DELETE FROM installations WHERE account_id=$1',[account]);await pool.query('DELETE FROM orders WHERE account_id=$1',[account]);await pool.query('DELETE FROM reservations WHERE account_id=$1',[account]);await pool.query('DELETE FROM accounts WHERE id=$1',[account]);}
 await pool.end();
}
