import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {Client} from 'colyseus.js';
import {CONTRACT,motion} from '../contract.mjs';
const base='http://127.0.0.1:18833',pose={position:[0,.245,-65],yaw:0,animation:'idle'},rooms=[];
const child=spawn(process.execPath,['bootstrap.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'18833'},stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
async function until(check,ms=6000){const end=Date.now()+ms;while(!await check()){if(Date.now()>end)throw Error('Timed out: '+log);await delay(30);}}
async function reserve(channel=3,overrides={}){return fetch(base+'/presence/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...pose,channel,layoutVersion:CONTRACT.layoutVersion,...overrides})});}
async function join(channel=3){const response=await reserve(channel);assert.equal(response.status,200);const room=await new Client(base).consumeSeatReservation(await response.json());room.snapshot=null;room.onMessage('snapshot',s=>room.snapshot=s);rooms.push(room);room.send('snapshot');return room;}
try{
 await until(async()=>{try{return(await fetch(base+'/healthz')).ok;}catch{return false;}});
 await test('validation rejects invalid motion and channel/layout/origin; no transaction APIs',async()=>{
  assert.equal(motion({...pose,position:[Infinity,0,0]}),null);assert.equal(motion({...pose,bowProgress:2}),null);
  assert.equal((await reserve(4)).status,400);assert.equal((await reserve(3,{layoutVersion:'wrong'})).status,409);
  assert.equal((await reserve(3,{face:'invalid'})).status,400);
  assert.equal((await fetch(base+'/presence/join',{method:'POST',headers:{Origin:'https://unrelated.example'}})).status,403);
  assert.equal((await fetch(base+'/api/service/trade/checkout',{method:'POST'})).status,404);
  assert.equal((await fetch(base+'/matchmake/joinOrCreate/temple',{method:'POST'})).status,404);
 });
 await test('3 real SDK sessions synchronize movement, bow, robe, face, bell and tea; reject stale and impossible movement',async()=>{
  const a=await join(),b=await join(),c=await join();await until(()=>[a,b,c].every(r=>r.snapshot?.count===3));
  assert.equal(new Set([a.roomId,b.roomId,c.roomId]).size,1);assert.equal(new Set([a.sessionId,b.sessionId,c.sessionId]).size,3);
  a.send('move',{...pose,sequence:1,position:[1,.245,-65],animation:'worship',face:'rabbit',wearingRobe:true,bowProgress:.4});
  await until(()=>b.snapshot.participants.find(p=>p.sessionId===a.sessionId)?.face==='rabbit');
  const remote=b.snapshot.participants.find(p=>p.sessionId===a.sessionId);assert.equal(remote.wearingRobe,true);assert.equal(remote.bowProgress,.4);assert.equal(remote.animation,'worship');
  await delay(60);a.send('move',{...pose,sequence:2,position:[90,.245,90]});await delay(200);assert.equal(b.snapshot.participants.find(p=>p.sessionId===a.sessionId).sequence,1);
  a.send('move',{...pose,sequence:1,face:'dog'});await delay(150);assert.equal(b.snapshot.participants.find(p=>p.sessionId===a.sessionId).face,'rabbit');
  a.send('move',{...pose,sequence:3,animation:'bell',bellProgress:.4,bellHit:1});await until(()=>c.snapshot.participants.find(p=>p.sessionId===a.sessionId)?.bellHit===1);
  await delay(60);a.send('move',{...pose,sequence:4,animation:'sit',drinkLift:.7,beverage:'coffee'});await until(()=>b.snapshot.participants.find(p=>p.sessionId===a.sessionId)?.beverage==='coffee');
  await c.leave();await until(()=>a.snapshot.count===2);const other=await join(2);await until(()=>other.snapshot?.count===1);assert.equal(other.snapshot.participants.length,0);await other.leave();
  const back=await join();await until(()=>a.snapshot.count===3);assert.notEqual(back.sessionId,c.sessionId);await back.leave();await a.leave();await b.leave();
 });
 await test('one fixed room per channel, capacity20 and 21st denied; releases seats on leave',async()=>{
  const clients=[];for(let i=0;i<20;i++)clients.push(await join(1));await until(()=>clients[0].snapshot?.count===20);
  assert.equal(new Set(clients.map(r=>r.roomId)).size,1);assert.equal((await reserve(1)).status,409);
  await clients.pop().leave();await until(()=>clients[0].snapshot.count===19);const replacement=await join(1);await until(()=>replacement.snapshot?.count===20);await replacement.leave();await Promise.all(clients.map(r=>r.leave()));
 });
}finally{for(const r of rooms)r.connection?.close();child.kill('SIGTERM');await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(3000)]);if(child.exitCode===null)child.kill('SIGKILL');}
