import test from 'node:test';import assert from 'node:assert/strict';
import{createTrialApi}from'../src/trial-api.ts';import{parseReviewSlots}from'../src/review-slots.ts';import{offeringZones}from'../src/contracts.ts';
const memory=()=>{const m=new Map<string,string>();return{getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);}};};
test('trial gates personal actions, keeps original slot geometry, installs all five kinds once and persists locally',async()=>{
 const storage=memory(),api=createTrialApi(storage);assert.equal((await api('me')).status,401);assert.equal((await api('practice/start','POST')).status,401);
 await api('auth/local-preview','POST');let n=5;assert.equal((await(await api('me/offerings')).json()).items.length,n);
 for(const zone of offeringZones){const data=await(await api('temples/sample:sasa/zones/'+zone+'/slots')).json();parseReviewSlots(data,zone,true);const slot=data.slots.find((s:any)=>s.status==='free');if(!slot)continue;
  const offer=(await(await api('offers')).json()).offers.find((o:any)=>o.kind===slot.accepts);const payload={revision:1,offerId:offer.id,slotId:slot.slotId,name:'',text:'평안한 하루',public:false,tag:false};
  assert.equal((await api('trade/enter','POST',payload)).status,200);const hold=(await(await api('trade/hold')).json()).hold;
  const order=await(await api('trade/checkout','POST',{holdId:hold.id})).json();assert.equal((await(await api('trade/checkout','POST',{holdId:hold.id})).json()).id,order.id);
  await api('trade/test-pay','POST',{orderId:order.id});await api('trade/test-pay','POST',{orderId:order.id});n++;
  assert.equal((await(await api('me/offerings')).json()).items.length,n);await api('logout','POST');const publicData=await(await api('temples/sample:sasa/zones/'+zone+'/slots')).json();assert.equal(publicData.slots.find((s:any)=>s.slotId===slot.slotId).text,'');await api('auth/local-preview','POST');
 }
 assert.equal(n,10);const reopened=createTrialApi(storage);assert.equal((await(await reopened('me/offerings')).json()).items.length,10);
 const other=createTrialApi(memory());await other('auth/local-preview','POST');assert.equal((await(await other('me/offerings')).json()).items.length,5);
});
test('private display persists, rejects stale edits and incompatible placements, and reset removes only this browser data',async()=>{
 const storage=memory(),api=createTrialApi(storage);await api('auth/local-preview','POST');const data=await(await api('private-room/display')).json();const item=data.items.find((i:any)=>i.kind==='lantern');
 assert.equal((await api('private-room/display','POST',{revision:0,placements:[{slotId:'right-1-1',orderId:item.orderId}]})).status,409);
 const placements=[{slotId:'left-1-1',orderId:item.orderId}];assert.equal((await api('private-room/display','POST',{revision:0,placements})).status,200);
 assert.equal((await api('private-room/display','POST',{revision:0,placements:[]})).status,409);assert.deepEqual((await(await createTrialApi(storage)('private-room/display')).json()).placements,placements);
 await api('me/delete','POST');assert.equal((await api('me')).status,401);await api('auth/local-preview','POST');assert.deepEqual((await(await api('private-room/display')).json()).placements,[]);
});
test('hold expires, practice counts are idempotent through completion and unsupported server actions fail explicitly',async()=>{
 let now=Date.now();const api=createTrialApi(memory(),()=>now);await api('auth/local-preview','POST');const data=await(await api('temples/sample:sasa/zones/Z02/slots')).json(),slot=data.slots.find((s:any)=>s.status==='free'),offer=(await(await api('offers')).json()).offers[0];
 await api('trade/enter','POST',{slotId:slot.slotId,offerId:offer.id,revision:1});now+=301000;assert.equal((await(await api('trade/hold')).json()).hold,null);
 const run=await(await api('practice/start','POST')).json();for(let count=1;count<=108;count++)assert.equal((await(await api('practice/bow','POST',{id:run.id,count})).json()).count,count);assert.equal((await(await api('practice/bow','POST',{id:run.id,count:108})).json()).count,108);assert.equal((await api('practice/bow','POST',{id:run.id,count:110})).status,409);assert.equal((await api('staff/refund','POST')).status,501);
});
