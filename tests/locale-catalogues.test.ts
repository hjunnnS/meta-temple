import {languages,flagUrl} from '../src/locales/languages.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const dir=new URL('../src/locales/',import.meta.url);
const files=readdirSync(dir).filter(name=>name.endsWith('.json'));
const read=(name:string)=>JSON.parse(readFileSync(new URL(name,dir),'utf8')) as Record<string,string>;
test('all visitor catalogues contain the same nonempty translations',()=>{
 const codes=languages.map(([code])=>code);
 assert.equal(new Set(codes).size,codes.length);
 assert.deepEqual(files.sort(),codes.filter(code=>code!=='ko').map(code=>code+'.json').sort());
 for(const [,flag] of languages)assert.match(readFileSync(new URL('../public'+flagUrl(flag),import.meta.url),'utf8'),/<svg/);
 const keys=Object.keys(read('en.json')).sort();
 for(const file of files){
  const pack=read(file);
  assert.deepEqual(Object.keys(pack).sort(),keys,file);
  assert(Object.values(pack).every(value=>typeof value==='string'&&value.trim()),file);
 }
});
