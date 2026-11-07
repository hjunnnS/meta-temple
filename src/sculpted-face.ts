import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

const gaussian = (x:number,y:number)=>Math.exp(-x*x-y*y);
const clamp = (v:number)=>Math.min(1,Math.max(0,v));

// All facial relief and traces of pigment follow a single closed casting.
export function sculptedFace(scene:Scene, material:StandardMaterial):Mesh {
 const positions:number[]=[], indices:number[]=[], colors:number[]=[], uvs:number[]=[];
 const columns=224, rows=240;
 for(let j=0;j<=rows;j++){
  const latitude=(j/rows-.5)*Math.PI;
  const h=2.277+.404*Math.sin(latitude);
  const ring=Math.cos(latitude);
  const cheekWidth=1-.082*Math.exp(-(((h-2.13)/.14)**2));
  for(let i=0;i<columns;i++){
   const angle=2*Math.PI*i/columns;
   const x=.285*ring**.76*cheekWidth*(.98+.085*Math.tanh((h-2.13)/.09))*Math.sin(angle);
   const front=Math.max(0,Math.cos(angle))**2;
   const a=Math.abs(x), t=(a-.045)/.177;
   const eyeSpan=Math.sin(Math.PI*clamp(t))**.75;
   const eyeAxis=2.310+.025*clamp(t);
   const upperLid=eyeAxis+.009*eyeSpan;
   const lowerLid=eyeAxis-.016*eyeSpan;
   const aperture=clamp((upperLid-h)/.003)*clamp((h-lowerLid)/.003)*eyeSpan;
   // The lid masks the upper iris; its center sits close to the lower rim.
   const irisDistance=Math.hypot(a-.126,h-(eyeAxis-.011));
   const iris=aperture*clamp((.031-irisDistance)/.005);
   const pupil=aperture*clamp((.016-irisDistance)/.004);
   const arch=2.350+.054*eyeSpan+.035*clamp(t);
   const mouthSpan=Math.max(0,1-(x/.095)**2);
   const seam=2.064+.010*(1-mouthSpan)+.002*Math.cos(65*x);
   const relief=
    .028*gaussian((a-.149)/.093,(h-2.213)/.084) // cheek pad
    +.044*gaussian(x/.115,(h-1.99)/.051)       // chin
    -.020*gaussian((a-.126)/.102,(h-2.34)/.054)
    +eyeSpan*(.019*Math.exp(-((h-upperLid-.013)**2)/.00045)
              +.008*Math.exp(-((h-lowerLid+.006)**2)/.00010)
              +.013*Math.exp(-((h-arch)**2)/.0005))
    +.096*gaussian(x/.048,(h-2.28)/.152)
    +.082*gaussian(x/.049,(h-2.169)/.036)
    +.038*gaussian((a-.049)/.024,(h-2.158)/.020)
    -.019*gaussian((a-.037)/.015,(h-2.152)/.009)
    +.018*gaussian(x/.1,(h-2.075)/.060)
    +mouthSpan*(.027*Math.exp(-((h-seam-.011)**2)/.00013)
               +.035*Math.exp(-((h-seam+.014)**2)/.00018))
    -.008*gaussian(x/.018,(h-2.15)/.025);
   const z=-.035-.255*ring*Math.cos(angle)-front*relief;
   positions.push(x,h,z);uvs.push(i/columns,j/rows);
   const brow=eyeSpan*Math.exp(-((h-arch)**2)/.000043);
   const eyelash=eyeSpan*Math.exp(-((h-upperLid)**2)/.000015);
   const nostril=gaussian((a-.038)/.012,(h-2.15)/.006);
   const lip=mouthSpan*Math.exp(-((h-seam)**2)/.00032);
   const ink=front*Math.max(.79*brow,.60*eyelash,.81*iris+.15*pupil,.48*nostril,.55*mouthSpan*Math.exp(-((h-seam)**2)/.000009));
   const exposedEye=front*aperture*(1-iris);
   colors.push(1-ink*.89-.22*exposedEye,1-ink*.93-front*lip*.48-.08*exposedEye,
    1-ink*.94-front*lip*.47+.25*exposedEye,1);
   if(j<rows){const v=j*columns+i,n=j*columns+(i+1)%columns;indices.push(v,n,v+columns,n,n+columns,v+columns);}
  }
 }
 const mesh=new Mesh('cast-gilt-face',scene),data=new VertexData(),normals:number[]=[];
 VertexData.ComputeNormals(positions,indices,normals);
 data.positions=positions;data.normals=normals;data.indices=indices;data.colors=colors;data.uvs=uvs;
 data.applyToMesh(mesh);mesh.material=material;return mesh;
}
