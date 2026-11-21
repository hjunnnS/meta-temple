interface MapLabel{
 x:number;y:number;text:SVGTextElement;box:SVGRectElement;leader:SVGLineElement;anchor:SVGCircleElement;
}
/** Keep text in screen pixels and place nearby labels without covering one another. */
export function readableMapLabels(image:SVGSVGElement,labels:MapLabel[]){
 let lastKey='',pending=0,disposed=false;
 const pen=document.createElement('canvas').getContext('2d');
 function layout(){
  pending=0;if(disposed)return;
  if(!image.isConnected)return;
  const matrix=image.getScreenCTM(),scale=matrix?Math.hypot(matrix.a,matrix.b):0;
  if(!scale||!image.getBoundingClientRect().height)return;
  const pixels=Math.max(14,parseFloat(getComputedStyle(document.documentElement).fontSize)*.875);
  const key=[scale,pixels,image.viewBox.baseVal.width,image.viewBox.baseVal.height].join(':');if(key===lastKey)return;lastKey=key;
  const font=getComputedStyle(image).fontFamily;if(pen)pen.font=pixels+'px '+font;
  const view=image.viewBox.baseVal,pad=2/scale,placed:{x:number;y:number;width:number;height:number}[]=[];
  for(const item of labels){
   item.text.setAttribute('font-size',String(pixels/scale));
   const width=Math.max(28/scale,((pen?.measureText(item.text.textContent??'').width??pixels*2)+10)/scale),height=(pixels+10)/scale;
   const clamp=(x:number,y:number)=>({x:Math.max(view.x+pad,Math.min(view.x+view.width-width-pad,x-width/2)),y:Math.max(view.y+pad,Math.min(view.y+view.height-height-pad,y-height/2)),width,height});
   let box=clamp(item.x,item.y),best=Infinity;
   const step=(pixels+14)/scale;
   for(let ring=0;ring<=8;ring++){
    const offsets=ring===0?[[0,0]]:[[-ring,0],[ring,0],[0,-ring],[0,ring],[-ring,-ring],[ring,-ring],[-ring,ring],[ring,ring]];
    for(const [dx,dy] of offsets){
     const next=clamp(item.x+dx*step,item.y+dy*step);
     const overlap=placed.reduce((sum,p)=>sum+Math.max(0,Math.min(next.x+width+pad,p.x+p.width)-Math.max(next.x-pad,p.x))*Math.max(0,Math.min(next.y+height+pad,p.y+p.height)-Math.max(next.y-pad,p.y)),0);
     const score=overlap*100000+Math.hypot(next.x+width/2-item.x,next.y+height/2-item.y);
     if(score<best){best=score;box=next;}
    }
    if(best<100000*pad*pad)break;
   }
   placed.push(box);const cx=box.x+width/2,cy=box.y+height/2;
   for(const [key,value]of Object.entries(box))item.box.setAttribute(key,String(value));
   item.box.setAttribute('rx',String(4/scale));
   item.text.setAttribute('x',String(cx));item.text.setAttribute('y',String(cy+pixels*.35/scale));
   item.leader.setAttribute('x1',String(item.x));item.leader.setAttribute('y1',String(item.y));item.leader.setAttribute('x2',String(cx));item.leader.setAttribute('y2',String(cy));
   const displaced=Math.hypot(cx-item.x,cy-item.y)*scale>3;item.leader.style.display=displaced?'':'none';item.anchor.style.display=displaced?'':'none';
  }
 }
 const observer=new ResizeObserver(()=>{if(!pending)pending=requestAnimationFrame(layout);});observer.observe(image);
 return ()=>{disposed=true;observer.disconnect();cancelAnimationFrame(pending);};
}
