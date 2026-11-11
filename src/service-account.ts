import {t,translateMarkup} from './locales';
import {offerings,type Offering} from './reception';
export function setupAccount(showMenu=true){
 const button=document.createElement('button');button.id='service-account';button.textContent=t('계정');if(showMenu)document.querySelector('header')!.insertBefore(button,document.querySelector('#settings'));
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-labelledby','account-title');dialog.innerHTML='<div class="panel-title"><h2 id="account-title">나의 체험</h2><button data-close aria-label="닫기">×</button></div><p>이메일·비밀번호 입력 없이 이 브라우저에서만 체험합니다. 실제 로그인이나 구매가 아닙니다.</p><p>체험을 시작하면 다섯 아이템의 샘플과 개인 공간을 이용할 수 있습니다.</p><button id="trial-start">체험 시작</button><p data-status role="status"></p><ul></ul><button id="trial-logout" hidden>체험 잠시 나가기</button><button id="trial-reset" hidden>이 브라우저의 체험 기록 초기화</button>';
 translateMarkup(dialog);document.body.append(dialog);
 const start=dialog.querySelector<HTMLButtonElement>('#trial-start')!,logout=dialog.querySelector<HTMLButtonElement>('#trial-logout')!,reset=dialog.querySelector<HTMLButtonElement>('#trial-reset')!,status=dialog.querySelector<HTMLElement>('[data-status]')!,list=dialog.querySelector('ul')!;
 let resume:(()=>void)|undefined;
 async function api(path:string,body?:object){const r=await fetch('/api/service/'+path,body?{method:'POST',body:JSON.stringify(body)}:{});if(!r.ok)throw Error();return r.json();}
 const changed=(reason='login')=>{window.dispatchEvent(new CustomEvent('sasa:account',{detail:reason}));window.dispatchEvent(new Event('sasa:installations'));};
 async function refresh(){list.replaceChildren();try{const result=await api('me/offerings');start.hidden=true;logout.hidden=reset.hidden=false;status.textContent='내 체험 아이템 '+result.items.length+'개';for(const item of result.items){const kind=(item.kind==='wish-plaque'?'plaque':item.kind) as Offering;const li=document.createElement('li');li.textContent=t(offerings[kind].label)+' · '+t(item.status==='installed'?'설치됨':'기간 만료');list.append(li);}}catch{start.hidden=false;logout.hidden=reset.hidden=true;status.textContent='개인정보 없이 체험을 시작하세요.';}}
 function open(next?:()=>void){resume=next;dialog.showModal();void refresh();}
 button.onclick=()=>open();
 start.onclick=async()=>{start.disabled=true;try{await api('auth/local-preview',{});changed();const next=resume;dialog.close();if(next)next();else{dialog.showModal();await refresh();}}catch{status.textContent='체험 기록을 저장하지 못했습니다. 브라우저 설정을 확인해 주세요.';}finally{start.disabled=false;}};
 logout.onclick=async()=>{await api('logout',{});changed('changed');await refresh();};
 reset.onclick=async()=>{if(!confirm('이 브라우저의 체험 신청과 개인 공간 배치를 초기화할까요?'))return;await api('me/delete',{});changed('changed');await refresh();};
 dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{resume=undefined;button.focus();});
 window.addEventListener('sasa:reservation-login',e=>open((e as CustomEvent<()=>void>).detail));window.addEventListener('sasa:practice-login',()=>open(()=>window.dispatchEvent(new Event('sasa:resume-practice'))));
 return{login(next:()=>void){open(next);},dismiss(){resume=undefined;if(dialog.open)dialog.close();}};
}
