/** Yield to input and paint while building the unchanged scene in small batches. */
export function preparation(onProgress:(value:number)=>void=()=>{}){
 let last=performance.now();
 return async(value?:number)=>{
  if(value!==undefined)onProgress(value);
  if(value===undefined&&performance.now()-last<12)return;
  const scheduler=(globalThis as typeof globalThis & {scheduler?:{yield?:()=>Promise<void>}}).scheduler;
  if(scheduler?.yield)await scheduler.yield();
  else await new Promise<void>(resolve=>setTimeout(resolve,0));
  last=performance.now();
 };
}
