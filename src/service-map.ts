import {pondBridge} from './pond-bridge-layout';
import {rearPrayerHalls,prayerHallPoint,prayerAisleX} from './prayer-halls';
import {locale,t} from './locales';
import {templePlaces,wishGarden,courtSouthEdge,courtDepth,candleCourt,memorialGarden} from './temple-layout';
import {boundaries,paving,sanctuaryWalk,rearPrayerWalk,prayerHallApproaches,teaApproach,teaGardenWalk,pondBridgeApproaches,eastCourts,pond,teaPavilion,personalGate,sweepingMonkSite,coinThrowBank} from './temple-terrain';
import {practiceSeat} from './hall-seats';
export interface ServicePlace {id:string;label:string;description:string;x:number;z:number;arrival:readonly[number,number];view:string}
const site=(id:string)=>templePlaces.find(p=>p.id===id)!;
export const servicePlaces:ServicePlace[]=[
 ...(['daeung','gwaneum','jijang','indeung','office','bell','cheonwang','ilju'] as const).map(id=>{const p=site(id);const views={daeung:'entrance',gwaneum:'gwaneumDoor',jijang:'jijangPlaza',indeung:'votiveShelves',office:'officeReception',bell:'bellRing',cheonwang:'gatePassage',ilju:'gateArrival'};const descriptions={daeung:'참배와 기도',gwaneum:'소원 기도',jijang:'추모 기도',indeung:'인등',office:'등·소원 접수처',bell:'종치기',cheonwang:'다음 일정',ilju:'사찰 둘러보기'};return {id,label:p.name,description:descriptions[id],x:p.x,z:p.z,arrival:(id==='daeung'?[practiceSeat.x,practiceSeat.z]:id==='jijang'?[p.x,p.z-1.125]:id==='office'?[p.x,p.z+6.1]:[p.x,p.z]) as [number,number],view:views[id]};}),
 {id:'lantern',label:'연등광장',description:'연등 배치도',x:0,z:-24,arrival:[0,-24],view:'lanternReception'},
 {id:'wish',label:'소원패 정원',description:'소원패',x:wishGarden.x,z:wishGarden.z,arrival:[wishGarden.x-6,wishGarden.z],view:'wishGarden'},
 {id:'candle',label:'석탑 촛불함',description:'봉헌초',x:candleCourt.x,z:candleCourt.z,arrival:[candleCourt.x+7,candleCourt.z],view:'candleCourt'},
 {id:'pond',label:'연못',description:'소원 동전',x:pond.x,z:pond.z,arrival:coinThrowBank[20],view:'wishCoinTree'},
 {id:'tower',label:'구름탑',description:'공간 둘러보기',x:eastCourts.tower.x,z:eastCourts.tower.z,arrival:[eastCourts.tower.x-9,eastCourts.tower.z],view:'eastPagoda'},
 {id:'buddha',label:'미륵보살 석상',description:'참배와 기도',x:eastCourts.buddha.x,z:eastCourts.buddha.z,arrival:[eastCourts.buddha.x,eastCourts.buddha.z-8],view:'forestBuddha'},
 {id:'tea',label:'쉼터',description:'차·커피 쉼터',x:teaPavilion.x,z:teaPavilion.z,arrival:[teaPavilion.x-7,teaPavilion.z+6],view:'teaSeated'},
 {id:'walk',label:'산책길',description:'명상숲 · 뒤뜰',x:0,z:71,arrival:[0,73],view:'sanctuaryWalk'},
 {id:'monk',label:'뒤뜰 · 낙엽 쓸고 있는 스님',description:'나무관세음보살~',x:sweepingMonkSite.x,z:sweepingMonkSite.z,arrival:[sweepingMonkSite.x+2,sweepingMonkSite.z],view:'sweepingMonk'},
 {id:'private',label:'시간과 공간의 방',description:'나만 입장하는 조용한 공간',x:personalGate.x,z:personalGate.z,arrival:[personalGate.x-2.5,personalGate.z],view:'personalGateWalk'},
 ...rearPrayerHalls.map(p=>({id:p.id,label:p.name,description:p.deity,x:p.x,z:p.z,arrival:prayerHallPoint(p,prayerAisleX,-1.1),view:p.id+'Interior'})),
];
export function serviceMap(parent:HTMLElement,position:()=>readonly number[]|null,navigate:(place:ServicePlace)=>void){
 const hint=document.createElement('p');hint.className='map-intro';hint.textContent=t('장소를 선택하세요');
 const layout=document.createElement('div');layout.className='service-map-layout';
 const image=document.createElementNS('http://www.w3.org/2000/svg','svg');image.setAttribute('viewBox','-64 -124 168 210');image.setAttribute('role','group');image.setAttribute('aria-label',t('사찰 지도'));
 const svg=<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string>,text?:string)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;image.append(el);return el;};
 svg('rect',{x:'-64',y:'-124',width:'168',height:'210',rx:'5',fill:'#e8eddd'});
 for(const b of boundaries)svg('line',{x1:String(b.from[0]),y1:String(-b.from[1]),x2:String(b.to[0]),y2:String(-b.to[1]),stroke:'#afbda0','stroke-width':'1'});
 for(const path of paving)svg('line',{x1:String(path.from[0]),y1:String(-path.from[1]),x2:String(path.to[0]),y2:String(-path.to[1]),stroke:'#ccd4bc','stroke-width':String(path.lanes===3?3:1.5)});
 for(const route of [sanctuaryWalk,rearPrayerWalk,...prayerHallApproaches.map(a=>a.route),teaApproach,teaGardenWalk,...pondBridgeApproaches])svg('polyline',{points:route.map(p=>p[0]+','+-p[1]).join(' '),fill:'none',stroke:'#ccd4bc','stroke-width':'1.5'});
 svg('rect',{x:String(memorialGarden.x-memorialGarden.width/2),y:String(-memorialGarden.z-memorialGarden.depth/2),width:String(memorialGarden.width),height:String(memorialGarden.depth),fill:'#d9cfb6'});
 svg('rect',{x:'-35.5',y:String(-(courtSouthEdge+courtDepth)),width:'71',height:String(courtDepth),fill:'#dadfc9'});
 svg('ellipse',{cx:String(pond.x),cy:String(-pond.z),rx:String(pond.width/2),ry:String(pond.depth/2),fill:'#b5cbb6'});
 svg('line',{x1:String(pondBridge.x),y1:String(-pondBridge.south),x2:String(pondBridge.x),y2:String(-pondBridge.north),stroke:'#9b7750','stroke-width':String(pondBridge.width)});
 const list=document.createElement('div');list.className='service-place-list';const detail=document.createElement('div');detail.className='service-place-detail';
 const title=document.createElement('h3'),description=document.createElement('p'),move=document.createElement('button');move.className='service-primary';move.textContent=t('이곳으로 이동');detail.append(title,description,move);
 const sidebar=document.createElement('div');sidebar.append(list,detail);layout.append(image,sidebar);parent.append(hint,layout);
 title.setAttribute('aria-live','polite');title.setAttribute('aria-atomic','true');
 const labels=new Map<string,SVGElement>(),nodes=new Map<string,SVGElement>(),markers=new Map<string,SVGElement>(),buttons=new Map<string,HTMLButtonElement>();let selected=servicePlaces[0];
 function choose(place:ServicePlace){selected=place;for(const[id,node]of nodes)node.setAttribute('fill',id===place.id?'#355b42':'#bdc7aa');for(const[id,label]of labels)label.setAttribute('fill',id===place.id?'#fff8e2':'#314b34');for(const controls of [markers,buttons])for(const[id,control]of controls)control.setAttribute('aria-pressed',String(id===place.id));title.textContent=t(place.label);description.textContent=t(place.description);}
 for(const place of servicePlaces){
  const number=String(servicePlaces.indexOf(place)+1).padStart(2,'0');
  const marker=svg('g',{role:'button',tabindex:'0','aria-label':number+' · '+t(place.label),'data-map-place':place.id,class:'service-map-marker'});
  const node=svg('rect',{x:String(place.x-4.3),y:String(-place.z-2.8),width:'8.6',height:'5.6',rx:'1',fill:'#bdc7aa'});nodes.set(place.id,node);
  const text=svg('text',{x:String(place.x),y:String(-place.z+1),'text-anchor':'middle',fill:'#314b34','font-size':'4'},number);labels.set(place.id,text);text.style.pointerEvents='none';
  marker.append(node,text);markers.set(place.id,marker);
  marker.addEventListener('click',()=>choose(place));
  marker.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(place);}});
 }
 for(const place of [...servicePlaces].sort((a,b)=>t(a.label).localeCompare(t(b.label),locale))){const b=document.createElement('button');b.type='button';b.dataset.destination=place.view;b.dataset.place=place.id;b.textContent=String(servicePlaces.indexOf(place)+1).padStart(2,'0')+' · '+t(place.label);b.onclick=()=>choose(place);buttons.set(place.id,b);list.append(b);}
 const at=position();if(at){const dot=svg('circle',{cx:String(at[0]),cy:String(-at[2]),r:'1.8',fill:'#d1a847',stroke:'#fff9e9','stroke-width':'.65'});const label=svg('text',{x:String(at[0]+3),y:String(-at[2]+1),'font-size':'4',fill:'#4c603f'},t('현재 위치'));label.setAttribute('aria-hidden','true');dot.setAttribute('aria-label',t('현재 위치'));dot.style.pointerEvents=label.style.pointerEvents='none';}
 move.onclick=()=>navigate(selected);choose(selected);
}
