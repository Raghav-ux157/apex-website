const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../public/img');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function watchSvg(name, caseColor, dialColor, accentColor, strapColor, isChrono = false) {
  const hourMarkers = [0,30,60,90,120,150,180,210,240,270,300,330].map(deg => {
    const isCard = deg % 90 === 0;
    return `<line x1='200' y1='${isCard ? '94' : '98'}' x2='200' y2='108' stroke='${accentColor}' stroke-width='${isCard ? '3.5' : '2'}' stroke-linecap='round' transform='rotate(${deg} 200 200)'/>`;
  }).join('\n    ');

  const chronoSubdials = isChrono ? `
    <circle cx='165' cy='200' r='20' fill='none' stroke='${accentColor}' stroke-width='1' opacity='0.7'/>
    <line x1='165' y1='200' x2='165' y2='186' stroke='${accentColor}' stroke-width='1.5'/>
    <circle cx='235' cy='200' r='20' fill='none' stroke='${accentColor}' stroke-width='1' opacity='0.7'/>
    <line x1='235' y1='200' x2='244' y2='200' stroke='${accentColor}' stroke-width='1.5'/>
    <circle cx='200' cy='238' r='18' fill='none' stroke='${accentColor}' stroke-width='1' opacity='0.7'/>
    <line x1='200' y1='238' x2='200' y2='226' stroke='${accentColor}' stroke-width='1.5'/>
  ` : '';

  const chronoPushers = isChrono ? `
    <rect x='318' y='152' width='10' height='16' rx='2' fill='${caseColor}'/>
    <rect x='318' y='232' width='10' height='16' rx='2' fill='${caseColor}'/>
  ` : '';

  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%' height='100%'>
  <defs>
    <radialGradient id='dialGrad-${name}' cx='50%' cy='50%' r='50%'>
      <stop offset='0%' stop-color='${dialColor}' stop-opacity='1'/>
      <stop offset='100%' stop-color='#050507' stop-opacity='1'/>
    </radialGradient>
    <linearGradient id='caseGrad-${name}' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${caseColor}'/>
      <stop offset='50%' stop-color='#1a1b24'/>
      <stop offset='100%' stop-color='${caseColor}'/>
    </linearGradient>
    <linearGradient id='strapGrad-${name}' x1='0%' y1='0%' x2='0%' y2='100%'>
      <stop offset='0%' stop-color='${strapColor}'/>
      <stop offset='100%' stop-color='#0a0a0d'/>
    </linearGradient>
    <filter id='shadow-${name}' x='-20%' y='-20%' width='140%' height='140%'>
      <feDropShadow dx='0' dy='12' stdDeviation='14' flood-color='#000000' flood-opacity='0.75'/>
    </filter>
  </defs>

  <!-- Straps (Top and Bottom) -->
  <rect x='152' y='10' width='96' height='100' rx='6' fill='url(#strapGrad-${name})' />
  <rect x='152' y='290' width='96' height='100' rx='6' fill='url(#strapGrad-${name})' />
  <line x1='158' y1='10' x2='158' y2='110' stroke='rgba(255,255,255,0.1)' stroke-dasharray='4,4'/>
  <line x1='242' y1='10' x2='242' y2='110' stroke='rgba(255,255,255,0.1)' stroke-dasharray='4,4'/>
  <line x1='158' y1='290' x2='158' y2='390' stroke='rgba(255,255,255,0.1)' stroke-dasharray='4,4'/>
  <line x1='242' y1='290' x2='242' y2='390' stroke='rgba(255,255,255,0.1)' stroke-dasharray='4,4'/>

  <!-- Outer Watch Case with Lugs -->
  <g filter='url(#shadow-${name})'>
    <!-- Lugs -->
    <path d='M146,80 L160,140 L240,140 L254,80 Z' fill='${caseColor}' opacity='0.9'/>
    <path d='M146,320 L160,260 L240,260 L254,320 Z' fill='${caseColor}' opacity='0.9'/>

    <!-- Crown & Pushers -->
    <rect x='325' y='188' width='14' height='24' rx='3' fill='${accentColor}'/>
    ${chronoPushers}

    <!-- Bezel -->
    <circle cx='200' cy='200' r='128' fill='url(#caseGrad-${name})' stroke='${accentColor}' stroke-width='2'/>
    <circle cx='200' cy='200' r='118' fill='#08090d' stroke='rgba(255,255,255,0.1)' stroke-width='1'/>
    
    <!-- Dial -->
    <circle cx='200' cy='200' r='112' fill='url(#dialGrad-${name})'/>
    
    <!-- Subtle Guilloche Circles -->
    <circle cx='200' cy='200' r='85' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='1'/>
    <circle cx='200' cy='200' r='60' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='1'/>

    <!-- Hour Markers -->
    ${hourMarkers}

    <!-- Chrono sub-dials -->
    ${chronoSubdials}

    <!-- Brand Emblem & Text -->
    <polygon points='200,132 194,142 206,142' fill='${accentColor}' />
    <text x='200' y='154' fill='#ffffff' font-family='serif' font-size='11' font-weight='600' letter-spacing='3' text-anchor='middle'>APEX</text>
    <text x='200' y='163' fill='${accentColor}' font-family='sans-serif' font-size='6.5' letter-spacing='1.5' text-anchor='middle'>CHRONOMETRE</text>

    <!-- Date Window -->
    <rect x='254' y='193' width='22' height='14' rx='2' fill='#0e1017' stroke='${accentColor}' stroke-width='0.8'/>
    <text x='265' y='203.5' fill='#ffffff' font-family='sans-serif' font-size='8.5' font-weight='bold' text-anchor='middle'>18</text>

    <!-- Hands -->
    <line x1='200' y1='200' x2='160' y2='160' stroke='${accentColor}' stroke-width='4' stroke-linecap='round'/>
    <line x1='200' y1='200' x2='248' y2='130' stroke='${accentColor}' stroke-width='2.8' stroke-linecap='round'/>
    <line x1='200' y1='214' x2='200' y2='104' stroke='#e53e3e' stroke-width='1.2'/>
    <!-- Centre Cap -->
    <circle cx='200' cy='200' r='5' fill='${accentColor}' stroke='#000' stroke-width='1'/>
    <circle cx='200' cy='200' r='2' fill='#e53e3e'/>

    <!-- Lower Inscription -->
    <text x='200' y='268' fill='rgba(255,255,255,0.45)' font-family='sans-serif' font-size='6' letter-spacing='1' text-anchor='middle'>AUTOMATIC 42H</text>
    <text x='200' y='277' fill='rgba(255,255,255,0.3)' font-family='sans-serif' font-size='5.5' letter-spacing='1.5' text-anchor='middle'>SWISS ENGINE</text>
  </g>
</svg>`;
}

function blogSvg(title, bgGradient) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 380' width='100%' height='100%'>
    <defs>
      <linearGradient id='bg-${title.replace(/\\s+/g, '')}' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${bgGradient[0]}'/>
        <stop offset='100%' stop-color='${bgGradient[1]}'/>
      </linearGradient>
    </defs>
    <rect width='600' height='380' fill='url(#bg-${title.replace(/\\s+/g, '')})'/>
    <circle cx='480' cy='120' r='140' fill='rgba(200,169,110,0.06)'/>
    <circle cx='120' cy='300' r='180' fill='rgba(200,169,110,0.03)'/>
    <polygon points='300,120 280,155 320,155' fill='#c8a96e' opacity='0.9'/>
    <text x='300' y='185' fill='#ffffff' font-family='serif' font-size='22' letter-spacing='4' font-weight='600' text-anchor='middle'>APEX ATELIER</text>
    <text x='300' y='212' fill='#c8a96e' font-family='sans-serif' font-size='12' letter-spacing='2' text-anchor='middle'>${title.toUpperCase()}</text>
  </svg>`;
}

const variants = [
  ['ph-black-gold-1.svg', '#23242e', '#0f1015', '#c8a96e', '#191308'],
  ['ph-black-gold-2.svg', '#1c1d24', '#0d0e13', '#dfcaa0', '#2a2215'],
  ['ph-silver-blue-1.svg', '#9ca3af', '#142238', '#e5e7eb', '#1e293b'],
  ['ph-silver-blue-2.svg', '#6b7280', '#0f1b2d', '#93c5fd', '#0f172a'],
  ['ph-green-1.svg', '#1f2937', '#0f241a', '#34d399', '#142c1e'],
  ['ph-green-2.svg', '#111827', '#0a1d14', '#10b981', '#064e3b'],
  ['ph-rose-1.svg', '#be7b72', '#261517', '#e2a89f', '#44282c'],
  ['ph-rose-2.svg', '#a8655c', '#1d1012', '#f3c5bd', '#331a1d'],
  ['ph-white-silver-1.svg', '#9ca3af', '#f8fafc', '#c8a96e', '#3e2c1c'],
  ['ph-white-silver-2.svg', '#d1d5db', '#f1f5f9', '#b38f4d', '#292524'],
  ['ph-chrono-1.svg', '#1f2029', '#0d0e14', '#f59e0b', '#18181b', true],
  ['ph-chrono-2.svg', '#27272a', '#111218', '#ef4444', '#09090b', true],
  ['ph-sport-1.svg', '#374151', '#0f172a', '#38bdf8', '#0284c7'],
  ['ph-sport-2.svg', '#1f2937', '#0c1222', '#60a5fa', '#0369a1'],
  ['ph-bronze-1.svg', '#78350f', '#291809', '#d97706', '#451a03'],
  ['ph-bronze-2.svg', '#92400e', '#1c1007', '#b45309', '#3b1c06'],
];

variants.forEach(([fn, c, d, a, s, ch]) => {
  fs.writeFileSync(path.join(dir, fn), watchSvg(fn, c, d, a, s, !!ch));
});

fs.writeFileSync(path.join(dir, 'blog-1.svg'), blogSvg('The Philosophy of Time', ['#111218', '#070709']));
fs.writeFileSync(path.join(dir, 'blog-2.svg'), blogSvg('Connoisseur Guide', ['#181a24', '#0a0c10']));
fs.writeFileSync(path.join(dir, 'blog-3.svg'), blogSvg('Horology Care & Longevity', ['#1a1917', '#090908']));

console.log('✅ Successfully generated ' + (variants.length + 3) + ' vector graphics in public/img/');
