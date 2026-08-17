import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pubDir = join(__dirname, '..', 'public');

const svg = readFileSync(join(pubDir, 'logo-mundo-motos.svg'));

await sharp(svg).resize(192, 192).png().toFile(join(pubDir, 'logo-192.png'));
console.log('Generated logo-192.png');

await sharp(svg).resize(512, 512).png().toFile(join(pubDir, 'logo-512.png'));
console.log('Generated logo-512.png');

await sharp(svg).resize(180, 180).png().toFile(join(pubDir, 'apple-touch-icon.png'));
console.log('Generated apple-touch-icon.png');

await sharp(svg).resize(192, 192).png().toFile(join(pubDir, 'icon-192x192.png'));
console.log('Generated icon-192x192.png');

await sharp(svg).resize(512, 512).png().toFile(join(pubDir, 'icon-512x512.png'));
console.log('Generated icon-512x512.png');

await sharp(svg).resize(192, 192).png().toFile(join(pubDir, 'maskable-icon-192x192.png'));
console.log('Generated maskable-icon-192x192.png');

await sharp(svg).resize(512, 512).png().toFile(join(pubDir, 'maskable-icon-512x512.png'));
console.log('Generated maskable-icon-512x512.png');

await sharp(svg).resize(64, 64).png().toFile(join(pubDir, 'favicon.png'));
console.log('Generated favicon.png');

console.log('All icons regenerated from new V-wings isologo.');
