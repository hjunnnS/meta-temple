import {flagUrl,languages,preferredLocale,selectLocale,t} from './locales';
import './language.css';
const root=document.getElementById('app')!;
root.innerHTML='<main class="language-entry"><div class="language-panel"><header class="language-brand"><span aria-hidden="true">山</span>사사 <small>SASA</small></header><h1>언어 선택</h1><p lang="en">Choose your language</p><div class="language-grid"></div></div></main>';
const grid=root.querySelector('.language-grid')!;
for(const [id,flag,name] of languages){
 const button=document.createElement('button');button.type='button';button.lang=id;button.dataset.locale=id;
 const icon=document.createElement('img');icon.className='language-flag';icon.alt='';icon.src=flagUrl(flag);icon.width=36;icon.height=27;
 button.append(icon,document.createTextNode(name));grid.append(button);
 if(id===preferredLocale())button.classList.add('preferred-language');
 button.onclick=async()=>{
  for(const option of grid.querySelectorAll('button'))option.disabled=true;
  root.setAttribute('aria-busy','true');
  try{await selectLocale(id);root.querySelector('h1')!.textContent=t('사찰을 준비하고 있어요…');root.querySelector('p')!.textContent='';await import('./main');}catch{if(root.contains(grid)){root.querySelector('h1')!.textContent=t('다시 불러오기');for(const option of grid.querySelectorAll('button')){option.disabled=false;option.onclick=()=>location.reload();}}}
  finally{root.removeAttribute('aria-busy');}
 };
}
