import {roomCameraWalls} from './private-room-layout.ts';
/** The garden is open above; the indoor ceiling and walls are separate obstructions. */
export const privateCameraBounds={min:[-5.70,.28,-7.60],max:[17.6,12,8.6]} as const;
export function privateCameraRadius(target:readonly number[],alpha:number,beta:number,requested:number){
 const direction=[Math.cos(alpha)*Math.sin(beta),Math.cos(beta),Math.sin(alpha)*Math.sin(beta)];
 let distance=Math.max(.08,Math.min(7,requested));
 for(let i=0;i<3;i++){
  const d=direction[i];if(Math.abs(d)<1e-8)continue;
  const edge=d>0?privateCameraBounds.max[i]:privateCameraBounds.min[i];
  distance=Math.min(distance,(edge-target[i])/d-.10);
 }
 for(const box of roomCameraWalls){
  let enter=-Infinity,leave=Infinity;
  for(let i=0;i<3;i++){
   if(Math.abs(direction[i])<1e-8){if(target[i]<box.min[i]-.08||target[i]>box.max[i]+.08){enter=Infinity;break;}continue;}
   const a=(box.min[i]-.08-target[i])/direction[i],b=(box.max[i]+.08-target[i])/direction[i];
   enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
  }
  if(enter<=leave&&leave>0)distance=Math.min(distance,Math.max(.08,enter-.04));
 }
 return Math.max(.08,distance);
}
