import {LANTERN_PALETTE,lanternColourIndex,type Vec3} from './contracts';
import {t} from './locales';
import './lantern-map.css';

export interface MapSlot {slotId:string;position:Vec3;status:'free'|'reserved'|'occupied'}
const statusText={free:'빈자리',reserved:'예약 중',occupied:'설치됨'};
export function lanternMap(slots:MapSlot[],initial:string|undefined,select:(id:string)=>void){
 const root=document.createElement('section');root.className='lantern-map';
 const rows=new Map<number,MapSlot[]>();
 for(const slot of slots){
  const x=slot.position[0];
  if(!rows.has(x))rows.set(x,[]);
  rows.get(x)!.push(slot);
 }
 const byId=new Map(slots.map(slot=>[slot.slotId,slot]));
 const columns=[...rows.entries()].sort(([a],[b])=>a-b);
 const zs=slots.map(s=>s.position[2]),north=Math.max(...zs),south=Math.min(...zs);
 function heading(text:string){const h=document.createElement('h3');h.textContent=text;root.append(h);}
 function label(text:string){const p=document.createElement('p');p.textContent=text;root.append(p);}
 function button(text:string,click:()=>void){
  const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=click;return b;
 }
 function overview(returnTo?:number){
  root.replaceChildren();select('');heading(t('연등 배치도'));label(t('줄을 선택하세요'));
  label('▲ '+t('대웅전'));
  const plan=document.createElement('div');plan.className='lantern-plan';root.append(plan);
  columns.forEach(([,row],i)=>{
   const free=row.filter(slot=>slot.status==='free').length;
   const b=button('',()=>detail(i));
   const number=document.createElement('strong'),availability=document.createElement('small'),strip=document.createElement('span');
   number.textContent=t('줄')+' '+(i+1);
   availability.textContent=free?t('빈자리')+' '+free:t('만석');
   b.dataset.row=String(i);b.disabled=free===0;strip.className='row-strip';strip.setAttribute('aria-hidden','true');
   b.append(strip,number,availability);
   for(const s of row){
    const dot=document.createElement('i');dot.style.top=(3+94*(north-s.position[2])/Math.max(1,north-south))+'%';
    dot.style.background=LANTERN_PALETTE[lanternColourIndex(s.position)];strip.append(dot);
   }
   plan.append(b);if(i===returnTo)b.focus();
  });
  label('▼ '+t('천왕문'));
 }
 function detail(index:number,selected=''){
  root.replaceChildren();select(selected);
  root.append(button('‹ '+t('연등 배치도'),()=>overview(index)));
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
   b.dataset.slot=slot.slotId;b.disabled=slot.status!=='free';b.setAttribute('aria-pressed',String(slot.slotId===selected));
   b.append(id,status);grid.append(b);
  }
  if(!selected)grid.querySelector<HTMLButtonElement>('button:enabled')?.focus();
 }
 function update(statuses:Map<string,MapSlot['status']>){
  for(const [id,status] of statuses){const slot=byId.get(id);if(slot)slot.status=status;}
  for(const row of root.querySelectorAll<HTMLButtonElement>('[data-row]')){
   const free=columns[Number(row.dataset.row)][1].filter(slot=>slot.status==='free').length;
   row.disabled=!free;row.querySelector('small')!.textContent=free?t('빈자리')+' '+free:t('만석');
  }
  for(const seat of root.querySelectorAll<HTMLButtonElement>('[data-slot]')){
   const status=byId.get(seat.dataset.slot!)!.status;
   seat.disabled=status!=='free';seat.querySelector('small')!.textContent=t(statusText[status]);
   if(seat.disabled&&seat.getAttribute('aria-pressed')==='true'){seat.setAttribute('aria-pressed','false');select('');}
  }
 }
 const index=columns.findIndex(([,row])=>row.some(s=>s.slotId===initial));
 if(index>=0)detail(index,columns[index][1].some(s=>s.slotId===initial&&s.status==='free')?initial:undefined);else overview();
 return {root,update};
}
