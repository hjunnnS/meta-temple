export function frameSummary(frames: number[]) {
  const finite = frames.filter(x => Number.isFinite(x) && x > 0);
  if (!finite.length) return null;
  const sorted = [...finite].sort((a,b)=>b-a);
  const worst = sorted.slice(0, Math.max(1,Math.ceil(sorted.length*.01)));
  const mean = (x:number[]) => x.reduce((a,b)=>a+b,0)/x.length;
  return { samples:finite.length, meanFps:1000/mean(finite), onePercentLowFps:1000/mean(worst), maxFrameMs:sorted[0] };
}
export class Measurement {
  frames: number[] = []; active = false; started = 0; warmupUntil = 0;
  invalidReason: string | null = null; stoppedAt: number | null = null;
  start(warmupSeconds=2) { this.frames=[]; this.started=performance.now(); this.warmupUntil=this.started+warmupSeconds*1000; this.active=true; this.invalidReason=null; this.stoppedAt=null; }
  invalidate(reason:string) { if(this.active || this.frames.length) {this.invalidReason=reason; if(this.active)this.stoppedAt=performance.now(); this.active=false;} }
  frame(ms:number) { if(this.active && performance.now()>=this.warmupUntil) this.frames.push(ms); }
  stop() { if(this.active)this.stoppedAt=performance.now(); this.active=false; return this.report(); }
  report() { return { ...frameSummary(this.frames), elapsedSeconds:((this.stoppedAt??performance.now())-this.started)/1000, warmupSeconds:(this.warmupUntil-this.started)/1000, valid:this.invalidReason===null && this.frames.length>0, invalidReason:this.invalidReason }; }
}
