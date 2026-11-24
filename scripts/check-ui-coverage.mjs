import assert from 'node:assert/strict';
import {inspectTextContrast} from './ui-contrast.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {webkit,chromium} from 'playwright';
import {enterTrial,exposeScene,go} from './trial-helpers.mjs';
const out=process.env.UI_EVIDENCE??'evidence/ui-unification-20261124/coverage';await mkdir(out,{recursive:true});const rows=[];
const inventory=[
 ['guide','#guide-monk-caption'],['coin','#pond-toss'],['sweeper-action','#sweeper-greet'],['private-entry','#private-gate-action'],['community-action','#community-open'],['inspection-exit','#inspection-exit'],
 ['npc-bubble','#npc-conversation-bubble'],['daily-monk','#daily-monk-caption'],['sweeper-bubble','#sweeper-caption'],
 ['public-practice','#practice-feedback'],['private-practice','#private-practice-feedback'],['public-result','#public-practice-outcome'],['private-result','#private-practice-outcome'],['practice-controls','#walk-pad'],
 ['wish-countdown','#pond-wish'],['controls-help','#visit-guide'],['offering-tag','#offering-tag'],['coffee-status','#tea-status'],
 ['zodiac','.face-dialog'],['community-dialog','#community-dialog'],['room-views','#private-views-panel'],
 ['map','#spaces-panel'],['settings','#settings-panel'],['account','.account-panel'],['scenery','#private-scenery-dialog'],['display','#private-display-dialog'],['access','#private-access-dialog'],['offering','#offering-drawer']
];
for(const kind of(process.env.UI_CASES??'mobile,pc').split(',')){
 const mobile=kind==='mobile',b=await(mobile?webkit.launch():chromium.launch({channel:'chrome'})),c=await b.newContext({viewport:mobile?{width:393,height:852}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile}),p=await c.newPage(),row={kind,realPhone:false,inventory:[]};p.setDefaultTimeout(25000);
 try{
 await enterTrial(p);await p.locator('#guide-free').click();await exposeScene(p);
 async function audit(){for(const [name,selector] of inventory){
  if(row.inventory.some(r=>r.name===name)||await p.locator(selector).count()===0)continue;
  const data=await p.locator(selector).first().evaluate(el=>{
   const old=el.getAttribute('data-practice');if(el.id==='walk-pad')el.setAttribute('data-practice','108');
   const s=getComputedStyle(el),rgba=v=>v.match(/[\d.]+/g).map(Number),bg=rgba(s.backgroundColor),fg=rgba(s.color),composite=bg.slice(0,3).map(v=>v*(bg[3]??1)+255*(1-(bg[3]??1))),lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0),contrast=(lum(fg.slice(0,3))+.05)/(lum(composite)+.05),result={background:s.backgroundColor,color:s.color,alpha:bg[3]??1,blur:s.backdropFilter||s.webkitBackdropFilter,contrast};
   if(el.id==='walk-pad'){if(old===null)el.removeAttribute('data-practice');else el.setAttribute('data-practice',old);}return result;
  });assert.equal(data.alpha,.68,name+' must use shared tint');assert.equal(data.blur,'none',name+' no blur');assert(data.contrast>=4.5,name+' readable on white scene');row.inventory.push({name,selector,...data});
 }
 }
 await audit();
 // A newly created dialog receives the theme without a selector-list update.
 row.futureDialog=await p.evaluate(()=>{const d=document.createElement('dialog');d.textContent='New dialog';document.body.append(d);const s=getComputedStyle(d),v=s.backgroundColor;d.remove();return v;});assert.match(row.futureDialog, /0\.68\)/);
 await p.locator('#appearance-open').click();await p.locator('#face-picker').click();await p.locator('.face-dialog').screenshot({path:out+'/'+kind+'-zodiac.jpg'});await p.locator('[data-face=rabbit]').click();await p.keyboard.press('Escape');row.zodiacSelection=true;
 await p.locator('#menu-open').click();await p.locator('#service-account').click();await p.locator('.account-panel').screenshot({path:out+'/'+kind+'-account.jpg'});if(await p.locator('#trial-start').isVisible()){await p.locator('#trial-start').click();await p.locator('#trial-logout').waitFor();}await p.locator('.account-panel [data-close]').click();row.accountFlow=true;
 await go(p,'pond');await p.locator('#pond-toss').screenshot({path:out+'/'+kind+'-coin-button.jpg'});await p.locator('#pond-toss').click();await p.locator('#pond-wish').waitFor();await p.locator('#pond-wish').screenshot({path:out+'/'+kind+'-wish.jpg'});await p.locator('#pond-wish').waitFor({state:'hidden',timeout:15000});row.coinCycle=true;
 await p.locator('#menu-open').click();await p.locator('#offering-open').click();const reception=p.locator('#reception-panel');await reception.getByRole('button',{name:/^연등 ·/}).click();await reception.locator('.lantern-plan button:enabled').first().click();await reception.locator('.lantern-seats button[data-status=free]:enabled').first().click();await reception.locator('form').waitFor();row.offeringContrast=await p.locator('#offering-drawer').evaluate(inspectTextContrast);assert(row.offeringContrast.every(x=>x.ratio>=x.minimum-.02),JSON.stringify(row.offeringContrast.filter(x=>x.ratio<x.minimum-.02)));await p.locator('#offering-drawer').screenshot({path:out+'/'+kind+'-offering.jpg'});const input=reception.locator('input:not([type=checkbox])').first();if(await input.count()){await input.fill('검수');assert.equal(await input.inputValue(),'검수');}row.offeringSelectionAndInput=true;await p.locator('#offering-close').click();
 await go(p,'private');await p.locator('#private-gate-action').click();await p.locator('#private-menu-open').waitFor();await audit();assert.equal(row.inventory.length,28);await p.locator('#private-menu-open').click();await p.locator('#private-scenery-open').click();await p.locator('#private-scenery-dialog').screenshot({path:out+'/'+kind+'-scenery.jpg'});await p.locator('#private-scenery-dialog button').filter({hasText:'단풍'}).click();row.sceneryChoice=true;
 await p.locator('#private-menu-open').click();await p.locator('#private-display-open').click();await p.locator('#private-display-dialog').screenshot({path:out+'/'+kind+'-display.jpg'});const field=p.locator('#private-display-dialog select').first();if(await field.count()){const style=await field.evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));assert.equal(style.background,'rgb(255, 253, 245)');row.readableInput=style;}await p.locator('#private-display-close').click();
 await p.locator('#private-menu-open').click();await p.locator('#private-room-exit').click();row.returnToTemple=true;
 // Existing community dialog is displayed read-only; no funding action is submitted.
 await p.locator('#community-dialog').evaluate(d=>d.showModal());await p.locator('#community-dialog').screenshot({path:out+'/'+kind+'-community.jpg'});await p.keyboard.press('Escape');
 row.passed=true;console.log('PASS',kind,'28 surfaces, zodiac, account, scenery, item menu and return');
 }catch(e){row.failure=String(e);console.log('FAIL',kind,String(e));await p.screenshot({path:out+'/'+kind+'-failure.jpg'}).catch(()=>{});}finally{rows.push(row);await writeFile(out+'/result.json',JSON.stringify(rows,null,2));await c.close();await b.close();}
}
assert(rows.every(r=>r.passed));
