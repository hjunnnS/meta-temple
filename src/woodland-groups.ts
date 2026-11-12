/** Species-separated groves reuse the existing budget: 17 bamboo clumps + 16 seasonal trees. */
export const woodlandGroups=[
 {id:'yaksa-bamboo',name:'약사전 뒤 대나무',kind:'bamboo',points:[[-53.8,49],[-54.7,52],[-54,56],[-53.8,59]]},
 {id:'daeung-west-bamboo',name:'대웅전 서쪽 대나무',kind:'bamboo',points:[[-20.5,55.5],[-21.8,59],[-20.2,62.5],[-18.8,60.3]]},
 {id:'daeung-east-bamboo',name:'대웅전 동쪽 대나무',kind:'bamboo',points:[[29,39],[31.8,40.3],[29.7,43],[32.2,44.7]]},
 {id:'northwest-bamboo',name:'북서쪽 담장 대나무',kind:'bamboo',points:[[-43,108],[-40.5,110.5],[-37.2,109],[-34.5,111],[-40,106]]},
 {id:'north-maples',name:'문수전·보현전 사이 계절나무',kind:'seasonal',points:[[-1,103],[3,106],[7,103],[10.5,106],[14,103]]},
 {id:'geukrak-maples',name:'극락전 남쪽 계절나무',kind:'seasonal',points:[[86,43],[90,44],[88,48],[91,51.5],[86.8,53]]},
 {id:'bell-maples',name:'범종각 뒤 계절나무',kind:'seasonal',points:[[-31.5,-58.8],[-33,-63],[-28.2,-62.7]]},
 {id:'east-court-maples',name:'동쪽 마당 계절나무',kind:'seasonal',points:[[62,0],[66,2.7],[62,5.5]]},
] as const;
export const groveTrees=woodlandGroups.flatMap((group,index)=>group.points.map(([x,z],i)=>({x,z,kind:group.kind,group:group.id,seed:index*7+i})));
export function groveBounds(group:typeof woodlandGroups[number]){
 const xs=group.points.map(p=>p[0]),zs=group.points.map(p=>p[1]);
 return {x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,
  rx:(Math.max(...xs)-Math.min(...xs))/2+1.8,rz:(Math.max(...zs)-Math.min(...zs))/2+1.8};
}
/** The centre remains open; entrances and the Maitreya approach are protected separately by route clearance. */
export function inOpenRearCourt(x:number,z:number){return x>=-14&&x<=16&&z>=54&&z<=80;}
