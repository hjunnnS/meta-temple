/** Anonymous presence only. No accounts, orders, private rooms or payment APIs. */
export const CONTRACT={schemaVersion:1,layoutVersion:'layout-web-015',capacity:20,channels:3,ttlMs:30000,bounds:{west:-60,east:98,south:-81,north:118}};
const FACES=['human','rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig'];
const ORIGINS=new Set(['https://sasa-temple-personal-trial.fond-bell-1966.chatgpt.site','http://127.0.0.1:4355','http://localhost:4355']);
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
export function motion(value){
 const p=value?.position,b=CONTRACT.bounds;if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||p[0]<b.west||p[0]>b.east||p[2]<b.south||p[2]>b.north||p[1]<-1||p[1]>5||!Number.isFinite(value.yaw)||!['idle','walk','worship','sit','bell'].includes(value.animation))return null;
 for(const key of['bowProgress','bellProgress','drinkLift'])if(value[key]!==undefined&&(!Number.isFinite(value[key])||value[key]<0||value[key]>1))return null;
 for(const key of['meditating','wearingRobe'])if(value[key]!==undefined&&typeof value[key]!=='boolean')return null;
 if(value.face!==undefined&&!FACES.includes(value.face))return null;if(value.beverage!==undefined&&!['tea','coffee'].includes(value.beverage))return null;
 if(value.bellHit!==undefined&&(!Number.isSafeInteger(value.bellHit)||value.bellHit<0))return null;
 return{position:p,yaw:Math.atan2(Math.sin(value.yaw),Math.cos(value.yaw)),animation:value.animation,face:value.face??'human',wearingRobe:value.wearingRobe??false,meditating:value.meditating??false,bowProgress:value.bowProgress??0,bellProgress:value.bellProgress??0,bellHit:value.bellHit??0,drinkLift:value.drinkLift??0,beverage:value.beverage??'tea'};
}
async function body(request){
 const reader=request.body?.getReader();if(!reader)return{};let n=0,chunks=[];try{for(;;){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;if(n>4096){await reader.cancel();throw new Error('body_limit');}chunks.push(r.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(n);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}const value=JSON.parse(new TextDecoder().decode(bytes)||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('invalid_body');return value;
}
function selectPeers(db,channel,now){return db.prepare('SELECT session_id, sequence, pose FROM presence_sessions WHERE channel = ? AND updated_at >= ? ORDER BY session_id').bind(channel,now-CONTRACT.ttlMs);}
function snapshot(rows,self,channel){const peers=rows.map(r=>({...JSON.parse(r.pose),sessionId:r.session_id,sequence:r.sequence}));return{schemaVersion:CONTRACT.schemaVersion,layoutVersion:CONTRACT.layoutVersion,channelId:String(channel),self,count:peers.length,participants:peers.filter(p=>p.sessionId!==self)};}
export default{async fetch(request,env){
 const origin=request.headers.get('Origin'),allowed=origin&&ORIGINS.has(origin),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(allowed){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='POST, GET, OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type, Authorization';headers['Access-Control-Max-Age']='600';}
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&!allowed)return json({error:'origin_not_allowed'},403);
 const path=new URL(request.url).pathname;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(path==='/'||path==='/health')return json({service:'sasa-presence',schemaVersion:1,layoutVersion:CONTRACT.layoutVersion,capacity:20});
 if(!/^\/channel\/(join|move|leave)$/.test(path))return json({error:'not_found'},404);
 if(request.method!=='POST')return json({error:'method'},405);
 if(!env.DB)return json({error:'presence_unavailable'},503);
 try{
  const data=await body(request),db=env.DB,now=Date.now();
  if(path==='/channel/join'){
   const channel=Number(data.channel??1);if(!Number.isInteger(channel)||channel<1||channel>CONTRACT.channels)return json({error:'invalid_channel'},400);
   if(data.layoutVersion!==CONTRACT.layoutVersion)return json({error:'layout_mismatch'},409);
   const pose=motion(data.position?data:{position:[0,.245,-65],yaw:0,animation:'idle'});if(!pose)return json({error:'invalid_motion'},400);
   const self=crypto.randomUUID(),key=token();
   const result=await db.batch([
    db.prepare('DELETE FROM presence_sessions WHERE updated_at < ?').bind(now-CONTRACT.ttlMs),
    db.prepare('INSERT INTO presence_sessions (session_id, token_hash, channel, sequence, pose, updated_at, joined_at) SELECT ?, ?, ?, 0, ?, ?, ? WHERE (SELECT COUNT(*) FROM presence_sessions WHERE channel = ? AND updated_at >= ?) < ?').bind(self,await hash(key),channel,JSON.stringify(pose),now,now,channel,now-CONTRACT.ttlMs,CONTRACT.capacity),
    selectPeers(db,channel,now)
   ]);
   if(result[1].meta.changes!==1)return json({error:'channel_full'},409);
   return json({...snapshot(result[2].results,self,channel),key},201);
  }
  if(typeof data.self!=='string'||data.self.length>100)return json({error:'invalid_session'},400);
  const secret=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!secret||!/^[a-f0-9]{64}$/.test(secret))return json({error:'session_expired'},401);
  const keyHash=await hash(secret),row=await db.prepare('SELECT channel, sequence, pose, updated_at FROM presence_sessions WHERE session_id = ? AND token_hash = ? AND updated_at >= ?').bind(data.self,keyHash,now-CONTRACT.ttlMs).first();
  if(!row)return json({error:'session_expired'},401);
  if(path==='/channel/leave'){await db.prepare('DELETE FROM presence_sessions WHERE session_id = ? AND token_hash = ?').bind(data.self,keyHash).run();return json({left:true});}
  if(!Number.isSafeInteger(data.sequence)||data.sequence<1)return json({error:'invalid_sequence'},400);
  const pose=motion(data);if(!pose)return json({error:'invalid_motion'},400);
  const previous=JSON.parse(row.pose),distance=Math.hypot(pose.position[0]-previous.position[0],pose.position[2]-previous.position[2]);
  if(data.sequence>row.sequence&&row.sequence>0&&distance>1.5+8*Math.max(0,now-row.updated_at)/1000)return json({error:'invalid_motion'},400);
  const result=await db.batch([
   db.prepare('UPDATE presence_sessions SET sequence = ?, pose = ?, updated_at = ? WHERE session_id = ? AND token_hash = ? AND sequence < ? AND updated_at >= ?').bind(data.sequence,JSON.stringify(pose),now,data.self,keyHash,data.sequence,now-CONTRACT.ttlMs),
   selectPeers(db,row.channel,now)
  ]);
  // A concurrent leave or expiration must never resurrect the old session.
  if(!result[1].results.some(r=>r.session_id===data.self))return json({error:'session_expired'},401);
  return json(snapshot(result[1].results,data.self,row.channel));
 }catch(error){if(error instanceof SyntaxError||['body_limit','invalid_body'].includes(error?.message))return json({error:'invalid_body'},400);return json({error:'presence_unavailable'},503);}
}};
