import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {databaseSettings} from './runtime-config.mjs';
import {fixedSlots,layoutDraft} from '../../src/contracts.ts';

const settings=databaseSettings();
export const localRoot=settings.state;
export const connection=settings.connection;
export const pool=new pg.Pool({...connection,max:5,connectionTimeoutMillis:3000});
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
  const applied=new Set((await db.query('SELECT version FROM migrations')).rows.map(r=>r.version));
  if(!applied.has(1)){
   await db.query(await readFile(new URL('./001.sql',import.meta.url),'utf8'));
   const slots=fixedSlots();
   for(const kind of new Set(slots.map(s=>s.accepts)))await db.query('INSERT INTO products VALUES ($1)',[kind]);
   for(const s of slots)await db.query('INSERT INTO slots VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[s.id,'sample:sasa',s.zoneId,s.accepts,...s.position,s.rotationY,layoutDraft.version]);
   await db.query('INSERT INTO migrations VALUES (1)');
  }
  for(const version of [2,3,4,5,6,7,8,9,10,11,12,13]){
   if(applied.has(version))continue;
   await db.query(await readFile(new URL(String(version).padStart(3,'0')+'.sql',import.meta.url),'utf8'));
   await db.query('INSERT INTO migrations VALUES ($1)',[version]);
  }
  // Approved map relocation: update coordinates atomically, never recreate items or ownership.
  const stored=(await db.query("SELECT id,kind,layout_version FROM slots WHERE temple_id='sample:sasa'")).rows;
  if(stored.some(slot=>slot.layout_version!==layoutDraft.version)){
   const desired=fixedSlots(),byId=new Map(desired.map(slot=>[slot.id,slot]));
   if(stored.length!==desired.length||stored.some(slot=>byId.get(slot.id)?.accepts!==slot.kind))
    throw Error('배치 갱신 전 자리 ID와 종류를 확인해 주세요. 기존 거래는 변경하지 않았습니다.');
   for(const slot of desired)await db.query('UPDATE slots SET x=$2,y=$3,z=$4,rotation_y=$5,layout_version=$6 WHERE id=$1',
    [slot.id,...slot.position,slot.rotationY,layoutDraft.version]);
  }
 });
}
