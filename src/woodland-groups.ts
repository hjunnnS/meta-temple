/** Species-separated groves: 33 bamboo clumps + 41 seasonal trees; shared models and LOD retained. */
export const woodlandGroups=[
 {id:'yaksa-bamboo',name:'약사전 뒤 대나무',kind:'bamboo',points:[[-53.8,49],[-54.7,52],[-54,56],[-53.8,59],[-53,53.5]]},
 {id:'daeung-west-bamboo',name:'대웅전 서쪽 대나무',kind:'bamboo',points:[[-20.5,55.5],[-21.8,59],[-20.2,62.5],[-18.8,60.3],[-17.6,56.8]]},
 {id:'daeung-east-bamboo',name:'대웅전 동쪽 대나무',kind:'bamboo',points:[[29,39],[31.8,40.3],[29.7,43],[32.2,44.7],[33.2,41.5]]},
 {id:'northwest-bamboo',name:'북서쪽 담장 대나무',kind:'bamboo',points:[[-43,108],[-40.5,110.5],[-37.2,109],[-34.5,111],[-40,106],[-37,106]]},
 {id:'north-maples',name:'문수전·보현전 사이 계절나무',kind:'seasonal',points:[[-1,103],[3,106],[7,103],[10.5,106],[14,103],[1,101],[11.5,101],[18,105],[22,108],[26,108],[29,106]]},
 {id:'geukrak-maples',name:'극락전 남쪽 계절나무',kind:'seasonal',points:[[86,43],[90,44],[88,48],[91,51.5],[86.8,53],[84.5,47]]},
 {id:'bell-maples',name:'범종각 뒤 계절나무',kind:'seasonal',points:[[-31.5,-58.8],[-33,-63],[-28.2,-62.7],[-29,-67],[-32,-67],[-25,-67],[-33,-55],[-33.4,-51],[-33.4,-47],[-33.4,-43]]},
 {id:'east-court-maples',name:'동쪽 마당 계절나무',kind:'seasonal',points:[[62,0],[66,2.7],[62,5.5]]},
 {id:'sweeper-maples',name:'비질 스님 주변 단풍',kind:'seasonal',points:[[-21.3,67.7],[-17.8,67.4],[-15.7,70],[-27.4,69.9],[-28.4,66.6]]},
 {id:'west-wall-bamboo',name:'인등전 뒤 담장 대나무',kind:'bamboo',points:[[-33.4,-29],[-33.4,-25],[-33.4,-21]]},
 {id:'east-wall-bamboo',name:'소원 정원 동쪽 담장 대나무',kind:'bamboo',points:[[73,-21],[73,-17],[73,-13]]},
 {id:'northeast-bamboo',name:'북동 산책길 바깥 대나무',kind:'bamboo',points:[[87,105],[90,108],[86,111]]},
 {id:'tea-maples',name:'쉼터 서쪽 계절나무',kind:'seasonal',points:[[40,-70],[41,-74],[44,-72]]},
 {id:'rear-bend-maples',name:'보현전 동쪽 산책길 단풍',kind:'seasonal',points:[[55,96],[59,96],[62,98]]},
 {id:'west-bend-bamboo',name:'약사전 북쪽 산책길 대나무',kind:'bamboo',points:[[-47,79],[-49,83],[-48,87]]},
] as const;
export const groveTrees=woodlandGroups.flatMap((group,index)=>group.points.map(([x,z],i)=>({x,z,kind:group.kind,group:group.id,seed:index*7+i})));
export function groveBounds(group:typeof woodlandGroups[number]){
 const xs=group.points.map(p=>p[0]),zs=group.points.map(p=>p[1]);
 return {x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,
  rx:(Math.max(...xs)-Math.min(...xs))/2+1.8,rz:(Math.max(...zs)-Math.min(...zs))/2+1.8};
}
/** The centre remains open; entrances and the Maitreya approach are protected separately by route clearance. */
export function inOpenRearCourt(x:number,z:number){return x>=-14&&x<=16&&z>=54&&z<=80;}
