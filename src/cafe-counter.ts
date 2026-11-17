import type{Scene}from'@babylonjs/core/scene';import type{Mesh}from'@babylonjs/core/Meshes/mesh';
import{MeshBuilder as B}from'@babylonjs/core/Meshes/meshBuilder';import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';import{Color3}from'@babylonjs/core/Maths/math.color';
import{visitorMesh}from'./walking';import{teaPavilion}from'./temple-terrain';import{walkingPose}from'./locomotion';
/** A preparation counter at the back of the pavilion, clear of existing seats. */
export function cafeCounter(scene:Scene,parts:Mesh[],wood:StandardMaterial){
 const {x,z}=teaPavilion,cz=z-2.45;
 const mat=(name:string,color:string)=>{const m=new StandardMaterial('cafe-'+name,scene);m.diffuseColor=Color3.FromHexString(color).toLinearSpace();m.specularColor=new Color3(.1,.1,.1);return m;};
 const metal=mat('brushed-metal','#9da7a5'),dark=mat('machine-body','#354b46'),white=mat('porcelain','#eae3d1'),linen=mat('apron','#8b765b'),glass=mat('coffee-beans','#534333');
 function box(name:string,w:number,h:number,d:number,dx:number,y:number,dz:number,m:StandardMaterial){const mesh=B.CreateBox('cafe-'+name,{width:w,height:h,depth:d},scene);mesh.position.set(x+dx,y,cz+dz);mesh.material=m;mesh.receiveShadows=true;parts.push(mesh);return mesh;}
 function cylinder(name:string,r:number,h:number,dx:number,y:number,dz:number,m:StandardMaterial){const mesh=B.CreateCylinder('cafe-'+name,{diameter:r,height:h,tessellation:16},scene);mesh.position.set(x+dx,y,cz+dz);mesh.material=m;parts.push(mesh);return mesh;}
 box('counter',3.9,.94,.84,0,.79,0,wood);box('worktop',4.05,.09,.95,0,1.305,0,metal);
 box('espresso-machine',1.15,.58,.49,-.67,1.64,-.09,dark);box('espresso-steel-face',1.08,.34,.025,-.67,1.65,.167,metal);box('drip-tray',1.10,.04,.28,-.67,1.39,.20,dark);
 for(const dx of[-.94,-.44]){cylinder('brew-head',.10,.09,dx,1.50,.24,metal);box('portafilter-handle',.065,.06,.22,dx,1.48,.35,dark);cylinder('cup',.12,.14,dx,1.47,.29,white);}
 cylinder('grinder',.26,.4,.32,1.56,-.10,dark);cylinder('bean-hopper',.24,.22,.32,1.87,-.10,glass);
 cylinder('kettle',.3,.28,1.15,1.49,-.07,metal);const spout=box('kettle-spout',.10,.07,.22,1.15,1.53,.13,metal);spout.rotation.x=-.4;
 for(let i=0;i<4;i++)cylinder('stacked-cups',.15,.08,.76,1.40+i*.07,.18,white);
 box('tea-tin',.22,.3,.22,1.63,1.51,-.06,linen);box('menu-board',.52,.38,.04,1.50,1.54,.39,dark);
 const body=visitorMesh(scene,'cafe-attendant');body.setFace('human');body.root.position.set(x,.32,cz-.90);body.root.rotation.y=0;
 const apron=B.CreateBox('cafe-cloth-apron',{width:.40,height:.60,depth:.06},scene);apron.parent=body.chest;apron.position.set(0,-.06,.18);apron.material=linen;
 for(const m of new Set(body.root.getChildMeshes().map(m=>m.material)))if(m instanceof StandardMaterial&&m!==linen)m.diffuseColor=m.diffuseColor.toLinearSpace();
 let clock=0,hidden=false;const space=(e:Event)=>{hidden=(e as CustomEvent).detail==='private';body.root.setEnabled(!hidden);};window.addEventListener('sasa:space',space);
 const obs=scene.onBeforeRenderObservable.add(()=>{if(hidden||document.hidden)return;clock+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);walkingPose(body,0,0,false);body.head.rotation.y=.12*Math.sin(clock*.4);body.arms[1].rotation.x=-.55-.10*Math.sin(clock*.65);body.forearms[1].rotation.x=-.65;});
 scene.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(obs);window.removeEventListener('sasa:space',space);});return{body,obstacle:{x,z:cz-.9,radius:.38}};
}
