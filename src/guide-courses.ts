import {templePlaces} from './temple-layout.ts';
import {prayerHallPoint,prayerAisleX,prayerHallFloor,rearPrayerHalls} from './prayer-halls.ts';

export const guideCourses=[
 {id:'health',label:'건강',place:'yaksa',deity:'약사여래불',intro:'몸과 마음의 평안을 바라는 마음으로 약사전을 찾아가 보겠습니다.',prayer:'몸과 마음이 평안하고, 힘든 시간을 지나가는 동안 용기를 잃지 않기를 바랍니다.'},
 {id:'family',label:'가족',place:'gwaneum',deity:'관세음보살',intro:'가족을 떠올리며 관음전에서 서로를 돌보는 마음을 살펴보겠습니다.',prayer:'우리 가족이 서로의 마음을 듣고, 따뜻한 말과 행동으로 함께하기를 바랍니다.'},
 {id:'exam',label:'시험',place:'munsu',deity:'문수보살',intro:'문수전에서 배움의 마음을 가다듬고 지금 할 수 있는 일을 돌아보겠습니다.',prayer:'배운 것을 차분히 살피고, 준비한 만큼 힘을 다하며, 결과 앞에서도 마음을 지킬 수 있기를 바랍니다.'},
 {id:'relationship',label:'관계',place:'bohyeon',deity:'보현보살',intro:'보현전에서 나의 말과 행동을 돌아보며 관계를 위한 작은 실천을 생각해 보겠습니다.',prayer:'상대의 마음을 헤아리고, 내 마음도 돌보며, 할 수 있는 작은 친절을 실천하기를 바랍니다.'},
 {id:'loss',label:'상실',place:'jijang',deity:'지장보살',intro:'지장전에서 그리운 마음을 잠시 내려놓고 소중한 인연을 떠올려 보겠습니다.',prayer:'소중한 인연이 평안하기를 바랍니다. 남겨진 마음도 천천히 돌보고, 기억 속 따뜻함을 간직할 수 있기를 바랍니다.'},
] as const;
export type GuideCourseId=typeof guideCourses[number]['id'];
export type GuideCourse=typeof guideCourses[number];
/** Only the health slice is enabled until G06's route/content review. */
export const enabledGuideCourses:readonly GuideCourseId[]=['health'];
export function guideCourse(id:GuideCourseId){return guideCourses.find(c=>c.id===id)!;}
export function guideDestination(id:GuideCourseId){
 const course=guideCourse(id),hall=templePlaces.find(p=>p.id===course.place)!;
 const rear=rearPrayerHalls.find(p=>p.id===hall.id);
 const arrival=rear?prayerHallPoint(rear,prayerAisleX,-1.1):[hall.x,hall.z-(hall.id==='jijang'?1.125:0)] as const;
 return {place:course.place,name:hall.name,x:arrival[0],z:arrival[1],floor:rear?prayerHallFloor:1.4025*hall.scale,yaw:'yaw'in hall?hall.yaw:0};
}
export function atGuideDestination(id:GuideCourseId,p:readonly number[]|null){
 if(!p||p.length<3||!p.every(Number.isFinite))return false;
 const d=guideDestination(id);
 return Math.hypot(p[0]-d.x,p[2]-d.z)<=1.5&&Math.abs(p[1]-d.floor)<.3;
}
