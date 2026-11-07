import { courtDepth, courtSouthEdge, sideHallCenterZ, templePlaces, wallCenterX, wishGarden } from './temple-layout.ts';

export type GroundPoint = readonly [number, number];
export interface Boundary { from: GroundPoint; to: GroundPoint; height: number }
export interface StonePath { name: string; from: GroundPoint; to: GroundPoint; lanes: number }
const place = (id: typeof templePlaces[number]['id']) => templePlaces.find(p => p.id === id)!;
const innerGate = place('cheonwang');
const outerGate = place('ilju');
const frontWallZ = innerGate.z - 5.5;
export const boundaries: Boundary[] = [];
for (const side of [-1, 1]) {
  const x = side * wallCenterX;
  const add = (from: GroundPoint, to: GroundPoint, height: number) => boundaries.push({from,to,height});
  add([side*6,frontWallZ],[x,frontWallZ],2.2);
  add([side*4,outerGate.z-2],[side*4,outerGate.z+2],4.45);
  add([side*4,outerGate.z+2],[side*6,frontWallZ],4.45);
  add([x,frontWallZ],[x,courtSouthEdge],1.44);
  add([x,courtSouthEdge],[x,courtSouthEdge+courtDepth],1.8);
  add([x,courtSouthEdge+courtDepth],[x,63],1.44);
}
const office = place('office'), bell = place('bell'), indeung = place('indeung');
export const paving: StonePath[] = [
  {name:'entrance',from:[0,-71.5],to:[0,courtSouthEdge],lanes:3},
  {name:'office',from:[1.97,office.z],to:[office.x-7.45*office.scale,office.z],lanes:1},
  {name:'bell',from:[-1.97,bell.z],to:[bell.x+3.5,bell.z],lanes:1},
  {name:'indeung',from:[-1.97,indeung.z],to:[indeung.x+7.45*indeung.scale,indeung.z],lanes:1},
  {name:'side-hall',from:[-1.97,sideHallCenterZ],to:[-21.4,sideHallCenterZ],lanes:1},
  {name:'side-hall',from:[1.97,sideHallCenterZ],to:[21.4,sideHallCenterZ],lanes:1},
  {name:'wish-garden',from:[1.97,wishGarden.z],to:[wishGarden.x-wishGarden.width/2,wishGarden.z],lanes:1},
];
export function distanceToSegment(x:number,z:number,from:GroundPoint,to:GroundPoint) {
  const dx=to[0]-from[0], dz=to[1]-from[1];
  const t=Math.max(0,Math.min(1,((x-from[0])*dx+(z-from[1])*dz)/(dx*dx+dz*dz)));
  return Math.hypot(x-from[0]-t*dx,z-from[1]-t*dz);
}
export function insideGround(x:number,z:number,radius:number) {
  return Math.abs(x)<=80-radius && Math.abs(z)<=80-radius &&
    boundaries.every(wall=>distanceToSegment(x,z,wall.from,wall.to)>.25+radius);
}
