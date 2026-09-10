const fs = require('fs');
const sharp = require('sharp');

const logo = fs.readFileSync('public/assets/logo-aivur-dark.png').toString('base64');
const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#061521"/>
      <stop offset="0.58" stop-color="#0A2E45"/>
      <stop offset="1" stop-color="#07111D"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#B7193B"/>
      <stop offset="0.55" stop-color="#C9A84C"/>
      <stop offset="1" stop-color="#E53E5D"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="18%" r="68%">
      <stop offset="0" stop-color="#1D668D" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#1D668D" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.3" fill="#9DB4C2" opacity="0.16"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="720" y="0" width="480" height="630" fill="url(#grid)" opacity="0.46"/>
  <path d="M-40 526 C 250 410, 378 474, 624 536 S 1000 574, 1240 410" fill="none" stroke="#B7193B" stroke-width="3" opacity="0.72"/>
  <path d="M-30 542 C 270 430, 420 504, 650 550 S 1010 584, 1230 438" fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.5"/>
  <rect x="72" y="72" width="218" height="1" fill="url(#accent)"/>
  <image href="data:image/png;base64,${logo}" x="72" y="92" width="300" height="100" preserveAspectRatio="xMidYMid meet"/>
  <text x="72" y="290" fill="#C9A84C" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="5">MENTORIA DE ELITE PARA CONCURSOS</text>
  <text x="72" y="365" fill="#F4F7F8" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800">Estude com precisão</text>
  <text x="72" y="422" fill="#F4F7F8" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800">cirúrgica.</text>
  <text x="76" y="480" fill="#9DB4C2" font-family="Arial, Helvetica, sans-serif" font-size="21">Inteligência que evolui resultados.</text>
  <rect x="72" y="548" width="1056" height="1" fill="#9DB4C2" opacity="0.24"/>
  <text x="72" y="584" fill="#9DB4C2" font-family="Arial, Helvetica, sans-serif" font-size="16" letter-spacing="2">AIVUR.COM.BR</text>
  <text x="1128" y="584" text-anchor="end" fill="#C9A84C" font-family="Arial, Helvetica, sans-serif" font-size="16" letter-spacing="2">MENTOR AIVUR</text>
</svg>`;

sharp(Buffer.from(svg)).png().toFile('public/og-image-wa-v2.png').then(() => {
  console.log('Created public/og-image-wa-v2.png');
});
