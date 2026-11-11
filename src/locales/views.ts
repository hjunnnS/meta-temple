import {locale,t} from './index';
const views:Record<string,string[]>={
 entryLandscape:['천왕문','전체 풍경'],teaGarden:['쉼터','옆마당'],teaGardenSeated:['쉼터','좌석'],teaSeated:['쉼터','좌석'],teaPavilion:['연못','쉼터'],sanctuaryWalk:['대웅전','산책길'],personalGateWalk:['시간과 공간의 방','입구'],personalGate:['시간과 공간의 방','입구'],forestBuddha:['대웅전','석조 입상'],treeSpecimen:['연못','전체 풍경'],wishCoin:['소원 동전','종무소'],wishCoinTree:['소원 동전','연못'],wishCoinOpposite:['소원 동전','연못'],pondPagoda:['연못','구층탑'],eastPagoda:['구층탑'],bellRing:['범종각','종치기'],
 plazaCourt:['연등광장','중앙 마당'],plazaHall:['연등광장','대웅전'],courtHall:['중앙 마당','대웅전'],eavesHall:['대웅전','처마'],
 gwaneumDoor:['관음전','입구'],gwaneumAltar:['관음전','불단'],gwaneumSeats:['관음전','내부'],
 gateHallSightline:['천왕문','대웅전'],gateArrival:['일주문','입구'],templeApproach:['일주문','대웅전'],gateWalk:['천왕문','내부'],gateEave:['천왕문','처마'],guardianGallery:['천왕문','사천왕'],courtWall:['중앙 마당','외관'],
 votiveShelves:['인등전','인등'],memorialLamps:['지장전','추모등'],indeungApproach:['인등전','외관'],pagodaCourt:['석탑'],stoneLanterns:['대웅전','석등'],candleCourt:['석탑 촛불함'],
 wishGarden:['소원패 정원'],wishAisle:['소원패 정원','내부'],officeReception:['종무소','등·소원 접수처'],lanternReception:['연등광장','연등'],
 entryRowMap:['배치도 · 위에서 보기','범종각','종무소'],gateExitOffice:['천왕문','종무소'],officeApproach:['종무소','외관'],bellApproach:['범종각','외관'],bellDetail:['범종각','내부'],
 jijangPlaza:['지장전','외관'],jijangInterior:['지장전','내부'],entrance:['대웅전','입구'],sanctuary:['대웅전','내부'],seating:['대웅전','방석'],shrine:['대웅전','불단'],face:['대웅전','불상'],chime:['처마','풍경'],
};
export function translateViews(select:HTMLSelectElement){
 const selected=select.value;
 const options=Array.from(select.options);
 if(locale!=='ko'){
  for(const opt of options){const keys=views[opt.value];if(keys)opt.textContent=keys.map(t).join(' · ');}
 }
 const collator=new Intl.Collator(locale,{numeric:true});
 options.sort((a,b)=>collator.compare(a.label,b.label));
 select.replaceChildren(...options);select.value=selected;
}
