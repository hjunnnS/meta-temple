import {transaction} from './database.mjs';
async function record(db,o,kind){
 await db.query('INSERT INTO events(kind,account_id,order_id) VALUES($1,$2,$3)',[kind,o.account_id,o.id]);
}
async function release(db,o){
 await db.query('UPDATE reservations SET released_at=COALESCE(released_at,now()),payment_lock=false WHERE id=$1',[o.reservation_id]);
}
export async function maintainOrders(){
 return transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(541931)');
  const expired=await db.query("UPDATE installations SET removed_at=ends_at WHERE removed_at IS NULL AND ends_at<=now() RETURNING order_id");
  for(const i of expired.rows){
   const {rows:[o]}=await db.query("UPDATE orders SET status='expired' WHERE id=$1 AND status='installed' RETURNING *",[i.order_id]);if(o)await record(db,o,'expired');
  }
  const due=await db.query("SELECT * FROM orders WHERE status IN ('paid','recovering','refund_pending','refund_failed') AND next_attempt_at<=now() ORDER BY next_attempt_at LIMIT 100 FOR UPDATE");
  for(const o of due.rows){
   if(o.status.startsWith('refund_')){
    // The local provider stores the authoritative final refund outcome.
    const {rows:[receipt]}=await db.query("UPDATE test_receipts SET status='refunded' WHERE order_id=$1 AND account_id=$2 AND amount_krw=$3 AND status IN ('paid','refunded') RETURNING status",[o.id,o.account_id,o.amount_krw]);
    if(!receipt){
     await db.query("UPDATE orders SET status='refund_failed',next_attempt_at=now()+interval '1 minute' WHERE id=$1",[o.id]);
     if(o.status!=='refund_failed')await record(db,o,'refund_failed');
     continue;
    }
    await db.query('UPDATE installations SET removed_at=COALESCE(removed_at,now()) WHERE order_id=$1',[o.id]);
    await db.query("UPDATE orders SET status='refunded' WHERE id=$1",[o.id]);await release(db,o);await record(db,o,'refunded');continue;
   }
   await db.query('SAVEPOINT install_attempt');
   try{
    await db.query("INSERT INTO installations(order_id,account_id,slot_id,starts_at,ends_at) VALUES ($1,$2,$3,now(),now()+$4::integer*interval '24 hours')",[o.id,o.account_id,o.slot_id,o.term_days]);
    await db.query("UPDATE orders SET status='installed',install_attempts=install_attempts+1 WHERE id=$1",[o.id]);
    await release(db,o);await record(db,o,'installed');
   }catch(error){
    await db.query('ROLLBACK TO SAVEPOINT install_attempt');
    if(!error.code)throw error;
    const refund=o.install_attempts>=3;
    await db.query("UPDATE orders SET status=$2,install_attempts=install_attempts+1,next_attempt_at=now()+$3::integer*interval '1 minute' WHERE id=$1",[o.id,refund?'refund_pending':'recovering',refund?0:1]);
    await record(db,o,refund?'refund_pending':'install_retry');
   }
   await db.query('RELEASE SAVEPOINT install_attempt');
  }
 });
}
