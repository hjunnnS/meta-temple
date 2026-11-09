import {randomInt} from 'node:crypto';
import {maintainOrders} from './lifecycle.mjs';
import {pool,transaction} from './database.mjs';
class TradeError extends Error{constructor(status,message){super(message);this.status=status;}}
const deny=(status,message)=>{throw new TradeError(status,message);};
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
export function inscription(input,kind){
 const clean=(v,n)=>{
  if(typeof v!=='string'||[...v].length>n||/[\u0000-\u001f\u007f]/.test(v))deny(400,'invalid_text');
  return v.trim();
 };
 const text=clean(input.text??'',100),name=clean(input.name??'',12);
 if(name&&(kind!=='lantern'||input.tag!==true||input.public!==true))deny(400,'name_consent_required');
 return {text,name,tag:!!name,public:input.public===true};
}
async function settle(db){
 await db.query("UPDATE reservations SET released_at=now() WHERE released_at IS NULL AND NOT payment_lock AND expires_at<=now()");
 const draws=await db.query('SELECT slot_id,closes_at FROM draws WHERE closes_at<=now()');
 for(const draw of draws.rows){
  const {rows}=await db.query('SELECT e.* FROM entries e JOIN offers o ON o.id=e.offer_id WHERE e.slot_id=$1 AND o.enabled ORDER BY e.account_id',[draw.slot_id]);
  if(rows.length){
   const e=rows[randomInt(rows.length)];
   await db.query("INSERT INTO reservations(account_id,slot_id,kind,offer_id,inscription,quoted_price,quoted_days,expires_at) SELECT $1,s.id,s.kind,$3,$4,f.price_krw,f.days,$5::timestamptz+interval '5 minutes' FROM slots s JOIN offers f ON f.id=$3 WHERE s.id=$2 AND $5::timestamptz+interval '5 minutes'>now() ON CONFLICT DO NOTHING",[e.account_id,e.slot_id,e.offer_id,e.inscription,draw.closes_at]);
  }
  await db.query('DELETE FROM draws WHERE slot_id=$1',[draw.slot_id]);
 }
}
const held=async(db,account)=>(await db.query('SELECT id,slot_id AS "slotId",offer_id AS "offerId",expires_at AS "expiresAt",payment_lock AS "paymentLock" FROM reservations WHERE account_id=$1 AND released_at IS NULL',[account])).rows[0]??null;
export async function trade(action,method,input,account){
 try{const result=await transaction(async db=>{
  // Serialize allocation and settlement across local service processes, including empty slots.
  await db.query('SELECT pg_advisory_xact_lock(541931)');await settle(db);
  if(action==='hold'&&method==='GET'){
   const waiting=(await db.query('SELECT slot_id FROM entries WHERE account_id=$1',[account])).rowCount>0;
   return [200,{hold:await held(db,account),waiting,serverTime:Date.now()}];
  }
  if(method!=='POST')deny(405,'method');
  if(action==='enter'){
   const eligible=await db.query('SELECT 1 FROM accounts WHERE id=$1 AND deletion_requested_at IS NULL',[account]);if(!eligible.rowCount)deny(409,'deletion_requested');
   const {rows:[slot]}=await db.query('SELECT s.id,s.kind,o.revision FROM slots s JOIN offers o ON o.kind=s.kind WHERE s.id=$1 AND o.id=$2 AND o.enabled',[input.slotId,input.offerId]);
   if(slot&&slot.revision!==(input.revision??1))deny(409,'offer_changed');
   if(!slot)deny(409,'incompatible_offer');
   if(await held(db,account))deny(409,'already_reserved');
   const taken=await db.query('SELECT 1 FROM installations WHERE slot_id=$1 AND removed_at IS NULL UNION ALL SELECT 1 FROM reservations WHERE slot_id=$1 AND released_at IS NULL',[slot.id]);
   if(taken.rowCount)deny(409,'unavailable');
   const previous=await db.query('SELECT slot_id FROM entries WHERE account_id=$1',[account]);
   if(previous.rowCount&&previous.rows[0].slot_id!==slot.id)deny(409,'already_entered');
   const content=inscription(input,slot.kind);
   await db.query("INSERT INTO draws VALUES ($1,clock_timestamp()+interval '1 second') ON CONFLICT DO NOTHING",[slot.id]);
   await db.query('INSERT INTO entries VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',[account,slot.id,input.offerId,content]);
   return [202,{waiting:true}];
  }
  if(action==='cancel'){
   await db.query('DELETE FROM entries WHERE account_id=$1',[account]);
   const h=await held(db,account);if(h?.paymentLock)deny(409,'payment_locked');
   if(h)await db.query('UPDATE reservations SET released_at=now() WHERE id=$1',[h.id]);
   return [200,{cancelled:true}];
  }
  if(action==='checkout'){
   if(!uuid(input.holdId))deny(400,'invalid_hold');
   const prior=await db.query('SELECT id,amount_krw,status FROM orders WHERE reservation_id=$1 AND account_id=$2',[input.holdId,account]);if(prior.rowCount)return [200,prior.rows[0]];
   const h=await held(db,account);if(!h||h.id!==input.holdId)deny(409,'expired_hold');
   const {rows:[o]}=await db.query('INSERT INTO orders(reservation_id,account_id,slot_id,amount_krw,offer_id,term_days,inscription) SELECT r.id,r.account_id,r.slot_id,r.quoted_price,r.offer_id,r.quoted_days,r.inscription FROM reservations r WHERE r.id=$1 RETURNING id,amount_krw,status',[h.id]);
   if(!o)deny(409,'offer_stopped');
   await db.query('UPDATE reservations SET payment_lock=true WHERE id=$1',[h.id]);
   await db.query('INSERT INTO test_receipts(order_id,amount_krw,account_id) VALUES($1,$2,$3)',[o.id,o.amount_krw,account]);
   await db.query("INSERT INTO events(kind,account_id,order_id) VALUES('checkout',$1,$2)",[account,o.id]);
   return [200,o];
  }
  if(!uuid(input.orderId))deny(400,'invalid_order');
  const {rows:[order]}=await db.query('SELECT * FROM orders WHERE id=$1 AND account_id=$2',[input.orderId,account]);
  if(!order)deny(404,'unknown_order');
  if(action==='test-cancel'){
   if(order.status==='cancelled')return [200,{id:order.id,status:'cancelled'}];
   const receipt=await db.query("UPDATE test_receipts SET status='cancelled' WHERE order_id=$1 AND status='pending' AND $2='pending'",[order.id,order.status]);
   if(!receipt.rowCount)deny(409,'payment_already_processed');
   await db.query("UPDATE orders SET status='cancelled' WHERE id=$1",[order.id]);
   await db.query("UPDATE reservations SET released_at=now(),payment_lock=false WHERE id=$1",[order.reservation_id]);
   return [200,{id:order.id,status:'cancelled'}];
  }
  if(action==='test-pay'){
   if(order.status==='cancelled')deny(409,'payment_cancelled');
   // This is a loopback-only test provider. The amount and buyer come from its own receipt.
   await db.query("UPDATE test_receipts SET status='paid' WHERE order_id=$1 AND status='pending'",[order.id]);
  }else if(action!=='reconcile')deny(404,'unknown_action');
  const {rows:[receipt]}=await db.query('SELECT * FROM test_receipts WHERE order_id=$1',[order.id]);
  if(!receipt||receipt.account_id!==account||receipt.amount_krw!==order.amount_krw)deny(409,'receipt_mismatch');
  if(receipt.status==='paid'&&order.status==='pending'){
   await db.query("UPDATE orders SET status='paid' WHERE id=$1",[order.id]);order.status='paid';
   await db.query("INSERT INTO events(kind,account_id,order_id) VALUES('payment_verified',$1,$2)",[account,order.id]);
  }
  return [200,{id:order.id,status:order.status}];
 });
 if(['paid','recovering','refund_pending','refund_failed'].includes(result[1]?.status)){
  await maintainOrders();
  const {rows:[current]}=await pool.query('SELECT id,status FROM orders WHERE id=$1 AND account_id=$2',[result[1].id,account]);
  return [200,current];
 }
 return result;
 }catch(e){if(e instanceof TradeError)return [e.status,{error:e.message}];throw e;}
}
