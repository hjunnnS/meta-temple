import {validDisplayPlacements,compatibleDisplay} from '../../src/private-display-layout.ts';
const catalogSql=`SELECT o.id AS "orderId",s.kind,o.slot_id AS "slotId",COALESCE(o.inscription->>'name','') AS name,COALESCE(o.inscription->>'text','') AS text,COALESCE((o.inscription->>'tag')::boolean,false) AS tag,o.status,i.ends_at AS "endsAt"
 FROM orders o JOIN slots s ON s.id=o.slot_id JOIN installations i ON i.order_id=o.id JOIN test_receipts r ON r.order_id=o.id
 WHERE o.account_id=$1 AND o.status IN ('installed','expired') AND r.status='paid' ORDER BY o.created_at DESC`;
export async function privateDisplay(db,account,method,input){
 if(!['GET','POST'].includes(method))return [405,{error:'method'}];
 const {rows:[room]}=await db.query('SELECT id,display_layout AS placements,display_revision AS revision FROM private_rooms WHERE account_id=$1 AND id::text=$2'+(method==='POST'?' FOR UPDATE':''),[account,input.roomId]);
 if(!room)return [404,{error:'unknown_private_room'}];
 if(method==='POST'){
  if(!Number.isSafeInteger(input.revision)||input.revision<0||!validDisplayPlacements(input.placements))return [400,{error:'invalid_display'}];
  if(input.revision!==room.revision)return [409,{error:'layout_changed'}];
 }
 const {rows:items}=await db.query(catalogSql+(method==='POST'?' FOR SHARE OF o,r':''),[account]);
 if(method==='POST'){
  if(!compatibleDisplay(input.placements,items))return [409,{error:'item_unavailable_or_incompatible'}];
  // Retain only stable references; the current owner-only inscription is read on demand.
  const placements=input.placements.map(({slotId,orderId})=>({slotId,orderId}));
  await db.query('UPDATE private_rooms SET display_layout=$1::jsonb,display_revision=display_revision+1 WHERE id=$2',[JSON.stringify(placements),room.id]);
  room.placements=placements;room.revision++;
 }
 const eligible=new Set(items.map(item=>item.orderId));
 return [200,{roomId:room.id,revision:room.revision,items,placements:room.placements.filter(row=>eligible.has(row.orderId))}];
}
