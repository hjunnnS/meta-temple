import {loginFeedback} from './login-feedback';
import {locale,t,translateMarkup} from './locales';
import {offerings,type Offering} from './reception';
export function setupAccount(showMenu=true){
 const button=document.createElement('button');button.textContent=t('계정');button.id='service-account';
 if(showMenu)document.querySelector('header')!.insertBefore(button,document.querySelector('#settings'));
 const dialog=document.createElement('dialog');
 dialog.setAttribute('aria-labelledby','account-title');
 dialog.innerHTML='<div class="panel-title"><h2 id="account-title">계정</h2><button aria-label="닫기" data-close>×</button></div><form><label>시험 이메일<input name="email" type="email" required placeholder="visitor@example.test"></label><button>로그인 링크 받기</button></form><button data-confirm hidden>로그인 완료</button><p data-status role="status"></p><ul></ul><button data-logout hidden>로그아웃</button>';
 translateMarkup(dialog);document.body.append(dialog);
 const form=dialog.querySelector('form')!,status=dialog.querySelector<HTMLElement>('[data-status]')!;
 const confirm=dialog.querySelector<HTMLButtonElement>('[data-confirm]')!,logout=dialog.querySelector<HTMLButtonElement>('[data-logout]')!;
 const list=dialog.querySelector('ul')!;
 const social=document.createElement('div');dialog.insertBefore(social,confirm);
 const mailLabel=form.querySelector('label')!.firstChild!;
 const trialLabel=mailLabel.textContent;
 let external=false;
 let firebase:ReturnType<typeof import("./firebase-login").firebaseLogin>|undefined;
 async function loginMethods(config:{external:boolean;methods:string[];client?:import("firebase/app").FirebaseOptions},n:number){
  if(config.client){firebase=(await import("./firebase-login")).firebaseLogin(config.client);if(n!==sequence)return;}
  external=config.external;form.hidden=external&&!config.methods.includes('email');
  mailLabel.textContent=external?t('이메일'):trialLabel;social.replaceChildren();
  form.querySelector('input')!.placeholder=external?'name@example.org':'visitor@example.test';
  for(const provider of config.methods.filter(p=>p==='google'||p==='apple')){
   const action=document.createElement('button');action.type='button';
   action.textContent=provider==='google'?'Google':'Apple';social.append(action);
   action.onclick=async()=>{
    action.disabled=true;
    try{
     await firebase!.social(provider);
     accountChanged();accountChanges?.postMessage('login');if(!finishLogin()&&dialog.open)await refresh();
    }catch(error){status.textContent=t(loginFeedback(error));}
    finally{action.disabled=false;}
   };
  }
 }
 const accountChanges=typeof BroadcastChannel==='function'?new BroadcastChannel('sasa-account-changes'):null;
 function accountChanged(){
  window.dispatchEvent(new Event('sasa:account'));window.dispatchEvent(new Event('sasa:installations'));
 }
 const returnHint=document.createElement('p');
 returnHint.setAttribute('role','status');returnHint.hidden=true;dialog.append(returnHint);
 let resumePractice=false,confirmedHere=false;
 let resumeReservation:(()=>void)|undefined;
 let onLogin:(()=>void)|undefined;
 function finishLogin(){
  if(onLogin&&dialog.open){const resume=onLogin;onLogin=undefined;dialog.close();resume();return 'return';}
  if(resumeReservation&&dialog.open){
   const reserve=resumeReservation;resumeReservation=undefined;dialog.close();reserve();return "reservation";
  }
  if(!resumePractice||!dialog.open)return false;
  resumePractice=false;dialog.close();window.dispatchEvent(new Event('sasa:resume-practice'));return 'practice';
 }
 accountChanges?.addEventListener('message',event=>{
  if(event.data==='practice-return'){
   if(confirmedHere&&dialog.open){
    returnHint.textContent=t('법당이 열린 탭으로 돌아가 절하기를 눌러 주세요.');returnHint.hidden=false;
   }
   return;
  }
  accountChanged();
  if(event.data==='login'){
   const resumed=finishLogin();
   if(resumed==='practice')accountChanges?.postMessage('practice-return');
   if(resumed)return;
  }
  if(dialog.open)void refresh();
 });
 let sequence=0,link=new URLSearchParams(location.hash.slice(1)).get('login');
 if(link)history.replaceState(null,'',location.pathname+location.search);
 function clear(){social.replaceChildren();window.dispatchEvent(new CustomEvent('sasa:select',{detail:null}));dialog.querySelector('[data-account-office]')?.remove();dialog.querySelector('[data-staff-link]')?.remove();list.replaceChildren();status.textContent='';form.hidden=true;logout.hidden=true;confirm.hidden=true;}
 async function api(path:string,body?:object){
  const response=await fetch('/api/service/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
  if(!response.ok)throw Error(String(response.status));return response.json();
 }
 async function refresh(){
  const n=++sequence;clear();
  if(link){confirm.hidden=false;status.textContent=t('이 브라우저에서 시험 계정에 로그인합니다.');return;}
  try{
   const [account,data,staff]=await Promise.all([api('me'),api('me/offerings'),api('staff/roles')]);
   if(n!==sequence)return;
   status.textContent=(account.email?account.email+' · ':'')+t('내 아이템')+' '+data.items.length+(locale==='ko'?'개':'');logout.hidden=false;
   if(staff.roles.length){const link=document.createElement('a');link.href='/staff.html';link.textContent=t('시험 운영 화면');link.dataset.staffLink='';list.before(link);}
   const erase=document.createElement('button');erase.textContent=t('시험 계정 삭제');list.append(erase);
   erase.onclick=async()=>{if(!window.confirm(t('진행 중인 거래가 끝나면 로그인 정보와 공개 문구를 지웁니다. 시험 거래 기록은 30일 뒤 삭제됩니다. 요청할까요?')))return;
    try{const result=await api('me/delete',{confirm:true});accountChanged();accountChanges?.postMessage('changed');await refresh();status.textContent=t(result.waiting?'진행 중인 거래를 마치면 계정을 삭제합니다.':'시험 계정을 삭제했습니다.');}catch{status.textContent=t('삭제 요청을 접수하지 못했습니다.');}
   };
   const states:Record<string,string>={cancelled:'결제 취소',pending:'결제 대기',paid:'결제 확인',installed:'설치됨',recovering:'설치 복구 중',refund_pending:'환불 중',refund_failed:'환불 확인 중',refunded:'환불 완료',expired:'기간 만료'};
   let selected:HTMLDetailsElement|null=null;
   type AccountItem={orderId:string;kind:string;slotId:string;status:string;amountKrw:number;startsAt:string;endsAt:string;inquired:boolean;shareable:boolean;installationId:string};
   function renderItem(item:AccountItem){
    const li=document.createElement('li'),details=document.createElement('details'),title=document.createElement('summary'),info=document.createElement('p');
    const product=offerings[(item.kind==='wish-plaque'?'plaque':item.kind) as Offering];
    title.textContent=[t(product.label),t(product.place),t(states[item.status]??item.status)].join(' · ');
    info.textContent=t('설치 자리')+' '+item.slotId.split(':').at(-1)+' · '+Number(item.amountKrw).toLocaleString(locale)+(locale==='ko'?'원':' KRW')+(item.endsAt?' · '+new Date(item.startsAt).toLocaleString(locale)+' ~ '+new Date(item.endsAt).toLocaleString(locale):'');
    details.ontoggle=()=>{
     if(!dialog.open||!details.isConnected)return;
     if(details.open){
      if(selected&&selected!==details)selected.open=false;
      selected=details;
     }else if(selected===details)selected=null;
     else return;
     window.dispatchEvent(new CustomEvent('sasa:select',{detail:selected&&item.status==='installed'?item.slotId:null}));
    };
    details.append(title,info);
    const reference=document.createElement('p');reference.textContent=t('주문 번호')+' · '+item.orderId;
    const inquire=document.createElement('button');inquire.textContent=t(item.inquired?'문의 접수됨':'종무소에 주문 문의');inquire.disabled=!!item.inquired;
    inquire.onclick=async()=>{
     inquire.disabled=true;
     try{await api('me/order-inquiry',{id:item.orderId});inquire.textContent=t('문의 접수됨');}
     catch{inquire.disabled=false;status.textContent=t('연결 상태를 확인해 주세요.');}
    };
    details.append(reference,inquire);
    if(item.shareable){
     const share=document.createElement('a');share.textContent=t('공개 링크 열기');share.href='/shared.html?id='+encodeURIComponent(item.installationId);share.target='_blank';share.rel='noopener';
     const hide=document.createElement('button');hide.textContent=t('공개 중단');hide.onclick=async()=>{try{await api('hide',{id:item.installationId});window.dispatchEvent(new Event('sasa:installations'));await refresh();}catch{status.textContent=t('공개 중단을 완료하지 못했습니다.');}};
     details.append(share,hide);
    }
    li.append(details);return li;
   }
   const rows=new Map<string,{element:HTMLLIElement;snapshot:string}>();
   function updateItems(items:AccountItem[]){
    const ids=new Set(items.map(item=>item.orderId));
    for(const [id,row] of rows)if(!ids.has(id)){row.element.remove();rows.delete(id);}
    for(const [index,item] of items.entries()){
     const previous=rows.get(item.orderId),snapshot=JSON.stringify(item);
     if(previous?.snapshot===snapshot)continue;
     const row=renderItem(item),details=row.querySelector('details')!;
     const wasOpen=previous?.element.querySelector('details')?.open;
     const focused=previous?[...previous.element.querySelectorAll('summary,button,a')].indexOf(document.activeElement as HTMLElement):-1;
     if(previous)previous.element.replaceWith(row);
     else list.insertBefore(row,list.querySelectorAll('li')[index]??null);
     if(wasOpen)details.open=true;
     if(focused>=0)row.querySelectorAll<HTMLElement>('summary,button,a')[focused]?.focus();
     rows.set(item.orderId,{element:row,snapshot});
    }
    status.textContent=(account.email?account.email+' · ':'')+t('내 아이템')+' '+items.length+(locale==='ko'?'개':'');
   }
   updateItems(data.items);
   async function poll(){
    if(n!==sequence||!dialog.open)return;
    if(!document.hidden){
     try{const next=await api('me/offerings');if(n===sequence&&dialog.open)updateItems(next.items);}
     catch(error){if(n!==sequence)return;if(String(error)==='Error: 401'){await refresh();return;}status.textContent=t('연결 상태를 확인해 주세요.');}
    }
    if(n===sequence&&dialog.open)window.setTimeout(poll,3000);
   }
   window.setTimeout(poll,3000);
   const office=document.createElement('button');office.textContent=t('종무소 접수 안내');office.onclick=()=>{dialog.close();document.querySelector<HTMLButtonElement>('[data-view="officeReception"]')?.click();};list.after(office);office.dataset.accountOffice='';
  }catch(error){
   if(n!==sequence)return;
   if(String(error)==='Error: 401'){
    try{const config=await api('auth/methods');if(n!==sequence)return;await loginMethods(config,n);if(n!==sequence)return;
     status.textContent=external?'':t('@example.test 시험 주소를 사용하세요.');}
    catch{if(n===sequence)status.textContent=t('연결 상태를 확인해 주세요.');}
   }
   else status.textContent=t('계정 정보를 불러오지 못했습니다.');
  }
 }
 button.onclick=()=>{dialog.showModal();void refresh();};
 dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>dialog.close();
 window.addEventListener('sasa:practice-login',()=>{resumePractice=true;button.click();});
 window.addEventListener('sasa:reservation-login',event=>{resumeReservation=(event as CustomEvent<()=>void>).detail;button.click();});
 dialog.onclose=()=>{onLogin=undefined;resumeReservation=undefined;resumePractice=false;confirmedHere=false;returnHint.hidden=true;sequence++;clear();form.reset();if(!document.activeElement||document.activeElement===document.body)button.focus();};
 form.onsubmit=async e=>{e.preventDefault();const n=sequence;
  try{const email=String(new FormData(form).get('email')).trim();if(external)await firebase!.send(email);else await api('login-link',{email});if(n===sequence)status.textContent=t(external?'이메일로 로그인 링크를 보냈습니다. 같은 브라우저에서 열어 주세요.':'이 Mac의 시험 우편함에 로그인 링크를 보냈습니다.');}
  catch(error){if(n===sequence)status.textContent=t(external?loginFeedback(error):'시험 이메일 주소와 연결 상태를 확인해 주세요.');}
 };
 confirm.onclick=async()=>{const raw=link;clear();
  try{await api('login',{token:raw});link=null;confirmedHere=true;accountChanged();accountChanges?.postMessage('login');if(!finishLogin())await refresh();}
  catch(error){const expired=String(error)==='Error: 401';if(expired)link=null;await refresh();status.textContent=t(expired?'링크가 만료되었거나 이미 사용됐습니다. 새 링크를 받아 주세요.':'연결 상태를 확인해 주세요.');}
 };
 logout.onclick=async()=>{clear();try{await api('logout',{});accountChanged();accountChanges?.postMessage('changed');await refresh();}catch{status.textContent=t('로그아웃을 완료하지 못했습니다.');logout.hidden=false;}};
 window.addEventListener('hashchange',()=>{
  const next=new URLSearchParams(location.hash.slice(1)).get('login');if(!next)return;
  link=next;history.replaceState(null,'',location.pathname+location.search);
  if(!dialog.open)dialog.showModal();void refresh();
 });
 if(link){dialog.showModal();void refresh();}
 return {
  login(resume:()=>void){onLogin=resume;button.click();},
  dismiss(){if(onLogin&&dialog.open){onLogin=undefined;dialog.close();}}
 };
}
