import {languages,type Locale} from './languages';
export {languages,flagUrl} from './languages';
const loaders=import.meta.glob<Record<string,string>>('./*.json',{import:'default'});
let dictionary:Record<string,string>={};
const aliases:Record<string,string>={
 '사찰 배치 검토':'공간 둘러보기','사사 처음 시점':'전체 풍경','환경 설정 열기':'환경 설정','환경 설정 닫기':'닫기','시험 계정':'계정','첫 방문 안내':'사찰 둘러보기','검증 기록 닫기':'닫기','장면 보기':'공간 둘러보기','걷기 조작':'아바타로 걷기','내 연등 이름표':'이름표 신청','종무소 접수 안내':'등·소원 접수처','범종과 당목 살펴보기':'범종각','명상숲에서 머무르기':'명상숲 · 뒤뜰','소리 연결 중':'공간음 켜기','소리를 켜지 못했습니다. 다시 시도할 수 있습니다.':'다시 시도해 주세요.','준비 시간이 길어지고 있습니다. 다시 시도해 주세요.':'다시 시도해 주세요.','공간을 준비하지 못했습니다.':'다시 시도해 주세요.','사찰 재질을 불러오지 못했습니다. 연결을 확인해 주세요.':'연결 상태를 확인해 주세요.','사찰 3D 장면. 드래그로 시점 회전, 휠이나 두 손가락으로 확대.':'드래그하여 둘러보기 · 휠 / 두 손가락으로 확대',
 '왼쪽으로 걷기':'왼쪽','오른쪽으로 걷기':'오른쪽','앞으로 걷기':'앞','뒤으로 걷기':'뒤'
};
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
