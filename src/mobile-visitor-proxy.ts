import{Mesh}from'@babylonjs/core/Meshes/mesh';import{VertexData}from'@babylonjs/core/Meshes/mesh.vertexData';import{Matrix,Quaternion}from'@babylonjs/core/Maths/math.vector';import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';import{Color3}from'@babylonjs/core/Maths/math.color';import type{Node}from'@babylonjs/core/node';
/** One colour-baked surface per moving joint; original close-up parts remain untouched. */
export function mobileVisitorProxy(parts:Mesh[]){
 const groups=new Map<Node|null,Mesh[]>(),result:Mesh[]=[];
 for(const p of parts)if(/-(soft-shirt|upper-trouser|lower-trouser|shoe-upper|upper-sleeve|lower-sleeve|palm|face|hair-cap|eye)$/.test(p.name)){const group=groups.get(p.parent)??[];group.push(p);groups.set(p.parent,group);}
 if(!parts.length)return result;const scene=parts[0].getScene(),mat=new StandardMaterial(parts[0].name+'-distant-colours',scene);mat.diffuseColor=Color3.White();mat.specularColor=new Color3(.045,.04,.035);mat.specularPower=30;
 for(const[parent,meshes]of groups){const positions:number[]=[],normals:number[]=[],indices:number[]=[],colors:number[]=[];
  for(const mesh of meshes){const data=VertexData.ExtractFromMesh(mesh);if(!data.positions||!data.indices)continue;data.transform(Matrix.Compose(mesh.scaling,mesh.rotationQuaternion??Quaternion.FromEulerVector(mesh.rotation),mesh.position));const offset=positions.length/3;positions.push(...data.positions);if(data.normals)normals.push(...data.normals);for(const i of data.indices)indices.push(i+offset);const colour=(mesh.material as StandardMaterial).diffuseColor;for(let i=0;i<data.positions.length/3;i++)colors.push(colour.r,colour.g,colour.b,1);}
  const m=new Mesh('ambient-lod-'+result.length+'-'+parts[0].uniqueId,scene),d=new VertexData();d.positions=positions;d.normals=normals;d.indices=indices;d.colors=colors;d.applyToMesh(m);m.material=mat;m.parent=parent;m.isPickable=false;m.receiveShadows=false;m.isVisible=false;m.metadata={ambientVisitor:true,mobileProxy:true};result.push(m);
 }return result;
}
