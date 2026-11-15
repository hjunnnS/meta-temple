export const CONTRACT={schemaVersion:1,layoutVersion:'layout-web-015',capacity:20,channels:3,ttlMs:30000,bounds:{west:-60,east:98,south:-81,north:118}};
const FACES=['human','rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig'];
export function motion(value){
 const p=value?.position,b=CONTRACT.bounds;if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||p[0]<b.west||p[0]>b.east||p[2]<b.south||p[2]>b.north||p[1]<-1||p[1]>5||!Number.isFinite(value.yaw)||!['idle','walk','worship','sit','bell'].includes(value.animation))return null;
 for(const key of['bowProgress','bellProgress','drinkLift'])if(value[key]!==undefined&&(!Number.isFinite(value[key])||value[key]<0||value[key]>1))return null;
 for(const key of['meditating','wearingRobe'])if(value[key]!==undefined&&typeof value[key]!=='boolean')return null;
 if(value.face!==undefined&&!FACES.includes(value.face))return null;if(value.beverage!==undefined&&!['tea','coffee'].includes(value.beverage))return null;
 if(value.bellHit!==undefined&&(!Number.isSafeInteger(value.bellHit)||value.bellHit<0))return null;
 return{position:p,yaw:Math.atan2(Math.sin(value.yaw),Math.cos(value.yaw)),animation:value.animation,face:value.face??'human',wearingRobe:value.wearingRobe??false,meditating:value.meditating??false,bowProgress:value.bowProgress??0,bellProgress:value.bellProgress??0,bellHit:value.bellHit??0,drinkLift:value.drinkLift??0,beverage:value.beverage??'tea'};
}
