/** A low, straight bridge west of the wishing bowls, with gentle continuous ramps. */
export const pondBridge={x:44,south:-63.5,north:-40,width:2.8,ramp:3,height:.78} as const;
export function onPondBridge(x:number,z:number,radius=0){
 return Math.abs(x-pondBridge.x)<=pondBridge.width/2-radius&&z>=pondBridge.south&&z<=pondBridge.north;
}
export function pondBridgeHeight(x:number,z:number){
 if(!onPondBridge(x,z))return null;
 return .03+(pondBridge.height-.03)*Math.min(1,(z-pondBridge.south)/pondBridge.ramp,(pondBridge.north-z)/pondBridge.ramp);
}
