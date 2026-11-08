import {watchPublic} from './public-refresh.ts';
const kinds:Record<string,string>={lantern:'연등','wish-plaque':'소원패',votive:'인등',memorial:'추모등',candle:'봉헌초'};
const id=new URLSearchParams(location.search).get('id')??'';
const status=document.querySelector('[role=status]')!,name=document.querySelector('#name')!,message=document.querySelector('#message')!;
watchPublic(async signal=>{
 const response=await fetch('/api/service/shared/'+encodeURIComponent(id),{signal,cache:'no-store'});
 if(!response.ok)throw Error();
 return response.json();
},item=>{
 status.textContent=kinds[item.kind]??'봉헌';name.textContent=item.name??'';message.textContent=item.text??'';
},()=>{status.textContent='현재 볼 수 없는 봉헌입니다.';name.textContent='';message.textContent='';});
