import { courtDepth, courtSouthEdge, sideHallCenterZ, templePlaces, wallCenterX, wishGarden } from './temple-layout.ts';

export type GroundPoint = readonly [number, number];
export interface Boundary { from: GroundPoint; to: GroundPoint; height: number }
export interface StonePath { name: string; from: GroundPoint; to: GroundPoint; lanes: number }
const place = (id: typeof templePlaces[number]['id']) => templePlaces.find(p => p.id === id)!;
const innerGate = place('cheonwang');
const outerGate = place('ilju');
const frontWallZ = innerGate.z - 5.5;
export const eastCourts = {
  tower: {west:wallCenterX,east:72,south:outerGate.z,north:-25,x:58,z:-35},
  buddha: {west:wallCenterX,east:76,south:27,north:63,x:59,z:55},
} as const;
export const pond={x:50,z:-52,width:27,depth:15} as const;
// Shared polar shore for rendering, shoreline stones and walking clearance.
export function shoreRadius(a:number){
  return .96+.10*Math.sin(3*a+.55)+.074*Math.cos(2*a-.7)+.045*Math.sin(5*a-1);
}
export const boundaries: Boundary[] = [];
for (const side of [-1, 1]) {
  const x = side * wallCenterX;
  const add = (from: GroundPoint, to: GroundPoint, height: number) => boundaries.push({from,to,height});
  if(side===1){
    add([4,outerGate.z],[eastCourts.tower.east,outerGate.z],2.2);
  }else{
    add([side*6,frontWallZ],[x,frontWallZ],2.2);
  }
  add([side*4,outerGate.z-2],[side*4,outerGate.z+2],4.45);
  add([side*4,outerGate.z+2],[side*6,frontWallZ],4.45);
  if(side===1){
    for(const court of Object.values(eastCourts)){
      const {west,east,south,north}=court;
      if(court===eastCourts.buddha)add([west,south],[east,south],1.44);
      add([east,south],[east,north],1.44);
      add([east,north],[west,north],1.44);
    }
    add([x,eastCourts.tower.north],[x,courtSouthEdge],1.44);
    add([x,courtSouthEdge],[x,courtSouthEdge+courtDepth],1.8);
    add([x,courtSouthEdge+courtDepth],[x,eastCourts.buddha.south],1.44);
    continue;
  }
  add([x,frontWallZ],[x,courtSouthEdge],1.44);
  add([x,courtSouthEdge],[x,courtSouthEdge+courtDepth],1.8);
  add([x,courtSouthEdge+courtDepth],[x,63],1.44);
}
const office = place('office'), bell = place('bell'), indeung = place('indeung');
export const paving: StonePath[] = [
  {name:'entrance',from:[0,-71.5],to:[0,courtSouthEdge],lanes:3},
  {name:'office-entry',from:[1.97,-45],to:[17,-45],lanes:1},
  {name:'office-turn',from:[17,-45],to:[17,office.z],lanes:1},
  {name:'office',from:[17,office.z],to:[office.x-7.45*office.scale,office.z],lanes:1},
  {name:'tower-approach',from:[1.97,eastCourts.tower.z],to:[eastCourts.tower.x-5.76,eastCourts.tower.z],lanes:3},
  {name:'forest-court',from:[23,30],to:[59,30],lanes:1},
  {name:'forest-court',from:[59,30],to:[59,49],lanes:1},
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
    Math.hypot((x-pond.x)/(pond.width/2+radius),(z-pond.z)/(pond.depth/2+radius))>shoreRadius(Math.atan2((z-pond.z)/pond.depth,(x-pond.x)/pond.width)) &&
    boundaries.every(wall=>distanceToSegment(x,z,wall.from,wall.to)>.25+radius);
}

// Follow the office-side tree around the southern shoreline to the far-bank tree.
export const coinThrowBank = Array.from({length:97},(_,i)=>{
 const angle=2.02+(Math.PI*2+.35-2.02)*i/96;
 const radius=shoreRadius(angle);
 return [pond.x+Math.cos(angle)*(pond.width*.5*radius+1),
  pond.z+Math.sin(angle)*(pond.depth*.5*radius+1)] as GroundPoint;
});
export function canThrowCoin(x:number,z:number){
 return insideGround(x,z,.325)&&coinThrowBank.some((p,i)=>i>0&&distanceToSegment(x,z,coinThrowBank[i-1],p)<=1.75);
}
