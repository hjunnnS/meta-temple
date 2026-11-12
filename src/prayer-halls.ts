/** Approved rear extension: the existing forecourt and paid item coordinates stay fixed. */
export const rearPrayerHalls = [
 {id:'yaksa',name:'약사전',deity:'약사여래불',kind:'hall',x:-44,z:55,scale:.82,yaw:-Math.PI/2},
 {id:'munsu',name:'문수전',deity:'문수보살',kind:'hall',x:-22,z:99,scale:.82,yaw:0},
 {id:'bohyeon',name:'보현전',deity:'보현보살',kind:'hall',x:40,z:102,scale:.82,yaw:0},
 {id:'geukrak',name:'극락전',deity:'아미타불',kind:'hall',x:82,z:69,scale:.82,yaw:Math.PI/2},
] as const;
export type RearPrayerHall=typeof rearPrayerHalls[number];
export const prayerHallDimensions={x:14/23,y:.82,z:12/11.8} as const;
/** Transform a position relative to a hall centre; the template doorway faces -Z. */
export function prayerHallPoint(hall:RearPrayerHall,x:number,z:number):readonly[number,number]{
 const c=Math.cos(hall.yaw),s=Math.sin(hall.yaw);
 return [hall.x+c*x+s*z,hall.z-s*x+c*z];
}
// An aisle between front pillars, rather than a point through the centre pillar.
export const prayerAisleX=1.5*prayerHallDimensions.x;
export const prayerHallFloor=1.4025*prayerHallDimensions.y;
export const templeFootprint:readonly(readonly[number,number])[]=[
 [-37,-80],[77,-80],[77,30],[96,30],[96,116],[-58,116],[-58,30],[-37,30],
];
export const navigationBounds={west:-60,east:98,south:-81,north:118} as const;
export function withinNavigationBounds(x:number,z:number){return Number.isFinite(x)&&Number.isFinite(z)&&x>=navigationBounds.west&&x<=navigationBounds.east&&z>=navigationBounds.south&&z<=navigationBounds.north;}
/** Server presence accepts the expanded rectangle, retaining its former vertical limit. */
export function validTemplePose(p:unknown):p is [number,number,number]{
 return Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&withinNavigationBounds(p[0],p[2])&&p[1]>=-1&&p[1]<=5;
}
