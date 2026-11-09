import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pool,migrate} from './database.mjs';
import {staff} from './staff.mjs';
import {trade} from './trade.mjs';
const account=randomUUID(),buyer=randomUUID(),offer='check-'+randomUUID();
try{
 await migrate();
 for(const id of [account,buyer])await pool.query('INSERT INTO accounts VALUES($1,$2)',[id,id+'@example.test']);
 await pool.query("INSERT INTO offers(id,kind,days,price_krw) VALUES($1,'lantern',7,3100)",[offer]);
 const {rows:slots}=await pool.query("SELECT id FROM slots s WHERE kind='lantern' AND NOT EXISTS(SELECT 1 FROM reservations WHERE slot_id=s.id AND released_at IS NULL) AND NOT EXISTS(SELECT 1 FROM installations WHERE slot_id=s.id AND removed_at IS NULL) LIMIT 2");
 const reserve=async(user,slot)=>trade('enter','POST',{offerId:offer,slotId:slot.id},user);
 assert.equal((await reserve(buyer,slots[0]))[0],202);
 await pool.query("UPDATE draws SET closes_at=now() WHERE slot_id=$1",[slots[0].id]);
 const hold=(await trade('hold','GET',{},buyer))[1].hold;assert(hold);
 assert.equal((await reserve(account,slots[1]))[0],202);
 const change={id:offer,price:4400,enabled:false,revision:1,reason:'판매 중지 시험'};
 assert.equal((await staff(account,'offers','POST',change))[0],403);
 for(const [role,allowed] of [['desk','orders'],['moderation','content'],['catalog','offers']]){
  await pool.query('DELETE FROM staff_roles WHERE account_id=$1',[account]);
  await pool.query('INSERT INTO staff_roles VALUES($1,$2)',[account,role]);
  for(const area of ['offers','orders','content'])assert.equal((await staff(account,area,'GET',{}))[0],area===allowed?200:403);
 }
 const [update,checkout]=await Promise.all([staff(account,'offers','POST',change),trade('checkout','POST',{holdId:hold.id},buyer)]);
 assert.equal(update[0],200);assert.equal(checkout[1].amount_krw,3100);
 assert.equal((await reserve(account,slots[1]))[1].error,'offer_stopped');
 assert.equal((await trade('hold','GET',{},account))[1].waiting,false);
 assert.equal((await staff(account,'offers','POST',change))[0],409);
 assert.equal((await staff(account,'offers','POST',{...change,revision:2,enabled:true}))[0],200);
 assert.equal((await reserve(account,slots[1]))[1].error,'offer_changed');
 const {rows}=await pool.query('SELECT before_state,after_state FROM staff_audit WHERE actor=$1 ORDER BY id',[account]);
 assert.equal(rows.length,2);assert.equal(rows[0].before_state.price_krw,3100);assert.equal(rows[0].after_state.price_krw,4400);
 await pool.query("INSERT INTO staff_roles VALUES($1,'desk')",[account]);
 await pool.query(`WITH holds AS (
  INSERT INTO reservations(account_id,slot_id,kind,expires_at,released_at)
  SELECT $1,$2,'lantern',now(),now() FROM generate_series(1,105) RETURNING id,account_id,slot_id
 ) INSERT INTO orders(reservation_id,account_id,slot_id,offer_id,amount_krw,status)
 SELECT id,account_id,slot_id,$3,3100,'cancelled' FROM holds`,[buyer,slots[0].id,offer]);
 const getPage=async after=>(await staff(account,'orders','GET',{q:offer,after}))[1];
 const first=await getPage(),second=await getPage(first.next);
 assert.equal(first.rows.length,100);assert.equal(second.rows.length,6);assert.equal(second.next,null);
 assert.equal(new Set([...first.rows,...second.rows].map(row=>row.id)).size,106);
 console.log('PASS 106 same-offer orders across two pages, including tied timestamps.');
 console.log('PASS three roles, denied change, scoped audit, stale quote, draw cancellation, hold & checkout preserved across stop/resume');
}finally{
 await pool.query('DELETE FROM staff_audit WHERE actor=$1',[account]);await pool.query('DELETE FROM staff_roles WHERE account_id=$1',[account]);
 for(const table of ['events','test_receipts','orders','reservations','entries','accounts'])await pool.query('DELETE FROM '+table+' WHERE '+(table==='accounts'?'id':'account_id')+'=ANY($1::uuid[])',[[account,buyer]]);
 await pool.query('DELETE FROM offers WHERE id=$1',[offer]);await pool.end();
}
