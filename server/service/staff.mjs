import {transaction} from './database.mjs';

const scopes={alerts:'desk',offers:'catalog',orders:'desk',content:'moderation'};
export function staff(account,area,method,input){
 return transaction(async db=>{
  const {rows}=await db.query('SELECT role FROM staff_roles WHERE account_id=$1 FOR SHARE',[account]);
  const roles=rows.map(r=>r.role);
  if(area==='roles'&&method==='GET')return [200,{roles}];
  const role=scopes[area];
  if(!roles.includes(role))return [403,{error:'forbidden'}];
  if(method==='GET'){
   if(area==='alerts')return [200,{rows:(await db.query('SELECT target AS id,kind,acknowledged_at FROM operation_alerts WHERE resolved_at IS NULL ORDER BY detected_at')).rows}];
   if(area==='orders'){
    const term=String(input.q??'').trim().slice(0,100);
    const after=String(input.after??'');
    const [time,id]=after.split('|');
    if(after&&(!/^\d{4}-\d\d-\d\d [0-9:.+-]+\|[0-9a-f-]{36}$/.test(after)||!Number.isFinite(Date.parse(time))||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)))return [400,{error:'invalid_cursor'}];
    const result=await db.query(`SELECT o.created_at::text AS page_time,EXISTS(SELECT 1 FROM events WHERE order_id=o.id AND kind='order_inquiry') AS inquired,o.id,o.status,o.offer_id,o.slot_id,o.amount_krw,o.install_attempts,f.enabled,o.next_attempt_at FROM orders o LEFT JOIN offers f ON f.id=o.offer_id WHERE ($1='' OR strpos(concat_ws(' ',o.id::text,o.slot_id,o.offer_id,o.status),$1)>0 OR ($1='문의' AND EXISTS(SELECT 1 FROM events WHERE order_id=o.id AND kind='order_inquiry')) OR ($1='판매 중지' AND NOT f.enabled))
     AND ($2::timestamptz IS NULL OR (o.created_at,o.id)<($2::timestamptz,$3::uuid))
     ORDER BY o.created_at DESC,o.id DESC LIMIT 101`,[term,after?time:null,after?id:null]);
    const rows=result.rows.slice(0,100),last=rows.at(-1);
    return [200,{rows,next:result.rowCount>100?last.page_time+'|'+last.id:null}];
   }
   if(area==='content'){
    const result=await db.query(`SELECT i.id,s.kind,i.hidden,i.text_deleted,o.inscription->>'name' AS name,o.inscription->>'text' AS text,
     array_agg(DISTINCT r.category) AS categories FROM content_reports r JOIN installations i ON r.installation_id=i.id JOIN orders o ON o.id=i.order_id JOIN slots s ON s.id=i.slot_id
     WHERE r.state='open' OR (r.state='hidden' AND NOT i.text_deleted) GROUP BY i.id,s.kind,o.id ORDER BY i.id`);
    return [200,{rows:result.rows}];
   }
   const queries={offers:'SELECT id,price_krw,days,enabled,revision FROM offers ORDER BY id',orders:'SELECT id,status,offer_id,slot_id,amount_krw FROM orders ORDER BY created_at DESC LIMIT 100',content:'SELECT id,kind FROM public_offerings ORDER BY id'};
   return [200,{rows:(await db.query(queries[area])).rows}];
  }
  if(method!=='POST'||typeof input.id!=='string'||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>200)return [400,{error:'invalid_action'}];
  await db.query('SELECT pg_advisory_xact_lock(541931)');
  let before,after,action;
  if(area==='alerts'){
   before={acknowledged:false};after={acknowledged:true};action='acknowledge';
   const result=await db.query('UPDATE operation_alerts SET acknowledged_at=now() WHERE target=$1 AND kind=$2 AND resolved_at IS NULL AND acknowledged_at IS NULL',[input.id,input.kind]);
   if(!result.rowCount)return [409,{}];
  }else if(area==='offers'){
   if(typeof input.enabled!=='boolean'||!Number.isSafeInteger(input.price)||input.price<=0||input.price>2147483647)return [400,{error:'invalid_offer'}];
   before=(await db.query('SELECT enabled,price_krw,revision FROM offers WHERE id=$1 FOR UPDATE',[input.id])).rows[0];
   if(!before)return [404,{}];
   if(before.revision!==input.revision)return [409,{error:'revision_changed'}];
   after=(await db.query('UPDATE offers SET enabled=$2,price_krw=$3,revision=revision+1 WHERE id=$1 RETURNING enabled,price_krw,revision',[input.id,input.enabled,input.price])).rows[0];
   await db.query('DELETE FROM entries WHERE offer_id=$1',[input.id]);action='revise_offer';
  }else if(area==='content'){
   if(!['hide','delete','dismiss'].includes(input.action))return [400,{}];
   const item=(await db.query("SELECT i.hidden,i.text_deleted,i.order_id FROM installations i WHERE i.id::text=$1 AND EXISTS(SELECT 1 FROM content_reports r WHERE r.installation_id=i.id AND r.state IN ('open','hidden')) FOR UPDATE",[input.id])).rows[0];
   if(!item)return [404,{}];
   action=input.action;before={hidden:item.hidden,deleted:item.text_deleted};
   if(action==='delete'){
    const {rows:[order]}=await db.query("UPDATE orders SET inscription='{}' WHERE id=$1 RETURNING reservation_id",[item.order_id]);
    await db.query("UPDATE reservations SET inscription='{}' WHERE id=$1",[order.reservation_id]);
   }
   if(action!=='dismiss')await db.query("UPDATE installations SET hidden=true,text_deleted=text_deleted OR $2 WHERE id::text=$1",[input.id,action==='delete']);
   await db.query("UPDATE content_reports SET state=$2 WHERE installation_id::text=$1 AND state IN ('open','hidden')",[input.id,{hide:'hidden',delete:'deleted',dismiss:'dismissed'}[action]]);
   after={hidden:item.hidden||action!=='dismiss',deleted:item.text_deleted||action==='delete'};
  }else{
   const order=(await db.query('SELECT status FROM orders WHERE id::text=$1 FOR UPDATE',[input.id])).rows[0];
   if(!order)return [404,{}];
   if(!['recovering','refund_failed','refund_pending'].includes(order.status))return [409,{}];
   before={status:order.status};after={status:order.status,retryRequested:true};
   if(order.status!=='recovering')await db.query('UPDATE orders SET next_attempt_at=now() WHERE id::text=$1',[input.id]);action='retry';
  }
  await db.query('INSERT INTO staff_audit(actor,role,action,target,before_state,after_state,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',[account,role,action,input.id,before,after,input.reason.trim()]);
  return [200,{updated:true}];
 });
}
