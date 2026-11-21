import{t}from'./locales';
/** Keep controls available without permanently covering the room or its practice feedback. */
export function privateRoomMenu(panel:HTMLElement,canvas:HTMLCanvasElement){
 const toggle=document.createElement('button');toggle.id='private-menu-open';toggle.textContent=t('공간 메뉴');toggle.setAttribute('aria-haspopup','dialog');
 const menu=document.createElement('dialog');menu.id='private-room-menu';menu.className='service-panel';menu.dataset.compactMenu='true';menu.setAttribute('aria-labelledby','private-room-menu-title');
 const title=document.createElement('div');title.className='panel-title';const heading=document.createElement('h2');heading.id='private-room-menu-title';heading.textContent=t('공간 메뉴');const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',t('닫기'));close.onclick=()=>menu.close();title.append(heading,close);menu.append(title);
 const actions=panel.querySelector<HTMLElement>('#private-room-actions')!,exit=panel.querySelector<HTMLButtonElement>('#private-room-exit')!,settings=panel.querySelector<HTMLButtonElement>('#private-room-settings')!;
 actions.prepend(settings);menu.append(actions,exit);panel.append(toggle,menu);
 toggle.onclick=()=>menu.showModal();menu.addEventListener('close',()=>{if(!panel.hidden&&document.activeElement!==canvas&&!document.querySelector('dialog[open]'))toggle.focus();});
 menu.addEventListener('click',event=>{const button=(event.target as Element).closest('button');if(button&&button!==close&&!button.disabled)menu.close();},{capture:true});
 menu.addEventListener('click',event=>{const r=menu.getBoundingClientRect();if(event.target===menu&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))menu.close();});
 return{prepare(){if(menu.open)menu.close();},hide(){if(menu.open)menu.close();canvas.focus();}};
}
