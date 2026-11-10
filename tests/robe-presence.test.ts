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


test('tea seating and drink phase reach later visitors and reject malformed drink states',()=>{
 const api=channels();const self=api('tea-guest','tea-session','join',{channel:1})[1].self;
 const pose={self,sequence:1,position:[59.5,.18,-64.8],yaw:0,animation:'sit',drinkLift:.8,beverage:'coffee'};
 assert.equal(api('tea-guest','tea-session','move',pose)[0],200);
 const watcher=api('watcher','watch-session','join',{channel:1})[1].self;
 const peer=api('watcher','watch-session','move',{...pose,self:watcher})[1].participants[0];
 assert.equal(peer.animation,'sit');assert.equal(peer.drinkLift,.8);assert.equal(peer.beverage,'coffee');
 for(const change of [{drinkLift:1.1},{drinkLift:NaN},{beverage:'unknown'}])assert.equal(api('tea-guest','tea-session','move',{...pose,sequence:2,...change})[0],400);
});
