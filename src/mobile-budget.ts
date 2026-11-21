import type{Quality}from'./mobile-profile';
/** Responds to sustained frame delay, never claims to read a device temperature. */
export class MobileBudget{
 level=0;idle=false;quietPractice=false;private first=true;private lastInput=0;private warmUntil=0;private windowStart=0;private sum=0;private count=0;private slow=0;private stable=0;private changedAt=-Infinity;
 input(now:number){this.lastInput=now;if(!this.idle)return false;this.idle=false;return true;}
 reset(now:number){this.level=0;this.idle=false;this.quietPractice=false;this.first=true;this.lastInput=now;this.slow=this.stable=this.sum=this.count=0;this.changedAt=now;}
 resume(now:number){this.windowStart=now;this.sum=this.count=this.slow=this.stable=0;this.warmUntil=now+2000;return this.input(now);}
 settings(quality:Quality){const base=quality==='high'?30:20;return{fps:this.quietPractice?15:this.idle?(quality==='high'?12:8):this.level===2?Math.min(base,20):base,scale:this.level===0?1:this.level===1?1.15:1.35,shadowFactor:1+this.level,reflectionFactor:1+this.level,softGlow:this.level<2};}
 observe(now:number,frameMs:number,quality:Quality,practiceActive=false,quietPractice=false){
  if(this.first){this.first=false;this.lastInput=now;this.windowStart=now;this.warmUntil=now+12000;}
  const previousQuiet=this.quietPractice;this.quietPractice=quietPractice;const previousIdle=this.idle;this.idle=!practiceActive&&now-this.lastInput>=45000;let changed=previousIdle!==this.idle||previousQuiet!==this.quietPractice;
  if(now<this.warmUntil)return changed;
  this.sum+=Math.max(1,Math.min(250,frameMs));this.count++;
  const elapsed=now-this.windowStart;if(elapsed<2000)return changed;
  const average=this.sum/this.count,target=1000/this.settings(quality).fps;this.sum=this.count=0;this.windowStart=now;
  if(average>target*1.45){this.slow+=elapsed;this.stable=0;}else if(average<=target*1.18){this.stable+=elapsed;this.slow=0;}else{this.stable=this.slow=0;}
  if(this.slow>=6000&&this.level<2&&now-this.changedAt>=10000){this.level++;this.changedAt=now;this.slow=this.stable=0;changed=true;}
  else if(this.stable>=30000&&this.level>0&&now-this.changedAt>=10000){this.level--;this.changedAt=now;this.slow=this.stable=0;changed=true;}
  return changed;
 }
}
