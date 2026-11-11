// Shared petal outline, with the fine branching veins curving toward the tip.
const petal=(x:number,y:number,angle:number,w:number,h:number,shade:string)=>`
 <g transform="translate(${x} ${y}) rotate(${angle}) scale(${w} ${h})">
  <use href="#lotus-petal" fill="url(#${shade})"/><use href="#lotus-veins"/>
 </g>`;
export const entryLotus=`<svg class="entry-lotus" viewBox="0 0 240 180" aria-hidden="true">
 <defs>
  <linearGradient id="blush" x2=".32" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#e95c99"/><stop offset=".27" stop-color="#f19dc1"/><stop offset=".72" stop-color="#ffe0dc"/><stop offset="1" stop-color="#f4d196"/></linearGradient>
  <linearGradient id="rose" x2=".2" y2="1"><stop stop-color="#dc558c"/><stop offset=".48" stop-color="#f2a5bb"/><stop offset="1" stop-color="#ffdfbc"/></linearGradient>
  <path id="lotus-petal" d="M0 0 C-23 -13 -35 -48 -24 -74 C-18 -87 -5 -98 0 -100 C7 -101 21 -77 25 -60 C33 -28 18 -7 0 0Z"/>
  <g id="lotus-veins" fill="none" stroke="#ad5680" stroke-width=".64" opacity=".33">
   ${[-18,-13,-8,-3,3,8,13,18].map(n=>`<path d="M${n*.15} -5 Q${n*1.75} -53 ${n*.55} ${-94+Math.abs(n)*.58}"/>`).join('')}
  </g>
 </defs>
 ${petal(112,119,-34,.97,1.19,'blush')}${petal(127,120,29,1,1.12,'blush')}
 ${petal(107,122,-60,1.04,1.04,'blush')}${petal(132,122,59,.98,1.08,'blush')}
 <g class="lotus-wings">${petal(112,124,-97,1,.92,'blush')}${petal(123,123,103,.98,.94,'blush')}</g>
 ${petal(117,117,-45,.70,.84,'rose')}${petal(128,116,46,.75,.86,'rose')}
 <g fill="#f9c653" stroke="#d49b38" stroke-width=".7">
 ${Array.from({length:26},(_,i)=>{const a=i*2.4,x=120+Math.cos(a)*22,y=91+Math.sin(a)*6;return `<path d="M120 110 Q${x} 105 ${x} ${y}" fill="none" stroke="#ffc456"/><ellipse cx="${x}" cy="${y}" rx="1.2" ry="2.1"/>`}).join('')}
 <path d="M101 87 Q120 78 140 87 L134 103 Q119 110 111 101Z"/>
 <ellipse cx="120" cy="87" rx="19" ry="5.8" fill="#ffe381"/>
 ${Array.from({length:11},(_,i)=>`<circle cx="${106+i*2.7}" cy="${86+Math.sin(i*2.4)*2.6}" r=".9"/>`).join('')}</g>
 <g class="lotus-lip"><path d="M88 99 C94 91 105 101 119 99 C131 98 150 93 151 103 C149 124 137 140 119 142 C99 139 85 116 88 99Z" fill="url(#rose)"/>
 ${Array.from({length:9},(_,i)=>`<path d="M${93+i*6} 101 Q${94+i*6} 117 ${113+i*1.5} 138" fill="none" stroke="#ba6588" stroke-width=".65" opacity=".37"/>`).join('')}</g>
 </svg>`;
