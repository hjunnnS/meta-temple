import {templePlaces} from './temple-layout.ts';
export const bellSite=templePlaces.find(p=>p.id==='bell')!;
export const BELL_DURATION=4.2;
export const BELL_IMPACT=1.65;
export function bellPoint(x:number,y:number,z=0):[number,number,number]{
 const yaw='yaw' in bellSite?bellSite.yaw:0,c=Math.cos(yaw),s=Math.sin(yaw);
 return [bellSite.x+c*x+s*z,y,bellSite.z-s*x+c*z];
}
const smooth=(x:number)=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
export function bellFrame(progress:number){
 const time=Math.max(0,Math.min(1,progress))*BELL_DURATION;
 let offset=0;
 if(time<1.15)offset=-.75*smooth((time-.25)/.9);
 else if(time<BELL_IMPACT)offset=-.75+1.10*smooth((time-1.15)/(BELL_IMPACT-1.15));
 else offset=.35*Math.exp(-Math.max(0,time-BELL_IMPACT-.12)*2.0)*Math.cos(Math.max(0,time-BELL_IMPACT-.12)*5.5)*(1-smooth((time-3.7)/.5));
 return {time,offset,lift:2.95-Math.sqrt(2.95**2-offset**2),holding:(time<1.83?1:1-smooth((time-1.83)/.65))*smooth(time/.25)};
}
export function bellCycle(onImpact:()=>void){
 let elapsed=0,active=false,hit=false;
 return {start(){if(active)return false;active=true;elapsed=0;hit=false;return true;},cancel(){active=false;elapsed=0;},
 update(dt:number){if(!active)return;elapsed=Math.min(BELL_DURATION,elapsed+Math.max(0,dt));if(!hit&&elapsed>=BELL_IMPACT){hit=true;onImpact();}if(elapsed>=BELL_DURATION)active=false;},
 get active(){return active;},get progress(){return elapsed/BELL_DURATION;}};
}

/** Original bell synthesis: inharmonic bronze modes, slow beating and a wooden attack. */
export function bellSamples(rate=24000,seconds=12){
 const samples=new Float32Array(Math.ceil(rate*seconds));
 const modes=[[132,.46,4.8],[133.1,.13,4.4],[273.2,.18,3.5],[346.8,.12,3.0],[547.4,.075,2.1],[706.3,.045,1.7],[1031,.035,1.0],[1657,.018,.55]];
 let seed=1741;
 for(let i=0;i<samples.length;i++){
  const t=i/rate;let value=0;
  for(const [hz,level,decay] of modes)value+=level*Math.sin(2*Math.PI*hz*t)*Math.exp(-t/decay);
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const attack=(seed/4294967296-.5)*.22*Math.exp(-t*45);
  samples[i]=.76*(value+attack)*Math.min(1,t/.003)*Math.min(1,(seconds-t)/.35);
 }
 return samples;
}
