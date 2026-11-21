import{Mesh}from'@babylonjs/core/Meshes/mesh.js';
/** A disposed merge source may still share its index array with other hall clones. */
export function mergeStaticBatch(parts:Mesh[],isolateSharedIndices=false){if(isolateSharedIndices)parts[0]?.makeGeometryUnique();return Mesh.MergeMeshes(parts,true,true);}
