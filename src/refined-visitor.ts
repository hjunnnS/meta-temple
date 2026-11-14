import type{Scene}from'@babylonjs/core/scene';
import{Mesh}from'@babylonjs/core/Meshes/mesh';import{MeshBuilder as B}from'@babylonjs/core/Meshes/meshBuilder';import{VertexData}from'@babylonjs/core/Meshes/mesh.vertexData';
import{TransformNode}from'@babylonjs/core/Meshes/transformNode';import{StandardMaterial}from'@babylonjs/core/Materials/standardMaterial';import{Color3}from'@babylonjs/core/Maths/math.color';import{Vector3}from'@babylonjs/core/Maths/math.vector';
import{legacyVisitorMesh}from'./visitor-rig';
import{visitorFace}from'./visitor-face';
import type{Face}from'./face-types';
/** Shared rounded human appearance; retains the approved rig, poses and zodiac faces. */
export function refinedVisitor(scene:Scene,name:string,monk=false){
 const rig=legacyVisitorMesh(scene,name,monk);for(const mesh of rig.root.getChildMeshes())mesh.dispose(false,true);
 const material=(suffix:string,hex:string)=>{const m=new StandardMaterial(name+'-'+suffix,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.045,.04,.035);m.specularPower=30;return m;};
 const skin=material('skin','#e7b99a'),cloth=material('linen','#6a8679'),trim=material('seam','#537266'),pants=material('trousers','#414b50'),shoe=material('shoes','#555b61'),sole=material('soles','#d5d5ca');
 function finish(m:Mesh,parent:TransformNode,mat:StandardMaterial,x=0,y=0,z=0){m.parent=parent;m.material=mat;m.position.set(x,y,z);m.isPickable=false;m.metadata={appearance:'refined-human'};return m;}
 function rounded(label:string,parent:TransformNode,mat:StandardMaterial,w:number,h:number,d:number,r:number,x:number,y:number,z:number,n=4){
  const m=new Mesh(name+'-'+label,scene),positions:number[]=[],normals:number[]=[],indices:number[]=[],uvs:number[]=[];const half=[w/2,h/2,d/2],radius=Math.min(r,...half),core=half.map(v=>v-radius);
  for(let face=0;face<6;face++){const axis=Math.floor(face/2),sign=face%2?1:-1,u=(axis+1)%3,v=(axis+2)%3,start=positions.length/3;
   for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const q=[0,0,0];q[axis]=half[axis]*sign;q[u]=(i/n*2-1)*half[u];q[v]=(j/n*2-1)*half[v];const c=q.map((a,k)=>Math.max(-core[k],Math.min(core[k],a))),delta=q.map((a,k)=>a-c[k]),length=Math.hypot(...delta);positions.push(...c.map((a,k)=>a+delta[k]/length*radius));normals.push(...delta.map(a=>a/length));uvs.push(i/n,j/n);}
   for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=start+j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;if(sign>0)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);}
  }
  const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(m);return finish(m,parent,mat,x,y,z);
 }
 function oval(label:string,parent:TransformNode,mat:StandardMaterial,w:number,h:number,d:number,x:number,y:number,z:number){const m=finish(B.CreateSphere(name+'-'+label,{diameter:1,segments:10},scene),parent,mat,x,y,z);m.scaling.set(w,h,d);return m;}
 function line(label:string,parent:TransformNode,mat:StandardMaterial,points:number[][],radius:number){return finish(B.CreateTube(name+'-'+label,{path:points.map(p=>Vector3.FromArray(p)),radius,tessellation:8,cap:Mesh.CAP_ALL},scene),parent,mat);}
 // Keep the approved limb lengths so the same planted hands and feet still work.
 rig.coat=rounded('soft-shirt',rig.chest,cloth,.45,.51,.295,.085,0,.235,0,6);
 const shirtPositions=rig.coat.getVerticesData('position')!;for(let i=0;i<shirtPositions.length;i+=3)shirtPositions[i]*=.88+.12*Math.max(0,Math.min(1,shirtPositions[i+1]/.51+.5));rig.coat.updateVerticesData('position',shirtPositions);
 rounded('shirt-hem',rig.coat,trim,.396,.025,.291,.011,0,-.242,0);
 rounded('shirt-placket',rig.coat,trim,.026,.35,.014,.007,0,.04,.151);
 for(const y of [.16,.06,-.04])oval('cloth-button',rig.coat,sole,.013,.013,.008,0,y,.161);
 for(const side of [-1,1])line('collar',rig.coat,trim,[[side*.084,.262,.012],[side*.067,.225,.112],[side*.012,.170,.154]],.010);
 oval('neck',rig.chest,skin,.135,.13,.13,0,.505,0);
 rig.sleeves.length=0;const ankles:TransformNode[]=[];
 for(const[i,side]of[-1,1].entries()){
  rounded('upper-trouser',rig.legs[i],pants,.175,.39,.19,.064,0,-.175,0);
  rounded('lower-trouser',rig.shins[i],pants,.165,.385,.182,.055,0,-.175,0);
  const ankle=new TransformNode(name+'-ankle-'+i,scene);ankle.parent=rig.shins[i];ankle.position.set(0,-.45,.034);ankles.push(ankle);
  rounded('shoe-upper',ankle,shoe,.185,.13,.29,.055,0,.004,.021);
  rounded('shoe-sole',ankle,sole,.194,.038,.30,.017,0,-.058,.021);
  rounded('shoe-toe',ankle,sole,.179,.047,.065,.018,0,-.02,.144);
  for(const y of[-.414,-.442])rounded('shoe-lace',ankle,sole,.11,.012,.06,.005,0,y+.45,.038);
  const upper=rounded('upper-sleeve',rig.arms[i],cloth,.177,.30,.19,.072,0,-.12,0),lower=rounded('lower-sleeve',rig.forearms[i],cloth,.157,.27,.17,.062,0,-.115,0);
  rig.sleeves.push(upper,lower);rounded('cuff',lower,trim,.16,.035,.174,.012,0,-.108,0);
  const palm=rounded('palm',rig.forearms[i],skin,.079,.137,.061,.029,0,-.25,.005);
  oval('thumb',palm,skin,.047,.074,.047,-side*.046,.018,.01);
  for(const y of[-.025,-.043])line('finger-fold',palm,skin,[[-.022,y,.029],[0,y-.003,.032],[.022,y,.029]],.002);
  rig.hands[i]=palm;
 }
 rig.head.position.y=.80;for(const child of rig.head.getChildren())child.dispose();
 let faceKind:Face='human',faceModel=refinedHumanFace(scene,rig.head,name,monk);
 function setFace(next:Face){if(next===faceKind)return;const replacement=next==='human'?refinedHumanFace(scene,rig.head,name,monk):visitorFace(scene,rig.head,next,monk);faceModel.dispose(false,true);faceModel=replacement;faceKind=next;}
 const plantFeet=()=>{for(let i=0;i<2;i++)ankles[i].rotation.x=-(rig.legs[i].rotation.x+rig.shins[i].rotation.x);};
 const originalBow=rig.bow;rig.bow=(phase:number)=>{originalBow(phase);plantFeet();};
 rig.bow(0);rig.root.metadata={appearance:'refined-human',monk,productionApplied:true};
 return {...rig,setFace,plantFeet,get face(){return faceKind;}};
}

export function refinedHumanFace(scene:Scene,parent:TransformNode,name:string,monk=false){
 const material=(suffix:string,hex:string)=>{const m=new StandardMaterial(name+'-'+suffix,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.045,.04,.035);m.specularPower=30;return m;};
 const skin=material('face-skin','#e7b99a'),ink=material('features','#382c29'),light=material('eye-glint','#fff3de');
 function finish(m:Mesh,parent:TransformNode,mat:StandardMaterial,x=0,y=0,z=0){m.parent=parent;m.material=mat;m.position.set(x,y,z);m.isPickable=false;m.metadata={appearance:'refined-human'};return m;}
 function rounded(label:string,parent:TransformNode,mat:StandardMaterial,w:number,h:number,d:number,r:number,x:number,y:number,z:number,n=4){
  const m=new Mesh(name+'-'+label,scene),positions:number[]=[],normals:number[]=[],indices:number[]=[],uvs:number[]=[];const half=[w/2,h/2,d/2],radius=Math.min(r,...half),core=half.map(v=>v-radius);
  for(let face=0;face<6;face++){const axis=Math.floor(face/2),sign=face%2?1:-1,u=(axis+1)%3,v=(axis+2)%3,start=positions.length/3;
   for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const q=[0,0,0];q[axis]=half[axis]*sign;q[u]=(i/n*2-1)*half[u];q[v]=(j/n*2-1)*half[v];const c=q.map((a,k)=>Math.max(-core[k],Math.min(core[k],a))),delta=q.map((a,k)=>a-c[k]),length=Math.hypot(...delta);positions.push(...c.map((a,k)=>a+delta[k]/length*radius));normals.push(...delta.map(a=>a/length));uvs.push(i/n,j/n);}
   for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=start+j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;if(sign>0)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);}
  }
  const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.applyToMesh(m);return finish(m,parent,mat,x,y,z);
 }
 function oval(label:string,parent:TransformNode,mat:StandardMaterial,w:number,h:number,d:number,x:number,y:number,z:number){const m=finish(B.CreateSphere(name+'-'+label,{diameter:1,segments:10},scene),parent,mat,x,y,z);m.scaling.set(w,h,d);return m;}
 function line(label:string,parent:TransformNode,mat:StandardMaterial,points:number[][],radius:number){return finish(B.CreateTube(name+'-'+label,{path:points.map(p=>Vector3.FromArray(p)),radius,tessellation:8,cap:Mesh.CAP_ALL},scene),parent,mat);}
 const face=new TransformNode(name+'-refined-face',scene);face.parent=parent;
 rounded('face',face,skin,.465,.435,.39,monk?.17:.115,0,0,0,10);
 for(const side of[-1,1]){
  oval('ear',face,skin,.065,.10,.065,side*.235,-.015,0);
  const eye=oval('eye',face,ink,.035,monk?.025:.054,.014,side*.094,.031,.199);
  oval('eye-light',eye,light,.20,.16,.36,-.12,.20,.45);
  const brow=rounded('eyebrow',face,ink,.070,.015,.015,.007,side*.094,.101,.196);brow.rotation.z=-side*.08;
 }
 oval('nose',face,skin,.053,.059,.061,0,-.020,.202);
 line('quiet-smile',face,ink,[[-.049,-.100,.195],[-.025,-.114,.202],[0,-.118,.205],[.025,-.114,.202],[.049,-.100,.195]],.0065);
 if(!monk){
 const hair=material('hair','#49312b'),lock=material('hair-soft-ridge','#50382f');
 // A single cap with swept, flattened locks, rather than a stack of spherical hair blobs.
 const cap=new Mesh(name+'-hair-cap',scene),pos:number[]=[],idx:number[]=[],uv:number[]=[];const cols=32,rows=10;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const a=i/cols*Math.PI*2,theta=j/rows*(1.43+1.0*(1-Math.cos(a))/2),radial=Math.sin(theta)**.40;pos.push(.26*radial*Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.70,.085+.265*Math.cos(theta),.235*radial*Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.70-.008);uv.push(i/cols,j/rows);}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}const capData=new VertexData();capData.positions=pos;capData.indices=idx;capData.uvs=uv;const normal:number[]=[];VertexData.ComputeNormals(pos,idx,normal);capData.normals=normal;capData.applyToMesh(cap);finish(cap,face,hair);hair.backFaceCulling=false;
 function sweptLock(label:string,points:number[][],width:number,depth:number,mat:StandardMaterial){
  const m=new Mesh(name+'-'+label,scene),positions:number[]=[],indices:number[]=[],normals:number[]=[];const rings=18,sides=10;
  const curve=(t:number)=>{const u=1-t;return new Vector3(...[0,1,2].map(k=>u*u*u*points[0][k]+3*u*u*t*points[1][k]+3*u*t*t*points[2][k]+t*t*t*points[3][k]) as[number,number,number]);};
  for(let j=0;j<=rings;j++){const t=j/rings,c=curve(t),direction=curve(Math.min(1,t+.005)).subtract(curve(Math.max(0,t-.005))).normalize(),perp=new Vector3(-direction.y,direction.x,0).normalize(),taper=.05+.95*Math.sin(Math.PI*t)**.65;for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;positions.push(c.x+perp.x*Math.cos(a)*width*taper,c.y+perp.y*Math.cos(a)*width*taper,c.z+Math.sin(a)*depth*taper);}}
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i;indices.push(a,a+sides+1,a+1,a+1,a+sides+1,a+sides+2);}VertexData.ComputeNormals(positions,indices,normals);const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=Array.from({length:positions.length/3},(_,i)=>[i%(sides+1)/sides,Math.floor(i/(sides+1))/rings]).flat();data.applyToMesh(m);mat.backFaceCulling=false;finish(m,face,mat);
 }
 sweptLock('swept-fringe',[[-.23,.16,.145],[-.11,.19,.242],[.12,.225,.218],[.22,.30,.075]],.062,.032,hair);
 sweptLock('crown-sweep',[[-.19,.27,.035],[-.08,.38,.075],[.15,.35,.025],[.225,.23,-.075]],.060,.029,lock);
 sweptLock('parted-side',[[-.225,.13,.055],[-.26,.20,.025],[-.18,.28,-.01],[-.05,.335,-.03]],.039,.018,hair);
 }
 return face;
}
