import {gateCanopyAnchor,type Vec3} from './contracts.ts';
import {lanternPlazaNorthZ} from './temple-layout.ts';
/** Presentation-space drape. Persistent slot IDs, X/Z and server layout remain unchanged. */
export function lanternDisplayPosition(position:Vec3):Vec3{
 const [x,y,z]=position,start=gateCanopyAnchor.z+1.15,end=lanternPlazaNorthZ-18;
 const u=Math.max(0,Math.min(1,(z-start)/(end-start))),ease=u*u*(3-2*u);
 const cross=Math.max(0,1-(x/16)**2),drop=ease*(.85+.15*cross);
 return [x,y-drop,z];
}
export function offeringDisplayPosition(slot:{accepts:string;position:Vec3}):Vec3{
 return slot.accepts==='lantern'?lanternDisplayPosition(slot.position):slot.position;
}
