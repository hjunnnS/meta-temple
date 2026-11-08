import {authConfig,firebaseVerifier,verifiedIdentity} from './external-auth.mjs';
import {maintainPrivacy} from './operations.mjs';
import {staff} from './staff.mjs';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {localRoot,pool,transaction,migrate} from './database.mjs';
import {trade} from './trade.mjs';
import {layoutDraft,offeringZones} from '../../src/contracts.ts';

const token=()=>randomBytes(32).toString('hex');
const digest=value=>createHash('sha256').update(value).digest('hex');
import {bowPractice} from './bows.mjs';
import {channels} from './channels.mjs';
const sessionCookie=raw=>'sasa_session='+raw+'; Path=/api/service; HttpOnly; SameSite=Strict; Max-Age=86400';
async function issueSession(db,id,raw,previous){
 await db.query('DELETE FROM sessions WHERE digest=$1 OR expires_at<=now()',[previous]);
 await db.query("INSERT INTO sessions VALUES ($1,$2,now()+interval '1 day')",[digest(raw),id]);
 await db.query("INSERT INTO events(kind,account_id) VALUES ('login',$1)",[id]);
}
export async function serviceApi(env=process.env){
 const external=authConfig(env);
 const verify=external&&firebaseVerifier(external);
 await migrate();
 const presence=channels(),practice=bowPractice();
 return async(req,res,next)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith('/api/service/'))return next();
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!['127.0.0.1:4330','localhost:4330','127.0.0.1:4340','localhost:4340'].includes(req.headers.host))return send(403,{error:'local_only'});
  if(req.method!=='GET'&&req.headers.origin!=='http://'+req.headers.host)return send(403,{error:'origin'});
  const cookie=(req.headers.cookie??'').split(';').map(c=>c.trim()).find(c=>c.startsWith('sasa_session='))?.slice(13)??'';
  const cookieHash=digest(cookie);
  const guest=(req.headers.cookie??'').split(';').map(value=>value.trim()).find(value=>/^sasa_guest=[a-f0-9]{64}$/.test(value))?.slice(11);
  try{
   let input={};
   if(req.method==='POST'){
    let data='';for await(const chunk of req){data+=chunk;if(data.length>(path==='/api/service/auth/finish'?18000:2048))return send(413,{error:'size'});}
    try{input=JSON.parse(data||'{}');}catch{return send(400,{error:'invalid_json'});}
    if(!input||typeof input!=='object')return send(400,{error:'invalid_input'});
   }
   if(path==='/api/service/time'&&req.method==='GET')return send(200,{time:Date.now()});
   if(path==='/api/service/auth/methods'&&req.method==='GET')return send(200,{external:!!external,methods:external?.methods??[],client:external?.client});
   if(path==='/api/service/auth/finish'&&req.method==='POST'&&external){
    const identity=await verifiedIdentity(external,input.idToken,verify);
    if(!identity)return send(401,{error:'invalid_login'});
    const raw=token();
    await transaction(async db=>{
     const {rows:[a]}=await db.query('INSERT INTO accounts(auth_identity) VALUES ($1) ON CONFLICT(auth_identity) DO UPDATE SET auth_identity=EXCLUDED.auth_identity RETURNING id',[identity]);
     await issueSession(db,a.id,raw,cookieHash);
    });
    if(guest)presence('guest:'+digest(guest),digest(guest),'logout',{});
    res.setHeader('Set-Cookie',sessionCookie(raw));
    return send(200,{signedIn:true});
   }
   if(!external&&path==='/api/service/login-link'&&req.method==='POST'){
    const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
    if(!/^[a-z0-9][a-z0-9._+-]{0,63}@example\.test$/.test(email))return send(400,{error:'test_email_required'});
    const raw=token();
    await transaction(async db=>{
     const {rows:[a]}=await db.query('INSERT INTO accounts(email) VALUES ($1) ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email RETURNING id',[email]);
     await db.query('DELETE FROM login_links WHERE account_id=$1 OR expires_at<=now()',[a.id]);
     await db.query("INSERT INTO login_links VALUES ($1,$2,now()+interval '10 minutes')",[digest(raw),a.id]);
     await writeFile(join(localRoot,'mail',randomUUID()+'.txt'),email+'\nhttp://'+req.headers.host+'/#login='+raw+'\n',{mode:0o600,flag:'wx'});
    });
    return send(202,{sent:true});
   }
   if(!external&&path==='/api/service/login'&&req.method==='POST'){
    if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token))return send(400,{error:'invalid_link'});
    const raw=token();
    const ok=await transaction(async db=>{
     const {rows:[link]}=await db.query('DELETE FROM login_links WHERE digest=$1 AND expires_at>now() RETURNING account_id',[digest(input.token)]);
     if(!link)return false;
     await issueSession(db,link.account_id,raw,cookieHash);return true;
    });
    if(!ok)return send(401,{error:'invalid_link'});
    if(guest)presence('guest:'+digest(guest),digest(guest),'logout',{});
    res.setHeader('Set-Cookie',sessionCookie(raw));
    return send(200,{signedIn:true});
   }
   if(path==='/api/service/logout'&&req.method==='POST'){
    const {rows:[signedOut]}=await pool.query('DELETE FROM sessions WHERE digest=$1 RETURNING account_id',[cookieHash]);
    if(signedOut)presence(signedOut.account_id,cookieHash,'logout',{});
    res.setHeader('Set-Cookie','sasa_session=; Path=/api/service; HttpOnly; SameSite=Strict; Max-Age=0');return send(200,{signedOut:true});
   }
   if(path==='/api/service/offers'&&req.method==='GET'){
    const {rows}=await pool.query('SELECT id,revision,kind,days,price_krw AS "priceKrw" FROM offers WHERE enabled ORDER BY kind,days');
    return send(200,{testOnly:true,offers:rows});
   }
   if(path==='/api/service/quote'&&req.method==='POST'){
    if(typeof input.offerId!=='string'||Object.keys(input).some(k=>k!=='offerId'))return send(400,{error:'invalid_offer'});
    const {rows:[offer]}=await pool.query('SELECT id,revision,kind,days,price_krw AS "priceKrw" FROM offers WHERE id=$1 AND enabled',[input.offerId]);
    if(!offer)return send(409,{error:'not_available'});
    return send(200,{testOnly:true,offer});
   }
   const shared=path.match(/^\/api\/service\/shared\/([0-9a-f-]{36})$/)?.[1];
   if(req.method==='GET'&&shared){
    const {rows:[item]}=await pool.query('SELECT kind,name,text FROM public_offerings WHERE id::text=$1',[shared]);
    return item?send(200,item):send(404,{error:'unavailable'});
   }
   const zone=path.match(/^\/api\/service\/temples\/sample:sasa\/zones\/(Z\d+)\/slots$/)?.[1];
   if(req.method==='GET'&&offeringZones.includes(zone)){
    const {rows}=await pool.query(`SELECT s.id AS "slotId",ARRAY[s.x,s.y,s.z] AS position,s.rotation_y AS "rotationY",s.kind AS accepts,i.id AS "installationId",COALESCE(i.account_id=(SELECT account_id FROM sessions WHERE digest=$2 AND expires_at>now()),false) AS owned,
     pub.name,
     CASE WHEN s.kind='wish-plaque' AND NOT i.text_deleted AND i.account_id=(SELECT account_id FROM sessions WHERE digest=$2 AND expires_at>now()) THEN o.inscription->>'text' ELSE pub.text END AS text,(i.id IS NOT NULL) AS installed,CASE WHEN i.id IS NOT NULL THEN 'occupied' WHEN EXISTS(SELECT 1 FROM reservations r WHERE r.slot_id=s.id AND r.released_at IS NULL AND (r.payment_lock OR r.expires_at>now())) THEN 'reserved' ELSE 'free' END AS status FROM slots s LEFT JOIN installations i ON i.slot_id=s.id AND i.removed_at IS NULL AND i.starts_at<=now() AND i.ends_at>now() LEFT JOIN orders o ON o.id=i.order_id LEFT JOIN public_offerings pub ON pub.id=i.id WHERE s.zone_id=$1 ORDER BY s.id`,[zone,cookieHash]);
    return send(200,{schemaVersion:1,layoutVersion:layoutDraft.version,templeId:'sample:sasa',zoneId:zone,coordinateSystem:{units:'metre',up:'+Y',north:'+Z',rotation:'radian'},slots:rows});
   }
   const {rows:[account]}=await pool.query('SELECT a.id,a.email FROM accounts a JOIN sessions s ON a.id=s.account_id WHERE s.digest=$1 AND s.expires_at>now()',[cookieHash]);
   if(req.method==='POST'&&path.startsWith('/api/service/channel/')){
    const action=path.split('/').pop();
    let visitor=account?.id,session=cookieHash;
    if(!visitor){
     if(!guest&&action!=='join')return send(410,{});
     const key=guest??token();
     if(!guest)res.setHeader('Set-Cookie','sasa_guest='+key+'; Path=/api/service; HttpOnly; SameSite=Strict');
     session=digest(key);visitor='guest:'+session;
    }
    const [code,result]=presence(visitor,session,action,input);return send(code,result);
   }
   if(!account)return send(401,{error:'login_required'});
   if(req.method==='POST'&&path.startsWith('/api/service/practice/')){
    const [code,result]=practice(cookieHash,path.split('/').pop(),input);return send(code,result);
   }
   if(path==='/api/service/me/delete'&&req.method==='POST'&&input.confirm===true)return send(200,await maintainPrivacy(account.id));
   if(path==='/api/service/report'&&req.method==='POST'){
    if(!['privacy','harm','other'].includes(input.category)||typeof input.id!=='string')return send(400,{error:'invalid_report'});
    const found=await pool.query('WITH visible AS (SELECT id FROM public_offerings WHERE id::text=$1), submitted AS (INSERT INTO content_reports(installation_id,reporter,category) SELECT id,$2,$3 FROM visible ON CONFLICT DO NOTHING) SELECT id FROM visible',[input.id,account.id,input.category]);
    return found.rowCount?send(200,{reported:true}):send(404,{error:'unavailable'});
   }
   if(path.startsWith('/api/service/staff/')){
    const criteria=req.method==='GET'?Object.fromEntries(new URL(req.url,'http://localhost').searchParams):input;
    const [code,body]=await staff(account.id,path.split('/').pop(),req.method,criteria);
    return send(code,body);
   }
   if(path==='/api/service/hide'&&req.method==='POST'){
    const result=await pool.query('UPDATE installations SET hidden=true WHERE id::text=$1 AND account_id=$2',[input.id,account.id]);
    return result.rowCount?send(200,{hidden:true}):send(404,{error:'unavailable'});
   }
   if(path.startsWith('/api/service/trade/')){
    const [status,result]=await trade(path.slice('/api/service/trade/'.length),req.method,input,account.id);
    return send(status,result);
   }
   if(req.method==='GET'&&path==='/api/service/me')return send(200,{email:account.email});
   if(req.method==='POST'&&path==='/api/service/me/order-inquiry'){
    const found=await transaction(async db=>{
     const {rows:[order]}=await db.query('SELECT id FROM orders WHERE id::text=$1 AND account_id=$2 FOR UPDATE',[input.id,account.id]);
     if(!order)return false;
     await db.query(`INSERT INTO events(kind,account_id,order_id) SELECT 'order_inquiry',$1,$2 WHERE NOT EXISTS(SELECT 1 FROM events WHERE order_id=$2 AND kind='order_inquiry')`,[account.id,order.id]);
     return true;
    });
    return found?send(200,{received:true}):send(404,{error:'unavailable'});
   }
   if(req.method==='GET'&&path==='/api/service/me/offerings'){
    const {rows}=await pool.query(`SELECT o.id AS "orderId",EXISTS(SELECT 1 FROM events e WHERE e.order_id=o.id AND e.kind='order_inquiry') AS inquired,o.slot_id AS "slotId", s.kind,i.id AS "installationId",i.starts_at AS "startsAt",i.ends_at AS "endsAt",i.removed_at AS "removedAt",EXISTS(SELECT 1 FROM public_offerings pub WHERE pub.id=i.id) AS shareable,o.status,o.amount_krw AS "amountKrw",s.zone_id AS "zoneId" FROM orders o JOIN slots s ON s.id=o.slot_id LEFT JOIN installations i ON i.order_id=o.id WHERE o.account_id=$1 ORDER BY o.created_at DESC`,[account.id]);
    return send(200,{items:rows});
   }
   return send(404,{error:'unknown_resource'});
  }catch{return send(503,{error:'service_unavailable'});}
 };
}
