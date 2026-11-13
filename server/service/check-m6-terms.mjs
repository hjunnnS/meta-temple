import assert from'node:assert/strict';import{randomUUID}from'node:crypto';import{pool,migrate}from'./database.mjs';import{trade}from'./trade.mjs';
const account=randomUUID();let order;
try{
 await migrate();const offers=(await pool.query('SELECT kind,days FROM offers WHERE enabled')).rows;assert.equal(offers.length,15);assert(offers.every(o=>[7,21,49].includes(o.days)));
 await pool.query('INSERT INTO accounts(id,email) VALUES($1,$2)',[account,account+'@example.test']);
 const slot=(await pool.query("SELECT id FROM slots s WHERE kind='lantern' AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.slot_id=s.id AND r.released_at IS NULL) AND NOT EXISTS(SELECT 1 FROM installations i WHERE i.slot_id=s.id AND i.removed_at IS NULL) LIMIT 1")).rows[0];
 const hold=(await pool.query("INSERT INTO reservations(account_id,slot_id,kind,offer_id,quoted_price,quoted_days,inscription,expires_at) VALUES($1,$2,'lantern','lantern-test-30',10000,30,'{}',now()+interval '5 minutes') RETURNING id",[account,slot.id])).rows[0];
 const [status,result]=await trade('checkout','POST',{holdId:hold.id},account);assert.equal(status,200);order=result.id;const saved=(await pool.query('SELECT amount_krw,term_days FROM orders WHERE id=$1',[order])).rows[0];assert.equal(saved.amount_krw,10000);assert.equal(saved.term_days,30);assert.equal((await pool.query("SELECT enabled FROM offers WHERE id='lantern-test-30'")).rows[0].enabled,false);
 console.log('PASS PostgreSQL 15 new options and disabled legacy 30-day reservation checkout retains original amount/duration');
}finally{await pool.query('DELETE FROM events WHERE account_id=$1',[account]);await pool.query('DELETE FROM test_receipts WHERE account_id=$1',[account]);await pool.query('DELETE FROM orders WHERE account_id=$1',[account]);await pool.query('DELETE FROM reservations WHERE account_id=$1',[account]);await pool.query('DELETE FROM accounts WHERE id=$1',[account]);await pool.end();}
