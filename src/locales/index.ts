import {languages,type Locale} from './languages';
export {languages,flagUrl} from './languages';
const loaders=import.meta.glob<Record<string,string>>('./*.json',{import:'default'});
let dictionary:Record<string,string>={};
const aliases:Record<string,string>={
 '사찰 배치 검토':'공간 둘러보기','사사 처음 시점':'전체 풍경','환경 설정 열기':'환경 설정','환경 설정 닫기':'닫기','시험 계정':'계정','첫 방문 안내':'사찰 둘러보기','검증 기록 닫기':'닫기','장면 보기':'공간 둘러보기','걷기 조작':'아바타로 걷기','내 연등 이름표':'이름표 신청','종무소 접수 안내':'등·소원 접수처','범종과 당목 살펴보기':'범종각','명상숲에서 머무르기':'명상숲 · 뒤뜰','소리 연결 중':'공간음 켜기','소리를 켜지 못했습니다. 다시 시도할 수 있습니다.':'다시 시도해 주세요.','준비 시간이 길어지고 있습니다. 다시 시도해 주세요.':'다시 시도해 주세요.','공간을 준비하지 못했습니다.':'다시 시도해 주세요.','사찰 재질을 불러오지 못했습니다. 연결을 확인해 주세요.':'연결 상태를 확인해 주세요.','사찰 3D 장면. 드래그로 시점 회전, 휠이나 두 손가락으로 확대.':'드래그하여 둘러보기 · 휠 / 두 손가락으로 확대',
 '왼쪽으로 걷기':'왼쪽','오른쪽으로 걷기':'오른쪽','앞으로 걷기':'앞','뒤으로 걷기':'뒤'
};
Object.assign(aliases,{
 '시간과 공간의 방 입장':'시간과 공간의 방','나만의 공간을 준비하고 있어요…':'개인 공간 이용권',
 '시간과 공간의 방 · 나만의 공간':'시간과 공간의 방','개인 공간은 로그인 후 입장할 수 있어요.':'로그인',
 '개인 공간에 연결하지 못했습니다. 다시 시도해 주세요.':'다시 시도해 주세요.','개인 공간을 확인하지 못했습니다.':'다시 시도해 주세요.','개인 공간을 열지 못했습니다.':'다시 시도해 주세요.',
 '세션이 끝났습니다. 다시 입장해 주세요.':'다시 시도해 주세요.','연결 상태를 확인한 뒤 다시 입장해 주세요.':'다시 시도해 주세요.','계정이 변경되어 사찰로 돌아왔습니다.':'사찰로 돌아가기',
 '내 아이템 전시':'내 아이템 배치','구매 완료된 다섯 종류의 아이템을 여기에서 골라 전시할 수 있습니다.':'아이템과 자리를 골라 배치해 주세요.',
 '구매 내역을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.':'다시 시도해 주세요.','자리를 비웠습니다. 저장되었습니다.':'배치가 저장되었습니다. 다시 들어와도 유지됩니다.',
 '다른 창에서 배치가 바뀌었습니다. 최신 배치를 확인하고 다시 선택해 주세요.':'아이템과 자리를 골라 배치해 주세요.',
 '이 아이템을 전시할 수 없습니다. 구매 상태와 자리를 다시 확인해 주세요.':'아이템과 자리를 골라 배치해 주세요.',
 '저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.':'다시 시도해 주세요.',
 '처리하지 못했습니다. 다시 열어 상태를 확인해 주세요.':'다시 시도해 주세요.','이용 권한을 확인하고 있습니다.':'개인 공간 이용권',
 '연못과 탑을 바라보는 쉼터':'쉼터','차·커피 쉼터':'쉼터','자리 옮기기':'좌석',
 '1인칭 보기로 앉은 자리의 풍경을 볼 수 있어요.':'공간 둘러보기',
 '잠시 숨을 고르고 풍경을 즐겨 보세요.':'쉼터','범종의 여운을 들어 보세요.':'종소리','종소리가 은은하게 잦아듭니다. 다시 칠 수 있어요.':'종소리',
 '소원 동전 던지기':'소원 동전',
 '당목을 뒤로 당겨 종을 칩니다.':'종치기','종치기를 멈췄습니다.':'종치기',
 '소리를 재생하지 못했습니다. 소리 설정을 확인해 주세요.':'환경 설정','소리를 켜지 못했습니다. 동작을 마친 뒤 다시 시도해 주세요.':'환경 설정',
});
export let locale:Locale='ko';
export async function selectLocale(value:Locale){
 dictionary=value==='ko'?{}:await loaders['./'+value+'.json']();
 locale=value;document.documentElement.lang=value;
 try{localStorage.setItem('sasa:language',value);}catch{}
}
export function preferredLocale():Locale{
 let saved='';try{saved=localStorage.getItem('sasa:language')??'';}catch{}
 return languages.find(([id])=>id===saved)?.[0]??'ko';
}
export function t(source:string):string{
 if(locale==='ko')return source;
 if(source==='01 / 대웅전')return '01 / '+dictionary['대웅전'];
 return dictionary[source]??dictionary[aliases[source]]??source;
}
// Only call on application-authored markup, before adding names, inscriptions or account data.
export function translateMarkup(root:Element){
 if(locale==='ko')return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,value=node.nodeValue??'',key=value.trim();
  if(key)node.nodeValue=value.replace(key,()=>t(key));
 }
 for(const el of [root,...root.querySelectorAll('[aria-label],[placeholder],[title]')]){
  for(const attr of ['aria-label','placeholder','title']){const value=el.getAttribute(attr);if(value)el.setAttribute(attr,t(value));}
 }
}
