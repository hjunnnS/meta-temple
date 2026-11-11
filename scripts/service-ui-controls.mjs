export async function serviceControl(page,id){
 const control=page.locator(id);if(!await control.isVisible()){
  if(await page.locator('body').evaluate(el=>el.classList.contains('in-private-room'))&&id==='#settings')await page.locator('#private-room-settings').click();
  else if(!await page.locator('#menu-panel').isVisible())await page.locator('#menu-open').click();
 }
 if(id==='#settings'&&await page.locator('#settings-panel').isVisible())return;
 await control.click();
}
export async function privateViews(page){await page.locator('#private-room-settings').click();await page.locator('#private-views-open').click();}
