import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {pool,transaction} from './database.mjs';
import {verifyRestore} from './backup.mjs';
const id=randomUUID(),placements=[];
try{
await transaction(async db=>{
 await db.query('SELECT pg_advisory_xact_lock(541931)');
 await db.query('INSERT INTO accounts(id,email) VALUES($1,$2)',[id,'restore-'+id+'@example.test']);
 await db.query("INSERT INTO private_room_orders(account_id,offer_id,status,paid_at) VALUES($1,'private-room-local-test','paid',now())",[id]);
 const positions={lantern:'left-2-1',votive:'left-2-2',memorial:'left-2-3','wish-plaque':'right-2-1',candle:'right-2-2'};
 for(const [kind,position] of Object.entries(positions)){
  const {rows:[slot]}=await db.query('SELECT id FROM slots s WHERE kind=$1 AND NOT EXISTS(SELECT 1 FROM installations WHERE slot_id=s.id AND removed_at IS NULL) AND NOT EXISTS(SELECT 1 FROM reservations WHERE slot_id=s.id AND released_at IS NULL) LIMIT 1',[kind]);assert(slot);
  const {rows:[hold]}=await db.query("INSERT INTO reservations(account_id,slot_id,kind,expires_at,released_at) VALUES($1,$2,$3,now(),now()) RETURNING id",[id,slot.id,kind]);
  const {rows:[order]}=await db.query("INSERT INTO orders(reservation_id,account_id,slot_id,amount_krw,status,inscription) VALUES($1,$2,$3,3000,'installed',$4) RETURNING id",[hold.id,id,slot.id,{name:'복원 시험',text:'나만의 소원',public:false,tag:false}]);
  await db.query("INSERT INTO test_receipts(order_id,amount_krw,account_id,status) VALUES($1,3000,$2,'paid')",[order.id,id]);
  await db.query("INSERT INTO installations(order_id,account_id,slot_id,starts_at,ends_at) VALUES($1,$2,$3,now(),now()+interval '7 days')",[order.id,id,slot.id]);
  placements.push({slotId:position,orderId:order.id});
 }
 await db.query('INSERT INTO private_rooms(account_id,display_layout,display_revision) VALUES($1,$2,7)',[id,JSON.stringify(placements)]);
});
const result=await verifyRestore(true,async db=>{
 const {rows:[room]}=await db.query('SELECT display_layout,display_revision FROM private_rooms WHERE account_id=$1',[id]);assert.deepEqual(room.display_layout,placements);assert.equal(room.display_revision,7);
 assert.equal((await db.query("SELECT count(*)::int AS count FROM private_room_orders WHERE account_id=$1 AND status='paid'",[id])).rows[0].count,1);
 assert.equal((await db.query('SELECT count(*)::int AS count FROM installations WHERE account_id=$1',[id])).rows[0].count,5);
});
await writeFile('evidence/local-expansion/recovery.json',JSON.stringify({passed:true,freshSnapshot:true,isolatedRestoration:true,fiveDisplaysAndRevisionRestored:true,paidRoomRightRestored:true,originalInstallationsRestored:true,tableCount:Object.keys(result.tables).length,durationMs:result.durationMs},null,2));
}finally{
 for(const table of ['installations','test_receipts','orders','reservations','accounts'])await pool.query('DELETE FROM '+table+' WHERE '+(table==='accounts'?'id':'account_id')+'=$1',[id]);
 await pool.end();
}
