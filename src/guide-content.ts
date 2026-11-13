import {prayerPlaceInfo} from './prayer-place-info.ts';
import{guideCourse,guideDestination,type GuideCourseId}from'./guide-courses.ts';
import type{GuideStage}from'./guide-session.ts';
export function guideContent(stage:GuideStage,id:GuideCourseId,tr:(text:string)=>string=text=>text){
 const c=guideCourse(id),d=guideDestination(id);
 if(stage==='prepare')return{title:tr('잠시 마음 준비하기'),text:tr(c.intro)+' '+tr('모신 분')+' · '+tr(c.deity)+'.'+' '+tr(prayerPlaceInfo[c.place].description)+' '+tr('편한 자세로 숨을 고르고, 오늘 마음에 담아 온 분을 떠올려 보세요.'),audio:'prepare-'+id};
 if(stage==='travel')return{title:tr('불단 앞 수행 자리로 걸어가기'),text:tr('{place}의 열린 입구로 들어가 불단 앞 수행 자리로 와 주세요. 사찰 지도에서 현재 목적지를 확인할 수 있습니다.').replace('{place}',tr(d.name)),audio:'travel-'+id};
 if(stage==='prayer')return{title:tr('기도문과 함께 참배하기'),text:tr(c.prayer)+' '+tr('편한 마음으로 합장하고 절을 올려 보세요. 절이 어렵다면 기도문을 읽으며 잠시 머무른 뒤 건너뛰어도 괜찮습니다.'),audio:'prayer-'+id};
 if(stage==='practice')return{title:tr('원하는 수행 선택하기'),text:tr('짧게 절하거나 잠시 명상할 수 있습니다. 108배는 로그인 후 선택할 수 있어요. 지금은 쉬고 싶다면 다음 단계로 건너뛰어도 괜찮습니다.'),audio:'practice'};
 if(stage==='offering')return{title:tr('원한다면 연등에 마음 담기'),text:tr('연등은 선택입니다. 신청을 원하면 배치도에서 자리를 고르고, 예약할 때 로그인해 주세요. 구매하지 않아도 이 안내를 마칠 수 있습니다.'),audio:'offering'};
 return{title:tr('마음을 돌보는 시간을 가지셨습니다'),text:tr('잠시 마음을 돌보는 시간을 가지셨습니다. 이제 자유롭게 머물다 가세요. 같은 고민으로 다시 안내받거나 다른 길을 천천히 둘러보셔도 좋습니다.')+' '+tr('연등·소원패 신청이나 산책은 안내를 마친 뒤 자유롭게 선택할 수 있어요.'),audio:'finish'};
}
