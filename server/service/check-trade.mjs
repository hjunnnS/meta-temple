// Creates synthetic accounts in the isolated PostgreSQL instance and removes its fixtures.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pool,migrate} from './database.mjs';
import {trade} from './trade.mjs';
const accounts=[];
try{
 await migrate();
 const {rows}=await pool.query("SELECT id FROM slots s WHERE s.kind='lantern' AND NOT EXISTS(SELECT 1 FROM installations i WHERE i.slot_id=s.id AND i.removed_at IS NULL) AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.slot_id=s.id AND r.released_at IS NULL) AND NOT EXISTS(SELECT 1 FROM draws d WHERE d.slot_id=s.id) LIMIT 1");
 const slotId=rows[0].id;
 for(let n=0;n<20;n++){const {rows:[a]}=await pool.query("INSERT INTO accounts(email) VALUES($1) RETURNING id",[randomUUID()+'@example.test']);accounts.push(a.id);}
 const payload={offerId:'lantern-test-7',slotId,text:'평안',public:false};
 assert.equal((await trade('enter','POST',{...payload,tag:true,name:'가족'},accounts[0]))[0],400);
 for(const invalid of [{text:'첫 줄\n둘째 줄'},{text:'🌸'.repeat(101)},{name:'🌸'.repeat(13),tag:true,public:true}]){
  const [status,result]=await trade('enter','POST',{...payload,...invalid},accounts[0]);
  assert.equal(status,400);assert.equal(result.error,'invalid_text');
 }
 Object.assign(payload,{text:'🌸'.repeat(100),name:'🌸'.repeat(12),tag:true,public:true});
 const responses=await Promise.all([...accounts,accounts[0]].map(a=>trade('enter','POST',payload,a)));
 assert(responses.every(r=>r[0]===202));assert.equal((await pool.query('SELECT count(*)::int AS count FROM entries WHERE slot_id=$1',[slotId])).rows[0].count,20);
 await new Promise(r=>setTimeout(r,1100));
 const holds=await Promise.all(accounts.map(a=>trade('hold','GET',{},a)));
 const winners=accounts.filter((_,i)=>holds[i][1].hold);assert.equal(winners.length,1);
 const who=winners[0],h=holds[accounts.indexOf(who)][1].hold,loser=accounts.find(a=>a!==who);
 assert.equal((await trade('checkout','POST',{holdId:h.id},loser))[0],409);
 const checkout=()=>trade('checkout','POST',{holdId:h.id},who);
 const [,o]=await checkout();assert.equal((await checkout())[1].id,o.id);
 assert.equal((await trade('cancel','POST',{},who))[0],409);
 assert.equal((await trade('reconcile','POST',{orderId:o.id},who))[1].status,'pending');
 assert.equal((await trade('test-pay','POST',{orderId:o.id},loser))[0],404);
 await pool.query("UPDATE reservations SET expires_at=now()-interval '1 second' WHERE id=$1",[h.id]);
 assert((await trade('hold','GET',{},who))[1].hold.paymentLock);
 for(let n=0;n<2;n++)assert.equal((await trade('test-pay','POST',{orderId:o.id},who))[1].status,'installed');
 const found=await pool.query('SELECT * FROM installations WHERE order_id=$1',[o.id]);assert.equal(found.rowCount,1);assert.equal(found.rows[0].slot_id,slotId);
 assert.equal((await trade('enter','POST',payload,loser))[0],409);
 console.log('PASS 20 accounts, 1 winner, locked pending payment, single same-slot installation, consent and retry');
}finally{
 await pool.query('DELETE FROM entries WHERE account_id=ANY($1)',[accounts]);
 for(const table of ['events','installations','test_receipts','orders','reservations','accounts'])
  await pool.query('DELETE FROM '+table+' WHERE '+(table==='accounts'?'id':'account_id')+'=ANY($1)',[accounts]);
 await pool.end();
}
