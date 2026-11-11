import {readFile,readdir,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {localRoot,transaction} from './database.mjs';

export async function maintainPrivacy(requester){
 return transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(541931)');
  if(requester)await db.query('UPDATE accounts SET deletion_requested_at=COALESCE(deletion_requested_at,now()) WHERE id=$1',[requester]);
  const {rows:ready}=await db.query(`SELECT id,email FROM accounts a WHERE deletion_requested_at IS NOT NULL AND erased_at IS NULL AND NOT EXISTS(SELECT 1 FROM orders WHERE account_id=a.id AND status IN ('pending','paid','recovering','refund_pending','refund_failed')) FOR UPDATE`);
  for(const {id,email} of ready){
   const mail=join(localRoot,'mail');
   for(const f of await readdir(mail)){
    if(!f.endsWith('.txt'))continue;
    const path=join(mail,f);
    if((await readFile(path,'utf8')).split('\n')[0]===email)await unlink(path);
   }
   for(const table of ['entries','login_links','sessions','staff_roles'])await db.query('DELETE FROM '+table+' WHERE account_id=$1',[id]);
   await db.query("UPDATE private_room_orders SET status='cancelled' WHERE account_id=$1 AND status='pending'",[id]);
   await db.query('DELETE FROM private_rooms WHERE account_id=$1',[id]);
   await db.query("UPDATE orders SET inscription='{}' WHERE account_id=$1",[id]);
   await db.query("UPDATE reservations SET inscription='{}',released_at=COALESCE(released_at,now()) WHERE account_id=$1",[id]);
   await db.query('UPDATE installations SET hidden=true,text_deleted=true WHERE account_id=$1',[id]);
   await db.query("UPDATE staff_audit SET reason='계정 삭제' WHERE actor=$1 OR target IN(SELECT id::text FROM orders WHERE account_id=$1 UNION ALL SELECT id::text FROM installations WHERE account_id=$1)",[id]);
   await db.query('UPDATE accounts SET email=NULL,auth_identity=NULL,erased_at=now() WHERE id=$1',[id]);
  }
  const {rows:due}=await db.query("SELECT id FROM accounts WHERE erased_at<=now()-interval '30 days' FOR UPDATE");
  for(const {id} of due){
   await db.query('DELETE FROM content_reports WHERE reporter=$1 OR installation_id IN(SELECT id FROM installations WHERE account_id=$1)',[id]);
   await db.query('DELETE FROM receipt_events WHERE order_id IN(SELECT id FROM orders WHERE account_id=$1)',[id]);
   const targets='SELECT id::text FROM orders WHERE account_id=$1 UNION ALL SELECT id::text FROM installations WHERE account_id=$1 UNION ALL SELECT id::text FROM reservations WHERE account_id=$1';
   await db.query('DELETE FROM staff_audit WHERE actor=$1 OR target IN('+targets+')',[id]);
   await db.query('DELETE FROM operation_alerts WHERE target IN('+targets+')',[id]);
   for(const table of ['events','installations','test_receipts','orders','reservations'])await db.query('DELETE FROM '+table+' WHERE account_id=$1',[id]);
   await db.query('DELETE FROM accounts WHERE id=$1',[id]);
  }
  return {waiting:!!requester&&!ready.some(a=>a.id===requester)};
 });
}
export async function refreshAlerts(){
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(541931)');
  await db.query(`INSERT INTO operation_alerts(kind,target) SELECT kind,target FROM operation_faults ON CONFLICT(kind,target) DO UPDATE SET detected_at=now(),acknowledged_at=NULL,resolved_at=NULL WHERE operation_alerts.resolved_at IS NOT NULL`);
  await db.query('UPDATE operation_alerts a SET resolved_at=now() WHERE resolved_at IS NULL AND NOT EXISTS(SELECT 1 FROM operation_faults f WHERE f.kind=a.kind AND f.target=a.target)');
 });
}
