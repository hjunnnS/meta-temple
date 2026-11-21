/** Hysteresis avoids visible detail flicker while walking around a boundary. */
export function visitorDetail(distance:number,current=0){
 if(current===0)return distance>28?1:0;
 if(current===1)return distance<23?0:distance>55?2:1;
 return distance<23?0:distance<48?1:2;
}
export function visitorDetailPart(name:string){
 if(/shoe-lace|cloth-button|shirt-placket|collar|finger-fold|eye-light/.test(name))return 1;
 if(/(?:^|-)(?:eyebrow|quiet-smile|swept-fringe|crown-sweep|parted-side|ear|nose)(?:-|$)/.test(name))return 2;
 return 0;
}
