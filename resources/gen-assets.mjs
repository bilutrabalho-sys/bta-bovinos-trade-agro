// Gera os PNGs-fonte da marca BTA (ícone + splash) a partir de SVG, usando o
// sharp (que vem com @capacitor/assets). Depois rode:
//   npx @capacitor/assets generate --android --assetPath resources
//
// Identidade BTA:
//   - Verde escuro de fundo (gradiente #0D2B1E -> #123B2A -> #1E5A40)
//   - Marca "BTA" em âmbar/dourado (#E4BC6A -> #CF9E3E)
//
// Modo avançado do @capacitor/assets (nomes fixos):
//   icon-only.png / icon-foreground.png / icon-background.png (1024x1024)
//   splash.png / splash-dark.png (2732x2732)

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const out = (name) => join(DIR, name);

const FONT = 'Arial Black, Arial, Segoe UI, sans-serif';

// Definições reutilizáveis (gradientes de fundo e da marca).
const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#0D2B1E"/>
      <stop offset="0.5" stop-color="#123B2A"/>
      <stop offset="1" stop-color="#1E5A40"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="#2C6E4E" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#2C6E4E" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="amber" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E9C578"/>
      <stop offset="0.55" stop-color="#D6A84F"/>
      <stop offset="1" stop-color="#C08E32"/>
    </linearGradient>
  </defs>`;

// SVG do ícone cheio (fundo verde + BTA). scale = fração da largura ocupada.
function iconSvg(size, { transparentBg = false, scale = 0.36 } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = size * scale;
  const bg = transparentBg
    ? ''
    : `<rect width="${size}" height="${size}" fill="url(#bg)"/>
       <rect width="${size}" height="${size}" fill="url(#glow)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs}
    ${bg}
    <text x="${cx}" y="${cy + fontSize * 0.35}" font-family="${FONT}" font-weight="900"
      font-size="${fontSize}" letter-spacing="${-fontSize * 0.03}" fill="url(#amber)"
      text-anchor="middle">BTA</text>
  </svg>`;
}

// Só o fundo verde (camada de fundo do adaptive icon).
function bgSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs}
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <rect width="${size}" height="${size}" fill="url(#glow)"/>
  </svg>`;
}

// Splash: fundo verde + BTA grande + tagline.
function splashSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = size * 0.22;
  const tagSize = size * 0.028;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs}
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <rect width="${size}" height="${size}" fill="url(#glow)"/>
    <text x="${cx}" y="${cy - fontSize * 0.08}" font-family="${FONT}" font-weight="900"
      font-size="${fontSize}" letter-spacing="${-fontSize * 0.03}" fill="url(#amber)"
      text-anchor="middle" dominant-baseline="central">BTA</text>
    <text x="${cx}" y="${cy + fontSize * 0.62}" font-family="Segoe UI, Arial, sans-serif" font-weight="600"
      font-size="${tagSize}" letter-spacing="${tagSize * 0.5}" fill="#C6D3C4"
      text-anchor="middle" dominant-baseline="central">BOVINOS  TRADE  AGRO</text>
  </svg>`;
}

async function render(svg, size, file) {
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size, { fit: 'fill' })
    .png()
    .toFile(out(file));
  console.log('gerado:', file);
}

await render(iconSvg(1024), 1024, 'icon-only.png');
await render(iconSvg(1024, { transparentBg: true, scale: 0.30 }), 1024, 'icon-foreground.png');
await render(bgSvg(1024), 1024, 'icon-background.png');
await render(splashSvg(2732), 2732, 'splash.png');
await render(splashSvg(2732), 2732, 'splash-dark.png');
// Cópia com o nome pedido no briefing (mestre 1024 do ícone).
await render(iconSvg(1024), 1024, 'icon.png');
console.log('OK — assets-fonte gerados em resources/');
