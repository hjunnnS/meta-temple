import type{Scene}from'@babylonjs/core/scene';
import type{TransformNode}from'@babylonjs/core/Meshes/transformNode';
import{Vector3,Matrix}from'@babylonjs/core/Maths/math.vector';
import{PointerEventTypes}from'@babylonjs/core/Events/pointerEvents';
import{worldTapAllowed}from'./tap-guard';
import{t,locale}from'./locales';
/** Short optional conversations; guide, sweeping and daily monks retain their own actions. */
export function monkConversations(scene:Scene,canvas:HTMLCanvasElement,visitor:()=>readonly number[]|null){
 const descriptions:[string,string,string,string][]=[
 ['대웅전 스님','대웅전 스님','잠시 마음을 모으고 편안히 머물러 보세요.','불단을 향해 합장하거나 방석에서 절과 명상을 할 수 있어요.'],
 ['tea-monk','쉼터 스님','차 한 잔과 함께 잠시 쉬어 가세요.','서두르지 말고 차의 온기와 지금의 호흡을 느껴 보세요.'],
 ['walking-monk','산책 스님','천천히 걸으며 주변을 둘러보세요.','산책길을 따라 걸으며 발걸음과 호흡에 마음을 두어 보세요.'],
 ['cafe-attendant','쉼터 직원','어서 오세요. 차나 커피를 골라 편히 쉬어 가세요.','음료와 좌석을 고른 뒤 앉아서 마실 수 있어요.'],
 ];
 const actors=descriptions.map(([id,title,greeting,detail])=>({root:scene.getTransformNodeByName(id),id,title,greeting,detail})).filter(a=>a.root)as{root:TransformNode;id:string;title:string;greeting:string;detail:string}[];
 for(const a of actors)for(const m of a.root.getChildMeshes()){m.isPickable=true;m.metadata={...m.metadata,conversationNpc:a.id,blocksOfferingPick:true};}
 const bubble=document.createElement('button');bubble.id='npc-conversation-bubble';bubble.hidden=true;bubble.type='button';bubble.style.cssText='position:fixed;z-index:19;max-width:240px;min-height:44px;padding:10px 14px;border:1px solid #bcb392;border-radius:14px;background:#faf6eaf2;color:#294737;transform:translate(-50%,-100%);font:14px/1.6 system-ui;cursor:pointer';document.body.append(bubble);
 const dialog=document.createElement('dialog');dialog.id='npc-conversation';dialog.className='service-panel';const title=document.createElement('h2'),message=document.createElement('p'),more=document.createElement('button'),close=document.createElement('button');more.className='service-primary';close.textContent=t('닫기');close.style.cssText='display:block;margin:12px auto 0;padding:10px 20px';close.onclick=()=>dialog.close();dialog.append(title,message,more,close);document.body.append(dialog);
 const localizeClose=()=>{close.textContent=t('닫기');};window.addEventListener('sasa:locale-ready',localizeClose);
 let active:typeof actors[number]|undefined,until=0,nextAuto=12,clock=0,privateSpace=false;
 const nearby=(a:typeof actors[number],range=6.5)=>{const p=visitor()??scene.activeCamera?.globalPosition.asArray();return p&&a.root.isEnabled()&&Math.hypot(p[0]-a.root.position.x,p[1]-a.root.position.y,p[2]-a.root.position.z)<range;};
 function speak(text:string){if(!('speechSynthesis'in window)||document.querySelector<HTMLInputElement>('#master-mute')?.checked)return;const u=new SpeechSynthesisUtterance(text);u.lang=locale==='ko'?'ko-KR':document.documentElement.lang;u.rate=.85;u.pitch=.8;u.volume=Number(document.querySelector<HTMLInputElement>('#audio-volume')?.value??35)/100;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}
 function open(a:typeof actors[number]){if(privateSpace||document.body.classList.contains('guide-active')||!nearby(a)||document.querySelector('dialog[open]'))return;active=a;until=0;bubble.hidden=true;title.textContent=t(a.title);message.textContent=t(a.greeting);more.textContent=t(a.id==='cafe-attendant'?'차·커피 고르기':'여기서는 무엇을 하나요?');more.onclick=()=>{message.textContent=t(a.detail);if(a.id==='cafe-attendant'){dialog.close();document.querySelector<HTMLSelectElement>('#tea-beverage')?.focus();}else speak(t(a.detail));};dialog.showModal();speak(t(a.greeting));}
 bubble.onclick=()=>{if(active)open(active);};
 const pointer=scene.onPointerObservable.add(e=>{if(e.type!==PointerEventTypes.POINTERTAP||!worldTapAllowed(canvas,e.event as PointerEvent))return;const id=e.pickInfo?.pickedMesh?.metadata?.conversationNpc,a=actors.find(a=>a.id===id);if(a)open(a);});
 const space=(e:Event)=>{privateSpace=(e as CustomEvent).detail==='private';if(privateSpace){dialog.close();bubble.hidden=true;window.speechSynthesis?.cancel();}};window.addEventListener('sasa:space',space);
 const cancel=()=>{dialog.close();bubble.hidden=true;until=0;window.speechSynthesis?.cancel();};window.addEventListener('blur',cancel);
 dialog.addEventListener('close',()=>{window.speechSynthesis?.cancel();canvas.focus();nextAuto=Math.max(nextAuto,clock+30);});
 const obs=scene.onBeforeRenderObservable.add(()=>{if(privateSpace||document.hidden)return;clock+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);const busy=!!document.querySelector('dialog[open]')||document.body.classList.contains('guide-active')||document.querySelector('#walk-pad')?.getAttribute('data-practice')!=='idle';
  if(clock>=nextAuto&&!busy){active=actors.find(a=>nearby(a,4.5));if(active){until=clock+4.5;nextAuto=clock+90;}else nextAuto=clock+3;}
  if(!active||clock>until||busy||!nearby(active)){bubble.hidden=true;return;}const c=scene.activeCamera;if(!c)return;const q=Vector3.Project(active.root.position.add(new Vector3(0,2.05,0)),Matrix.Identity(),scene.getTransformMatrix(),c.viewport.toGlobal(scene.getEngine().getRenderWidth(),scene.getEngine().getRenderHeight())),r=canvas.getBoundingClientRect();bubble.hidden=q.z<=0||q.z>=1;if(!bubble.hidden){bubble.textContent=t(active.greeting);bubble.style.left=Math.max(125,Math.min(innerWidth-125,r.x+q.x*r.width/scene.getEngine().getRenderWidth()))+'px';bubble.style.top=Math.max(100,r.y+q.y*r.height/scene.getEngine().getRenderHeight())+'px';}
 });
 scene.onDisposeObservable.addOnce(()=>{cancel();scene.onBeforeRenderObservable.remove(obs);scene.onPointerObservable.remove(pointer);window.removeEventListener('sasa:space',space);window.removeEventListener('blur',cancel);window.removeEventListener('sasa:locale-ready',localizeClose);bubble.remove();dialog.remove();});return actors;
}
