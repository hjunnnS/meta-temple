import {mobileDevice} from './mobile-profile';
import {t} from './locales';
export function stickVector(x:number,y:number,radius=35){const length=Math.hypot(x,y);if(length<radius*.15)return {x:0,z:0};const scale=Math.min(1,length/radius)/length;return{x:x*scale,z:-y*scale};}
export function touchStick(canvas:HTMLCanvasElement,id:string){
 const touchEnabled=mobileDevice();const element=document.createElement('div');element.id=id;element.className='touch-stick';element.hidden=true;element.setAttribute('role','group');element.setAttribute('aria-label',t('걷기 조작'));element.innerHTML='<span></span>';document.body.append(element);
 let pointer=-1,vector={x:0,z:0};
 function reset(){pointer=-1;vector={x:0,z:0};element.firstElementChild!.removeAttribute('style');}
 element.onpointerdown=e=>{if(pointer!==-1)return;e.preventDefault();canvas.focus();pointer=e.pointerId;element.setPointerCapture(pointer);move(e);};
 function move(e:PointerEvent){if(e.pointerId!==pointer)return;const r=element.getBoundingClientRect();vector=stickVector(e.clientX-r.x-r.width/2,e.clientY-r.y-r.height/2);(element.firstElementChild as HTMLElement).style.transform=`translate(${vector.x*30}px,${-vector.z*30}px)`;}
 element.onpointermove=move;element.onpointerup=reset;element.onpointercancel=reset;element.onlostpointercapture=reset;
 window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
 return {get vector(){return vector;},reset,show(visible:boolean){element.hidden=!touchEnabled||!visible||!!document.querySelector('dialog[open]')||document.body.classList.contains('keyboard-open');if(element.hidden)reset();},dispose(){reset();element.remove();window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);}};
}
export function touchPinch(canvas:HTMLCanvasElement,zoom:(factor:number)=>void,enabled:()=>boolean=()=>true){
 const points=new Map<number,{x:number;y:number}>();let previous=0;
 const down=(e:PointerEvent)=>{if(e.pointerType==='touch')points.set(e.pointerId,{x:e.clientX,y:e.clientY});previous=0;canvas.dataset.touchPinch=String(points.size>1);};
 const move=(e:PointerEvent)=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size!==2||!enabled()||document.querySelector('dialog[open]'))return;const [a,b]=[...points.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(previous>0&&distance>5){e.preventDefault();zoom(Math.max(.8,Math.min(1.25,previous/distance)));}previous=distance;};
 const up=(e:PointerEvent)=>{points.delete(e.pointerId);previous=0;canvas.dataset.touchPinch=String(points.size>1);};const clear=()=>{points.clear();previous=0;canvas.dataset.touchPinch='false';};
 canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 return ()=>{clear();canvas.removeEventListener('pointerdown',down,true);canvas.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);};
}
export function mobileViewport(){
 const update=()=>{const v=window.visualViewport;document.documentElement.style.setProperty('--usable-height',`${v?.height??innerHeight}px`);document.documentElement.style.setProperty('--viewport-top',`${v?.offsetTop??0}px`);const input=document.activeElement?.matches('input:not([type=checkbox]):not([type=range]),textarea');document.body.classList.toggle('keyboard-open',!!input&&innerHeight-(v?.height??innerHeight)>120);};
 window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);window.addEventListener('resize',update);document.addEventListener('focusin',update);document.addEventListener('focusout',()=>requestAnimationFrame(update));update();
}
