import {LANTERN_PALETTE,lanternColourIndex,type Vec3} from './contracts';
import {t} from './locales';
import './lantern-map.css';

interface MapSlot {slotId:string;position:Vec3;status:'free'|'reserved'|'occupied'}
const statusText={free:'빈자리',reserved:'예약 중',occupied:'설치됨'};
export function lanternMap(slots:MapSlot[],initial:string|undefined,select:(id:string)=>void){
 const root=document.createElement('section');root.className='lantern-map';
 const rows=new Map<number,MapSlot[]>();
 for(const slot of slots){
  const x=slot.position[0];
  if(!rows.has(x))rows.set(x,[]);
  rows.get(x)!.push(slot);
 }
 const columns=[...rows.entries()].sort(([a],[b])=>a-b);
 const zs=slots.map(s=>s.position[2]),north=Math.max(...zs),south=Math.min(...zs);
 function heading(text:string){const h=document.createElement('h3');h.textContent=text;root.append(h);}
 function label(text:string){const p=document.createElement('p');p.textContent=text;root.append(p);}
 function button(text:string,click:()=>void){
  const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=click;return b;
 }
 function overview(){
  root.replaceChildren();select('');heading(t('연등 배치도'));label(t('줄을 선택하세요'));
  label('▲ '+t('대웅전'));
  const plan=document.createElement('div');plan.className='lantern-plan';root.append(plan);
  columns.forEach(([,row],i)=>{
   const b=button('',()=>detail(i));b.title=t('줄')+' '+(i+1);b.setAttribute('aria-label',b.title);
   for(const s of row){
    const dot=document.createElement('i');dot.style.top=(3+94*(north-s.position[2])/(north-south))+'%';
    dot.style.background=LANTERN_PALETTE[lanternColourIndex(s.position)];b.append(dot);
   }
   plan.append(b);
  });
  label('▼ '+t('천왕문'));
 }
 function detail(index:number,selected=''){
  root.replaceChildren();select(selected);
  root.append(button('‹ '+t('연등 배치도'),overview));
  heading(t('줄')+' '+(index+1)+' · '+t('설치 자리'));
  label(t('대웅전')+' → '+t('천왕문'));
  const grid=document.createElement('div');grid.className='lantern-seats';root.append(grid);
  for(const slot of [...columns[index][1]].sort((a,b)=>b.position[2]-a.position[2])){
   const b=button('',()=>{
    grid.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed','false');
    b.setAttribute('aria-pressed','true');select(slot.slotId);
   });
   const id=document.createElement('strong');id.textContent=slot.slotId.slice(-4);
   const status=document.createElement('small');status.textContent=t(statusText[slot.status]);
   b.style.setProperty('--dye',LANTERN_PALETTE[lanternColourIndex(slot.position)]);
   b.disabled=slot.status!=='free';b.setAttribute('aria-pressed',String(slot.slotId===selected));
   b.append(id,status);grid.append(b);
  }
  if(!selected)grid.querySelector<HTMLButtonElement>('button:enabled')?.focus({preventScroll:true});
 }
 const index=columns.findIndex(([,row])=>row.some(s=>s.slotId===initial&&s.status==='free'));
 if(index>=0)detail(index,initial);else overview();
 return root;
}
