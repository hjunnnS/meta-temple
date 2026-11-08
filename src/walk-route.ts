type Point={x:number;z:number};
interface Terrain {floor(x:number,z:number):number;blocked(x:number,y:number,z:number):boolean}

export function safeStep(world:Terrain,from:Point,to:Point){
 let y=world.floor(from.x,from.z);
 const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.18));
 for(let i=1;i<=n;i++){
  const x=from.x+(to.x-from.x)*i/n,z=from.z+(to.z-from.z)*i/n,h=world.floor(x,z);
  if(Math.abs(h-y)>.5||world.blocked(x,h,z))return false;
  y=h;
 }
 return true;
}

// Search a grid relative to the visitor, including the exact starting position.
export function walkRoute(world:Terrain,start:Point,end:Point):Point[]{
 const spacing=.75;
 type Node=Point&{i:number;j:number;cost:number;score:number;parent?:Node};
 const first:Node={...start,i:0,j:0,cost:0,score:0};
 const open=[first],best=new Map<string,number>([['0,0',0]]);
 while(open.length){
  let k=0;for(let n=1;n<open.length;n++)if(open[n].score<open[k].score)k=n;
  const node=open[k];open[k]=open[open.length-1];open.pop();
  if(node.cost!==best.get(node.i+','+node.j))continue;
  if(Math.hypot(node.x-end.x,node.z-end.z)<1.1&&safeStep(world,node,end)){
   const path=[end];for(let p:Node|undefined=node;p?.parent;p=p.parent)path.push({x:p.x,z:p.z});
   return path.reverse();
  }
  for(const di of [-1,0,1])for(const dj of [-1,0,1]){
   if(!di&&!dj)continue;
   const i=node.i+di,j=node.j+dj,key=i+','+j,cost=node.cost+Math.hypot(di,dj)*spacing;
   const x=start.x+i*spacing,z=start.z+j*spacing;
   if(Math.abs(x)>80||Math.abs(z)>80||cost>=(best.get(key)??Infinity))continue;
   if(!safeStep(world,node,{x,z}))continue;
   best.set(key,cost);open.push({x,z,i,j,cost,score:cost+Math.hypot(end.x-x,end.z-z),parent:node});
  }
 }
 return [];
}
