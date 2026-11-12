import {t} from './locales';
import {serviceMap,type ServicePlace} from './service-map';
import './service-ui.css';
const icons={places:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16m6-14v16"/>',offer:'<path d="M12 20C5 20 2 15 2 10c5 0 9 4 10 10Zm0 0c7 0 10-5 10-10-5 0-9 4-10 10Z"/><path d="M12 17C8 12 9 7 12 3c3 4 4 9 0 14Z"/>',avatar:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'};
const icon=(name:keyof typeof icons)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
interface ServiceUIOptions{position:()=>readonly number[]|null;navigate:(place:ServicePlace)=>void;practice:(kind:'bow'|'meditation'|'108')=>void;schedule?:()=>void}
export function serviceUI(canvas:HTMLCanvasElement,go:(view:string)=>void,closeOffering:()=>void,options:ServiceUIOptions){
 document.body.classList.add('service-ui');
 const root=document.querySelector('#app')!,settings=document.querySelector<HTMLDialogElement>('#settings-panel')!;
 let lastControl:HTMLElement|null=null;let accountReturn:'menu'|'offer'|'practice'|'external'='external';
 function dialog(id:string,title:string){const panel=document.createElement('dialog');panel.id=id;panel.className='service-panel';panel.setAttribute('aria-labelledby',id+'-title');const heading=document.createElement('div');heading.className='panel-title';const h=document.createElement('h2');h.id=id+'-title';h.textContent=t(title);const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',t('닫기'));close.onclick=()=>panel.close();heading.append(h,close);panel.append(heading);root.append(panel);return panel;}
 const spaces=dialog('spaces-panel','사찰 지도'),appearance=dialog('appearance-panel','내 모습'),practice=dialog('practice-panel','수행'),menu=dialog('menu-panel','사찰 둘러보기'),review=dialog('review-panel','검수 도구'),stop=dialog('practice-stop-panel','수행 마치기');
 function open(panel:HTMLDialogElement){lastControl=document.activeElement instanceof HTMLElement?document.activeElement:null;if(menu.open&&panel!==menu)menu.close();panel.showModal();}
 function action(parent:HTMLElement,id:string,label:string,handler:()=>void){const b=document.createElement('button');b.id=id;b.type='button';b.textContent=t(label);b.onclick=handler;parent.append(b);return b;}
 const menuOpen=action(document.querySelector('header')!,'menu-open','전체 메뉴',()=>open(menu));menuOpen.className='circle';menuOpen.innerHTML=icon('menu');menuOpen.setAttribute('aria-haspopup','dialog');menuOpen.setAttribute('aria-controls',menu.id);
 const dock=document.createElement('nav');dock.id='service-dock';dock.setAttribute('aria-label',t('사찰 둘러보기'));
 function dockButton(id:string,label:string,name:keyof typeof icons,handler:()=>void){const b=action(dock,id,label,handler);b.replaceChildren();b.innerHTML=icon(name);const text=document.createElement('span');text.textContent=t(label);b.append(text);b.setAttribute('aria-haspopup','dialog');return b;}
 function showMap(guidePlace=document.body.dataset.guidePlace){spaces.querySelector('.service-map-body')?.remove();const body=document.createElement('div');body.className='service-map-body';spaces.append(body);serviceMap(body,options.position,place=>{spaces.close();closeOffering();options.navigate(place);canvas.focus();},guidePlace);open(spaces);}
 dockButton('spaces-open','사찰 지도','places',()=>showMap());
 dockButton('practice-open','수행','offer',()=>open(practice));
 dockButton('appearance-open','내 모습','avatar',()=>{closeOffering();go('walk');const camera=document.querySelector<HTMLButtonElement>('#walk-camera')!;if(camera.getAttribute('aria-pressed')==='true')camera.click();open(appearance);});root.append(dock);
 const intro=document.createElement('p');intro.className='practice-note';intro.textContent=t('참배와 명상은 로그인 없이 이용할 수 있습니다.');practice.append(intro);
 action(practice,'practice-bow','참배 시작',()=>{practice.close();closeOffering();options.practice('bow');});
 action(practice,'practice-meditate','명상하기',()=>{practice.close();closeOffering();options.practice('meditation');});
 action(practice,'practice-108','108배 시작',()=>{practice.close();closeOffering();options.practice('108');});
 const loginNote=document.createElement('p');loginNote.className='note';loginNote.textContent=t('108배는 로그인 후 시작합니다.');practice.append(loginNote);
 action(menu,'menu-map','사찰 지도',()=>showMap());action(menu,'schedule-open','오늘의 일정',()=>{menu.close();options.schedule?.();});
 const offeringOpen=action(menu,'offering-open','등·소원 접수처',()=>{menu.close();go('officeReception');canvas.focus();});offeringOpen.className='menu-action';
 const account=document.querySelector<HTMLElement>('#service-account');if(account){menu.append(account);account.classList.add('menu-action');account.addEventListener('click',()=>{accountReturn=menu.open?'menu':'external';menu.close();});}
 const settingsOpen=document.querySelector<HTMLElement>('#settings')!;settingsOpen.textContent=t('환경 설정');menu.append(settingsOpen);settingsOpen.classList.add('menu-action');settingsOpen.addEventListener('click',()=>menu.close());
 settings.addEventListener('close',()=>{if(!document.body.classList.contains('in-private-room'))menuOpen.focus();});
 const looks=document.createElement('div');looks.className='appearance-options';appearance.append(looks);
 for(const id of ['walk-robe','walk-camera','face-picker']){const control=document.getElementById(id);if(control){looks.append(control);control.addEventListener('click',()=>{if(appearance.open)appearance.close();});}}
 const picker=document.querySelector('.place-picker')!,footer=document.querySelector('footer')!;review.append(picker,footer);
 for(const b of footer.querySelectorAll<HTMLButtonElement>('[data-view]'))b.addEventListener('click',()=>{if(review.open)review.close();canvas.focus();});
 document.querySelector('#place')!.addEventListener('change',()=>{if(review.open)review.close();});
 const sample=document.createElement('details'),sampleTitle=document.createElement('summary');sampleTitle.textContent=t('이름표 미리보기');sample.append(sampleTitle,document.querySelector('#lantern-name')!.closest('label')!,document.querySelector('#apply-name')!,document.querySelector('#name-status')!);review.append(sample);
 const serverTools=document.querySelector('#review-tools');if(serverTools)review.append(serverTools);
 const reviewOpen=action(settings,'review-open','검수 도구',()=>{settings.close();open(review);});reviewOpen.className='quiet-link';
 const actions=document.createElement('div');actions.id='context-actions';root.append(actions);
 for(const id of ['walk-pad','pond-toss','sweeper-greet','private-gate-action','tea-break']){const el=document.getElementById(id);if(el)actions.append(el);}
 const pad=document.querySelector('#walk-pad')!,directions=pad.querySelector('div');if(directions)directions.id='walk-directions';
 action(pad as HTMLElement,'practice-context','수행',()=>open(practice));
 const stopButton=document.querySelector<HTMLButtonElement>('#bow-stop')!,stopText=document.createElement('p');stopText.textContent=t('수행을 마쳐도 같은 자리에 머뭅니다.');stop.append(stopText);action(stop,'practice-continue','계속 수행',()=>stop.close());action(stop,'practice-finish','수행 마치기',()=>{stop.close();stopButton.onclick?.call(stopButton,new PointerEvent('click'));canvas.focus();});
 stopButton.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open(stop);},{capture:true});
 const reception=document.querySelector<HTMLElement>('#reception-panel')!,offering=document.createElement('section');offering.id='offering-drawer';offering.hidden=reception.hidden;offering.setAttribute('aria-label',t('등·소원 접수처'));
 const top=document.createElement('div');top.className='offering-heading';const title=document.createElement('strong');title.textContent=t('등·소원 접수처');const close=action(top,'offering-close','닫기',()=>{closeOffering();canvas.focus();});close.textContent='×';close.setAttribute('aria-label',t('닫기'));top.prepend(title);const steps=document.createElement('ol');steps.id='offering-steps';for(const label of ['자리 선택','신청 내용','확인·예약']){const step=document.createElement('li');step.textContent=t(label);steps.append(step);}offering.append(top,steps,reception);root.append(offering);
 function syncOffer(){offering.hidden=reception.hidden;const stage=reception.querySelector<HTMLElement>('[data-stage]')?.dataset.stage;offering.dataset.step=stage??'products';steps.hidden=!stage;const index=['rows','seats','full'].includes(stage??'')?0:stage==='form'?1:2;for(const[at,step]of[...steps.children].entries())if(at===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');document.body.classList.toggle('offering-visible',!reception.hidden);}
 new MutationObserver(syncOffer).observe(reception,{attributes:true,attributeFilter:['hidden'],childList:true});window.addEventListener('sasa:offer-stage',syncOffer);syncOffer();
 const privateControls=document.querySelector<HTMLElement>('#private-room-controls')!,privateViews=dialog('private-views-panel','공간 둘러보기');
 const privateOptions=document.querySelector('.private-room-options')!;privateViews.append(privateOptions);privateControls.append(privateViews);privateViews.querySelector('details')!.setAttribute('open','');
 const viewsOpen=action(settings,'private-views-open','공간 둘러보기',()=>{settings.close();open(privateViews);});viewsOpen.className='private-only';
 for(const b of privateViews.querySelectorAll('button[data-room-view]'))b.addEventListener('click',()=>{privateViews.close();canvas.focus();});
 window.addEventListener('sasa:space',event=>{if((event as CustomEvent).detail==='public'&&privateViews.open)privateViews.close();});
 window.addEventListener('sasa:reservation-login',()=>{accountReturn='offer';});window.addEventListener('sasa:practice-login',()=>{accountReturn='practice';});
 const accountPanel=document.querySelector('#account-title')?.closest('dialog');accountPanel?.classList.add('account-panel');
 for(const panel of [spaces,appearance,practice,menu,review,stop])panel.addEventListener('close',()=>{if(document.querySelector('dialog[open]'))return;if(lastControl?.isConnected&&lastControl.getClientRects().length)lastControl.focus();else canvas.focus();});
 accountPanel?.addEventListener('close',()=>{if(!document.querySelector('dialog[open]')){const reserve=[...reception.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===t('이 자리에 예약'));if(reserve?.isConnected&&reserve.getClientRects().length)reserve.focus();else canvas.focus();}});
 document.querySelector('.face-dialog')?.addEventListener('close',()=>canvas.focus());
 function rootMenu(){if(document.body.classList.contains('in-private-room')){canvas.focus();return;}menu.showModal();}
 function backButton(parent:HTMLElement,run:()=>void){const b=document.createElement('button');b.type='button';b.className='service-back';b.textContent='←';b.setAttribute('aria-label',t('뒤로'));b.onclick=run;parent.prepend(b);}
 function addBacks(){for(const panel of document.querySelectorAll<HTMLDialogElement>('dialog')){
  if(panel===menu||panel===stop||panel.querySelector('.service-back'))continue;
  const heading=panel.querySelector<HTMLElement>('.panel-title,header')??panel;
  backButton(heading,()=>{panel.close();if(panel===review||panel===privateViews){settings.showModal();return;}if(panel.classList.contains('face-dialog')){appearance.showModal();return;}if(panel.id==='diagnostic-dialog'){review.showModal();return;}if(panel===accountPanel){if(accountReturn==='menu')rootMenu();else if(accountReturn==='practice')practice.showModal();else canvas.focus();return;}if(['private-display-dialog','private-access-dialog'].includes(panel.id)){canvas.focus();return;}rootMenu();});
 }}
 addBacks();new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n instanceof Element&&(n.matches('dialog,.panel-title,header')||n.querySelector('dialog,.panel-title')))))addBacks();}).observe(document.body,{childList:true,subtree:true});
 backButton(top,()=>{closeOffering();rootMenu();});
 window.addEventListener('sasa:offering-return',()=>{closeOffering();canvas.focus();});
 document.querySelector<HTMLElement>('.brand')!.onclick=e=>{e.preventDefault();for(const panel of [spaces,appearance,practice,menu,review])if(panel.open)panel.close();closeOffering();canvas.focus();};
 return {openMap:showMap};
}
