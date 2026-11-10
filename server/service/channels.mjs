import {validFace} from '../../src/face-types.ts';
import {randomUUID} from 'node:crypto';
import {zones,layoutDraft} from '../../src/contracts.ts';

function zoneAt([x,,z]){
 return zones.findLast(zone=>Math.abs(x-zone.center[0])<=zone.size[0]/2&&Math.abs(z-zone.center[2])<=zone.size[1]/2)?.id??'grounds';
}
export function channels(clock=Date.now){
 const members=new Map();
 return (account,session,action,input)=>{
  const now=clock();
  for(const [id,v] of members)if(now-v.seen>20000)members.delete(id);
  let v=members.get(account);
  if(action==='logout'){if(v?.session===session)members.delete(account);return [200,{}];}
  if(action==='join'){
   if(![1,2,3].includes(input.channel))return [400,{}];
   const count=[...members.values()].filter(m=>m!==v&&m.channel===input.channel).length;
   if(count>=20)return [409,{error:'full'}];
   if(!v||v.session!==session||v.channel!==input.channel){
    v={session,channel:input.channel,id:randomUUID(),seen:now,moved:now,sequence:0,position:[0,.245,-65],yaw:0,animation:'idle',face:"human",wearingRobe:false};members.set(account,v);
   }
  }else{
   if(!v||v.session!==session||input.self!==v.id)return [410,{}];
   if(action==='leave'){members.delete(account);return [200,{}];}
   const {sequence,position,yaw,animation}=input;
   if(action!=='move'||(input.bellProgress!==undefined&&(!Number.isFinite(input.bellProgress)||input.bellProgress<0||input.bellProgress>1))||(input.bellHit!==undefined&&(!Number.isSafeInteger(input.bellHit)||input.bellHit<0))||(input.drinkLift!==undefined&&(!Number.isFinite(input.drinkLift)||input.drinkLift<0||input.drinkLift>1))||(input.beverage!==undefined&&!['tea','coffee'].includes(input.beverage))||(input.bowProgress!==undefined&&(!Number.isFinite(input.bowProgress)||input.bowProgress<0||input.bowProgress>1))||(input.face!==undefined&&!validFace(input.face))||(input.wearingRobe!==undefined&&typeof input.wearingRobe!=='boolean')||!Number.isSafeInteger(sequence)||sequence<1||!Array.isArray(position)||position.length!==3||!position.every(n=>Number.isFinite(n)&&Math.abs(n)<=85)||position[1]<-1||position[1]>5||!Number.isFinite(yaw)||!['idle','walk','worship','sit','bell'].includes(animation))return [400,{}];
   if(sequence>v.sequence){
    if(v.sequence&&Math.hypot(...position.map((n,i)=>n-v.position[i]))>1+9*(now-v.moved)/1000)return [422,{}];
    Object.assign(v,{sequence,position,yaw,animation,bellProgress:input.bellProgress,bellHit:input.bellHit??v.bellHit??0,drinkLift:input.drinkLift??0,beverage:input.beverage??'tea',bowProgress:input.bowProgress,face:input.face??v.face,wearingRobe:input.wearingRobe??v.wearingRobe,moved:now});
   }
  }
  v.seen=now;
  const peers=[...members.values()].filter(m=>m.channel===v.channel);
  const participants=peers.filter(m=>m!==v&&zoneAt(m.position)===zoneAt(v.position)).map(m=>({sessionId:m.id,position:m.position,yaw:m.yaw,animation:m.animation,bellProgress:m.bellProgress,bellHit:m.bellHit,drinkLift:m.drinkLift,beverage:m.beverage,bowProgress:m.bowProgress,face:m.face,wearingRobe:m.wearingRobe,sequence:m.sequence}));
  return [200,{schemaVersion:1,layoutVersion:layoutDraft.version,channelId:String(v.channel),self:v.id,count:peers.length,participants}];
 };
}
