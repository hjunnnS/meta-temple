const ease=(t:number,a:number,b:number)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
export const monkGreetingDuration=8.8;
export function sweepingMonkCycle(){
 let age=-1,sweepTime=0,spoken=false;
 return {
  greet(){if(age>=0)return false;age=0;spoken=false;return true;},
  cancel(){age=-1;spoken=false;},
  tick(dt:number){
   let utter=false;const delta=Math.max(0,Math.min(.1,dt));
   if(age<0)sweepTime+=delta;
   else{age+=delta;if(age>=2.2&&!spoken){spoken=true;utter=true;}if(age>=monkGreetingDuration){age=-1;spoken=false;}}
   return utter;
  },
  get active(){return age>=0;},
  frame(){
   const time=sweepTime%10.8,stroke=time<7.2?Math.sin(time*Math.PI/0.9)*ease(time,0,.45)*(1-ease(time,6.7,7.2)):0;
   const release=age<0?0:ease(age,0,.85)*(1-ease(age,7.5,8.8));
   const turn=age<0?0:ease(age,.6,1.7)*(1-ease(age,7.3,8.7));
   const palms=age<0?0:ease(age,1.5,2.3)*(1-ease(age,6.3,7.3));
   return {stroke,release,turn,palms,speech:age>=2.2&&age<6.4,phase:age<0?'sweeping':age<2.2?'preparing':age<6.4?'greeting':'returning'};
  },
 };
}
