import {preferredLocale,selectLocale,t,translateMarkup} from './locales';
import {firebaseLogin} from './firebase-login';

const link=location.href;
history.replaceState(null,'',location.pathname);
await selectLocale(preferredLocale());
translateMarkup(document.querySelector('main')!);
const confirm=document.querySelector('button')!,status=document.querySelector('p')!;
const email=document.querySelector('input')!;
const expired=t('링크가 만료되었거나 이미 사용됐습니다. 새 링크를 받아 주세요.');
status.textContent=expired;
try{
 const response=await fetch('/api/service/auth/methods',{cache:'no-store'});
 const config=await response.json();
 if(config.client&&config.methods.includes('email')){
  const login=firebaseLogin(config.client);
  if(login.isLink(link)){
   email.value=login.savedEmail();email.hidden=false;confirm.hidden=false;
   status.textContent='Email';
   confirm.onclick=async()=>{
    if(!email.reportValidity())return;
    confirm.disabled=true;
    try{
     await login.complete(email.value.trim(),link);
     email.hidden=true;confirm.hidden=true;status.textContent=t('로그인했습니다. 원래 사찰 탭으로 돌아가세요.');
     if(typeof BroadcastChannel==='function'){
      const channel=new BroadcastChannel('sasa-account-changes');channel.postMessage('login');channel.close();
     }
    }catch{status.textContent=expired;confirm.disabled=false;}
   };
  }
 }
}catch{status.textContent=t('연결 상태를 확인해 주세요.');}
