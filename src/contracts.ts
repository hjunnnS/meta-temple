/** M1 design-only fixtures. These are not server-issued purchase rights. */
import { wishGarden, templePlaces, courtHalfWidth, courtDepth, courtSouthEdge, sideHallCenterZ } from './temple-layout.ts';
export type ProductKind = 'lantern' | 'votive' | 'wish-plaque' | 'memorial' | 'candle';
export type Vec3 = readonly [number, number, number];
export interface Slot { id: string; zoneId: string; position: Vec3; rotationY: number; accepts: ProductKind }
export const SCENE_VERSION = 'm1-web-review-013';
export const SAMPLE_OWNER = 'sample-owner-a';
// Hang the first row just under the 7 m north eave; the cord starts at its supporting beam.
const gateZ = templePlaces.find(place => place.id === 'cheonwang')!.z;
export const gateCanopyAnchor = { z: gateZ + 5.5, y: 7.35, halfWidth: 2.5 };
const canopyStart = gateZ + 6.65;
const canopyEnd = sideHallCenterZ;
const plazaStart = canopyEnd - 18;
function canopyWidthAt(z: number): number {
  const progress = Math.max(0, Math.min(1, (z - canopyStart - 4) / (plazaStart - canopyStart - 4)));
  return 6 + 10 * progress;
}
export function lanternSlots(count: number): Slot[] {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Invalid density');
  // 004 intentionally rotates SAMPLE layout into front-to-back rows (no purchased data).
  // Identity and position depend on the index only, never quality or selected density.
  return Array.from({length: count}, (_, i) => {
    const reverse5 = (n: number) => ((n&1)<<4)|((n&2)<<2)|(n&4)|((n&8)>>2)|((n&16)>>4);
    const firstColumns = [9,13,18,22];
    const columns = [...firstColumns,...Array.from({length:32},(_,n)=>reverse5(n)).filter(n=>!firstColumns.includes(n))];
    let row = reverse5(i % 32);
    const col = columns[Math.floor(i / 32)];
    // Keep the three application fixtures in the plaza and the owned sample on a visible row.
    if (col === 9 && (row === 29 || row === 19)) row = row === 29 ? 19 : 29;
    const z = row <= 20
      ? plazaStart + row * .9
      : plazaStart + (canopyStart - plazaStart) * ((row - 20) / 11);
    return { id: `sample:Z02:lantern:${String(i).padStart(4,'0')}`, zoneId: 'Z02',
      position: [(col - 15.5)*0.9, 5.8 - 0.45*(1-Math.abs(row-15.5)/15.5), z] as Vec3,
      rotationY: 0, accepts: 'lantern' as const };
  });
}
/** Lamp base centres in world space, counted left to right as seen from the entry. */
export function hallLampSlots(kind:'votive'|'memorial'):Slot[]{
 const votive=kind==='votive';
 const hall=votive?templePlaces.find(p=>p.id==='indeung')!:templePlaces.find(p=>p.id==='jijang')!;
 const zoneId=votive?'Z07':'Z06';
 const columns=votive?6:4;
 return Array.from({length:votive?columns*2:columns},(_,index)=>{
  const dx=(votive?0:4.35)+(index%columns-(columns-1)/2)*(votive?.64:.55);
  const dz=votive?1.65:1.8;
  const y=1.4025*hall.scale+(votive?.69+Math.floor(index/columns)*.75:.83);
  const angle=hall.yaw;
  return {id:`sample:${zoneId}:${kind}:${String(index+1).padStart(2,'0')}`,zoneId,accepts:kind,rotationY:angle,
   position:[hall.x+dx*Math.cos(angle)+dz*Math.sin(angle),y,hall.z-dx*Math.sin(angle)+dz*Math.cos(angle)]};
 });
}
export const OWNED_INDICES = [23, 37, 58] as const;
export interface Zone { id: string; name: string; center: Vec3; size: readonly [number,number]; interior: string }
function placeCenter(id:(typeof templePlaces)[number]['id']):Vec3{
 const place=templePlaces.find(place=>place.id===id)!;
 return [place.x,0,place.z];
}
const zoneRows: [string,string,Vec3,readonly [number,number],string][] = [
 ['Z01','일주문·천왕문',[0,0,-60],[18,28],'통로'],
 ['Z02','연등 광장·연등길',[0,0,(canopyStart+canopyEnd)/2],[32,canopyEnd-canopyStart+2],'외부'],
 ['Z03','중앙 마당·촛불함',[0,0,courtSouthEdge+courtDepth/2],[2*courtHalfWidth,courtDepth],'외부'],
 ['Z04','대웅전',placeCenter('daeung'),[36,30],'공개 실내 제안'],
 ['Z05','관음전',placeCenter('gwaneum'),[18,14],'공개 실내 제안'],
 ['Z06','지장전',placeCenter('jijang'),[18,14],'공개 실내 제안'],
 ['Z07','인등전',placeCenter('indeung'),[18,14],'공개 실내 제안'],
 ['Z08','소원패 정원',[wishGarden.x,0,wishGarden.z],[wishGarden.width,wishGarden.depth],'외부'],
 ['Z09','추모 구역',[34,0,42],[22,20],'외부'],
 ['Z10','종무소',placeCenter('office'),[18,12],'안내 실내 제안'],
 ['Z11','범종각',placeCenter('bell'),[12,12],'개방형'],
 ['Z12','명상숲',placeCenter('forest'),[38,24],'외부'],
];
export const zones: Zone[] = zoneRows.map(([id,name,center,size,interior])=>({id,name,center,size,interior}));
export const layoutDraft = { version:'layout-web-014', status:'fixed', unit:'metre', handedness:'left', up:'+Y', forward:'+Z', zones };

/** Reference-photo palette, in spatial band order; ownership never changes body colour. */
export const LANTERN_PALETTE = ['#10b76a','#f582b6','#1765e8','#ffc329','#e93f46'] as const;
export function lanternColourIndex(position: Vec3): number {
  return Math.max(0,Math.min(4,Math.floor(5*(position[2]-canopyStart)/(canopyEnd-canopyStart))));
}
export function normalizeLanternName(value: string): string {
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f]/g,'').trim()).slice(0,12).join('');
}

/** Keep the complete lantern silhouette inside the widening gate-to-plaza canopy. */
export function visibleLanternSlots(count: number): Slot[] {
  return lanternSlots(count).filter(s=>Math.abs(s.position[0])+.5<=canopyWidthAt(s.position[2])/2);
}

/** Spaced canopy keeps original fixed slots, with no between-row infill. */
export function canopyLanternSlots(count:number):Slot[]{
 return visibleLanternSlots(count);
}

export const offeringZones = ['Z02','Z03','Z06','Z07','Z08'] as const;
export const rackSpacing = 1.8;
export function plaqueSlot(rack:number,row:number,index:number):Slot {
 const x=wishGarden.x+(rack-1)*rackSpacing;
 const z=wishGarden.z-(rack-1)*.4+(index-4)*.49;
 const y=2.11-row*.78-(.115+.022*Math.sin(index+row))-[.26,.208,.25][rack];
 const suffix=row===0&&index===2?String(rack):[rack,row,index].join('-');
 return {id:'sample:Z08:plaque:'+suffix,zoneId:'Z08',accepts:'wish-plaque',rotationY:-Math.PI/2,position:[x-.14,y,z]};
}
export const candleCabinets=[[5,0,0],[0,-5,Math.PI/2],[0,5,Math.PI/2]] as const;
export function candleSlot(cabinet:number,index:number):Slot {
 const [dx,dz,yaw]=candleCabinets[cabinet], z=(index-3)*.64;
 const x=templePlaces.find(p=>p.id==='gwaneum')!.x+dx+z*Math.sin(yaw);
 return {id:'sample:Z03:candle:'+(cabinet+1)+'-'+index,zoneId:'Z03',accepts:'candle',rotationY:yaw,
  position:[x,1,courtSouthEdge+courtDepth/2+dz+z*Math.cos(yaw)]};
}
export function fixedSlots():Slot[] {
 return [...canopyLanternSlots(1000),...hallLampSlots('votive'),...hallLampSlots('memorial'),
  ...Array.from({length:54},(_,i)=>plaqueSlot(Math.floor(i/18),Math.floor(i/9)%2,i%9)),
  ...Array.from({length:21},(_,i)=>candleSlot(Math.floor(i/7),i%7))];
}
