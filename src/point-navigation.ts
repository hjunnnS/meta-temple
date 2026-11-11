export type WalkPoint=readonly[number,number];
/** A route uses the same clearance and step-height rules as keyboard walking. */
export function walkingPath(start:WalkPoint,goal:WalkPoint,canStep:(from:WalkPoint,to:WalkPoint)=>boolean,step=.65,maxNodes=6000):WalkPoint[]{
 if(!goal.every(Number.isFinite)||Math.abs(goal[0])>80||Math.abs(goal[1])>80)return [];
 const line=(a:WalkPoint,b:WalkPoint)=>{const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.22));let previous=a;for(let i=1;i<=count;i++){const p:WalkPoint=[a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count];if(!canStep(previous,p))return false;previous=p;}return true;};
 if(line(start,goal))return [goal];
 interface Node{x:number;z:number;g:number;f:number;parent?:Node}
 const heap:Node[]=[],seen=new Map<string,number>();
 const distance=(p:WalkPoint)=>Math.hypot(p[0]-goal[0],p[1]-goal[1]);
 const point=(n:Node):WalkPoint=>[start[0]+n.x*step,start[1]+n.z*step];
 function push(n:Node){heap.push(n);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(heap[parent].f<=n.f)break;heap[i]=heap[parent];i=parent;}heap[i]=n;}
 function pop(){const first=heap[0],last=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(last.f<=heap[child].f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;}
 push({x:0,z:0,g:0,f:distance(start)});seen.set('0,0',0);
 for(let expanded=0;heap.length&&expanded<maxNodes;expanded++){
  const current=pop(),at=point(current);if(current.g>(seen.get(current.x+','+current.z)??Infinity))continue;
  if(distance(at)<step*1.5&&line(at,goal)){const reverse:WalkPoint[]=[goal];for(let n:Node|undefined=current;n?.parent;n=n.parent)reverse.push(point(n));return reverse.reverse();}
  for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=current.x+dx,z=current.z+dz,g=current.g+Math.hypot(dx,dz)*step,key=x+','+z;if(g>=(seen.get(key)??Infinity))continue;
   const next:WalkPoint=[start[0]+x*step,start[1]+z*step];if(next.some(v=>Math.abs(v)>80)||!line(at,next))continue;
   if(dx&&dz&&(!line(at,[next[0],at[1]])||!line(at,[at[0],next[1]])))continue;
   seen.set(key,g);push({x,z,g,f:g+distance(next),parent:current});
  }
 }
 return [];
}
