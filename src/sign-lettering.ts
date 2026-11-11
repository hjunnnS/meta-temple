import type {Mesh} from '@babylonjs/core/Meshes/mesh';
/** A box's +Z face has a different vertex order from its courtyard-facing -Z face. */
export function uprightBoxLettering(sign:Mesh){
 const uv=sign.getVerticesData('uv')!,normal=sign.getVerticesData('normal')!;
 for(let i=0;i<normal.length/3;i++){
  if(normal[i*3+2]>.9){uv[i*2]=1-uv[i*2];uv[i*2+1]=1-uv[i*2+1];}
  else if(Math.abs(normal[i*3+2])<.9){uv[i*2]=0;uv[i*2+1]=0;}
 }
 sign.setVerticesData('uv',uv);return sign;
}
