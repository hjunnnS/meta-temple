/** Keep fixed controls inside the area the browser both displays and hit-tests. */
export function viewportBounds(layoutHeight:number,visualHeight:number,dynamicHeight:number,offsetTop=0){
 const heights=[layoutHeight,visualHeight,dynamicHeight].filter(n=>Number.isFinite(n)&&n>0);
 const height=Math.min(...heights),top=Math.max(0,Math.min(offsetTop,Math.max(0,layoutHeight-height)));
 return{height,top,bottom:Math.max(0,layoutHeight-top-height)};
}
export function viewportFrame(layoutWidth:number,visualWidth:number,dynamicWidth:number,layoutHeight:number,visualHeight:number,dynamicHeight:number,offsetLeft=0,offsetTop=0){const vertical=viewportBounds(layoutHeight,visualHeight,dynamicHeight,offsetTop),horizontal=viewportBounds(layoutWidth,visualWidth,dynamicWidth,offsetLeft);return{...vertical,width:horizontal.height,left:horizontal.top,right:horizontal.bottom};}
