/** Image-approved relative placement, provisional metre dimensions for visual review.
 * Lantern sample coordinates remain untouched. +Z north, -X west.
 */
export const wallCenterX=37;
export const wallThickness=.5;
export const gardenBorderWidth=1.25;
export const courtHalfWidth=wallCenterX-wallThickness/2-gardenBorderWidth;
export const courtSouthEdge=7;
export const courtDepth=16;
// Lowest tread starts at z=1.1 minus half its depth, relative to hall origin z=8.
const sideHallScale=.75;
// Align the facing entrances with the middle of the lantern plaza.
export const sideHallCenterZ=-10;
const plazaLandingX=21.4;
const sideHallOffset=plazaLandingX+(8-1.1+.55)*sideHallScale;
export const wishGarden={x:sideHallOffset,z:-23.5,width:10,depth:7.5} as const;
export const templePlaces = [
 {id:'ilju',name:'일주문',kind:'gate',x:0,z:-68,scale:.65},
 {id:'cheonwang',name:'천왕문',kind:'gate',x:0,z:-52,scale:.8},
 {id:'bell',name:'범종각',kind:'bell',x:-sideHallOffset,z:-46,scale:.65,yaw:-Math.PI/2},
 {id:'indeung',name:'인등전',kind:'hall',x:-sideHallOffset,z:(-46+sideHallCenterZ)/2,scale:.65,yaw:-Math.PI/2},
 {id:'office',name:'종무소',kind:'hall',x:sideHallOffset,z:-56,scale:.65,yaw:Math.PI/2},
 {id:'gwaneum',name:'관음전',kind:'hall',x:-sideHallOffset,z:sideHallCenterZ,scale:sideHallScale,yaw:-Math.PI/2},
 {id:'jijang',name:'지장전',kind:'hall',x:sideHallOffset,z:sideHallCenterZ,scale:sideHallScale,yaw:Math.PI/2},
 {id:'daeung',name:'대웅전',kind:'hall',x:0,z:38,scale:1.5},
 {id:'forest',name:'명상숲 · 뒤뜰',kind:'forest',x:0,z:64,scale:1},
] as const;

/** Layout review proportions; individual architectural detail is reviewed next. */
export const daeungDimensions = { x:1.5, y:1.2, z:2 } as const;
export const meditationTrees = [
 ...Array.from({length:18},(_,i)=>({x:-30+(i%9)*7.5,z:61+Math.floor(i/9)*8})),
 ...[-1,1].flatMap(side=>Array.from({length:8},(_,i)=>({x:side*(27+(i%2)*5),z:32+Math.floor(i/2)*7}))),
];
