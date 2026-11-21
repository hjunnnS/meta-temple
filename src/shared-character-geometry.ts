import {Mesh} from '@babylonjs/core/Meshes/mesh';
import type {Scene} from '@babylonjs/core/scene';
import type {Geometry} from '@babylonjs/core/Meshes/geometry';
const pools=new WeakMap<Scene,Map<string,Geometry>>();
export function attachCharacterGeometry(mesh:Mesh,key:string){const geometry=pools.get(mesh.getScene())?.get(key);if(!geometry||geometry.isDisposed())return false;geometry.applyToMesh(mesh);return true;}
export function keepCharacterGeometry(mesh:Mesh,key:string){if(!mesh.geometry)return;let pool=pools.get(mesh.getScene());if(!pool){pool=new Map();pools.set(mesh.getScene(),pool);}pool.set(key,mesh.geometry);}
export function characterShape(scene:Scene,key:string,name:string,build:()=>Mesh){const geometry=pools.get(scene)?.get(key);if(geometry&&!geometry.isDisposed()){const mesh=new Mesh(name,scene);geometry.applyToMesh(mesh);return mesh;}const mesh=build();keepCharacterGeometry(mesh,key);return mesh;}
