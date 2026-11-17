import{readFileSync,mkdirSync,writeFileSync,renameSync}from'node:fs';
import{dirname}from'node:path';
export function communityStore(file){
 const goal=100000;let entries=[];try{const v=JSON.parse(readFileSync(file,'utf8'));if(!Array.isArray(v.entries))throw Error('invalid community file');entries=v.entries;}catch(e){if(e.code!=='ENOENT')throw e;}
 const snapshot=()=>{const total=entries.reduce((n,e)=>n+e.amount,0);return{id:'shared-hall-v1',title:'함께 만드는 작은 전각',trial:true,goal,total,stage:total>=goal?'complete':total>=70000?'roof':total>=40000?'columns':total>=20000?'foundation':'preparing',participants:new Set(entries.map(e=>e.visitor)).size,donors:[...new Map(entries.map(e=>[e.visitor,e.publicName||'익명 참여자'])).values()]};};
 return{snapshot,pledge(input){const{requestId,visitor,amount,publicName,consent}=input??{};const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;if(!uuid.test(requestId)||!uuid.test(visitor)||![1000,5000,10000].includes(amount)||typeof consent!=='boolean'||typeof publicName!=='string'||[...publicName].length>12||/[\u0000-\u001f]/.test(publicName))throw Error('invalid_pledge');
  const old=entries.find(e=>e.requestId===requestId);if(old){if(old.visitor!==visitor||old.amount!==amount)throw Error('request_conflict');return snapshot();}
  const state=snapshot();if(state.total>=goal)throw Error('project_complete');if(state.total+amount>goal)throw Error('exceeds_goal');if(entries.length>=1000)throw Error('capacity');
  const next=[...entries,{requestId,visitor,amount,publicName:consent?publicName.trim():'',at:new Date().toISOString()}];mkdirSync(dirname(file),{recursive:true});writeFileSync(file+'.tmp',JSON.stringify({entries:next}),{mode:0o600});renameSync(file+'.tmp',file);entries=next;return snapshot();
 }};
}
