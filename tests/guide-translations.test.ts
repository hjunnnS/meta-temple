import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{languages}from'../src/locales/languages.ts';import{guideCourses}from'../src/guide-courses.ts';import{guideContent}from'../src/guide-content.ts';import{guideStages}from'../src/guide-session.ts';
test('all fourteen languages have complete guide keys, placeholders and every course stage',()=>{
 const keys=JSON.parse(readFileSync(new URL('../docs/m5-guide-translation-keys.json',import.meta.url),'utf8'))as string[];assert.equal(keys.length,58);assert.equal(new Set(keys).size,58);
 for(const[locale]of languages){const dictionary=locale==='ko'?Object.fromEntries(keys.map(k=>[k,k])):JSON.parse(readFileSync(new URL('../src/locales/'+locale+'.json',import.meta.url),'utf8'))as Record<string,string>;
  for(const key of keys){assert(dictionary[key]?.trim(),locale+' '+key);for(const token of['{place}','{distance}'])assert.equal(dictionary[key].includes(token),key.includes(token),locale+' '+key);}
  for(const course of guideCourses)for(const stage of guideStages){const content=guideContent(stage,course.id,s=>dictionary[s]??s);assert(!content.text.includes('{place}'));if(locale!=='ko')assert(!/[가-힣]/u.test(content.text+content.title),locale+' '+course.id+' '+stage);}
 }
});
