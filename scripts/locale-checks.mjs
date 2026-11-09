import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
export {languages} from '../src/locales/languages.ts';

export async function dictionary(code){
 const pack=code==='ko'?{}:JSON.parse(await readFile(new URL('../src/locales/'+code+'.json',import.meta.url),'utf8'));
 return key=>{if(code==='ko')return key;assert(pack[key],code+' '+key);return pack[key];};
}

export async function fitsWidth(locator){
 await locator.scrollIntoViewIfNeeded();
 assert(await locator.evaluate(el=>{
  const box=el.getBoundingClientRect();
  return box.left>=-1&&box.right<=innerWidth+1&&el.scrollWidth<=el.clientWidth+1;
 }),await locator.textContent());
}
