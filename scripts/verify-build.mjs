import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('dist');
async function walk(dir) { return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e => e.isDirectory() ? walk(path.join(dir,e.name)) : path.join(dir,e.name)))).flat(); }
const pages = (await walk(root)).filter(p => p.endsWith('.html'));
const issues = [];
for (const page of pages) {
  const html = await readFile(page,'utf8');
  if ((html.match(/<h1[\s>]/g)||[]).length !== 1) issues.push(page+': expected one H1');
  if (!html.includes('lang="fr"')) issues.push(page+': missing French language');
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const asset = path.join(root, decodeURIComponent(match[1]));
    try { const info=await stat(asset); if(info.isDirectory()) await stat(path.join(asset,'index.html')); } catch { issues.push(page+': missing '+match[1]); }
  }
  for(const image of html.matchAll(/<img\b[^>]*>/g)) if(!/\balt=/.test(image[0])) issues.push(page+': image without alt');
}
assert.equal(pages.length,9,'Expected 9 pages');
assert.deepEqual(issues,[],issues.join('\n'));
console.log('PASS: 9 pages, internal links, local assets, alt texts, French language and H1 headings.');
