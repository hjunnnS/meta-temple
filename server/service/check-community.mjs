import assert from 'node:assert/strict';
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {pool} from './database.mjs';

const origin='http://127.0.0.1:4330';
const accounts=[],clients=[];
async function request(path,cookie,body){
 const response=await fetch(origin+'/api/service/'+path,{method:body?'POST':'GET',headers:{origin,cookie:'sasa_session='+cookie,'content-type':'application/json'},body:body&&JSON.stringify(body)});
 return {status:response.status,data:await response.json()};
}
try{
 for(let i=0;i<21;i++){
  const id=randomUUID(),key=randomBytes(32).toString('hex');
  await pool.query('INSERT INTO accounts VALUES ($1,$2)',[id,id+'@example.test']);accounts.push(id);
  await pool.query("INSERT INTO sessions VALUES ($1,$2,now()+interval '5 minutes')",[createHash('sha256').update(key).digest('hex'),id]);clients.push(key);
 }
 assert.equal((await request('channel/join','',{channel:3})).status,200);
 assert.equal((await request('practice/start','',{})).status,401);
 const start=performance.now();
 const members=await Promise.all(clients.slice(0,20).map(key=>request('channel/join',key,{channel:1})));
 assert(members.every(r=>r.status===200));
 assert.equal((await request('channel/join',clients[20],{channel:1})).status,409);
 assert.equal((await request('channel/join',clients[20],{channel:2})).data.count,1);
 const moves=await Promise.all(members.map((m,i)=>request('channel/move',clients[i],{self:m.data.self,position:[.2,.245,-65],yaw:0,sequence:1,animation:i?'walk':'worship'})));
 assert(moves.every(r=>r.status===200&&r.data.count===20&&r.data.participants.length===19));
 assert(moves.slice(1).some(r=>r.data.participants.some(p=>p.animation==='worship')) || (await request('channel/join',clients[1],{channel:1})).data.participants.some(p=>p.animation==='worship'));
 assert.equal((await request('channel/move',clients[0],{self:members[0].data.self,position:[80,1,80],yaw:0,sequence:2,animation:'walk'})).status,422);
 const latest={self:members[0].data.self,position:[.3,.245,-65],yaw:.5,sequence:4,animation:'idle'};
 assert.equal((await request('channel/move',clients[0],latest)).status,200);
 await request('channel/move',clients[0],{...latest,sequence:2,yaw:0});
 const current=(await request('channel/join',clients[1],{channel:1})).data.participants.find(p=>p.sessionId===latest.self);
 assert.equal(current.sequence,4);assert.equal(current.yaw,.5);
 for(let i=0;i<20;i++)assert.equal((await request('channel/leave',clients[i],{self:members[i].data.self})).status,200);
 const loneVisitor=(await request('channel/join',clients[20],{channel:1})).data;
 assert.equal(loneVisitor.count,1);
 // Simulate a lost tab with no leave signal or heartbeat, then use the same authenticated session again.
 await new Promise(resolve=>setTimeout(resolve,20100));
 const stale=await request('channel/move',clients[20],{self:loneVisitor.self,position:[0,.245,-65],sequence:1,yaw:0,animation:'idle'});
 assert.equal(stale.status,410);
 const returned=(await request('channel/join',clients[20],{channel:1})).data;
 assert.equal(returned.count,1);assert.notEqual(returned.self,loneVisitor.self);
 console.log('20 concurrent HTTP sessions, movement, worship, capacity, channel switch and leave:',Math.round(performance.now()-start),'ms');
 const id=accounts[0];
 const {rows:[slot]}=await pool.query("SELECT id FROM slots s WHERE kind='lantern' AND NOT EXISTS(SELECT 1 FROM reservations WHERE slot_id=s.id AND released_at IS NULL) AND NOT EXISTS(SELECT 1 FROM installations WHERE slot_id=s.id AND removed_at IS NULL) LIMIT 1");
 const {rows:[hold]}=await pool.query("INSERT INTO reservations(account_id,slot_id,kind,expires_at,released_at) VALUES($1,$2,'lantern',now(),now()) RETURNING id",[id,slot.id]);
 const {rows:[order]}=await pool.query("INSERT INTO orders(reservation_id,account_id,slot_id,amount_krw,term_days,status,inscription) VALUES($1,$2,$3,3000,7,'installed',$4) RETURNING id",[hold.id,id,slot.id,{public:true,tag:true,name:'시험',text:'공개 문구'}]);
 const {rows:[item]}=await pool.query("INSERT INTO installations(order_id,account_id,slot_id,starts_at,ends_at) VALUES($1,$2,$3,now()-interval '2 days',now()+interval '5 days') RETURNING id",[order.id,id,slot.id]);
 const link='shared/'+item.id;
 assert.deepEqual((await request(link,'')).data,{kind:'lantern',name:'시험',text:'공개 문구'});
 assert.equal((await request('hide',clients[1],{id:item.id})).status,404);
 await pool.query("UPDATE orders SET inscription=jsonb_set(inscription,'{public}','false') WHERE id=$1",[order.id]);
 assert.equal((await request(link,'')).status,404);
 await pool.query("UPDATE orders SET inscription=jsonb_set(inscription,'{public}','true') WHERE id=$1",[order.id]);
 assert.equal((await request('hide',clients[0],{id:item.id})).status,200);
 assert.equal((await request(link,'')).status,404);
 await pool.query("UPDATE installations SET hidden=false,ends_at=now()-interval '1 minute' WHERE id=$1",[item.id]);
 assert.equal((await request(link,'')).status,404);
 await pool.query("UPDATE installations SET ends_at=now()+interval '1 day' WHERE id=$1",[item.id]);
 const reason={id:item.id,category:'privacy'};
 assert.equal((await request('report','',reason)).status,401);
 for(let i=0;i<2;i++)assert.equal((await request('report',clients[1],reason)).status,200);
 assert.equal((await request('staff/content',clients[1])).status,403);
 await pool.query("INSERT INTO staff_roles VALUES ($1,'moderation'),($2,'desk')",[accounts[2],accounts[3]]);
 const reports=await request('staff/content',clients[2]);
 assert.equal(reports.data.rows.find(r=>r.id===item.id).text,'공개 문구');
 for(const action of ['hide','delete']){
  assert.equal((await request('staff/content',clients[2],{id:item.id,action,reason:'정책 검수'})).status,200);
  assert.equal((await request(link,'')).status,404);
 }
 const retained=await pool.query('SELECT i.removed_at,o.status,o.inscription FROM orders o JOIN installations i ON i.order_id=o.id WHERE o.id=$1',[order.id]);
 assert.deepEqual(retained.rows[0],{removed_at:null,status:'installed',inscription:{}});
 assert.equal((await request('staff/orders?q='+order.id,clients[3])).data.rows[0].id,order.id);
 assert.equal((await request('staff/orders',clients[3],{id:order.id,reason:'정상 설치'})).status,409);
 console.log('Moderation and desk: report, restricted review, hide, delete, preserve purchase, order search and refund scope passed.');
 console.log('Shared detail: guest, consent withdrawal, owner hide, expiry and forbidden non-owner change passed.');
}finally{
 await Promise.all(clients.map(key=>request('logout',key,{})));
 await pool.query('DELETE FROM content_reports WHERE reporter=ANY($1::uuid[])',[accounts]);
 await pool.query('DELETE FROM staff_audit WHERE actor=ANY($1::uuid[])',[accounts]);
 await pool.query('DELETE FROM staff_roles WHERE account_id=ANY($1::uuid[])',[accounts]);
 for(const table of ['events','installations','orders','reservations','sessions','accounts'])
  await pool.query('DELETE FROM '+table+' WHERE '+(table==='accounts'?'id':'account_id')+'=ANY($1::uuid[])',[accounts]);
 await pool.end();
}
