import {fixedSlots,layoutDraft,OWNED_INDICES} from '../src/contracts.ts';

function initiallyEmpty(slot){
 const suffix=slot.id.split(':').at(-1);
 switch(slot.accepts){
  case 'lantern': return [2,34,66].includes(Number(suffix));
  case 'votive': case 'memorial': return ['02','04'].includes(suffix);
  case 'wish-plaque': return !suffix.includes('-');
  case 'candle': return Number(suffix.split('-')[1])%3===1;
 }
}
export function zoneLayout(zoneId){
 const slots=fixedSlots().filter(s=>s.zoneId===zoneId).map(s=>{
  const row={slotId:s.id,position:s.position,rotationY:s.rotationY,accepts:s.accepts};
  if(initiallyEmpty(s))return row;
  const index=Number(s.id.split(':').at(-1));
  return {...row,sampleInstallation:{slotId:s.id,productKind:s.accepts,
   installationId:s.id==='sample:Z02:lantern:0023'?'sample:installation:23':'sample:installation:'+s.id.slice(7),
   ownerId:s.accepts==='lantern'&&OWNED_INDICES.includes(index)?'sample-owner-a':'sample-community'}};
 });
 return {schemaVersion:1,layoutVersion:layoutDraft.version,templeId:'sample:sasa',zoneId,
  coordinateSystem:{units:'metre',up:'+Y',north:'+Z',rotation:'radian'},slots};
}
