import sharp from 'sharp';
import { resolve } from 'node:path';

await Promise.all([
  sharp(resolve('public/favicon.svg')).resize(32, 32).png().toFile(resolve('public/favicon-32.png')),
  sharp(resolve('public/favicon.svg')).resize(180, 180).png().toFile(resolve('public/apple-touch-icon.png')),
  sharp(resolve('public/og-source.svg')).png().toFile(resolve('public/og.png'))
]);
