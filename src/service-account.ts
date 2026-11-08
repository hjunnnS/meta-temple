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
 function clear(){list.replaceChildren();status.textContent='';form.hidden=true;logout.hidden=true;confirm.hidden=true;}
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
   for(const item of data.items){const li=document.createElement('li');li.textContent=item.slotId;list.append(li);}
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
  try{await api('login',{token:raw});await refresh();}
  catch{await refresh();status.textContent='링크가 만료되었거나 이미 사용됐습니다. 새 링크를 받아 주세요.';}
 };
 logout.onclick=async()=>{clear();try{await api('logout',{});await refresh();}catch{status.textContent='로그아웃을 완료하지 못했습니다.';logout.hidden=false;}};
 window.addEventListener('hashchange',()=>{
  const next=new URLSearchParams(location.hash.slice(1)).get('login');if(!next)return;
  link=next;history.replaceState(null,'',location.pathname+location.search);
  if(!dialog.open)dialog.showModal();void refresh();
 });
 if(link){dialog.showModal();void refresh();}
}
