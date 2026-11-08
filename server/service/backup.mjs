import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,mkdtemp,readFile,writeFile,readdir,rename,rm,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import pg from 'pg';
import {localRoot,pool} from './database.mjs';
const run=promisify(execFile);
const folder=join(localRoot,'backups');
const env={...process.env,PGHOST:join(localRoot,'socket'),PGPORT:'54839'};
const day=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
async function manifest(db){
 const {rows}=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('sessions','login_links') ORDER BY tablename");
 const result={};
 for(const {tablename} of rows){
  if(!/^[a-z_]+$/.test(tablename))throw Error('Unexpected table');
  result[tablename]=(await db.query('SELECT count(*)::int AS count,md5(string_agg(md5(to_jsonb(t)::text),\'\' ORDER BY md5(to_jsonb(t)::text))) AS digest FROM '+tablename+' t')).rows[0];
 }
 return result;
}
export async function dailyBackup(){
 await mkdir(folder,{recursive:true,mode:0o700});
 const today=day(),target=join(folder,today);
 const db=await pool.connect();let tmp;
 try{
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  if(!(await db.query('SELECT pg_try_advisory_xact_lock(541932) AS own')).rows[0].own)return;
  for(const entry of await readdir(folder))if(/^\d{4}-\d\d-\d\d$/.test(entry)&&Date.parse(today)-Date.parse(entry)>=7*86400000)await rm(join(folder,entry),{recursive:true});
  if(await stat(target).catch(e=>{if(e.code!=='ENOENT')throw e;}))return;
  tmp=await mkdtemp(join(folder,'.pending-'));
  const snapshot=(await db.query('SELECT pg_export_snapshot() AS id')).rows[0].id;
  await run('pg_dump',['-Fc','--snapshot='+snapshot,'--exclude-table-data=public.sessions','--exclude-table-data=public.login_links','-f',join(tmp,'temple.dump'),'temple_test'],{env});
  await writeFile(join(tmp,'manifest.json'),JSON.stringify(await manifest(db)),{mode:0o600});
  await rename(tmp,target);tmp=undefined;
 }finally{try{await db.query('ROLLBACK');if(tmp)await rm(tmp,{recursive:true,force:true});}finally{db.release();}}
}
export async function verifyRestore(){
 await dailyBackup();const target=join(folder,day()),dbName='temple_verify_'+randomUUID().replaceAll('-','');
 const started=Date.now();
 await run('createdb',[dbName],{env});
 const client=new pg.Client({host:env.PGHOST,port:54839,database:dbName});
 try{
  await run('pg_restore',['--exit-on-error','--single-transaction','-d',dbName,join(target,'temple.dump')],{env});
  await client.connect();const actual=await manifest(client),expected=JSON.parse(await readFile(join(target,'manifest.json'),'utf8'));
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Restore manifest mismatch');
  if(Date.now()-started>1800000)throw Error('Restore exceeded 30 minutes');
  console.log('Verified isolated restore:',actual.slots.count,'slots,',Object.keys(actual).length,'table fingerprints,',Date.now()-started,'ms');
 }finally{await client.end();await run('dropdb',[dbName],{env});}
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{if(process.argv[2]==='verify')await verifyRestore();else await dailyBackup();}finally{await pool.end();}
}
