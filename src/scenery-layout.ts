export const sceneryChoices=[['pond','연못'],['city','도심 야경'],['river','한강뷰'],['sea','밤바다'],['mountain','단풍 산'],['snow','눈 덮인 산']]as const;
export type Scenery=typeof sceneryChoices[number][0];
export function validScenery(value:unknown):value is Scenery{return sceneryChoices.some(([id])=>id===value);}
export function sceneryRandom(seed=92841){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export const landscapeFloor=-58;
export function mountainHeight(x:number,z:number){
 let h=-9;const peaks=[[72,-72,35,60],[92,76,32,62],[185,-135,67,85],[225,80,76,93],[350,-240,110,125],[420,180,116,145]];
 for(const[px,pz,height,r]of peaks)h+=height*Math.exp(-((x-px)**2+(z-pz)**2)/(r*r));
 const near=Math.max(0,Math.min(1,(x-14)/28));return -9+(h+9)*near+(Math.sin(x*.09)*Math.cos(z*.08)*1.7+Math.sin(x*.23+z*.18)*.65)*near;
}
export interface SceneryBuilding{x:number;z:number;width:number;depth:number;height:number;tone:number;style:number}
export function sceneryBuildings(kind:'city'|'river'){
 const rand=sceneryRandom(kind==='city'?8382:44191),buildings:SceneryBuilding[]=[];
 for(let row=-21;row<22;row++)for(let col=-19;col<=19;col++){
  const x=32+row*23+(rand()-.5)*6,z=col*22+(rand()-.5)*7;

  if(row%4===3&&Math.abs(col)%4===0)continue;
  const distance=Math.hypot(x,z),width=7+rand()*8,depth=7+rand()*8;
  if(x-width/2<18&&x+width/2> -18&&z-depth/2<16&&z+depth/2> -16)continue;
  if(kind==='river'&&z+depth/2> -46&&z-depth/2<116)continue;
  const height=distance<90?14+rand()*29:12+Math.pow(rand(),1.7)*66;
  buildings.push({x,z,width,depth,height,tone:Math.floor(rand()*5),style:Math.floor(rand()*4)});
 }
 return buildings;
}

export const riverBanks={minX:26,minZ:-35,maxZ:105};
export function riverContains(x:number,z:number){return x>=riverBanks.minX&&z>riverBanks.minZ&&z<riverBanks.maxZ;}
