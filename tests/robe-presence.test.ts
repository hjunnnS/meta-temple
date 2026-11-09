import assert from 'node:assert/strict';
import test from 'node:test';
import {channels} from '../server/service/channels.mjs';

test('late arrivals see the current robe and stale moves cannot restore it',()=>{
 const api=channels();
 function join(name:string){return api(name,name,'join',{channel:1})[1].self;}
 const a=join('visitor-a');
 function move(name:string,self:string,sequence:number,wearingRobe?:boolean){
  const [status,data]=api(name,name,'move',{self,sequence,position:[2.1,1.78,38.35],animation:'worship',yaw:0,wearingRobe});
  assert.equal(status,200);return data.participants;
 }
 move('visitor-a',a,1,true);
 const b=join('visitor-b');
 assert.equal(move('visitor-b',b,1)[0].wearingRobe,true);
 move('visitor-a',a,3,false);
 move('visitor-a',a,2,true);
 assert.equal(move('visitor-b',b,2)[0].wearingRobe,false);
});

test('a later visitor gets the current bow progress and stale moves cannot rewind it',()=>{
 const api=channels();
 const member=(name:string)=>api(name,name,'join',{channel:1})[1].self;
 const a=member('a');
 const pose={self:a,sequence:2,position:[0,.245,-65],yaw:0,animation:'worship',bowProgress:.64};
 assert.equal(api('a','a','move',pose)[0],200);
 api('a','a','move',{...pose,sequence:1,bowProgress:0});
 assert.equal(api('b','b','join',{channel:1})[1].participants[0].bowProgress,.64);
 assert.equal(api('a','a','move',{...pose,sequence:3,bowProgress:1.1})[0],400);
});
