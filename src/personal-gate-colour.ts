export function personalGateColour(seconds:number):[number,number,number]{
 const colours=[[.62,.30,.92],[.20,.52,.98],[1,.48,.20]];
 const phase=((seconds%18)+18)%18/6,index=Math.floor(phase),u=phase-index,t=u*u*(3-2*u);
 return colours[index].map((value,i)=>value+(colours[(index+1)%3][i]-value)*t) as [number,number,number];
}
