import type{Mesh}from'@babylonjs/core/Meshes/mesh.js';
import{VertexData}from'@babylonjs/core/Meshes/mesh.vertexData.js';
/** A recipe is shared by static hall copies. Fine buffers do not exist at entry. */
interface StaticRecipe{build:()=>VertexData;vertices:number}
export function deferStaticGeometry(mesh:Mesh,build:()=>Mesh,vertices:number){
 const recipe:StaticRecipe={vertices,build(){const temporary=build();try{return VertexData.ExtractFromMesh(temporary,false,false);}finally{temporary.dispose();}}};
 mesh.metadata={...mesh.metadata,mobileStaticRecipe:recipe};return mesh;
}
export function estimatedStaticVertices(mesh:Mesh){return (mesh.metadata?.mobileStaticRecipe as StaticRecipe|undefined)?.vertices??mesh.getTotalVertices();}
/** Capture transforms before MergeMeshes disposes the sources; regenerate verbatim only on approach. */
export function lazyStaticBatch(parts:Mesh[]){
 if(!parts.some(p=>p.metadata?.mobileStaticRecipe))return undefined;
 const sources=parts.map(mesh=>({recipe:mesh.metadata?.mobileStaticRecipe as StaticRecipe|undefined,data:mesh.metadata?.mobileStaticRecipe?undefined:(()=>{const data=VertexData.ExtractFromMesh(mesh,false,false);data.indices=data.indices?.slice()??null;return data;})(),matrix:mesh.computeWorldMatrix(true).clone()}));
 return()=>{const data=sources.map(s=>{const d=s.recipe?s.recipe.build():s.data!.clone();return d.transform(s.matrix);});return data[0].merge(data.slice(1),true,true);};
}
