import {Room} from '@colyseus/core';
import {CONTRACT,motion} from './contract.mjs';
export class TempleRoom extends Room {
 onCreate({channel}){
  this.channel=channel;this.maxClients=CONTRACT.capacity;this.autoDispose=false;this.members=new Map();this.setSeatReservationTime(8);
  this.onMessage('move',(client,input)=>{
   const previous=this.members.get(client.sessionId),now=performance.now();
   if(!previous||!Number.isSafeInteger(input?.sequence)||input.sequence<=previous.sequence||now-client.userData.received<50)return;
   client.userData.received=now;const pose=motion(input);if(!pose)return;
   const distance=Math.hypot(pose.position[0]-previous.position[0],pose.position[2]-previous.position[2]);
   if(distance>1.5+8*(now-client.userData.moved)/1000)return;
   this.members.set(client.sessionId,{...pose,sequence:input.sequence,sessionId:client.sessionId});client.userData.moved=now;
  });
  this.onMessage('snapshot',client=>this.sendSnapshot(client));
  this.setSimulationInterval(()=>{for(const client of this.clients)this.sendSnapshot(client);},100);
 }
 onAuth(_client,options){return options.layoutVersion===CONTRACT.layoutVersion&&options.channel===this.channel&&!!motion(options);}
 onJoin(client,options){const now=performance.now();client.userData={received:-Infinity,moved:now};this.members.set(client.sessionId,{...motion(options),sequence:0,sessionId:client.sessionId});}
 onLeave(client){this.members.delete(client.sessionId);for(const peer of this.clients)if(peer!==client)this.sendSnapshot(peer);}
 sendSnapshot(client){if(!this.members.has(client.sessionId))return;client.send('snapshot',{schemaVersion:CONTRACT.schemaVersion,layoutVersion:CONTRACT.layoutVersion,channelId:String(this.channel),self:client.sessionId,count:this.members.size,participants:[...this.members.values()].filter(p=>p.sessionId!==client.sessionId)});}
}
