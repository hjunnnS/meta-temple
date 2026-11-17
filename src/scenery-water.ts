import type{Scene}from'@babylonjs/core/scene';
import{MeshBuilder}from'@babylonjs/core/Meshes/meshBuilder';
import{ShaderMaterial}from'@babylonjs/core/Materials/shaderMaterial';
import{Effect}from'@babylonjs/core/Materials/effect';
import{Color3}from'@babylonjs/core/Maths/math.color';
import{Vector3}from'@babylonjs/core/Maths/math.vector';
export function sceneryWater(scene:Scene,night:boolean,y:number,river?:{minX:number;minZ:number;maxZ:number}){
 Effect.ShadersStore['sceneryWaterVertexShader']=`precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;uniform float clock;uniform float waterLevel;varying vec3 point;void main(){vec3 p=position;p.y+=.035*sin(p.x*.11+p.z*.04+clock*.5)+.025*sin(p.z*.17-p.x*.06-clock*.35);point=p+vec3(0.,waterLevel,0.);gl_Position=worldViewProjection*vec4(p,1.);}`;
 Effect.ShadersStore['sceneryWaterFragmentShader']=`precision highp float;varying vec3 point;uniform vec3 eye;uniform vec3 baseColor;uniform vec3 horizon;uniform vec3 lightColor;uniform float clock;uniform float riverMode;uniform vec3 riverBounds;void main(){if(riverMode>.5&&(point.x<riverBounds.x||point.z<riverBounds.y||point.z>riverBounds.z))discard;vec3 normal=normalize(vec3(-.009*cos(point.x*.11+point.z*.04+clock*.5),1.,-.012*cos(point.z*.17-point.x*.06-clock*.35)));vec3 view=normalize(eye-point);float fresnel=pow(1.-max(dot(normal,view),0.),3.);vec3 reflected=reflect(-view,normal);float shine=pow(max(dot(reflected,normalize(vec3(.9,.27,-.2))),0.),100.);float fine=.5+.5*sin(point.x*1.1+sin(point.z*.7)+clock*.8);vec3 color=mix(baseColor,horizon,fresnel*.7)+lightColor*shine*(.35+.65*fine);color+=vec3(.007)*sin(point.x*.8+point.z*.6+clock*.3);float fog=smoothstep(280.,950.,length(eye-point));gl_FragColor=vec4(mix(color,horizon,fog),1.);}`;
 const material=new ShaderMaterial('scenery-water',scene,'sceneryWater',{attributes:['position'],uniforms:['worldViewProjection','clock','waterLevel','eye','baseColor','horizon','lightColor','riverMode','riverBounds']});
 material.setFloat('riverMode',river?1:0);material.setVector3('riverBounds',new Vector3(river?.minX??0,river?.minZ??0,river?.maxZ??0));material.setFloat('waterLevel',y);material.setColor3('baseColor',Color3.FromHexString(night?'#102c3d':'#586c70'));material.setColor3('horizon',Color3.FromHexString(night?'#182c46':'#bda58a'));material.setColor3('lightColor',Color3.FromHexString(night?'#c3d5d2':'#ffbe65'));material.backFaceCulling=false;
 const mesh=MeshBuilder.CreateGround('scenery-water-surface',{width:5000,height:5000,subdivisions:96},scene);mesh.position.y=y;mesh.material=material;mesh.isPickable=false;
 return{mesh,material,update(clock:number){material.setFloat('clock',clock);material.setVector3('eye',scene.activeCamera?.position??Vector3.Zero());}};
}
