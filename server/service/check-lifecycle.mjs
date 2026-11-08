import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pool,migrate} from './database.mjs';
import {maintainOrders} from './lifecycle.mjs';
const account=randomUUID();
try{
 await migrate();await pool.query("INSERT INTO accounts VALUES ($1,$2)",[account,account+'@example.test']);
 const {rows:[slot]}=await pool.query("SELECT id FROM slots s WHERE kind='candle' AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.slot_id=s.id AND r.released_at IS NULL) AND NOT EXISTS(SELECT 1 FROM installations i WHERE i.slot_id=s.id AND i.removed_at IS NULL) LIMIT 1");
 async function make(status,released){
  const {rows:[r]}=await pool.query("INSERT INTO reservations(account_id,slot_id,kind,expires_at,released_at,payment_lock) VALUES($1,$2,'candle',now(),CASE WHEN $3 THEN now() END,true) RETURNING id",[account,slot.id,released]);
  const {rows:[o]}=await pool.query("INSERT INTO orders(reservation_id,account_id,slot_id,amount_krw,term_days,status) VALUES($1,$2,$3,3000,7,$4) RETURNING id",[r.id,account,slot.id,status]);return o.id;
 }
 // An existing installation occupying the fixture forces a real unique-constraint failure.
 const prior=await make('installed',true);
 await pool.query("INSERT INTO installations(order_id,account_id,slot_id,starts_at,ends_at) VALUES($1,$2,$3,now(),now()+interval '1 day')",[prior,account,slot.id]);
 const failed=await make('paid',false);
 const state=async id=>(await pool.query('SELECT status,install_attempts FROM orders WHERE id=$1',[id])).rows[0];
 for(let i=0;i<4;i++){
  await pool.query('UPDATE orders SET next_attempt_at=now() WHERE id=$1',[failed]);await maintainOrders();
  assert.equal((await state(failed)).install_attempts,i+1);
  if(i<3){await maintainOrders();assert.equal((await state(failed)).install_attempts,i+1);}
 }
 await maintainOrders();assert.equal((await state(failed)).status,'refund_failed');
 assert.equal((await pool.query('SELECT released_at FROM reservations r JOIN orders o ON o.reservation_id=r.id WHERE o.id=$1',[failed])).rows[0].released_at,null);
 await pool.query("INSERT INTO test_receipts VALUES ($1,3000,$2,'paid')",[failed,account]);
 await pool.query('UPDATE orders SET next_attempt_at=now() WHERE id=$1',[failed]);await maintainOrders();await maintainOrders();assert.equal((await state(failed)).status,'refunded');
 await pool.query("UPDATE installations SET starts_at='2024-02-22T00:00:00Z',ends_at='2024-02-29T00:00:00Z' WHERE order_id=$1",[prior]);
 await maintainOrders();assert.equal((await state(prior)).status,'expired');
 console.log('PASS initial failure + 3 scheduled retries, refund failure keeps hold, confirmed refund releases, expiry keeps history.');
}finally{
 for(const table of ['events','installations','test_receipts','orders','reservations','accounts'])await pool.query('DELETE FROM '+table+' WHERE '+(table==='accounts'?'id':'account_id')+'=$1',[account]);await pool.end();
}
