import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import '@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration';
import '@babylonjs/core/Shaders/ShadersInclude/instancesVertex';
const vertex=`precision highp float;
attribute vec3 position;attribute vec3 normal;attribute vec2 uv;
uniform mat4 viewProjection;uniform vec3 lampCenter;
#include<instancesDeclaration>
varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vRay;varying float vDistance;
void main(){
#include<instancesVertex>
 vec3 localRay=position-lampCenter;
 vPosition=(finalWorld*vec4(position,1.)).xyz;
 vRay=mat3(finalWorld)*localRay;vDistance=dot(localRay,localRay);
 vNormal=normalize(mat3(finalWorld)*normal);vUV=uv;
 gl_Position=viewProjection*vec4(vPosition,1.);
}`;
const fragment=`precision highp float;
varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vRay;varying float vDistance;
uniform sampler2D paper;uniform vec3 dye;uniform float night;uniform float lampOn;uniform vec3 eye;uniform float panels;uniform vec3 sunDirection;uniform vec3 sunTint;uniform float sunlight;uniform float skylight;
void main(){
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 vec2 paperUV=vec2(fract(vUV.x*panels),vUV.y);
 vec2 texUV=paperUV*vec2(.72,1.2);vec3 fibres=texture2D(paper,texUV).rgb;
 float pulp=dot(fibres,vec3(.299,.587,.114));
 // Optical density varies with fibres, wrinkles and glued seams.
 float fibrePattern=clamp((pulp-.83)*6.5,0.,1.);
 float density=mix(.90,.32,fibrePattern);
 float dx=dot(texture2D(paper,texUV+vec2(.0015,0.)).rgb,vec3(.333))-pulp;
 float dy=dot(texture2D(paper,texUV+vec2(0.,.0015)).rgb,vec3(.333))-pulp;
 vec3 tangent=normalize(cross(vec3(0.,1.,.001),n));vec3 bitangent=normalize(cross(n,tangent));n=normalize(n+3.*dx*tangent+3.*dy*bitangent);
 float seam=min(paperUV.x,1.-paperUV.x);
 float glued=1.-smoothstep(.008,.035,seam);
 float hoopDistance=abs(fract(vUV.y*16.+.5)-.5);
 float hoopShadow=mix(.46,1.,smoothstep(.012,.075,hoopDistance));
 float ribShadow=mix(.34,1.,smoothstep(.003,.028,seam));
 float smallFolds=.04*sin(vUV.y*210.+sin(paperUV.x*21.)*2.);
 float opticalDepth=density+glued*.65+smallFolds;
 vec3 absorption=-log(max(dye,vec3(.025)))*1.15+vec3(.14);
 vec3 transmitted=exp(-absorption*opticalDepth);
 vec3 ray=vRay;
 float d2=vDistance;
 vec3 towardsEye=normalize(eye-vPosition);
 float forwardLobe=.22+.78*pow(max(dot(normalize(ray),towardsEye),0.),9.);
 float irradiance=1./(.16+d2*4.);
 float sourceShadow=hoopShadow*ribShadow;
 float key=max(dot(n,normalize(vec3(-.6,.8,-.7))),0.);
 vec3 exterior=dye*(.24+.60*key)*mix(.88,1.08,fibrePattern)*mix(1.,.055,night);
 vec3 warmBulb=vec3(1.,.83,.57);
 vec3 interior=warmBulb*transmitted*irradiance*forwardLobe*sourceShadow*mix(.65,5.2,night)*lampOn;
 // Per-channel absorption reveals a warm core through thin paper, dyed edges and dark ribs.
 vec3 nightColor=exterior+interior;nightColor=nightColor/(vec3(1.)+nightColor);
 // Approved single-lantern daylight: fine ribs and broad dyed-paper transmission.
 float closeHoop=abs(fract(vUV.y*34.+.5)-.5);
 float aa=max(.002,fwidth(vUV.y)*34.*.6);
 float fineHoops=mix(.48,1.,smoothstep(.006-aa,.045+aa,closeHoop));
 float fineRibs=mix(.61,1.,smoothstep(.001,.012,seam));
 vec3 toSun=normalize(-sunDirection);
 float back=max(dot(-n,toSun),0.);
 float dayKey=max(dot(n,toSun),0.);
 float skyThrough=(.72+.20*max(-n.y,0.))*(skylight/1.1);
 vec3 sunlightThrough=mix(dye,transmitted,.24)*(skyThrough+.48*back*(sunlight/1.4))*sunTint;
 sunlightThrough*=mix(.80,1.08,fibrePattern)*exp(-glued*.45)*fineHoops*fineRibs;
 vec3 reflected=dye*(.24+.60*dayKey)*mix(.88,1.08,fibrePattern)*fineHoops;
 vec3 dayBulb=warmBulb*transmitted*irradiance*.12*fineHoops*fineRibs*lampOn;
 vec3 daylight=reflected+sunlightThrough+dayBulb;
 vec3 dayColor=daylight/(vec3(1.)+daylight);
 vec3 color=mix(dayColor,nightColor,night);

 gl_FragColor=vec4(pow(max(color,0.),vec3(1./2.2)),1.);
}`;
export function createHanjiMaterial(scene:Scene,name:string,hex:string,panels=1,center=new Vector3(.035,.03,-.025),texture?:Texture){
 const fibre=texture??new Texture('/textures/hanji-fibres-generated-v1.png',scene);fibre.anisotropicFilteringLevel=16;
 const paper=new ShaderMaterial(name,scene,{vertexSource:vertex,fragmentSource:fragment},{attributes:['position','normal','uv'],uniforms:['world','viewProjection','dye','night','lampOn','eye','lampCenter','panels','sunDirection','sunTint','sunlight','skylight'],samplers:['paper']});
 paper.setVector3('sunDirection',new Vector3(-.65,-.95,.45));paper.setColor3('sunTint',Color3.White());paper.setFloat('sunlight',1.4);paper.setFloat('skylight',1.1);paper.backFaceCulling=false;paper.setTexture('paper',fibre);paper.setColor3('dye',Color3.FromHexString(hex).toLinearSpace());paper.setFloat('night',0);paper.setFloat('lampOn',1);paper.setFloat('panels',panels);paper.setVector3('lampCenter',center);paper.setVector3('eye',scene.activeCamera?.position??Vector3.Zero());return paper;
}
