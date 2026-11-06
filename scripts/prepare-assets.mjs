import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Explicit source root can be supplied on another computer. Original assets are never modified.
const root = process.argv[2] || 'C:/Users/Marius/Documents/Unica-Mosaic/Assets-Classes';
const output = path.resolve('public/images');
await mkdir(output, { recursive: true });
const photos = {
  'blason': '02_Photos_boutique/image00001.jpeg',
  'dalida': '03_Realisations/02_Installations_et_commandes/image00073.jpeg',
  'atelier-mains': '04_Ateliers/05_Reportage_general/Unica Ateliers #1-100.jpg',
  'atelier-table': '04_Ateliers/05_Reportage_general/Unica Ateliers #1-10.jpg',
  'atelier-partage': '04_Ateliers/06_Evenements_anniversaires/Unica Ateliers #Anniversaire-40.jpg',
  'pixel-kids': '04_Ateliers/02_Pixel_Kids/Photos/image00027.jpeg',
  'recolle': '04_Ateliers/01_Recolle-toi_meuf/ff18de7b-e095-4032-ba79-94ad7937ee5a.JPG',
  'croix': '04_Ateliers/03_Ma_croix_mes_couleurs/Atelier WhatsApp Image 2026-11-03 at 08.50.15.jpeg',
  'boutique': '02_Photos_boutique/image00189.jpeg',
  'tortue': '03_Realisations/02_Installations_et_commandes/image00027.jpeg',
  'lion': '03_Realisations/01_Fabrication/57b554de-9fca-48da-8dc0-e25549d5b39f 2.jpg',
};
const manifest = [];
for (const [name, source] of Object.entries(photos)) {
  const input = path.join(root, source);
  const variants = [];
  for (const width of [480, 960, 1600]) {
    const file = `${name}-${width}.webp`;
    const info = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(path.join(output, file));
    variants.push({ file, width: info.width, height: info.height, bytes: info.size });
  }
  manifest.push({ name, source, variants });
}
const brand = path.join(root, '01_Charte_et_logos/02_Exports_logo_UNICA/Export Logo/RVB/SVG');
for (const [name, source] of Object.entries({
  'logo-rose': 'Logo principal/UNICA-Logo principal horizontal-rose.svg',
  'logo-creme': 'Logo principal/UNICA-Logo principal horizontal-beige.svg',
  'favicon': 'Logomark/UNICA-Logomark-rose.svg',
})) {
  let svg = await readFile(path.join(brand, source), 'utf8');
  // Tighten the empty artboard only; keep paths, colours and logo proportions intact.
  const { info } = await sharp(Buffer.from(svg)).trim().png().toBuffer({ resolveWithObject: true });
  const original = await sharp(Buffer.from(svg)).metadata();
  const box = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const scale = box[2] / original.width;
  const margin = 18;
  svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${-info.trimOffsetLeft * scale - margin} ${-info.trimOffsetTop * scale - margin} ${info.width * scale + margin * 2} ${info.height * scale + margin * 2}"`);
  await writeFile(path.join(output, `${name}.svg`), svg);
}
await writeFile('public/images/manifest.json', JSON.stringify(manifest, null, 2));
console.log(`Prepared ${manifest.length} photographs in three WebP sizes and 3 vector logos.`);
console.log(`Total WebP: ${(manifest.flatMap(x => x.variants).reduce((s,x) => s+x.bytes,0)/1024/1024).toFixed(2)} MB`);
