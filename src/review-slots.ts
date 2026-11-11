import { fixedSlots, layoutDraft, type Slot } from './contracts.ts';
export interface ReviewSlot extends Slot { installationId:string|null; owned:boolean;name?:string;text?:string;reserved?:boolean }
export function parseReviewSlots(data:unknown, zoneId:string,service=false):ReviewSlot[]{
 const d=data as {schemaVersion:number;layoutVersion:string;templeId:string;zoneId:string;coordinateSystem:{units:string;up:string;north:string;rotation:string};slots:Record<string,unknown>[]};
 if(d?.schemaVersion!==1||d.layoutVersion!==layoutDraft.version||d.templeId!=='sample:sasa'||d.zoneId!==zoneId||
  d.coordinateSystem?.units!=='metre'||d.coordinateSystem.up!=='+Y'||d.coordinateSystem.north!=='+Z'||d.coordinateSystem.rotation!=='radian'||!Array.isArray(d.slots))throw Error('슬롯 규격 또는 배치 버전을 확인해 주세요.');
 const ids=new Set<string>(), installations=new Set<string>();
 const expected=new Map(fixedSlots().filter(s=>s.zoneId===zoneId).map(s=>[s.id,s]));
 if(!expected.size||expected.size!==d.slots.length)throw Error('구역 자리 수 불일치');
 return d.slots.map(s=>{
  const id=s.slotId,p=s.position,a=s.sampleInstallation as Record<string,unknown>|undefined;
  const fixed=expected.get(String(id));
  if(typeof id!=='string'||!fixed||ids.has(id)||s.accepts!==fixed.accepts||!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||s.rotationY!==fixed.rotationY||p.some((v,i)=>Math.abs(v-fixed.position[i])>1e-7))throw Error('슬롯 좌표 또는 ID 오류');
  ids.add(id);
  if(service){
   if(!['free','reserved','occupied'].includes(String(s.status))||typeof s.owned!=='boolean'||(s.status==='occupied')!==(typeof s.installationId==='string'))throw Error('설치 상태 오류');
   return {...fixed,installationId:s.installationId as string|null,owned:s.owned,reserved:s.status==='reserved',name:typeof s.name==='string'?s.name:'',text:typeof s.text==='string'?s.text:''};
  }
  if(a!==undefined&&(!a||a.slotId!==id||typeof a.installationId!=='string'||!a.installationId.startsWith('sample:')||installations.has(a.installationId)||a.productKind!==fixed.accepts||typeof a.ownerId!=='string'))throw Error('샘플 설치 오류');
  if(a)installations.add(a.installationId as string);
  return {id,zoneId,position:[p[0],p[1],p[2]],rotationY:Number(s.rotationY),accepts:fixed.accepts,installationId:a?.installationId as string??null,owned:a?.ownerId==='sample-owner-a'};
 });
}
