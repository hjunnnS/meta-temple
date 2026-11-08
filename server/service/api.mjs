import {staff} from './staff.mjs';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {localRoot,pool,transaction,migrate} from './database.mjs';
import {trade} from './trade.mjs';
import {layoutDraft,offeringZones} from '../../src/contracts.ts';

const token=()=>randomBytes(32).toString('hex');
const digest=value=>createHash('sha256').update(value).digest('hex');
import {channels} from './channels.mjs';
export async function serviceApi(){
 await migrate();
 const presence=channels();
 return async(req,res,next)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith('/api/service/'))return next();
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!['127.0.0.1:4330','localhost:4330'].includes(req.headers.host))return send(403,{error:'local_only'});
  if(req.method!=='GET'&&req.headers.origin!=='http://'+req.headers.host)return send(403,{error:'origin'});
  const cookie=(req.headers.cookie??'').split(';').map(c=>c.trim()).find(c=>c.startsWith('sasa_session='))?.slice(13)??'';
  const cookieHash=digest(cookie);
  try{
   let input={};
   if(req.method==='POST'){
    let data='';for await(const chunk of req){data+=chunk;if(data.length>2048)return send(413,{error:'size'});}
    try{input=JSON.parse(data||'{}');}catch{return send(400,{error:'invalid_json'});}
    if(!input||typeof input!=='object')return send(400,{error:'invalid_input'});
   }
   if(path==='/api/service/login-link'&&req.method==='POST'){
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
   if(path==='/api/service/login'&&req.method==='POST'){
    if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token))return send(400,{error:'invalid_link'});
    const raw=token();
    const ok=await transaction(async db=>{
     const {rows:[link]}=await db.query('DELETE FROM login_links WHERE digest=$1 AND expires_at>now() RETURNING account_id',[digest(input.token)]);
     if(!link)return false;
     await db.query('DELETE FROM sessions WHERE digest=$1 OR expires_at<=now()',[cookieHash]);
     await db.query("INSERT INTO sessions VALUES ($1,$2,now()+interval '1 day')",[digest(raw),link.account_id]);
     await db.query("INSERT INTO events(kind,account_id) VALUES ('login',$1)",[link.account_id]);return true;
    });
    if(!ok)return send(401,{error:'invalid_link'});
    res.setHeader('Set-Cookie','sasa_session='+raw+'; Path=/api/service; HttpOnly; SameSite=Strict; Max-Age=86400');
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
     pub.text,(i.id IS NOT NULL) AS installed,CASE WHEN i.id IS NOT NULL THEN 'occupied' WHEN EXISTS(SELECT 1 FROM reservations r WHERE r.slot_id=s.id AND r.released_at IS NULL AND (r.payment_lock OR r.expires_at>now())) THEN 'reserved' ELSE 'free' END AS status FROM slots s LEFT JOIN installations i ON i.slot_id=s.id AND i.removed_at IS NULL AND i.starts_at<=now() AND i.ends_at>now() LEFT JOIN public_offerings pub ON pub.id=i.id WHERE s.zone_id=$1 ORDER BY s.id`,[zone,cookieHash]);
    return send(200,{schemaVersion:1,layoutVersion:layoutDraft.version,templeId:'sample:sasa',zoneId:zone,coordinateSystem:{units:'metre',up:'+Y',north:'+Z',rotation:'radian'},slots:rows});
   }
   const {rows:[account]}=await pool.query('SELECT a.id,a.email FROM accounts a JOIN sessions s ON a.id=s.account_id WHERE s.digest=$1 AND s.expires_at>now()',[cookieHash]);
   if(!account)return send(401,{error:'login_required'});
   if(path.startsWith('/api/service/staff/')){
    const [code,body]=await staff(account.id,path.split('/').pop(),req.method,input);
    return send(code,body);
   }
   if(req.method==='POST'&&path.startsWith('/api/service/channel/')){
    const [code,result]=presence(account.id,cookieHash,path.split('/').pop(),input);
    return send(code,result);
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
   if(req.method==='GET'&&path==='/api/service/me/offerings'){
    const {rows}=await pool.query('SELECT o.id AS "orderId",o.slot_id AS "slotId", s.kind,i.id AS "installationId",i.starts_at AS "startsAt",i.ends_at AS "endsAt",i.removed_at AS "removedAt",EXISTS(SELECT 1 FROM public_offerings pub WHERE pub.id=i.id) AS shareable,o.status,o.amount_krw AS "amountKrw",s.zone_id AS "zoneId" FROM orders o JOIN slots s ON s.id=o.slot_id LEFT JOIN installations i ON i.order_id=o.id WHERE o.account_id=$1 ORDER BY o.created_at DESC',[account.id]);
    return send(200,{items:rows});
   }
   return send(404,{error:'unknown_resource'});
  }catch{return send(503,{error:'service_unavailable'});}
 };
}
