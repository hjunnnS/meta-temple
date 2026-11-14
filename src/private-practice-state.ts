import{BOW_SECONDS}from'./motion-timing.ts';
export const PRIVATE_BOW_DURATION=BOW_SECONDS;
export type PrivatePracticeMode='idle'|'bow'|'lowering'|'meditating'|'rising';
const ease=(value:number)=>{const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);};
export function privatePracticeState(){
 let mode:PrivatePracticeMode='idle',time=0,count=0,meditationTime=0,riseFrom=1,stopping=false;
 const seated=()=>mode==='lowering'?ease(time/1.25):mode==='meditating'?1:mode==='rising'?riseFrom*(1-ease(time/Math.max(.18,.95*riseFrom))):0;
 return {
  start(kind:'bow'|'meditate'){if(mode!=='idle')return false;mode=kind==='bow'?'bow':'lowering';time=0;meditationTime=0;stopping=false;return true;},
  stop(){
   if(mode==='bow'){stopping=true;return;}
   if(mode==='lowering'||mode==='meditating'){riseFrom=seated();mode='rising';time=0;}
  },
  tick(dt:number){
   if(mode==='idle')return;time+=Math.max(0,dt);
   if(mode==='bow'&&time>=PRIVATE_BOW_DURATION){count++;mode='idle';time=0;stopping=false;}
   else if(mode==='lowering'&&time>=1.25){mode='meditating';time=0;}
   else if(mode==='meditating')meditationTime+=Math.max(0,dt);
   else if(mode==='rising'&&time>=Math.max(.18,.95*riseFrom)){mode='idle';time=0;}
  },
  get mode(){return mode;},get active(){return mode!=='idle';},get bowProgress(){return mode==='bow'?Math.min(1,time/PRIVATE_BOW_DURATION):0;},get seated(){return seated();},get count(){return count;},get meditationTime(){return meditationTime;},get stopping(){return stopping;},
 };
}
