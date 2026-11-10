export function wishToss(){
 let started:number|null=null;
 let success=false;
 return {
  start(now:number,draw:number){
   if(started!==null)return false;
   success=draw<.25;started=now;return true;
  },
  frame(now:number){
   if(started===null)return {phase:'idle',age:0,success};
   const age=Math.max(0,(now-started)/1000);
   if(age>=7.1){started=null;return {phase:'idle',age,success};}
   return {phase:age<3?'wishing':age<3.85?'flying':success?'success':'miss',age,success};
  }
 };
}
