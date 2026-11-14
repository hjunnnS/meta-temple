import type{visitorMesh}from'./walking';
/** Root/camera stay on their smooth walk surface; only the body transfers its weight. */
export function walkingPose(body:ReturnType<typeof visitorMesh>,stride:number,blend:number,palms=false){
 body.bow(palms?.105:0);const amount=Math.max(0,Math.min(1,blend));let lift=Infinity;
 for(let i=0;i<2;i++){
  const swing=Math.sin(stride+i*Math.PI),hip=.40*swing*amount,knee=.52*Math.max(0,-swing)*amount;
  body.legs[i].rotation.x=hip;body.shins[i].rotation.x=knee;
  lift=Math.min(lift,.35*(1-Math.cos(hip))+.45*(1-Math.cos(hip+knee))+.034*Math.sin(hip+knee));
  if(!palms){body.arms[i].rotation.x=-.26*swing*amount;body.forearms[i].rotation.x=-.10*amount;}
 }
 body.hips.position.y-=.9*.79*lift;body.chest.rotation.y=.025*Math.sin(stride)*amount;body.head.rotation.y=-body.chest.rotation.y*.6;body.plantFeet();
}
