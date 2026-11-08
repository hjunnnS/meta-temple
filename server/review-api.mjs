import {localSessions} from './local-sessions.mjs';
import {readFile} from 'node:fs/promises';
import {zoneLayout} from './review-layout.mjs';
import {offeringZones} from '../src/contracts.ts';


export function reviewApi(){
 const sessionApi=localSessions();
 return async (req,res,next)=>{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith('/api/review/'))return next();
  function send(status,body){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!/^((localhost|127\.0\.0\.1)(:\d+)?|\[::1\](:\d+)?)$/.test(req.headers.host??''))return send(403,{error:'local_only'});
  if(req.headers.origin && req.headers.origin!=='http://'+req.headers.host)return send(403,{error:'origin'});
  if(url.pathname==='/api/review/sessions'||url.pathname.startsWith('/api/review/sessions/'))return sessionApi(req,send);
  const zone=url.pathname.match(/^\/api\/review\/temples\/sample:sasa\/zones\/(Z\d+)\/slots$/)?.[1];
  if(!offeringZones.includes(zone))return send(404,{error:'unknown_resource'});
  if(req.method!=='GET')return send(405,{error:'method'});
  try{send(200,process.env.TEMPLE_REVIEW_FIXTURE&&zone==='Z02'?JSON.parse(await readFile(process.env.TEMPLE_REVIEW_FIXTURE,'utf8')):zoneLayout(zone));}
  catch{send(503,{error:'fixture_unavailable'});}
 };
}
