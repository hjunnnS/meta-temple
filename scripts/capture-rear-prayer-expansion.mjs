import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=await import('/Users/hjunnn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const out='evidence/rear-prayer-expansion';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true,args:['--enable-gpu']});
try{
 const p=await b.newPage({viewport:{width:1400,height:1500},reducedMotion:'reduce'});
 await p.addInitScript(()=>{localStorage.setItem('sasa:guide-seen','1');localStorage.setItem('sasa:language','ko');});
 await p.goto('http://127.0.0.1:4342');await p.locator('.enter-temple').click();await p.locator('.entry-overlay').waitFor({state:'detached',timeout:60000});
 await p.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/engineStore-')).name;const store=Object.values(await import(url)).find(x=>Array.isArray(x?.Instances));window.captureScene=store.Instances[0].scenes[0];});
 async function view(name){await p.evaluate(name=>{const s=document.querySelector('#place');s.value=name;s.dispatchEvent(new Event('change',{bubbles:true}));},name);await p.waitForTimeout(500);}
 async function raw(name){const data=await p.locator('#world').evaluate(c=>c.toDataURL('image/png').split(',')[1]);await writeFile(out+'/'+name+'.png',Buffer.from(data,'base64'));}
 await view('map');await raw('map-clean');
 const labels=await p.evaluate(()=>{
  const list=[[-44,55,'약사전 · 약사여래불',true],[-22,99,'문수전 · 문수보살',true],[40,102,'보현전 · 보현보살',true],[82,69,'극락전 · 아미타불',true],[0,38,'대웅전'],[-27,14,'관음전'],[27,14,'지장전'],[59,55,'미륵보살 석상'],[69,36,'개인 공간 입구'],[58,-34,'구름탑'],[56,-51,'연못'],[66,-70,'쉼터'],[-27,-28,'인등전'],[27,-46,'종무소'],[-27,-46,'범종각'],[0,-52,'천왕문'],[0,-78,'일주문'],[27,-23.5,'소원패 정원'],[0,-19,'연등 440자리']];
  const c=captureScene.activeCamera,V=c.target.constructor,M=captureScene.getTransformMatrix().constructor;
  return list.map(([x,z,label,added])=>{const at=V.Project(new V(x,5,z),M.Identity(),captureScene.getTransformMatrix(),c.viewport.toGlobal(1400,1500));return {x:at.x,y:at.y,label,added};});
 });
 await writeFile(out+'/map-labels.json',JSON.stringify(labels,null,2));
 await p.setViewportSize({width:1600,height:1000});
 for(const name of ['rearPrayerWest','rearPrayerMunsu','rearPrayerNorth','rearPrayerEast','yaksaInterior','munsuInterior','bohyeonInterior','geukrakInterior']){await view(name);await raw(name+'-clean');}
 await p.close();
 const head='<meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f6f4ec;color:#263f34;font-family:"Apple SD Gothic Neo",sans-serif}h1{font-size:30px;margin:0 0 12px}p{font-size:18px;margin:0 0 22px;color:#657164}.sheet{padding:36px;width:1472px}.map{position:relative;width:1400px;height:1500px}.map img{width:100%;height:100%}.label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font-size:17px;background:#233e34ed;color:#fff5dc;padding:5px 9px;border-radius:4px}.label.new{background:#945624f5;border:1px solid #e8bf73}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.grid figure{margin:0}.grid img{width:100%;display:block}.grid figcaption{font-size:20px;font-weight:600;padding:12px 0 18px}.note{margin-top:20px;font-size:17px}</style>';
 const map='<section class="sheet" id="map-report"><h1>실제 맵 · 대웅전 뒤편 확장 완료</h1><p>주황색 이름표는 새 전각 4곳 · 기존 시설과 연등·판매 자리는 유지 · 북쪽 ↑</p><div class="map"><img src="map-clean.png">'+labels.map(l=>'<span class="label '+(l.added?'new':'')+'" style="left:'+l.x+'px;top:'+l.y+'px">'+l.label+'</span>').join('')+'</div><p class="note">실제 3D 장면 캡처에 위치 설명만 덧붙인 이미지입니다.</p></section>';
 const figures=(items)=>items.map(([name,label])=>'<figure><img src="'+name+'-clean.png"><figcaption>'+label+'</figcaption></figure>').join('');
 const walk='<section class="sheet" id="walk-report"><h1>새 산책길에서 본 네 전각</h1><p>산책길 눈높이의 실제 화면 · 기와·단청·목재 재질은 기존 건축 표현을 재사용</p><div class="grid">'+figures([['rearPrayerWest','서쪽 · 약사전 / 동쪽으로 열린 입구'],['rearPrayerMunsu','북서쪽 · 문수전 / 남쪽으로 열린 입구'],['rearPrayerNorth','북동쪽 · 보현전 / 남쪽으로 열린 입구'],['rearPrayerEast','동쪽 · 극락전 / 서쪽으로 열린 입구']])+'</div></section>';
 const inside='<section class="sheet" id="interior-report"><h1>네 전각의 불·보살과 불단</h1><p>입구 반대편 안쪽에 불단 · 방석과 촛불 배치 · 기존 얼굴과 법복 주름 조형을 재사용</p><div class="grid">'+figures([['yaksaInterior','약사전 · 약사여래불'],['munsuInterior','문수전 · 문수보살'],['bohyeonInterior','보현전 · 보현보살'],['geukrakInterior','극락전 · 아미타불']])+'</div></section>';
 await writeFile(out+'/report.html',head+map+walk+inside);
 const report=await b.newPage({viewport:{width:1472,height:1700},deviceScaleFactor:1});await report.goto('file://'+resolve(out+'/report.html'));
 for(const [id,file]of[['map-report','map-labelled.png'],['walk-report','walk-views.png'],['interior-report','interiors.png']])await report.locator('#'+id).screenshot({path:out+'/'+file});
 await report.close();console.log('Saved actual labelled map, four path views, four shrines.');
}finally{await b.close();}
