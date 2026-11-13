import type{createTemple}from'./scene';
import{guideCourses,guideCourse,guideDestination,atGuideDestination,enabledGuideCourses,type GuideCourseId}from'./guide-courses';
import{GuideSession}from'./guide-session';import{guideContent}from'./guide-content';
import{guideMonk}from'./guide-monk';import{guideVoice}from'./guide-voice';
import type{PracticeEvent,PracticeKind}from'./practice-events';import{t,locale}from'./locales';import'./guided-visit.css';
interface Options{app:ReturnType<typeof createTemple>;canvas:HTMLCanvasElement;walk:()=>void;map:(id:string)=>void;offering:()=>void;volume:()=>number;stopOtherAudio:()=>void}
export function guidedVisit(o:Options){
 const session=new GuideSession(),voice=guideVoice(o.volume);let arrived=false,suspended=false,lastPoll=0,pending:'prayer'|PracticeKind|null=null,run='',offeringPending=false;
 const welcome=document.createElement('aside');welcome.id='guide-welcome';welcome.hidden=true;
 const heading=document.createElement('h2');heading.textContent=t('어떻게 머물고 싶으신가요?');const intro=document.createElement('p');intro.textContent=t('자유롭게 둘러보거나 스님의 안내를 받을 수 있어요.');welcome.append(heading,intro);
 const choice=document.createElement('dialog');choice.id='guide-picker';choice.className='service-panel';choice.setAttribute('aria-label',t('스님 안내'));
 const title=document.createElement('h2');title.textContent=t('오늘 어떤 마음으로 오셨나요?');choice.append(title);
 const card=document.createElement('section');card.id='guide-card';card.hidden=true;card.setAttribute('aria-label',t('스님 안내'));
 const announcement=document.createElement('span');announcement.className='guide-announcement';announcement.setAttribute('aria-live','polite');announcement.setAttribute('aria-atomic','true');let lastAnnouncement='';
 const bubbleActor=guideMonk(o.app.scene,o.app.camera,o.canvas,()=>o.app.settings.visitor,()=>open());
 function button(parent:HTMLElement,id:string,text:string,act:()=>void,disabled=false){const b=document.createElement('button');b.id=id;b.type='button';b.textContent=t(text);b.disabled=disabled;b.onclick=act;parent.append(b);return b;}
 function clearPending(){pending=null;run='';offeringPending=false;}
 function stopOwnedPractice(){if(pending||run)o.app.stopPractice();clearPending();}
 function exit(){stopOwnedPractice();session.exit();voice.stop();card.hidden=true;welcome.hidden=true;choice.close();document.body.classList.remove('guide-active');delete document.body.dataset.guidePlace;bubbleActor.set(null,false,'');announcement.textContent='';lastAnnouncement='';o.canvas.focus();}
 function open(){welcome.hidden=true;document.querySelector<HTMLDialogElement>('#menu-panel')?.close();voice.stop();o.stopOtherAudio();if(!choice.open)choice.showModal();}
 function start(id:GuideCourseId){stopOwnedPractice();session.start(id);choice.close();welcome.hidden=true;o.walk();document.querySelector<HTMLElement>('#visit-guide')!.hidden=true;arrived=atGuideDestination(id,o.app.settings.visitor);render(true);const h=card.querySelector('h2')!;h.tabIndex=-1;h.focus({preventScroll:true});}
 const choices=document.createElement('div');choices.className='guide-choices';choice.append(choices);
 for(const c of guideCourses)button(choices,'guide-course-'+c.id,c.label,()=>start(c.id),!enabledGuideCourses.includes(c.id));
 button(choice,'guide-picker-free','자유롭게 둘러보기',exit);
 const welcomeActions=document.createElement('div');welcomeActions.className='guide-actions';welcome.append(welcomeActions);button(welcomeActions,'guide-free','자유롭게 둘러보기',exit);button(welcomeActions,'guide-with-monk','스님에게 안내받기',open);
 document.body.append(welcome,choice,card,announcement);
 const menu=document.querySelector('#menu-panel');if(menu)button(menu as HTMLElement,'guide-open','스님 안내',open);
 function resultLabel(value:string){return t(value==='completed'?'완료':value==='skipped'?'건너뜀':'선택 전');}
 function practice(kind:PracticeKind,prayer=false){if(!session.course||!atGuideDestination(session.course,o.app.settings.visitor))return;stopOwnedPractice();pending=prayer?'prayer':kind;o.stopOtherAudio();if(prayer)void voice.speak('prayer-'+session.course);else voice.stop();o.app.startPractice(kind);render();}
 function render(speak=false){
  document.body.classList.toggle('guide-active',session.active);
  if(!session.course){card.hidden=true;return;}
  const focusInside=card.contains(document.activeElement),content=guideContent(session.stage,session.course,t),destination=guideDestination(session.course);
  document.body.dataset.guidePlace=destination.place;card.hidden=suspended;card.dataset.stage=session.stage;card.dataset.course=session.course;card.replaceChildren();
  const label=document.createElement('small');label.textContent=t('스님 안내')+' · '+t(guideCourse(session.course).label);const h=document.createElement('h2');h.textContent=t(content.title);const paragraph=document.createElement('p');paragraph.textContent=t(content.text);card.append(label,h,paragraph);
  if(session.stage==='travel'||session.stage==='prayer'||session.stage==='practice'){
   const target=document.createElement('p');target.textContent=t('목적지')+' · '+t(destination.name);card.append(target);
   const distance=document.createElement('small');distance.id='guide-distance';card.append(distance);updateDistance();
  }
  const actions=document.createElement('div');actions.className='guide-actions';card.append(actions);
  if(session.stage==='travel')button(actions,'guide-map','지도에서 목적지 보기',()=>o.map(destination.place));
  if(session.stage==='prayer'&&session.prayer==='pending')button(actions,'guide-pray','기도문과 함께 참배하기',()=>practice('bow',true),!arrived||!!pending);
  if(session.stage==='practice'&&session.practice==='pending'){
   button(actions,'guide-bow','짧게 절하기',()=>practice('bow'),!arrived||!!pending);
   button(actions,'guide-meditate','명상하기',()=>practice('meditation'),!arrived||!!pending);
   button(actions,'guide-108','108배 시작',()=>practice('108'),!arrived||!!pending);
  }
  if(pending){const status=document.createElement('p');status.id='guide-practice-status';status.textContent=t(pending==='108'?'108배를 마치거나 건너뛰기를 선택할 수 있어요.':pending==='meditation'?'천천히 숨을 고르세요. 10초 이상 머문 뒤 수행 마치기를 눌러 주세요.':'천천히 합장하고 절을 올려 보세요.');card.append(status);button(actions,'guide-stop-practice','수행 마치기',()=>{o.app.stopPractice();clearPending();render();});}
  if(session.stage==='offering'&&session.offering==='pending')button(actions,'guide-offering','연등 신청 알아보기',()=>{offeringPending=true;voice.stop();o.offering();});
  if(session.stage==='finish'){
   const summary=document.createElement('p');summary.id='guide-summary';summary.textContent=[t('참배')+' · '+resultLabel(session.prayer),t('수행')+' · '+resultLabel(session.practice),t('연등')+' · '+resultLabel(session.offering)].join(' / ');card.append(summary);button(actions,'guide-finish','자유롭게 머무르기',exit);
  }else{
   const disabled=session.stage==='travel'&&!arrived||session.stage==='prayer'&&session.prayer==='pending'||session.stage==='practice'&&session.practice==='pending'||session.stage==='offering'&&session.offering==='pending';
   button(actions,'guide-next','다음 안내',()=>{stopOwnedPractice();if(session.advance(arrived)){if(session.stage==='prayer'){o.app.camera.alpha=-Math.PI/2-destination.yaw;o.app.camera.beta=1.35;}render(true);if(session.stage==='travel')o.canvas.focus();}},disabled);
   if(['prayer','practice','offering'].includes(session.stage)&&session[session.stage as 'prayer'|'practice'|'offering']==='pending')button(actions,'guide-skip','이 단계 건너뛰기',()=>{stopOwnedPractice();session.skip();render(true);});
  }
  const tools=document.createElement('div');tools.className='guide-tools';card.append(tools);
  if(session.stage!=='prepare')button(tools,'guide-previous','이전 안내',()=>{stopOwnedPractice();session.previous();render(true);});
  if(locale==='ko')button(tools,'guide-repeat','다시 듣기',()=>{o.stopOtherAudio();void voice.speak(content.audio);});
  else{const note=document.createElement('small');note.textContent=t('현재 언어는 자막으로 안내합니다.');card.append(note);button(tools,'guide-repeat','안내 다시 보기',()=>{card.scrollTop=0;h.tabIndex=-1;h.focus({preventScroll:true});});}
  button(tools,'guide-change','다른 고민 선택',()=>{stopOwnedPractice();open();});button(tools,'guide-exit','안내 종료',exit);
  const showActor=session.stage==='prepare'||session.stage==='finish'||arrived&&session.stage!=='travel';
  bubbleActor.set(session.stage==='prepare'?null:session.course,showActor,t(content.title));
  if(lastAnnouncement!==content.title){lastAnnouncement=content.title;announcement.textContent=content.title;}
  if(focusInside&&!suspended){h.tabIndex=-1;h.focus({preventScroll:true});}
  if(speak&&!suspended){o.stopOtherAudio();void voice.speak(content.audio);}
 }
 function updateDistance(){if(!session.course)return;const el=card.querySelector('#guide-distance'),p=o.app.settings.visitor,d=guideDestination(session.course);if(el)el.textContent=arrived?t('수행 자리에 도착했어요.'):p?t('약 {distance}m 남았어요.').replace('{distance}',String(Math.round(Math.hypot(p[0]-d.x,p[2]-d.z)))):t('아바타로 걸어서 이동해 주세요.');}
 const progress=(event:Event)=>{
  const e=(event as CustomEvent<PracticeEvent>).detail;if(!session.course||!pending||!e)return;
  const expected=pending==='prayer'?'bow':pending;
  if(e.kind!==expected)return;
  if(e.status==='started'){if(atGuideDestination(session.course,o.app.settings.visitor))run=e.id;return;}
  if(!run||e.id!==run)return;
  const stage=pending==='prayer'?'prayer':'practice';clearPending();if(e.status==='completed'){session.result(stage,'completed');o.app.stopPractice();}render();
 };
 window.addEventListener('sasa:practice-event',progress);
 window.addEventListener('sasa:offering-installed',event=>{const d=(event as CustomEvent<{kind:string}>).detail;if(session.stage==='offering'&&offeringPending&&d?.kind==='lantern'){offeringPending=false;session.result('offering','completed');render();}});
 window.addEventListener('sasa:space',event=>{suspended=(event as CustomEvent).detail==='private';voice.stop();bubbleActor.pause(suspended);if(!suspended&&session.course)render();else card.hidden=true;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)voice.stop();});window.addEventListener('blur',()=>voice.stop());
 document.querySelector('#master-mute')?.addEventListener('change',()=>voice.level());document.querySelector('#audio-volume')?.addEventListener('input',()=>voice.level());
 window.addEventListener('sasa:lotus-entry',()=>{welcome.hidden=false;document.querySelector<HTMLElement>('#visit-guide')!.hidden=true;});
 o.app.scene.onBeforeRenderObservable.add(()=>{
  if(performance.now()-lastPoll<250)return;lastPoll=performance.now();
  if(!session.course||suspended)return;const next=atGuideDestination(session.course,o.app.settings.visitor);if(next!==arrived){arrived=next;if(!next&&run)stopOwnedPractice();render();}updateDistance();
 });
 return{session,open,exit};
}
