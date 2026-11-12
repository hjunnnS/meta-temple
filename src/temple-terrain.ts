import {templeFootprint, rearPrayerHalls, prayerAisleX, prayerHallPoint} from './prayer-halls.ts';
import { courtDepth, courtSouthEdge, sideHallCenterZ, templePlaces, wallCenterX, wishGarden, meditationTrees } from './temple-layout.ts';

export type GroundPoint = readonly [number, number];
export interface Boundary { from: GroundPoint; to: GroundPoint; height: number }
export interface StonePath { name: string; from: GroundPoint; to: GroundPoint; lanes: number }
const place = (id: typeof templePlaces[number]['id']) => templePlaces.find(p => p.id === id)!;
const innerGate = place('cheonwang');
const outerGate = place('ilju');
const frontWallZ = innerGate.z - 5.5;
export const eastCourts = {
  tower: {west:wallCenterX,east:77,south:outerGate.z-9,north:-25,x:58,z:-34},
  buddha: {west:wallCenterX,east:76,south:27,north:63,x:59,z:55},
} as const;
export const pond={x:54,z:-52,width:34,depth:19} as const;
// Shared polar shore for rendering, shoreline stones and walking clearance.
export function shoreRadius(a:number){
  return .96+.10*Math.sin(3*a+.55)+.074*Math.cos(2*a-.7)+.045*Math.sin(5*a-1);
}
// One enclosing wall follows the approved plan; no internal return walls divide the eastern gardens.
export const rearGardenWalls:Boundary[]=[
 {from:[-37,30],to:[-58,30],height:1.8},
 {from:[-58,30],to:[-58,116],height:1.8},
 {from:[-58,116],to:[96,116],height:1.8},
 {from:[96,116],to:[96,30],height:1.8},
 {from:[96,30],to:[77,30],height:1.8},
];
export const boundaries:Boundary[]=[
 {from:[-wallCenterX,outerGate.z],to:[-4,outerGate.z],height:2.2},
 {from:[4,outerGate.z],to:[77,outerGate.z],height:2.2},
 {from:[-wallCenterX,outerGate.z],to:[-wallCenterX,30],height:1.8},
 {from:[77,outerGate.z],to:[77,30],height:1.8},
 ...rearGardenWalls,
 {from:[-4,outerGate.z+2],to:[-6,frontWallZ],height:4.45},
 {from:[4,outerGate.z+2],to:[6,frontWallZ],height:4.45},
];
const office = place('office'), bell = place('bell'), indeung = place('indeung');
export const paving: StonePath[] = [
  {name:'entrance',from:[0,outerGate.z-1.5],to:[0,courtSouthEdge],lanes:3},
  {name:'office-approach',from:[1.97,-45],to:[15,-45],lanes:1},
  {name:'office-side',from:[15,-45],to:[15,office.z+6.1],lanes:1},
  {name:'office',from:[15,office.z+6.1],to:[office.x,office.z+6.1],lanes:1},
  {name:'office-entry',from:[office.x,office.z+6.1],to:[office.x,office.z+7.45*office.scale],lanes:1},
  {name:'tower-approach',from:[1.97,eastCourts.tower.z],to:[eastCourts.tower.x-5.76,eastCourts.tower.z],lanes:3},
  {name:'forest-court',from:[23,30],to:[59,30],lanes:1},
  {name:'forest-court',from:[59,30],to:[59,49],lanes:1},
  {name:'bell',from:[-1.97,bell.z],to:[bell.x+3.5,bell.z],lanes:1},
  {name:'indeung',from:[-1.97,indeung.z],to:[indeung.x+7.45*indeung.scale,indeung.z],lanes:1},
  {name:'side-hall',from:[-1.97,sideHallCenterZ],to:[-21.4,sideHallCenterZ],lanes:1},
  {name:'side-hall',from:[1.97,sideHallCenterZ],to:[21.4,sideHallCenterZ],lanes:1},
  {name:'right-garden-connection',from:[18,sideHallCenterZ],to:[18,wishGarden.z],lanes:1},
  {name:'memorial-garden',from:[18,-9],to:[32,-9],lanes:1},
  {name:'wish-garden',from:[18,wishGarden.z],to:[wishGarden.x-wishGarden.width/2,wishGarden.z],lanes:1},
];
export function distanceToSegment(x:number,z:number,from:GroundPoint,to:GroundPoint) {
  const dx=to[0]-from[0], dz=to[1]-from[1];
  const t=Math.max(0,Math.min(1,((x-from[0])*dx+(z-from[1])*dz)/(dx*dx+dz*dz)));
  return Math.hypot(x-from[0]-t*dx,z-from[1]-t*dz);
}
export function insideBoundary(x:number,z:number,radius:number){
 // Test the concave footprint as well as distance to its physical walls.
 let inside=false;
 for(let i=0,j=templeFootprint.length-1;i<templeFootprint.length;j=i++){
  const a=templeFootprint[i],b=templeFootprint[j];
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside&&boundaries.every(wall=>distanceToSegment(x,z,wall.from,wall.to)>.25+radius);
}
export function insideGround(x:number,z:number,radius:number) {
 return insideBoundary(x,z,radius) &&
  Math.hypot((x-pond.x)/(pond.width/2+radius),(z-pond.z)/(pond.depth/2+radius))>
   shoreRadius(Math.atan2((z-pond.z)/pond.depth,(x-pond.x)/pond.width));
}

// Follow the office-side tree around the southern shoreline to the far-bank tree.
export const coinThrowBank = Array.from({length:97},(_,i)=>{
 const angle=2.02+(Math.PI*2+.35-2.02)*i/96;
 const radius=shoreRadius(angle);
 return [pond.x+Math.cos(angle)*(pond.width*.5*radius+1.65),
  pond.z+Math.sin(angle)*(pond.depth*.5*radius+1.65)] as GroundPoint;
});
export function canThrowCoin(x:number,z:number){
 return insideGround(x,z,.325)&&coinThrowBank.some((p,i)=>i>0&&distanceToSegment(x,z,coinThrowBank[i-1],p)<=1.75);
}


export const teaPavilion={x:66,z:-70,width:14,depth:8} as const;
export const teaTerrace={x:teaPavilion.x,z:teaPavilion.z+teaPavilion.depth/2+1.75,width:teaPavilion.width,depth:3.5} as const;
export const teaRestArea={
 west:47,east:teaPavilion.x+teaPavilion.width/2+1,
 south:teaPavilion.z-teaPavilion.depth/2-1,north:teaTerrace.z+teaTerrace.depth/2+1,
} as const;
export const personalGate={x:80,z:56} as const;
function roundedRoute(points:GroundPoint[]){
 const route:GroundPoint[]=[points[0]];
 for(let i=1;i<points.length-1;i++){
  const before=points[i-1],corner=points[i],after=points[i+1];
  const incoming=Math.hypot(corner[0]-before[0],corner[1]-before[1]);
  const outgoing=Math.hypot(corner[0]-after[0],corner[1]-after[1]);
  const trim=Math.min(2.8,incoming*.23,outgoing*.23);
  const a=corner.map((v,j)=>v+(before[j]-v)*trim/incoming) as unknown as GroundPoint;
  const b=corner.map((v,j)=>v+(after[j]-v)*trim/outgoing) as unknown as GroundPoint;
  route.push(a);
  for(let j=1;j<=8;j++){
   const t=j/8;
   route.push([(1-t)**2*a[0]+2*(1-t)*t*corner[0]+t*t*b[0],
    (1-t)**2*a[1]+2*(1-t)*t*corner[1]+t*t*b[1]]);
  }
 }
 route.push(points.at(-1)!);return route;
}
export const rearPrayerWalk=roundedRoute([
 [-24,30],[-32,45],[-32,68],[-22,86],[6,91],[40,89],
 [74,86],[74,62],[71,47],[59,47],[59,49],
]);
export const prayerHallApproaches=rearPrayerHalls.map(hall=>{
 const entrance=prayerHallPoint(hall,prayerAisleX,-7.65);
 const outside=prayerHallPoint(hall,prayerAisleX,-10);
 const start:GroundPoint=hall.id==='yaksa'?[-32,outside[1]]:hall.id==='geukrak'?[74,outside[1]]:[outside[0],hall.id==='munsu'?86:89];
 return {id:hall.id,route:roundedRoute([start,outside,entrance])};
});
export const sanctuaryWalk=roundedRoute([
 [18,20],[23,28],[59,30],[68,38],[68,46],[68,61],[24,61],
 [23,73],[-24,73],[-25,56],[-24,28],[-17,20],
]);
export const sweepingMonkSite={x:-21,z:70.8} as const;
export const teaGardenTables=[{x:55,z:-67.8},{x:54,z:-72},{x:50,z:-68},{x:49,z:-72.5}] as const;
export const teaSeats=[...Array.from({length:12},(_,i)=>({
 x:teaPavilion.x-5+Math.floor((i%6)/2)*5+(i%2? .5:-.5),
 z:i<6?teaTerrace.z+.15:teaPavilion.z+1.8,y:.18,yaw:0,outdoors:i<6,ground:.32,area:i<6?'테라스':'실내',
})),...teaGardenTables.flatMap(table=>[-.5,.5].map(dx=>({x:table.x+dx,z:table.z-.9,y:-.13,yaw:0,outdoors:true,ground:.01,area:'옆마당'})))];
export const teaTables=teaSeats.slice(0,12).filter((_,i)=>i%2===0).map(seat=>({x:seat.x+.5,z:seat.z+.85}));
export const teaApproach=roundedRoute([[35,-34],[35,-64.25],[58.7,-64.25]]);
// A continuous dry route joins the terrace, east shore and pagoda approach.
export const teaGardenWalk=roundedRoute([[73.8,-64.25],[74.8,-61.5],[74.5,-51],[73,-40],[69,-34]]);
export const gateApproach:GroundPoint[]=[[68,personalGate.z],[personalGate.x+2,personalGate.z]];
export const interiorWoodland=meditationTrees.filter(tree=>[sanctuaryWalk,rearPrayerWalk,...prayerHallApproaches.map(a=>a.route)].every(route=>route.every((p,i)=>i===0||distanceToSegment(tree.x,tree.z,route[i-1],p)>2.0)));
