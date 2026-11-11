export interface RoomBox {min:readonly [number,number,number];max:readonly [number,number,number]}
// Shared architecture for walking clearance and camera obstruction.
export const roomCameraWalls:RoomBox[]=[
 {min:[-6.12,0,-8.12],max:[-5.88,4.5,8.12]},
 {min:[5.88,0,-8.12],max:[6.12,4.5,-1.6]},
 {min:[5.88,0,6.8],max:[6.12,4.5,8.12]},
 {min:[5.88,3.55,-1.6],max:[6.12,4.5,6.8]},
 {min:[-6.12,0,7.88],max:[6.12,4.5,8.12]},
 {min:[-6.12,0,-8.12],max:[-1.3,4.5,-7.88]},
 {min:[1.3,0,-8.12],max:[6.12,4.5,-7.88]},
 ...[-1.6,2.6,6.8].map(z=>({min:[5.82,0,z-.1] as const,max:[6.02,3.6,z+.1] as const})),
 {min:[-6.12,4.04,-8.12],max:[6.12,4.6,8.12]},
 {min:[-5.75,.12,-3.6],max:[-4.65,2.55,3.5]},
 {min:[4.65,.12,-6.5],max:[5.75,2.55,-2.8]},
];
export function canWalkPrivateRoom(x:number,z:number){
 const room=Math.abs(x)<=5.5&&z>=-7.4&&z<=7.3;
 const terrace=x>=5.4&&x<=8.9&&z>=-1.05&&z<=6.2;
 const garden=x>=8.4&&x<=17.1&&z>=-4.3&&z<=8;
 if(!room&&!terrace&&!garden)return false;
 if(z< -7.05&&Math.abs(x)>1.1)return false;
 if(Math.abs(x)<2.25&&z>5.9&&x<6)return false;
 if(x< -4.25&&z> -3.95&&z<3.85)return false;
 if(x>4.25&&x<6&&z> -6.85&&z< -2.45)return false;
 if(x>5.4&&x<6.4&&(z< -1.05||z>6.2))return false;
 if(x>5.45&&x<6.4&&[-1.6,2.6,6.8].some(p=>Math.abs(z-p)<.45))return false;
 if([[10,-2],[16.5,7.7],[10.5,7],[16.8,0]].some(([rx,rz])=>Math.hypot(x-rx,z-rz)<.65))return false;
 if([[10.2,6.8],[16,6.4],[16.2,-2.1]].some(([rx,rz])=>Math.hypot(x-rx,z-rz)<.4))return false;
 // Pond and two planted stones are viewed from the dry stepping-stone route.
 if(((x-13.4)/2.15)**2+((z-3.1)/1.65)**2<1.1)return false;
 return true;
}
