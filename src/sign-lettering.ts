import type {Mesh} from '@babylonjs/core/Meshes/mesh';
/** A box's +Z face has a different vertex order from its courtyard-facing -Z face. */
export function uprightBoxLettering(sign:Mesh,faces:'both'|'front'|'back'='both'){
 const uv=sign.getVerticesData('uv')!,normal=sign.getVerticesData('normal')!;
 for(let i=0;i<normal.length/3;i++){
  if(normal[i*3+2]>.9){uv[i*2]=1-uv[i*2];uv[i*2+1]=1-uv[i*2+1];}
  if(Math.abs(normal[i*3+2])<.9||(faces==='front'&&normal[i*3+2]>.9)||(faces==='back'&&normal[i*3+2]<-.9)){uv[i*2]=0;uv[i*2+1]=0;}
 }
 sign.setVerticesData('uv',uv);
 // Separated indoor/outdoor panels must not retain an opaque, unlettered rear plate.
 // Keep the original readable face exactly; ordinary two-sided gate signs keep their box.
 if(faces!=='both'){
  const indices=sign.getIndices()!,visible:number[]=[];
  const direction=faces==='front'?-1:1;
  for(let i=0;i<indices.length;i+=3){
   if(normal[indices[i]*3+2]*direction>.9)visible.push(indices[i],indices[i+1],indices[i+2]);
  }
  sign.setIndices(visible);
 }
 return sign;
}
