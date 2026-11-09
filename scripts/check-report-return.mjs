import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readdir,readFile} from 'node:fs/promises';
import {languages,dictionary,fitsWidth} from './locale-checks.mjs';
import {origin,mailbox} from './local-candidate.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-gpu']});
try{
 for(const [code,hide] of [...languages.map(([code])=>[code,false]),['ko',true]]){
  const t=await dictionary(code);
  const context=await browser.newContext({locale:code,viewport:{width:320,height:740}});
  await context.addInitScript(code=>localStorage.setItem('sasa:language',code),code);
  try{
   const page=await context.newPage(),id=randomUUID(),email=id+'@example.test';
   let visible=true,successful=0;
   await page.route('**/service/shared/*',r=>visible?r.fulfill({json:{kind:'lantern',name:'시험',text:'공개 문구'}}):r.fulfill({status:404,json:{}}));
   await page.route('**/service/report',async r=>{
    assert.deepEqual(r.request().postDataJSON(),{id,category:'harm'});
    const me=await context.request.get(origin+'/api/service/me');
    if(me.ok()){successful++;await r.fulfill({json:{reported:true}});}
    else await r.fulfill({status:401,json:{}});
   });
   await page.goto(origin+'/shared.html?id='+id);
   const form=page.locator('main form'),dialog=page.locator('dialog[open]');
   await form.locator('select').selectOption('harm');await form.locator('button').click();
   await dialog.locator('input').fill(email);await dialog.locator('form button').click();
   await dialog.getByText(t('이 Mac의 시험 우편함에 로그인 링크를 보냈습니다.')).waitFor();
   const messages=await Promise.all((await readdir(mailbox)).map(file=>readFile(mailbox+'/'+file,'utf8')));
   const link=messages.find(text=>text.startsWith(email+'\n')).split('\n')[1];
   visible=!hide;
   const confirm=await context.newPage();await confirm.goto(link);await confirm.locator('[data-confirm]').click();
   await confirm.getByText(email,{exact:false}).first().waitFor();
   await confirm.close();await page.bringToFront();
   await dialog.waitFor({state:'hidden'});assert.equal(successful,0);
   if(hide){
    await page.getByText(t('현재 볼 수 없는 봉헌입니다.')).waitFor();
    assert(await form.isHidden());assert.equal(await page.locator('#message').textContent(),'');
   }else{
    assert.equal(await form.locator('select').inputValue(),'harm');const submit=form.getByRole('button',{name:t('신고 접수'),exact:true});await fitsWidth(submit);await submit.click();
    await page.getByText(t('신고를 접수했습니다.')).waitFor();assert.equal(successful,1);
   }
   console.log(code,'report return passed',hide?'hidden':'public');
  }finally{await context.close();}
 }
 console.log('PASS local email sign-in returns to the selected report; hidden offering clears the draft.');
}finally{await browser.close();}
