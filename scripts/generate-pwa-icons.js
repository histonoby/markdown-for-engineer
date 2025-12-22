// PWAアイコン生成スクリプト
// Node.jsでcanvasを使用してPWAアイコンを生成します

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVGアイコンのテンプレート
const createSvgIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ff9f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b967ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0d1117"/>
  <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" rx="${size * 0.1}" fill="url(#grad1)" opacity="0.2"/>
  <path d="M${size * 0.3} ${size * 0.25} L${size * 0.7} ${size * 0.25} L${size * 0.7} ${size * 0.75} L${size * 0.3} ${size * 0.75} Z" fill="none" stroke="#00ff9f" stroke-width="${size * 0.02}"/>
  <path d="M${size * 0.35} ${size * 0.35} L${size * 0.65} ${size * 0.35}" stroke="#00ff9f" stroke-width="${size * 0.015}"/>
  <path d="M${size * 0.35} ${size * 0.45} L${size * 0.55} ${size * 0.45}" stroke="#00d4ff" stroke-width="${size * 0.015}"/>
  <path d="M${size * 0.35} ${size * 0.55} L${size * 0.6} ${size * 0.55}" stroke="#b967ff" stroke-width="${size * 0.015}"/>
  <path d="M${size * 0.35} ${size * 0.65} L${size * 0.5} ${size * 0.65}" stroke="#00ff9f" stroke-width="${size * 0.015}"/>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

// アイコンを生成
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = `pwa-${size}x${size}.svg`;
  const filepath = path.join(publicDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Generated: ${filename}`);
});

console.log('\\nPWA icons generated successfully!');
console.log('Note: For production, convert these SVGs to PNGs using a tool like sharp or imagemagick.');

