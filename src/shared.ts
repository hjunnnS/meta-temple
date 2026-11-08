import {preferredLocale,selectLocale,t,translateMarkup} from './locales';
await selectLocale(preferredLocale());translateMarkup(document.querySelector('main')!);document.title=t('공개 봉헌')+' · SASA';
import {watchPublic} from './public-refresh.ts';
const kinds:Record<string,string>={lantern:'연등','wish-plaque':'소원패',votive:'인등',memorial:'추모등',candle:'봉헌초'};
const id=new URLSearchParams(location.search).get('id')??'';
const status=document.querySelector('[role=status]')!,name=document.querySelector('#name')!,message=document.querySelector('#message')!;
const report=document.querySelector('form')!;
watchPublic(async signal=>{
 const response=await fetch('/api/service/shared/'+encodeURIComponent(id),{signal,cache:'no-store'});
 if(!response.ok)throw Error();
 return response.json();
},item=>{
 report.hidden=false;status.textContent=t(kinds[item.kind]??'공개 봉헌');name.textContent=item.name??'';message.textContent=item.text??'';
},()=>{report.hidden=true;status.textContent=t('현재 볼 수 없는 봉헌입니다.');name.textContent='';message.textContent='';});

report.onsubmit=async e=>{
 e.preventDefault();const result=document.querySelector('#report-status')!;
 try{
  const response=await fetch('/api/service/report',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,category:report.querySelector('select')!.value})});
  result.textContent=t(response.ok?'신고를 접수했습니다.':response.status===401?'계정 메뉴에서 먼저 로그인하세요.':'현재 볼 수 없는 봉헌입니다.');
 }catch{result.textContent=t('연결 상태를 확인해 주세요.');}
};
