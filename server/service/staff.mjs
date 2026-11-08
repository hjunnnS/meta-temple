import {transaction} from './database.mjs';

const scopes={offers:'catalog',orders:'desk',content:'moderation'};
export function staff(account,area,method,input){
 return transaction(async db=>{
  const {rows}=await db.query('SELECT role FROM staff_roles WHERE account_id=$1 FOR SHARE',[account]);
  const roles=rows.map(r=>r.role);
  if(area==='roles'&&method==='GET')return [200,{roles}];
  const role=scopes[area];
  if(!roles.includes(role))return [403,{error:'forbidden'}];
  if(method==='GET'){
   const queries={offers:'SELECT id,price_krw,days,enabled,revision FROM offers ORDER BY id',orders:'SELECT id,status,offer_id,slot_id,amount_krw FROM orders ORDER BY created_at DESC LIMIT 100',content:'SELECT id,kind FROM public_offerings ORDER BY id'};
   return [200,{rows:(await db.query(queries[area])).rows}];
  }
  if(method!=='POST'||typeof input.id!=='string'||typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>200)return [400,{error:'invalid_action'}];
  await db.query('SELECT pg_advisory_xact_lock(541931)');
  let before,after,action;
  if(area==='offers'){
   if(typeof input.enabled!=='boolean'||!Number.isSafeInteger(input.price)||input.price<=0||input.price>2147483647)return [400,{error:'invalid_offer'}];
   before=(await db.query('SELECT enabled,price_krw,revision FROM offers WHERE id=$1 FOR UPDATE',[input.id])).rows[0];
   if(!before)return [404,{}];
   if(before.revision!==input.revision)return [409,{error:'revision_changed'}];
   after=(await db.query('UPDATE offers SET enabled=$2,price_krw=$3,revision=revision+1 WHERE id=$1 RETURNING enabled,price_krw,revision',[input.id,input.enabled,input.price])).rows[0];
   await db.query('DELETE FROM entries WHERE offer_id=$1',[input.id]);action='revise_offer';
  }else if(area==='content'){
   const item=(await db.query('SELECT hidden FROM installations WHERE id::text=$1 FOR UPDATE',[input.id])).rows[0];
   if(!item)return [404,{}];
   if(item.hidden)return [200,{updated:false}];
   await db.query('UPDATE installations SET hidden=true WHERE id::text=$1',[input.id]);before=item;after={hidden:true};action='hide';
  }else{
   const order=(await db.query('SELECT status FROM orders WHERE id::text=$1 FOR UPDATE',[input.id])).rows[0];
   if(!order)return [404,{}];
   if(!['recovering','refund_failed','refund_pending'].includes(order.status))return [409,{}];
   before={status:order.status};after={status:order.status,retryRequested:true};
   await db.query('UPDATE orders SET next_attempt_at=now() WHERE id::text=$1',[input.id]);action='retry';
  }
  await db.query('INSERT INTO staff_audit(actor,role,action,target,before_state,after_state,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',[account,role,action,input.id,before,after,input.reason.trim()]);
  return [200,{updated:true}];
 });
}
