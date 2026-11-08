export function setupAccount(){
 const button=document.createElement('button');button.textContent='계정';button.id='service-account';
 document.querySelector('header')!.insertBefore(button,document.querySelector('#settings'));
 const dialog=document.createElement('dialog');
 dialog.setAttribute('aria-label','시험 계정');
 dialog.innerHTML='<div class="panel-title"><h2>계정</h2><button aria-label="닫기" data-close>×</button></div><form><label>시험 이메일<input name="email" type="email" required placeholder="visitor@example.test"></label><button>로그인 링크 받기</button></form><button data-confirm hidden>로그인 완료</button><p data-status role="status"></p><ul></ul><button data-logout hidden>로그아웃</button>';
 document.body.append(dialog);
 const form=dialog.querySelector('form')!,status=dialog.querySelector<HTMLElement>('[data-status]')!;
 const confirm=dialog.querySelector<HTMLButtonElement>('[data-confirm]')!,logout=dialog.querySelector<HTMLButtonElement>('[data-logout]')!;
 const list=dialog.querySelector('ul')!;
 let sequence=0,link=new URLSearchParams(location.hash.slice(1)).get('login');
 if(link)history.replaceState(null,'',location.pathname+location.search);
 function clear(){window.dispatchEvent(new CustomEvent('sasa:select',{detail:null}));dialog.querySelector('[data-account-office]')?.remove();list.replaceChildren();status.textContent='';form.hidden=true;logout.hidden=true;confirm.hidden=true;}
 async function api(path:string,body?:object){
  const response=await fetch('/api/service/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
  if(!response.ok)throw Error(String(response.status));return response.json();
 }
 async function refresh(){
  const n=++sequence;clear();
  if(link){confirm.hidden=false;status.textContent='이 브라우저에서 시험 계정에 로그인합니다.';return;}
  try{
   const account=await api('me'),data=await api('me/offerings');
   if(n!==sequence)return;
   status.textContent=account.email+' · 내 아이템 '+data.items.length+'개';logout.hidden=false;
   const states:Record<string,string>={pending:'결제 대기',paid:'결제 확인',installed:'설치됨',recovering:'설치 복구 중',refund_pending:'환불 중',refund_failed:'환불 확인 중',refunded:'환불 완료',expired:'기간 만료'};
   for(const item of data.items){
    const li=document.createElement('li'),details=document.createElement('details'),title=document.createElement('summary'),info=document.createElement('p');
    title.textContent=item.slotId+' · '+(states[item.status]??item.status);
    info.textContent=item.zoneId+' · '+Number(item.amountKrw).toLocaleString('ko-KR')+'원'+(item.endsAt?' · '+new Date(item.startsAt).toLocaleString('ko-KR')+' ~ '+new Date(item.endsAt).toLocaleString('ko-KR'):'');
    details.ontoggle=()=>{if(details.open)window.dispatchEvent(new CustomEvent('sasa:select',{detail:item.slotId}));};details.append(title,info);if(item.shareable){
     const share=document.createElement('a');share.textContent='공개 링크 열기';share.href='/shared.html?id='+encodeURIComponent(item.installationId);share.target='_blank';share.rel='noopener';
     const hide=document.createElement('button');hide.textContent='공개 중단';hide.onclick=async()=>{try{await api('hide',{id:item.installationId});window.dispatchEvent(new Event('sasa:installations'));await refresh();}catch{status.textContent='공개 중단을 완료하지 못했습니다.';}};
     details.append(share,hide);
    }
    li.append(details);list.append(li);
   }
   const office=document.createElement('button');office.textContent='종무소 접수 안내';office.onclick=()=>{dialog.close();document.querySelector<HTMLButtonElement>('[data-view="officeReception"]')?.click();};list.after(office);office.dataset.accountOffice='';
  }catch(error){
   if(n!==sequence)return;
   if(String(error)==='Error: 401'){form.hidden=false;status.textContent='@example.test 시험 주소를 사용하세요.';}
   else status.textContent='계정 정보를 불러오지 못했습니다.';
  }
 }
 button.onclick=()=>{dialog.showModal();void refresh();};
 dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>dialog.close();
 dialog.onclose=()=>{sequence++;clear();form.reset();button.focus();};
 form.onsubmit=async e=>{e.preventDefault();const n=sequence;
  try{await api('login-link',{email:new FormData(form).get('email')});if(n===sequence)status.textContent='이 Mac의 시험 우편함에 로그인 링크를 보냈습니다.';}
  catch{if(n===sequence)status.textContent='시험 이메일 주소와 연결 상태를 확인해 주세요.';}
 };
 confirm.onclick=async()=>{const raw=link;link=null;clear();
  try{await api('login',{token:raw});window.dispatchEvent(new Event('sasa:account'));window.dispatchEvent(new Event('sasa:installations'));await refresh();}
  catch{await refresh();status.textContent='링크가 만료되었거나 이미 사용됐습니다. 새 링크를 받아 주세요.';}
 };
 logout.onclick=async()=>{clear();try{await api('logout',{});window.dispatchEvent(new Event('sasa:account'));window.dispatchEvent(new Event('sasa:installations'));await refresh();}catch{status.textContent='로그아웃을 완료하지 못했습니다.';logout.hidden=false;}};
 window.addEventListener('hashchange',()=>{
  const next=new URLSearchParams(location.hash.slice(1)).get('login');if(!next)return;
  link=next;history.replaceState(null,'',location.pathname+location.search);
  if(!dialog.open)dialog.showModal();void refresh();
 });
 if(link){dialog.showModal();void refresh();}
}
