import {createServer} from 'node:http';
import {resolve} from 'node:path';
import express from 'express';
import sirv from 'sirv';
import {matchMaker} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {TempleRoom} from './temple-room.mjs';
import {CONTRACT,motion} from './contract.mjs';
const port=Number(process.env.PORT??18831),host=process.env.HOST??'127.0.0.1';
const origins=new Set((process.env.SASA_ALLOWED_ORIGINS??'http://127.0.0.1:4355,http://localhost:4355').split(',').filter(Boolean));
const allowed=origin=>!origin||origins.has(origin);
const app=express(),channels=new Map(),rate=new Map();
app.disable('x-powered-by');
app.use((req,res,next)=>{const origin=req.get('origin');res.set('Cache-Control','no-store');if(!allowed(origin))return res.sendStatus(403);if(origin){res.set('Access-Control-Allow-Origin',origin);res.vary('Origin');res.set('Access-Control-Allow-Headers','Content-Type');res.set('Access-Control-Allow-Methods','POST, OPTIONS');}if(req.method==='OPTIONS')return res.sendStatus(204);next();});
app.get('/healthz',(_req,res)=>res.json({service:'sasa-colyseus',transport:'Colyseus 0.16 / WebSocket',layoutVersion:CONTRACT.layoutVersion,channels:3,capacity:20}));
app.use(express.json({limit:'4kb'}));
app.post('/presence/join',async(req,res)=>{
 const address=req.ip,now=Date.now();let window=rate.get(address);if(!window||window.until<=now){window={until:now+60000,count:0};rate.set(address,window);}if(++window.count>90)return res.status(429).json({error:'try_later'});
 const channel=req.body?.channel;if(!Number.isInteger(channel)||!channels.has(channel))return res.status(400).json({error:'invalid_channel'});
 if(req.body.layoutVersion!==CONTRACT.layoutVersion)return res.status(409).json({error:'layout_mismatch'});
 const pose=motion(req.body);if(!pose)return res.status(400).json({error:'invalid_motion'});
 try{const seat=await matchMaker.joinById(channels.get(channel),{...pose,channel,layoutVersion:CONTRACT.layoutVersion});const {name,roomId,processId}=seat.room;res.json({sessionId:seat.sessionId,room:{name,roomId,processId}});}catch{res.status(409).json({error:'channel_full'});}
});
// Keep account, purchase and private-room APIs out of this anonymous presence server.
app.use(['/api','/matchmake','/presence'],(_req,res)=>res.status(404).json({error:'not_found'}));
if(process.env.SASA_STATIC_DIR)app.use(sirv(resolve(process.env.SASA_STATIC_DIR),{single:true,etag:true,dev:true}));
app.use((_req,res)=>res.sendStatus(404));
app.use((error,_req,res,_next)=>res.status(error.status===413?413:400).json({error:'invalid_request'}));
const server=createServer(app);server.once('error',error=>{console.error('HTTP server failed:',error.code);process.exit(1);});const transport=new WebSocketTransport({server,maxPayload:4096,pingInterval:3000,pingMaxRetries:2,verifyClient:info=>allowed(info.origin)});
await matchMaker.setup();matchMaker.defineRoomType('temple',TempleRoom);await matchMaker.accept();
for(let channel=1;channel<=3;channel++){const room=await matchMaker.createRoom('temple',{channel});channels.set(channel,room.roomId);}
transport.listen(port,host,()=>console.log('Sasa Colyseus listening on '+host+':'+port));
const cleanup=setInterval(()=>{const now=Date.now();for(const [key,value]of rate)if(value.until<=now)rate.delete(key);},60000);cleanup.unref();
for(const event of ['SIGINT','SIGTERM'])process.once(event,async()=>{clearInterval(cleanup);await matchMaker.gracefullyShutdown();transport.shutdown();process.exit(0);});
