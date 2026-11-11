export const privateRoomOffer=Object.freeze({id:'private-room-local-test',revision:1,priceKrw:0,testOnly:true,duration:null});
export async function ownsPrivateRoom(db,account){return (await db.query("SELECT 1 FROM private_room_orders WHERE account_id=$1 AND status='paid' LIMIT 1",[account])).rowCount>0;}
export async function privateAccess(db,account,method,input){
 const {rows:[owner]}=await db.query('SELECT deletion_requested_at FROM accounts WHERE id=$1 FOR UPDATE',[account]);
 if(!owner||owner.deletion_requested_at)return [409,{error:'account_deletion_pending'}];
 if(method==='GET'){
  const {rows:orders}=await db.query('SELECT id,status,amount_krw AS "priceKrw",created_at AS "createdAt" FROM private_room_orders WHERE account_id=$1 ORDER BY created_at DESC,id DESC',[account]);
  return [200,{testOnly:true,offer:privateRoomOffer,hasAccess:await ownsPrivateRoom(db,account),orders}];
 }
 if(method!=='POST')return [405,{error:'method'}];
 if(input.action==='checkout'){
  if(Object.keys(input).some(k=>!['action','offerId','revision'].includes(k))||input.offerId!==privateRoomOffer.id||input.revision!==privateRoomOffer.revision)return [409,{error:'offer_changed'}];
  if(await ownsPrivateRoom(db,account))return [200,{testOnly:true,hasAccess:true}];
  const {rows:[order]}=await db.query("INSERT INTO private_room_orders(account_id,offer_id) VALUES($1,$2) ON CONFLICT(account_id) WHERE status='pending' DO UPDATE SET account_id=EXCLUDED.account_id RETURNING id,status,amount_krw AS \"priceKrw\"",[account,privateRoomOffer.id]);
  return [200,{testOnly:true,order}];
 }
 if(!['test-pay','cancel'].includes(input.action)||typeof input.orderId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.orderId)||Object.keys(input).some(k=>!['action','orderId'].includes(k)))return [400,{error:'invalid_order'}];
 const {rows:[order]}=await db.query('SELECT id,status FROM private_room_orders WHERE id::text=$1 AND account_id=$2 FOR UPDATE',[input.orderId,account]);
 if(!order)return [404,{error:'unknown_order'}];
 if(input.action==='cancel'){
  if(order.status==='paid')return [409,{error:'payment_already_processed'}];
  await db.query("UPDATE private_room_orders SET status='cancelled' WHERE id=$1",[order.id]);
  return [200,{testOnly:true,order:{...order,status:'cancelled'},hasAccess:await ownsPrivateRoom(db,account)}];
 }
 if(order.status==='cancelled')return [409,{error:'payment_cancelled'}];
 if(order.status==='pending')await db.query("UPDATE private_room_orders SET status='paid',paid_at=now() WHERE id=$1",[order.id]);
 return [200,{testOnly:true,order:{...order,status:'paid'},hasAccess:true}];
}
