import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {pool} from './database.mjs';
import {maintainPrivacy} from './operations.mjs';
const origin=process.env.SASA_URL??'http://127.0.0.1:4342';assert.match(origin,/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const ids=[],cookies=[];
async function user(){const id=randomUUID(),key=randomUUID();ids.push(id);cookies.push(key);await pool.query('INSERT INTO accounts(id,email) VALUES($1,$2)',[id,'room-'+id+'@example.test']);await pool.query("INSERT INTO sessions VALUES($1,$2,now()+interval '1 day')",[createHash('sha256').update(key).digest('hex'),id]);return key;}
async function call(key,path,data,extra={}){const r=await fetch(origin+'/api/service/'+path,{method:data?'POST':'GET',headers:{Origin:origin,Cookie:'sasa_session='+key,'Content-Type':'application/json',...extra},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()};}
const checkout={action:'checkout',offerId:'private-room-local-test',revision:1};
try{
const a=await user(),b=await user();assert.equal((await call('', 'private-room/access')).status,401);
assert.equal((await call(a,'private-room/enter',{})).status,403);
assert.equal((await call(a,'private-room/access',{...checkout,amount:0})).status,409);
assert.equal((await call(a,'private-room/access',{...checkout,revision:99})).status,409);
const orders=await Promise.all([call(a,'private-room/access',checkout),call(a,'private-room/access',checkout)]);assert.equal(orders[0].data.order.id,orders[1].data.order.id);
const cancelled=orders[0].data.order.id;assert.equal((await call(b,'private-room/access',{action:'test-pay',orderId:cancelled})).status,404);
assert.equal((await call(a,'private-room/access',{action:'cancel',orderId:cancelled})).status,200);
assert.equal((await call(a,'private-room/access',{action:'test-pay',orderId:cancelled})).status,409);
assert.equal((await call(a,'private-room/enter',{})).status,403);
const order=(await call(a,'private-room/access',checkout)).data.order;
const paid=await Promise.all([call(a,'private-room/access',{action:'test-pay',orderId:order.id}),call(a,'private-room/access',{action:'test-pay',orderId:order.id})]);assert(paid.every(r=>r.status===200&&r.data.hasAccess));
assert.equal((await call(a,'private-room/access',{action:'cancel',orderId:order.id})).status,409);
const room=(await call(a,'private-room/enter',{})).data.roomId;assert(room);assert.equal((await call(b,'private-room/heartbeat',{roomId:room})).status,409);
assert.equal((await call(b,'private-room/display?roomId='+room)).status,409);
assert.equal((await call(a,'private-room/access',checkout,{Origin:'http://untrusted.invalid'})).status,403);
assert.equal((await call(a,'private-room/heartbeat',{roomId:room})).status,200);
// Server-side revocation is enforced by both room entry and an existing lease.
await pool.query("UPDATE private_room_orders SET status='cancelled',paid_at=NULL WHERE id=$1",[order.id]);
assert.equal((await call(a,'private-room/heartbeat',{roomId:room})).status,409);assert.equal((await call(a,'private-room/display?roomId='+room)).status,409);assert.equal((await call(a,'private-room/enter',{})).status,403);
const bOrder=(await call(b,'private-room/access',checkout)).data.order;await call(b,'private-room/access',{action:'test-pay',orderId:bOrder.id});
assert.equal((await call(b,'private-room/enter',{})).status,200);
const aPending=(await call(a,'private-room/access',checkout)).data.order;
await pool.query('UPDATE accounts SET deletion_requested_at=now() WHERE id=$1',[ids[1]]);
assert.equal((await call(b,'private-room/access')).status,409);assert.equal((await call(b,'private-room/enter',{})).status,409);
await call(a,'logout',{});assert.equal((await call(a,'private-room/heartbeat',{roomId:room})).status,401);
await pool.query('UPDATE accounts SET deletion_requested_at=now() WHERE id=$1',[ids[0]]);await maintainPrivacy();
assert.equal((await pool.query('SELECT 1 FROM private_rooms WHERE account_id=ANY($1::uuid[])',[ids])).rowCount,0);
assert.equal((await pool.query('SELECT status FROM private_room_orders WHERE id=$1',[aPending.id])).rows[0].status,'cancelled');
const result={passed:true,loginRequired:true,trialOrderDoesNotGrantAccess:true,duplicateCheckoutIdempotent:true,duplicatePayIdempotent:true,cancelBeforePay:true,foreignOrderDenied:true,foreignRoomDenied:true,clientPriceIgnoredAndRejected:true,staleOfferRejected:true,originDenied:true,revocationEnforced:true,deletingAccountDenied:true,logoutDenied:true,deletedRoomDataCleared:true,deletedPendingOrderCancelled:true};await writeFile('evidence/local-expansion/security.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{for(const id of ids){await pool.query('DELETE FROM sessions WHERE account_id=$1',[id]);await pool.query('DELETE FROM login_links WHERE account_id=$1',[id]);await pool.query('DELETE FROM events WHERE account_id=$1',[id]);await pool.query('DELETE FROM accounts WHERE id=$1',[id]);}await pool.end();}
