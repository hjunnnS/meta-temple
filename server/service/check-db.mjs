// Run against the isolated local M3 database after npm run service.
import assert from 'node:assert/strict';
import {fixedSlots} from '../../src/contracts.ts';
import {migrate,pool} from './database.mjs';
try{
 await Promise.all([migrate(),migrate()]);
 const slots=await pool.query('SELECT id,x,y,z,rotation_y,kind FROM slots');
 const layout=new Map(fixedSlots().map(slot=>[slot.id,slot]));
 assert.equal(slots.rowCount,layout.size);
 for(const row of slots.rows){
  const s=layout.get(row.id);assert.deepEqual([row.x,row.y,row.z],s.position);assert.equal(row.rotation_y,s.rotationY);assert.equal(row.kind,s.accepts);
 }
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const {rows:[a]}=await client.query("INSERT INTO accounts(email) VALUES(gen_random_uuid()||'@example.test') RETURNING id");
  const {rows:[b]}=await client.query("INSERT INTO accounts(email) VALUES(gen_random_uuid()||'@example.test') RETURNING id");
  const {rows:[r]}=await client.query("INSERT INTO reservations(account_id,slot_id,kind,expires_at) VALUES($1,'sample:Z07:votive:09','votive',now()+interval '1 minute') RETURNING id",[a.id]);
  await client.query('SAVEPOINT checked');
  for(const [sql,args,code] of [
   ["INSERT INTO orders(reservation_id,account_id,slot_id,amount_krw) VALUES($1,$2,'sample:Z07:votive:09',100)",[r.id,b.id],'23503'],
   ["INSERT INTO reservations(account_id,slot_id,kind,expires_at) VALUES($1,'sample:Z06:memorial:03','candle',now())",[b.id],'23503'],
   ["INSERT INTO reservations(account_id,slot_id,kind,expires_at) VALUES($1,'sample:Z07:votive:09','votive',now())",[b.id],'23505']
  ]){
   await assert.rejects(client.query(sql,args),{code});await client.query('ROLLBACK TO SAVEPOINT checked');
  }
 }finally{await client.query('ROLLBACK');client.release();}
 console.log('531 fixed slots, repeatable migration, owner and product constraints, exclusive reservation passed.');
}finally{await pool.end();}
