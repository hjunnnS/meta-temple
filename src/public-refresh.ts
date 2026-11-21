// Both open details and the 3D scene must discard older permission snapshots.
export function watchPublic<T>(load:(signal:AbortSignal)=>Promise<T>,show:(data:T)=>void,clear:()=>void){
 let lastPassive=0;
 let pending:AbortController|undefined;
 function invalidate(){pending?.abort();pending=undefined;clear();}
 async function refresh(){
  if(document.hidden||!navigator.onLine){invalidate();return;}
  pending?.abort();
  const request=new AbortController();pending=request;
  const deadline=setTimeout(()=>{if(pending===request)invalidate();},1800);
  try{const data=await load(request.signal);if(pending===request)show(data);}
  catch{if(pending===request)invalidate();}
  finally{clearTimeout(deadline);}
 }
 window.addEventListener('offline',invalidate);
 window.addEventListener('pagehide',invalidate);
 for(const event of ['online','pageshow'])window.addEventListener(event,refresh);
 document.addEventListener('visibilitychange',refresh);
 window.addEventListener('sasa:space',event=>{if((event as CustomEvent).detail==='public')void refresh();});
 document.addEventListener('close',()=>{if(!document.hidden&&!document.body.classList.contains('in-private-room'))void refresh();},true);
 window.setInterval(()=>{if(document.hidden||document.body.classList.contains('in-private-room'))return;const passive=!!document.querySelector('#spaces-panel[open],#menu-panel[open],#settings-panel[open]');if(passive&&performance.now()-lastPassive<10000)return;lastPassive=performance.now();void refresh();},2000);
 void refresh();return refresh;
}
