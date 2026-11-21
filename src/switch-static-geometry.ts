import type{Mesh}from'@babylonjs/core/Meshes/mesh';import type{Geometry}from'@babylonjs/core/Meshes/geometry';import{SubMesh}from'@babylonjs/core/Meshes/subMesh.js';
/** Geometry.applyToMesh can retain a smaller existing submesh range on a detailed replacement. */
export function switchStaticGeometry(mesh:Mesh,geometry:Geometry){geometry.applyToMesh(mesh);mesh.releaseSubMeshes();new SubMesh(0,0,mesh.getTotalVertices(),0,mesh.getTotalIndices(),mesh);mesh.refreshBoundingInfo();}
