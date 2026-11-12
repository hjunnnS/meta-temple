/** Low planting stays at the edges; no new buildings, sale slots or courtyard furniture. */
export const quietGardenBeds=[
 {id:'bell-back',x:-33.5,z:-51,rx:1.7,rz:17,kind:'seasonal'},
 {id:'indeung-back',x:-33.7,z:-25,rx:1.6,rz:10,kind:'bamboo'},
 {id:'gwaneum-back',x:-34.5,z:13,rx:1.1,rz:12,kind:'bamboo'},
 {id:'west-rear',x:-54.2,z:84,rx:1.4,rz:13,kind:'bamboo'},
 {id:'north-between',x:14,z:108.8,rx:15,rz:3.7,kind:'seasonal'},
 {id:'north-east',x:83,z:111,rx:9,rz:2.2,kind:'bamboo'},
 {id:'east-bend',x:59,z:99,rx:6,rz:3.5,kind:'seasonal'},
 {id:'west-bend',x:-49,z:83,rx:3.2,rz:7,kind:'bamboo'},
 {id:'east-upper',x:92.3,z:92,rx:1.3,rz:14,kind:'bamboo'},
 {id:'wish-east',x:73,z:-17,rx:1.7,rz:12,kind:'bamboo'},
 {id:'east-lawn',x:68,z:-6,rx:4.7,rz:4.6,kind:'seasonal'},
 {id:'tower-north',x:63,z:-24.5,rx:6.5,rz:1.5,kind:'seasonal'},
 {id:'tea-west',x:41.7,z:-72,rx:3.5,rz:4.1,kind:'seasonal'},
 {id:'tea-south',x:60,z:-76.4,rx:9,rz:.85,kind:'seasonal'},
] as const;
/** Repeated low clusters break exposed wall lines, while leaving gaps between beds. */
export const quietShrubClusters=[
 [-34.3,-55],[-34.1,-49],[-34.2,-40],[-34.6,-16],[-34.7,6],[-34.6,20],
 [-54.5,78],[-54.5,88],[-52,108],[20,111],[27,111],[76,112],[88,111],[93,96],[93,85],
 [73.8,-23],[73.8,-13],[69,-5],[66,-8],[64,-24],[69,-24],
 [39,-71],[42,-75],[45,-74],[56,-76.5],[65,-76.5],
] as const;
