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
 report.hidden=false;status.textContent=kinds[item.kind]??'봉헌';name.textContent=item.name??'';message.textContent=item.text??'';
},()=>{report.hidden=true;status.textContent='현재 볼 수 없는 봉헌입니다.';name.textContent='';message.textContent='';});

report.onsubmit=async e=>{
 e.preventDefault();const result=document.querySelector('#report-status')!;
 try{
  const response=await fetch('/api/service/report',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,category:report.querySelector('select')!.value})});
  result.textContent=response.ok?'신고를 접수했습니다.':response.status===401?'시험 계정으로 로그인한 뒤 신고해 주세요.':'공개 상태를 다시 확인하세요.';
 }catch{result.textContent='연결 상태를 확인해 주세요.';}
};
