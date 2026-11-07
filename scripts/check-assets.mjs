import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const assets = JSON.parse(await readFile('public/textures/sources.json', 'utf8'));
const media = new Set(['.jpg','.jpeg','.png','.webp','.ktx2','.glb','.gltf','.bin','.ogg','.wav','.mp3']);
async function visit(directory) {
  const files = [];
  for (const item of await readdir(directory, {withFileTypes:true})) {
    const path = join(directory, item.name);
    if (item.isDirectory()) files.push(...await visit(path));
    else if (media.has(extname(item.name).toLowerCase())) files.push(path);
  }
  return files;
}
assert.deepEqual(assets.map(asset => asset.file).sort(), (await visit('public')).sort(), '배포 에셋과 출처 목록 불일치');
for (const asset of assets) {
  const data = await readFile(asset.file);
  assert.equal(data.length, asset.bytes, asset.file);
  assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256, asset.file);
  assert.ok(asset.source && asset.credit && asset.rights, asset.file);
  if (!asset.source.startsWith('https://')) assert.ok((await stat(asset.source)).isFile(), asset.source);
  if (/\.(glb|gltf)$/.test(asset.file)) assert.equal(asset.metresPerUnit, 1, asset.file);
  if (/\.(jpg|jpeg|png|webp|ktx2)$/.test(asset.file)) assert.ok(asset.material, asset.file);
}
console.log('배포 에셋 출처·버전·용량 검사 통과:', assets.length);
