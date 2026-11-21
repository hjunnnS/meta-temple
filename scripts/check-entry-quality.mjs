import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';import {enterTrial,exposeScene} from './trial-helpers.mjs';
const out=process.env.QUALITY_EVIDENCE??'evidence/entry-optimization/quality';await mkdir(out,{recursive:true});const b=await launchBrowser({channel:'chrome'}),results=[];
try{for(const [label,url] of [['before',process.env.BEFORE_URL??'https://sasa-temple-personal-trial.fond-bell-1966.chatgpt.site'],['after',process.env.AFTER_URL??'http://127.0.0.1:4355']]){
 const c=await b.newContext({viewport:{width:1280,height:720}}),p=await c.newPage();process.env.TRIAL_URL=url;await enterTrial(p);await exposeScene(p);
 const scene=await p.evaluate(()=>{const s=trialScene;function hash(a){let h=2166136261;for(const v of new Uint8Array(a.buffer,a.byteOffset,a.byteLength))h=Math.imul(h^v,16777619)>>>0;return h.toString(16);}
 const meshes=s.meshes.filter(m=>m.name.startsWith('architecture-')||['natural-soil-trails','mountain-landscape'].includes(m.name));const materials=[...new Set(meshes.map(m=>m.material))];
 const geometry=meshes.map(m=>({name:m.name,material:m.material.name,positions:hash(new Float32Array(m.getVerticesData('position'))),normals:hash(new Float32Array(m.getVerticesData('normal'))),indices:hash(new Uint32Array(m.getIndices())),vertices:m.getTotalVertices()})).sort((a,b)=>a.name.localeCompare(b.name));
 const surfaces=materials.map(m=>({name:m.name,diffuse:m.diffuseColor?.asArray(),maps:['diffuseTexture','bumpTexture','opacityTexture'].map(key=>{const t=m[key];if(!t)return {key};const c=t.getContext?.();return {key,name:t.name,size:t.getSize(),pixels:c?hash(c.getImageData(0,0,t.getSize().width,t.getSize().height).data):null,level:t.level,u:t.uScale,v:t.vScale};})})).sort((a,b)=>a.name.localeCompare(b.name));
 return {geometry,surfaces,ambientCapacity:s.metadata.ambientPopulation.capacity};});results.push({label,url,...scene});await c.close();}
 assert.deepEqual(results[1].geometry,results[0].geometry,'Geometry must be unchanged');assert.deepEqual(results[1].surfaces,results[0].surfaces,'Material colors, texture settings and generated pixels must be unchanged');assert.equal(results[1].ambientCapacity,20);
 await writeFile(out+'/result.json',JSON.stringify({passed:true,exactGeometry:true,exactMaterialSettingsAndDynamicPixels:true,results},null,2));console.log('PASS exact geometry, material colors, generated texture pixels and texture resolution');
}finally{await b.close();}
