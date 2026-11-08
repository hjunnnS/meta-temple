import {randomUUID} from 'node:crypto';

// Temporary practice state is scoped to the authenticated session.
export function bowPractice(clock=Date.now){
 const active=new Map();
 return (session,action,input)=>{
  const now=clock();
  for(const [key,value] of active)if(value.seen+30*60*1000<now)active.delete(key);
  if(action==='start'){
   const run={id:randomUUID(),count:0,seen:now};active.set(session,run);
   return [200,{id:run.id,count:0}];
  }
  const run=active.get(session);
  if(!run||run.id!==input.id)return [409,{error:'practice_ended'}];
  if(action==='cancel'){active.delete(session);return [200,{}];}
  if(action!=='bow'||!Number.isInteger(input.count)||input.count<1||input.count>108)return [400,{}];
  if(input.count===run.count)return [200,{count:run.count}];
  if(input.count!==run.count+1||now-run.seen<1000)return [409,{error:'bow_not_ready'}];
  run.count=input.count;run.seen=now;
  return [200,{count:run.count}];
 };
}
