import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{languages}from'../src/locales/languages.ts';
test('M6 authored practice, arrangement and seat status messages exist in every supported language',()=>{
 const keys=JSON.parse(readFileSync(new URL('../docs/m6-translation-keys.json',import.meta.url),'utf8')) as string[];
 for(const [locale]of languages){if(locale==='ko')continue;const dictionary=JSON.parse(readFileSync(new URL('../src/locales/'+locale+'.json',import.meta.url),'utf8'));for(const key of keys){assert(dictionary[key]?.trim(),locale+' '+key);assert(!/[가-힣]/u.test(dictionary[key]),locale+' Korean fallback '+key);}}
});
