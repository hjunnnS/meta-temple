import type {ProductKind} from './contracts.ts';
export const displayLabels:Record<ProductKind,string>={lantern:'연등','wish-plaque':'소원패',votive:'인등',memorial:'추모등',candle:'봉헌초'};
export interface DisplayPosition {id:string;label:string;position:readonly [number,number,number];yaw:number;accepts:readonly ProductKind[]}
export const privateDisplayPositions:DisplayPosition[]=[
 ...[.53,1.33,2.15].flatMap((y,row)=>[-2.8,-1.0,1.0,2.8].map((z,col)=>({id:`left-${row+1}-${col+1}`,label:`왼쪽 ${row+1}층 ${col+1}번`,position:[-5.12,y,z] as const,yaw:-Math.PI/2,accepts:['lantern','votive','memorial'] as const}))),
 ...[.53,1.33,2.15].flatMap((y,row)=>[-5.6,-3.7].map((z,col)=>({id:`right-${row+1}-${col+1}`,label:`오른쪽 ${row+1}층 ${col+1}번`,position:[5.12,y,z] as const,yaw:Math.PI/2,accepts:['wish-plaque','candle'] as const}))),
];
export interface DisplayPlacement {slotId:string;orderId:string}
export interface DisplayItem {orderId:string;kind:ProductKind;slotId:string;name:string;text:string;tag:boolean;status:string;endsAt:string}
export function validDisplayPlacements(value:unknown):value is DisplayPlacement[]{
 if(!Array.isArray(value)||value.length>privateDisplayPositions.length)return false;
 const slots=new Set<string>(),orders=new Set<string>();
 for(const row of value){
  if(!row||typeof row!=='object'||typeof row.slotId!=='string'||typeof row.orderId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(row.orderId))return false;
  if(!privateDisplayPositions.some(s=>s.id===row.slotId)||slots.has(row.slotId)||orders.has(row.orderId))return false;
  slots.add(row.slotId);orders.add(row.orderId);
 }
 return true;
}
export function compatibleDisplay(placements:DisplayPlacement[],items:Pick<DisplayItem,'orderId'|'kind'>[]){
 const catalog=new Map(items.map(item=>[item.orderId,item.kind]));
 return placements.every(row=>{const kind=catalog.get(row.orderId),slot=privateDisplayPositions.find(s=>s.id===row.slotId);return !!kind&&!!slot&&slot.accepts.includes(kind);});
}
