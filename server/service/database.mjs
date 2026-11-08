import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {userInfo} from 'node:os';
import {fixedSlots,layoutDraft} from '../../src/contracts.ts';

export const localRoot=resolve('.m3-local');
export const pool=new pg.Pool({host:resolve(localRoot,'socket'),port:54839,database:'temple_test',user:userInfo().username,max:5});
export async function transaction(work){
 const client=await pool.connect();
 try{await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result;}
 catch(error){await client.query('ROLLBACK');throw error;}
 finally{client.release();}
}
export async function migrate(){
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(541930)');
  await db.query('CREATE TABLE IF NOT EXISTS migrations(version integer PRIMARY KEY)');
  if((await db.query('SELECT version FROM migrations WHERE version=1')).rowCount)return;
  await db.query(await readFile(new URL('./001.sql',import.meta.url),'utf8'));
  const slots=fixedSlots();
  for(const kind of new Set(slots.map(s=>s.accepts)))await db.query('INSERT INTO products VALUES ($1)',[kind]);
  for(const s of slots)await db.query('INSERT INTO slots VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[s.id,'sample:sasa',s.zoneId,s.accepts,...s.position,s.rotationY,layoutDraft.version]);
  await db.query('INSERT INTO migrations VALUES (1)');
 });
}
