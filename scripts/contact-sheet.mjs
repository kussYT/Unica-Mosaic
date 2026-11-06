import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
const images = JSON.parse(await readFile('public/images/manifest.json', 'utf8'));
await mkdir('.qa', { recursive: true });
const layers = [];
for (const [i, img] of images.entries()) {
  const left = (i % 4) * 300, top = Math.floor(i/4)*280;
  layers.push({ input: await sharp(`public/images/${img.name}-480.webp`).resize(290,240,{fit:'inside'}).extend({top:0,bottom:0,left:0,right:0}).png().toBuffer(), left, top });
  layers.push({input: Buffer.from(`<svg width="290" height="30"><text x="8" y="22" font-size="18">${img.name}</text></svg>`),left,top:top+240});
}
await sharp({create:{width:1200,height:840,channels:3,background:'#fcf4f1'}}).composite(layers).png().toFile('.qa/contact-sheet.png');
