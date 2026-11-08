import { layoutDraft, type Slot } from './contracts.ts';
export interface ReviewSlot extends Slot { installationId:string|null; owned:boolean }
export function parseReviewSlots(data:unknown):ReviewSlot[]{
 const d=data as {schemaVersion:number;layoutVersion:string;templeId:string;zoneId:string;coordinateSystem:{units:string;up:string;north:string;rotation:string};slots:Record<string,unknown>[]};
 if(d?.schemaVersion!==1||d.layoutVersion!==layoutDraft.version||d.templeId!=='sample:sasa'||d.zoneId!=='Z02'||
  d.coordinateSystem?.units!=='metre'||d.coordinateSystem.up!=='+Y'||d.coordinateSystem.north!=='+Z'||d.coordinateSystem.rotation!=='radian'||!Array.isArray(d.slots))throw Error('슬롯 규격 또는 배치 버전을 확인해 주세요.');
 const ids=new Set<string>(), installations=new Set<string>();
 return d.slots.map(s=>{
  const id=s.slotId,p=s.position,a=s.sampleInstallation as Record<string,unknown>|undefined;
  if(typeof id!=='string'||!/^sample:Z02:lantern:\d{4}$/.test(id)||ids.has(id)||s.accepts!=='lantern'||!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||!Number.isFinite(s.rotationY))throw Error('슬롯 좌표 또는 ID 오류');
  ids.add(id);
  if(a!==undefined&&(!a||a.slotId!==id||typeof a.installationId!=='string'||!a.installationId.startsWith('sample:')||installations.has(a.installationId)||a.productKind!=='lantern'||typeof a.ownerId!=='string'))throw Error('샘플 설치 오류');
  if(a)installations.add(a.installationId as string);
  return {id,zoneId:'Z02',position:[p[0],p[1],p[2]],rotationY:Number(s.rotationY),accepts:'lantern',installationId:a?.installationId as string??null,owned:a?.ownerId==='sample-owner-a'};
 });
}
