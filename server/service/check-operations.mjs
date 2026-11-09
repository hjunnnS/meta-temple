import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {join} from 'node:path';
import {writeFile,stat} from 'node:fs/promises';
import {migrate,pool,localRoot} from './database.mjs';
import {maintainPrivacy,refreshAlerts} from './operations.mjs';
import {staff} from './staff.mjs';
import {trade} from './trade.mjs';
const id=randomUUID(),operator=randomUUID(),email=id+'@example.test';
const file=join(localRoot,'mail',id+'.txt');
let browser,page;
try{
 await migrate();
 for(const a of [id,operator])await pool.query('INSERT INTO accounts(id,email) VALUES($1,$2)',[a,a+'@example.test']);
 await pool.query("INSERT INTO staff_roles VALUES($1,'desk')",[operator]);
 await writeFile(file,email+'\nlocal fixture\n',{mode:0o600});
 const {rows:[slot]}=await pool.query("SELECT id FROM slots s WHERE kind='lantern' AND NOT EXISTS (SELECT 1 FROM reservations WHERE slot_id=s.id AND released_at IS NULL) AND NOT EXISTS(SELECT 1 FROM installations WHERE slot_id=s.id AND removed_at IS NULL) LIMIT 1");
 const {rows:[h]}=await pool.query("INSERT INTO reservations(account_id,slot_id,kind,expires_at,offer_id,quoted_price,quoted_days,inscription) VALUES($1,$2,'lantern',now()+interval '5 minutes','lantern-test-7',3000,7,$3) RETURNING id",[id,slot.id,{public:true,text:'시험 원문'}]);
 const order=(await trade('checkout','POST',{holdId:h.id},id))[1];
 if(process.env.SASA_LOCAL_INTEGRATION==='1'){
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
  const {origin}=await import('../../scripts/local-candidate.mjs');
  const token=randomBytes(32).toString('hex');
  await pool.query("INSERT INTO sessions VALUES ($1,$2,now()+interval '10 minutes')",[createHash('sha256').update(token).digest('hex'),id]);
  browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
  page=await browser.newPage({locale:'ko-KR',reducedMotion:'reduce'});
  await page.context().addCookies([{name:'sasa_session',value:token,domain:'127.0.0.1',path:'/api/service',httpOnly:true}]);
  async function openAccount(){
   await page.goto(origin);await page.locator('.enter-temple').click();
   await page.locator('.entry-overlay').waitFor({state:'detached'});
   await page.locator('#service-account').click();
  }
  await openAccount();page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'시험 계정 삭제',exact:true}).click();
  const notice=page.locator('[data-deletion-pending]');
  await notice.waitFor();await openAccount();await notice.waitFor();
  assert.equal(await page.getByRole('button',{name:'시험 계정 삭제',exact:true}).count(),0);
  assert.equal((await (await page.request.get(origin+'/api/service/me')).json()).deletionPending,true);
 }else assert((await maintainPrivacy(id)).waiting);
 await pool.query("UPDATE orders SET created_at=now()-interval '11 minutes' WHERE id=$1",[order.id]);
 await refreshAlerts();await refreshAlerts();
 const matches=async()=>(await staff(operator,'alerts','GET',{}))[1].rows.filter(r=>r.id===order.id);
 assert.equal((await matches()).length,1);
 assert.equal((await staff(operator,'alerts','POST',{id:order.id,kind:'payment_delay',reason:'확인'}))[0],200);
 assert((await matches())[0].acknowledged_at);
 assert.equal((await trade('test-pay','POST',{orderId:order.id},id))[1].status,'installed');
 await refreshAlerts();assert.equal((await matches()).length,0);
 await maintainPrivacy();
 if(page){
  await page.locator('dialog[open] input[name=email]').waitFor();
  assert.equal(await page.locator('[data-deletion-pending]').count(),0);
  assert.equal((await page.request.get(new URL('/api/service/me',page.url()).href)).status(),401);
 }
 assert.equal((await pool.query('SELECT email FROM accounts WHERE id=$1',[id])).rows[0].email,null);
 assert.equal((await pool.query('SELECT * FROM public_offerings WHERE id IN(SELECT id FROM installations WHERE account_id=$1)',[id])).rowCount,0);
 assert.deepEqual((await pool.query('SELECT inscription FROM orders WHERE id=$1',[order.id])).rows[0].inscription,{});
 assert.equal(await stat(file).catch(()=>null),null);
 await pool.query("UPDATE accounts SET erased_at=now()-interval '30 days 1 second' WHERE id=$1",[id]);await maintainPrivacy();
 assert.equal((await pool.query('SELECT 1 FROM orders WHERE id=$1',[order.id])).rowCount,0);
 console.log('PASS deletion waits for payment, alert deduplication/ack/resolution, private mail and public text removed, day-30 purge');
}finally{
 await browser?.close();
 await pool.query('DELETE FROM sessions WHERE account_id=$1',[id]);
 await pool.query('DELETE FROM staff_audit WHERE actor=$1',[operator]);await pool.query('DELETE FROM staff_roles WHERE account_id=$1',[operator]);
 for(const table of ['events','installations','test_receipts','orders','reservations','accounts'])await pool.query('DELETE FROM '+table+' WHERE '+(table==='accounts'?'id':'account_id')+'=ANY($1::uuid[])',[[operator,id]]);
 await pool.end();
}
