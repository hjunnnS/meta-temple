import {validFace} from '../src/face-types.ts';
import {layoutDraft} from '../src/contracts.ts';
import { randomUUID } from 'node:crypto';

export function localSessions(){
 const sessions=new Map();
 const channelId='sample:channel:1',layoutVersion=layoutDraft.version;
 function snapshot(self){
  return {schemaVersion:1,layoutVersion,channelId,self,participants:[...sessions.values()].map(s=>s.pose).filter(p=>p.sessionId!==self)};
 }
 return async (req,send)=>{
  const now=Date.now();
  for(const [id,s] of sessions)if(now-s.last>20000)sessions.delete(id);
  if(req.method==='POST'&&req.url==='/api/review/sessions'){
   if(sessions.size>=32)return send(429,{error:'review_capacity'});
   const self='sample:session:'+randomUUID(),key=randomUUID();
   sessions.set(self,{key,last:now,pose:{sessionId:self,sequence:0,position:[0,.245,-65],yaw:0,animation:'idle',face:"human",wearingRobe:false}});
   return send(201,{...snapshot(self),key});
  }
  const id=req.url.slice('/api/review/sessions/'.length);
  const s=sessions.get(id);
  if(!s||req.headers.authorization!=='Bearer '+s.key)return send(401,{error:'expired_session'});
  if(req.method==='DELETE'){sessions.delete(id);return send(200,{left:true});}
  if(req.method!=='PUT')return send(405,{error:'method'});
  try{
   let body='';for await(const chunk of req){body+=chunk;if(body.length>2048)return send(413,{error:'size'});}
   const p=JSON.parse(body);
   if((p.face!==undefined&&!validFace(p.face))||!Number.isSafeInteger(p.sequence)||p.sequence<1||!Array.isArray(p.position)||p.position.length!==3||
    !p.position.every(n=>Number.isFinite(n)&&Math.abs(n)<=85)||!Number.isFinite(p.yaw)||(p.wearingRobe!==undefined&&typeof p.wearingRobe!=='boolean')||!['idle','walk','worship'].includes(p.animation))return send(400,{error:'invalid_motion'});
   // Recheck after reading the body; a concurrent leave may have invalidated the session.
   if(sessions.get(id)!==s)return send(401,{error:'expired_session'});
   s.last=now;
   if(p.sequence>s.pose.sequence)s.pose={sessionId:id,sequence:p.sequence,position:p.position,yaw:p.yaw,animation:p.animation,face:p.face??s.pose.face,wearingRobe:p.wearingRobe??s.pose.wearingRobe};
   return send(200,snapshot(id));
  }catch{return send(400,{error:'invalid_json'});}
 };
}
