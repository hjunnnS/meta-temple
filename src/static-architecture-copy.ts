import{Mesh}from'@babylonjs/core/Meshes/mesh';
/** Static, single-material architecture shares its existing vertex buffers.
 * Avoid copying Babylon's full mesh object/prototype graph for every roof tile.
 * Animated or hierarchical meshes continue to use Babylon's normal clone path.
 */
export function copyStaticArchitecture(source:Mesh,name:string){
 if(!source.geometry||source.getChildren().length||source.animations.length||source.skeleton||source.morphTargetManager||source.subMeshes?.length!==1||source.material?.getClassName()==='MultiMaterial'||source.getClassName()!=='Mesh')return source.clone(name,null)!;
 const mesh=new Mesh(name,source.getScene());source.geometry.applyToMesh(mesh);
 mesh.material=source.material;mesh.position.copyFrom(source.position);mesh.rotation.copyFrom(source.rotation);mesh.scaling.copyFrom(source.scaling);mesh.rotationQuaternion=source.rotationQuaternion?.clone()??null;
 mesh.isVisible=source.isVisible;mesh.visibility=source.visibility;mesh.isPickable=source.isPickable;mesh.receiveShadows=source.receiveShadows;mesh.checkCollisions=source.checkCollisions;mesh.billboardMode=source.billboardMode;mesh.layerMask=source.layerMask;mesh.renderingGroupId=source.renderingGroupId;mesh.sideOrientation=source.sideOrientation;
 mesh.metadata=source.metadata?{...source.metadata}:null;mesh.setEnabled(source.isEnabled());return mesh;
}
