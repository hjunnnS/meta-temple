// Contrast against a white 3D scene; canvas/body CSS is deliberately excluded.
export function inspectTextContrast(root){
 const rgba=s=>{const a=s.match(/[\d.]+/g)?.map(Number)??[0,0,0,0];return[a[0],a[1],a[2],a[3]??1];},mix=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
 const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),rows=[];
 while(walker.nextNode()){
  const e=walker.currentNode.parentElement,text=walker.currentNode.textContent.trim(),r=e.getBoundingClientRect();if(!text||!r.width||!r.height||e.closest('svg,option,script,style')||getComputedStyle(e).visibility==='hidden')continue;
  let bg=[255,255,255],chain=[];for(let n=e;n;n=n.parentElement){chain.push(n);if(n===root)break;}for(const n of chain.reverse())bg=mix(rgba(getComputedStyle(n).backgroundColor),bg);
  const s=getComputedStyle(e),fg=mix(rgba(s.color),bg),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05),large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&Number(s.fontWeight)>=700);rows.push({text:text.slice(0,90),ratio,minimum:large?3:4.5});
 }return rows;
}
