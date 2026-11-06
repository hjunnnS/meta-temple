/** M1 design-only fixtures. These are not server-issued purchase rights. */
export type ProductKind = 'lantern' | 'votive' | 'wish-plaque' | 'memorial';
export type Vec3 = readonly [number, number, number];
export interface Slot { id: string; zoneId: string; position: Vec3; rotationY: number; accepts: ProductKind }
export const SCENE_VERSION = 'm1-slice-008';
export const SAMPLE_OWNER = 'sample-owner-a';
export function lanternSlots(count: number): Slot[] {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Invalid density');
  // 004 intentionally rotates SAMPLE layout into front-to-back rows (no purchased data).
  // Identity and position depend on the index only, never quality or selected density.
  return Array.from({length: count}, (_, i) => {
    const reverse5 = (n: number) => ((n&1)<<4)|((n&2)<<2)|(n&4)|((n&8)>>2)|((n&16)>>4);
    const firstColumns = [9,13,18,22];
    const columns = [...firstColumns,...Array.from({length:32},(_,n)=>reverse5(n)).filter(n=>!firstColumns.includes(n))];
    const row = reverse5(i % 32), col = columns[Math.floor(i / 32)];
    return { id: `sample:Z02:lantern:${String(i).padStart(4,'0')}`, zoneId: 'Z02',
      position: [(col - 15.5)*0.9, 5.8 - 0.45*(1-Math.abs(row-15.5)/15.5), -28 + row*0.9] as Vec3,
      rotationY: 0, accepts: 'lantern' as const };
  });
}
export const OWNED_INDICES = [23, 37, 58] as const;
export interface Zone { id: string; name: string; center: Vec3; size: readonly [number,number]; interior: string }
const zoneRows: [string,string,Vec3,readonly [number,number],string][] = [
 ['Z01','일주문·천왕문',[0,0,-66],[18,12],'통로'],
 ['Z02','연등 광장·연등길',[0,0,-38],[24,34],'외부'],
 ['Z03','중앙 마당·석탑',[0,0,-8],[34,24],'외부'],
 ['Z04','대웅전',[0,0,17],[24,16],'공개 실내 제안'],
 ['Z05','관음전',[-32,0,16],[18,14],'공개 실내 제안'],
 ['Z06','지장전',[32,0,16],[18,14],'공개 실내 제안'],
 ['Z07','인등전',[-32,0,-10],[18,14],'공개 실내 제안'],
 ['Z08','소원패 정원',[32,0,-12],[20,18],'외부'],
 ['Z09','추모 구역',[34,0,42],[22,20],'외부'],
 ['Z10','종무소',[-32,0,-40],[18,12],'안내 실내 제안'],
 ['Z11','범종각',[32,0,-40],[12,12],'개방형'],
 ['Z12','명상숲',[-25,0,48],[38,24],'외부'],
];
export const zones: Zone[] = zoneRows.map(([id,name,center,size,interior])=>({id,name,center,size,interior}));
export const layoutDraft = { version:'layout-draft-001', status:'proposed', unit:'metre', handedness:'left', up:'+Y', forward:'+Z', zones };

/** Reference-photo palette, in spatial band order; ownership never changes body colour. */
export const LANTERN_PALETTE = ['#10b76a','#f582b6','#1765e8','#ffc329','#e93f46'] as const;
export function lanternColourIndex(position: Vec3): number {
  return Math.max(0,Math.min(4,Math.floor((position[2]+21.225)/4.445)));
}
export function normalizeLanternName(value: string): string {
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f]/g,'').trim()).slice(0,12).join('');
}

/** Keep the complete lantern silhouette above the nine-column paved approach. */
export function visibleLanternSlots(count: number): Slot[] {
  return lanternSlots(count).filter(s=>Math.abs(s.position[0])+.5<=7.93 && s.position[2]-.5>=-21.725 && s.position[2]+.5<=1.5);
}

/** Spaced canopy keeps original fixed slots, with no between-row infill. */
export function canopyLanternSlots(count:number):Slot[]{
 return visibleLanternSlots(count);
}
