/**
 * Full-colour emblem illustrations, drawn for this app (no third-party rights).
 *
 * Same symbols as the line emblems in ./emblems.ts (trishula and damaru, gada,
 * modak, khadga, lotus, Sudarshana chakra, veena, Saturn, rising sun, treasure
 * pot), rendered with gradients and highlights so they read as real objects.
 *
 * Each value is a complete SVG document (viewBox 0 0 100 100) rendered in the
 * app with react-native-svg's SvgXml. Gradient ids are prefixed with the deity
 * id so several emblems can share a screen (and a DOM on web) without clashing.
 * Pure data: no React Native imports, so Node scripts can render it too.
 */

type Stop = [offset: number, color: string, opacity?: number];

const stops = (s: Stop[]) => s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');
const linear = (id: string, x1: number, y1: number, x2: number, y2: number, s: Stop[]) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
const radial = (id: string, cx: number, cy: number, r: number, s: Stop[]) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`;
const svg = (defs: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs>${body}</svg>`;
const r2 = (n: number) => Math.round(n * 100) / 100;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/* Shared palettes. */
const GOLD_BALL: Stop[] = [[0, '#FFF7D1'], [0.25, '#F9D25A'], [0.55, '#E0A526'], [0.85, '#A86B12'], [1, '#6B400A']];
const GOLD_BAND: Stop[] = [[0, '#7A4A0E'], [0.3, '#E8B33A'], [0.5, '#FFF0B0'], [0.7, '#C98B1A'], [1, '#6B400A']];
const GOLD_ROD: Stop[] = [[0, '#6B400A'], [0.3, '#C98B1A'], [0.5, '#FFE8A0'], [0.7, '#C98B1A'], [1, '#6B400A']];
const STEEL: Stop[] = [[0, '#4E5965'], [0.32, '#B4C0CC'], [0.5, '#FFFFFF'], [0.66, '#A9B5C1'], [1, '#46505B']];
const RUBY: Stop[] = [[0, '#FFB4A8'], [0.35, '#E53935'], [1, '#6D0F0F']];
const CLOTH_RED: Stop[] = [[0, '#4A0B0B'], [0.4, '#B3261E'], [0.5, '#E0553F'], [0.62, '#A21E17'], [1, '#4A0B0B']];

/** Small faceted gem with a highlight. */
const gem = (id: string, cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/><circle cx="${r2(cx - r * 0.35)}" cy="${r2(cy - r * 0.35)}" r="${r2(r * 0.3)}" fill="#FFFFFF" opacity="0.8"/>`;

/** Soft white specular highlight. */
const spec = (id: string, cx: number, cy: number, rx: number, ry: number, rot = -30) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#${id})"/>`;
const SPEC: Stop[] = [[0, '#FFFFFF', 0.85], [1, '#FFFFFF', 0]];

/* ------------------------------------------------------------------ */

function hanuman(): string {
  const p = 'hanuman-';
  const defs =
    radial(`${p}head`, 0.38, 0.32, 0.75, GOLD_BALL) +
    linear(`${p}band`, 0, 0, 0, 1, GOLD_BAND) +
    linear(`${p}rod`, 0, 0, 1, 0, GOLD_ROD) +
    linear(`${p}grip`, 0, 0, 1, 0, CLOTH_RED) +
    radial(`${p}ruby`, 0.35, 0.35, 0.7, RUBY) +
    radial(`${p}spec`, 0.5, 0.5, 0.5, SPEC);
  // Meridian ridges on the mace head.
  const ridges = [-0.8, -0.45, 0, 0.45, 0.8]
    .map((k) => `<path d="M50 11.3 C${r2(50 + k * 28)} 19 ${r2(50 + k * 28)} 45 50 52.7" fill="none" stroke="#7A4A0E" stroke-width="0.8" opacity="0.5"/>`)
    .join('');
  const ridgeLights = [-0.62, -0.25, 0.2]
    .map((k) => `<path d="M50 11.6 C${r2(50 + k * 28)} 19 ${r2(50 + k * 28)} 45 50 52.4" fill="none" stroke="#FFF3C4" stroke-width="0.5" opacity="0.45"/>`)
    .join('');
  const gems = (
    [
    [36, 35.4, 1.2],
    [43, 36.8, 1.5],
    [50, 37.3, 1.7],
    [57, 36.8, 1.5],
    [64, 35.4, 1.2],
  ] as [number, number, number][]
  )
    .map(([x, y, r]) => gem(`${p}ruby`, x, y, r))
    .join('');
  const wraps = range(5)
    .map((i) => `<line x1="46.6" y1="${69 + i * 3}" x2="53.4" y2="${67 + i * 3}" stroke="#F2C14E" stroke-width="0.6"/>`)
    .join('');
  return svg(
    defs,
    `<circle cx="50" cy="89.6" r="4.2" fill="url(#${p}head)"/>` +
      `<path d="M48.5 93.2 L50 97.2 L51.5 93.2 Z" fill="url(#${p}band)"/>` +
      `<rect x="46.8" y="55" width="6.4" height="33" rx="1" fill="url(#${p}rod)"/>` +
      `<rect x="46.5" y="66.5" width="7" height="16.5" rx="1" fill="url(#${p}grip)"/>` +
      wraps +
      `<rect x="45.6" y="64.4" width="8.8" height="2.6" rx="1" fill="url(#${p}band)"/>` +
      `<rect x="45.6" y="82.6" width="8.8" height="2.6" rx="1" fill="url(#${p}band)"/>` +
      `<path d="M41 57 H59 L56.5 52 H43.5 Z" fill="url(#${p}band)"/>` +
      `<rect x="44" y="56.6" width="12" height="2.8" rx="1" fill="url(#${p}band)"/>` +
      `<circle cx="50" cy="32" r="21" fill="url(#${p}head)"/>` +
      ridges +
      ridgeLights +
      `<path d="M29.1 30.2 C36 36.6 64 36.6 70.9 30.2 L70.9 35.2 C64 41.6 36 41.6 29.1 35.2 Z" fill="url(#${p}band)"/>` +
      gems +
      spec(`${p}spec`, 41, 21, 6.5, 3.6) +
      `<path d="M44 12.2 H56 L54 9.4 H46 Z" fill="url(#${p}band)"/>` +
      `<circle cx="50" cy="6.8" r="3" fill="url(#${p}head)"/>` +
      `<path d="M48.7 4.4 L50 0.8 L51.3 4.4 Z" fill="url(#${p}band)"/>`,
  );
}

function shiva(): string {
  const p = 'shiva-';
  const defs =
    linear(`${p}steel`, 0, 0, 1, 0, STEEL) +
    linear(`${p}shaft`, 0, 0, 1, 0, [[0, '#2F363E'], [0.35, '#8E9AA6'], [0.5, '#E6ECF2'], [0.7, '#76818D'], [1, '#2B3138']]) +
    linear(`${p}band`, 0, 0, 0, 1, GOLD_BAND) +
    radial(`${p}ball`, 0.38, 0.32, 0.75, GOLD_BALL) +
    linear(`${p}wood`, 0, 0, 1, 0, [[0, '#3E1E0C'], [0.3, '#8B4A22'], [0.5, '#C47A3E'], [0.7, '#8B4A22'], [1, '#3E1E0C']]) +
    radial(`${p}skin`, 0.45, 0.4, 0.7, [[0, '#FFF8E6'], [1, '#D9BE8C']]) +
    linear(`${p}cord`, 0, 0, 0, 1, CLOTH_RED);
  // Lacing on the damaru: top half and bottom half.
  const lace = [0, 1, 2, 3, 4]
    .map((i) => {
      const xt = 42.4 + i * 3.8;
      const xw = 48.3 + i * 0.85;
      return `<line x1="${r2(xt)}" y1="57.6" x2="${r2(xw)}" y2="64" stroke="#F3E2C0" stroke-width="0.45" opacity="0.85"/><line x1="${r2(xw)}" y1="66" x2="${r2(xt)}" y2="72.4" stroke="#F3E2C0" stroke-width="0.45" opacity="0.85"/>`;
    })
    .join('');
  return svg(
    defs,
    `<rect x="48.4" y="44" width="3.2" height="52" rx="1.2" fill="url(#${p}shaft)"/>` +
      `<path d="M50 43 C37 43 27.5 35 27 22 L26.4 8.6 L31.6 19.5 C32 30 39 36 50 36 Z" fill="url(#${p}steel)"/>` +
      `<path d="M50 43 C63 43 72.5 35 73 22 L73.6 8.6 L68.4 19.5 C68 30 61 36 50 36 Z" fill="url(#${p}steel)"/>` +
      `<path d="M29.3 21 C30 31 38 38.6 49 39.3" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.55"/>` +
      `<path d="M70.7 21 C70 31 62 38.6 51 39.3" fill="none" stroke="#2E353D" stroke-width="0.5" opacity="0.5"/>` +
      `<path d="M50 2.6 C54.6 9 57.2 16 55.6 24 L53 38.5 H47 L44.4 24 C42.8 16 45.4 9 50 2.6 Z" fill="url(#${p}steel)"/>` +
      `<path d="M50 6 V36.5" stroke="#FFFFFF" stroke-width="0.7" opacity="0.7"/>` +
      `<path d="M51.2 9 L51.2 36" stroke="#3E4650" stroke-width="0.4" opacity="0.5"/>` +
      `<rect x="43" y="38" width="14" height="3.2" rx="1" fill="url(#${p}band)"/>` +
      `<rect x="44.5" y="41" width="11" height="2.8" rx="1" fill="url(#${p}band)"/>` +
      `<circle cx="50" cy="46" r="2.1" fill="url(#${p}ball)"/>` +
      // Damaru tied to the shaft, drawn larger than life so it reads at small sizes.
      `<g transform="translate(50 65) scale(1.35) translate(-50 -65)">` +
      `<path d="M41 57 H59 L52.2 65 H47.8 Z" fill="url(#${p}wood)"/>` +
      `<path d="M47.8 65 H52.2 L59 73 H41 Z" fill="url(#${p}wood)"/>` +
      lace +
      `<ellipse cx="50" cy="57" rx="9" ry="2.2" fill="url(#${p}skin)" stroke="#6B3A17" stroke-width="0.5"/>` +
      `<ellipse cx="50" cy="73" rx="9" ry="2.2" fill="url(#${p}skin)" stroke="#6B3A17" stroke-width="0.5"/>` +
      `<rect x="46.6" y="63.6" width="6.8" height="2.8" rx="1.2" fill="url(#${p}cord)"/>` +
      `<path d="M53.4 65.2 C57.8 66 60 69 59.6 72.6" fill="none" stroke="#B71C1C" stroke-width="0.9"/>` +
      `<circle cx="59.6" cy="74" r="1.6" fill="url(#${p}ball)"/>` +
      `<path d="M46.6 65.2 C42.2 66 40 69 40.4 72.6" fill="none" stroke="#B71C1C" stroke-width="0.9"/>` +
      `<circle cx="40.4" cy="74" r="1.6" fill="url(#${p}ball)"/>` +
      `<path d="M58.6 75.4 L58 79.4 M59.6 75.6 V79.8 M60.6 75.4 L61.2 79.4" stroke="#C62828" stroke-width="0.7" stroke-linecap="round"/>` +
      `</g>`,
  );
}

function ganesha(): string {
  const p = 'ganesha-';
  const defs =
    radial(`${p}dough`, 0.4, 0.35, 0.8, [[0, '#FFF1CF'], [0.35, '#F6CF86'], [0.72, '#DE9A45'], [1, '#97561C']]) +
    radial(`${p}marigold`, 0.45, 0.4, 0.65, [[0, '#FFE082'], [0.45, '#FFA000'], [1, '#D84315']]) +
    linear(`${p}plate`, 0, 0, 0, 1, [[0, '#FFF0B8'], [0.45, '#E3AE45'], [1, '#8A5A12']]) +
    radial(`${p}inner`, 0.5, 0.35, 0.7, [[0, '#FBE3A0'], [0.6, '#D9A23A'], [1, '#A06A16']]) +
    linear(`${p}foot`, 0, 0, 0, 1, GOLD_BAND) +
    linear(`${p}grass`, 0, 0, 1, 0, [[0, '#2E6B1F'], [1, '#8BC34A']]) +
    radial(`${p}spec`, 0.5, 0.5, 0.5, SPEC);
  // A round, pleated ukadiche modak with a short twisted tip.
  const body = 'M50 25 C52.5 31 58 35 63.5 41 C70 48 73.5 55 73.5 63 C73.5 73.5 63 79.5 50 79.5 C37 79.5 26.5 73.5 26.5 63 C26.5 55 30 48 36.5 41 C42 35 47.5 31 50 25 Z';
  // Nine fine pleats, gathered at the tip.
  const ends: [number, number][] = [
    [28.5, 69],
    [33, 74.2],
    [38.5, 77.4],
    [44, 79],
    [50, 79.5],
    [56, 79],
    [61.5, 77.4],
    [67, 74.2],
    [71.5, 69],
  ];
  const pleats = ends
    .map(
      ([x, y]) =>
        `<path d="M50 27 C${r2(50 + (x - 50) * 0.45)} 38 ${r2(50 + (x - 50) * 1.0)} 54 ${x} ${y}" fill="none" stroke="#8A4A14" stroke-width="0.7" opacity="0.6"/>` +
        `<path d="M50.6 28 C${r2(51.4 + (x - 50) * 0.45)} 38 ${r2(51.6 + (x - 50) * 1.0)} 54 ${r2(x + 1.4)} ${r2(y - 0.6)}" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.5"/>`,
    )
    .join('');
  const tip = `<path d="M48.6 26.5 C49 23 50.6 20.4 52.8 19.2 C51.8 22 51.7 24.4 51.4 26.5 Z" fill="url(#${p}dough)"/>`;
  const modak = (tx: number, ty: number, s: number, withPleats: boolean) =>
    `<g transform="translate(${tx} ${ty}) scale(${s})"><path d="${body}" fill="url(#${p}dough)"/>${withPleats ? pleats : ''}${tip}</g>`;
  const smallPleats = (tx: number) =>
    [-8, 0, 8].map((dx) => `<path d="M${tx + 25} 55 C${r2(tx + 25 + dx * 0.45)} 61 ${r2(tx + 25 + dx)} 69 ${r2(tx + 25 + dx)} 79.6" fill="none" stroke="#8A4A14" stroke-width="0.6" opacity="0.7"/>`).join('');
  const marigold = (x: number, y: number, r: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}marigold)"/>` +
    `<circle cx="${x}" cy="${y}" r="${r2(r * 0.7)}" fill="none" stroke="#FFCA28" stroke-width="${r2(r * 0.28)}" stroke-dasharray="0.1 ${r2(r * 0.42)}" stroke-linecap="round"/>` +
    `<circle cx="${x}" cy="${y}" r="${r2(r * 0.3)}" fill="#E65100"/>`;
  return svg(
    defs,
    `<path d="M37 87 H63 L59.5 92 H40.5 Z" fill="url(#${p}foot)"/>` +
      `<ellipse cx="50" cy="81.5" rx="42" ry="9.5" fill="url(#${p}plate)"/>` +
      `<ellipse cx="50" cy="80.6" rx="36" ry="6.6" fill="url(#${p}inner)"/>` +
      `<ellipse cx="50" cy="81.5" rx="41.2" ry="8.9" fill="none" stroke="#FFF4C8" stroke-width="0.6" opacity="0.6"/>` +
      modak(2, 41.5, 0.5, false) +
      smallPleats(2) +
      modak(48, 41.5, 0.5, false) +
      smallPleats(48) +
      modak(0, 0, 1, true) +
      spec(`${p}spec`, 39, 52, 5, 8, 20) +
      // Durva grass, sacred to Ganesha, laid on the plate.
      `<path d="M30 84.6 C38 82.6 46 83.4 52 85.6" fill="none" stroke="url(#${p}grass)" stroke-width="1.1" stroke-linecap="round"/>` +
      `<path d="M31 86.4 C39 85.6 47 86.6 53.6 89" fill="none" stroke="url(#${p}grass)" stroke-width="1.1" stroke-linecap="round"/>` +
      `<path d="M33 83 C40 80.6 47.4 80.8 53 82.6" fill="none" stroke="url(#${p}grass)" stroke-width="1" stroke-linecap="round"/>` +
      marigold(14, 82, 4.6) +
      marigold(86, 82, 4.6) +
      marigold(22.5, 87.2, 3.4) +
      marigold(77.5, 87.2, 3.4),
  );
}

function durga(): string {
  const p = 'durga-';
  const defs =
    radial(`${p}halo`, 0.5, 0.5, 0.5, [[0, '#FF8A65', 0.55], [0.6, '#D32F2F', 0.32], [1, '#7F0000', 0]]) +
    linear(`${p}ring`, 0, 0, 1, 1, [[0, '#FFF0B0'], [0.5, '#E0A526'], [1, '#8A5A12']]) +
    linear(`${p}steel`, 0, 0, 1, 0, STEEL) +
    linear(`${p}band`, 0, 0, 0, 1, GOLD_BAND) +
    radial(`${p}ball`, 0.38, 0.32, 0.75, GOLD_BALL) +
    linear(`${p}grip`, 0, 0, 1, 0, CLOTH_RED) +
    radial(`${p}ruby`, 0.35, 0.35, 0.7, RUBY);
  const wraps = range(4)
    .map((i) => `<line x1="46.8" y1="${72 + i * 3}" x2="53.2" y2="${70 + i * 3}" stroke="#F2C14E" stroke-width="0.6"/>`)
    .join('');
  return svg(
    defs,
    `<circle cx="50" cy="46" r="40" fill="url(#${p}halo)"/>` +
      `<circle cx="50" cy="46" r="36" fill="none" stroke="url(#${p}ring)" stroke-width="1.4"/>` +
      `<circle cx="50" cy="46" r="32.6" fill="none" stroke="#F7C948" stroke-width="1" stroke-dasharray="0.1 2.6" stroke-linecap="round" opacity="0.85"/>` +
      `<path d="M45.8 66 L45 31 C44.6 21 46.6 12.5 50 5 C54 11.5 57.4 19.5 56.6 30 L54.2 66 Z" fill="url(#${p}steel)"/>` +
      `<path d="M46.4 64 L45.7 31 C45.4 22 47.2 14 50 7.6" fill="none" stroke="#FFFFFF" stroke-width="0.5" opacity="0.5"/>` +
      `<path d="M50 12 C50.6 25 50.6 45 50 64" fill="none" stroke="#FFFFFF" stroke-width="0.8" opacity="0.75"/>` +
      `<path d="M51.3 14 C51.9 27 51.7 45 51.3 64" fill="none" stroke="#5B6672" stroke-width="0.5" opacity="0.55"/>` +
      `<path d="M31 66 C31 61.5 36 62 41 64.2 H59 C64 62 69 61.5 69 66 C69 70.5 64 70 59 68.2 H41 C36 70 31 70.5 31 66 Z" fill="url(#${p}band)"/>` +
      `<circle cx="31.8" cy="66" r="1.9" fill="url(#${p}ball)"/>` +
      `<circle cx="68.2" cy="66" r="1.9" fill="url(#${p}ball)"/>` +
      gem(`${p}ruby`, 50, 66.2, 2.4) +
      `<rect x="46.6" y="68.4" width="6.8" height="14" rx="1.4" fill="url(#${p}grip)"/>` +
      wraps +
      `<path d="M44.5 83 H55.5 L53.5 85.6 H46.5 Z" fill="url(#${p}band)"/>` +
      `<circle cx="50" cy="88.4" r="3.6" fill="url(#${p}ball)"/>` +
      `<path d="M48.7 91.6 L50 94.8 L51.3 91.6 Z" fill="url(#${p}band)"/>`,
  );
}

function lakshmi(): string {
  const p = 'lakshmi-';
  const defs =
    linear(`${p}back`, 0.5, 1, 0.5, 0, [[0, '#AD1457'], [0.45, '#E91E63'], [0.85, '#F8BBD0'], [1, '#FFF0F5']]) +
    linear(`${p}front`, 0.5, 1, 0.5, 0, [[0, '#D81B60'], [0.4, '#F06292'], [0.88, '#FCE4EC'], [1, '#FFFFFF']]) +
    radial(`${p}leaf`, 0.45, 0.4, 0.75, [[0, '#AED581'], [0.5, '#558B2F'], [1, '#2E5E1A']]) +
    linear(`${p}water`, 0, 0, 0, 1, [[0, '#4FC3F7', 0.55], [1, '#01579B', 0.15]]) +
    radial(`${p}gold`, 0.4, 0.35, 0.7, GOLD_BALL) +
    linear(`${p}sepal`, 0, 0, 0, 1, [[0, '#7CB342'], [1, '#33691E']]);
  const petal = (d: string, fill: 'back' | 'front', vein: string) =>
    `<path d="${d}" fill="url(#${p}${fill})"/><path d="${vein}" fill="none" stroke="#FFFFFF" stroke-width="0.45" opacity="0.4"/>`;
  const stamens = [43.5, 46.5, 49.5, 52.5, 55.5]
    .map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 62.6 : 63.6}" r="1.5" fill="url(#${p}gold)"/>`)
    .join('');
  return svg(
    defs,
    `<ellipse cx="50" cy="82" rx="45" ry="9" fill="url(#${p}water)"/>` +
      `<path d="M14 87 Q26 84 38 87 M62 87 Q74 84 86 87 M28 92 Q39 89.5 50 92 T72 92" fill="none" stroke="#81D4FA" stroke-width="0.8" opacity="0.75"/>` +
      // Lily pads.
      `<path d="M6 80 C8 72.6 22 69.6 33 72 L29.4 77.4 L36.4 77 C32.4 83.4 13 85.4 6 80 Z" fill="url(#${p}leaf)"/>` +
      `<path d="M94 80 C92 72.6 78 69.6 67 72 L70.6 77.4 L63.6 77 C67.6 83.4 87 85.4 94 80 Z" fill="url(#${p}leaf)"/>` +
      `<path d="M30 77.4 L12 78 M30 77.4 L18 74.4 M30 77.4 L19 82" stroke="#C5E1A5" stroke-width="0.45" opacity="0.6"/>` +
      `<path d="M70 77.4 L88 78 M70 77.4 L82 74.4 M70 77.4 L81 82" stroke="#C5E1A5" stroke-width="0.45" opacity="0.6"/>` +
      // Back row.
      petal('M50 70 C36 72 20 65 13 50 C29 47 42 54 50 70 Z', 'back', 'M48 69 C38 63 26 56 16 51') +
      petal('M50 70 C64 72 80 65 87 50 C71 47 58 54 50 70 Z', 'back', 'M52 69 C62 63 74 56 84 51') +
      petal('M50 70 C38 67 29 55 28 37 C40 41 48 53 50 70 Z', 'back', 'M49 68 C42 60 33 50 29.5 39') +
      petal('M50 70 C62 67 71 55 72 37 C60 41 52 53 50 70 Z', 'back', 'M51 68 C58 60 67 50 70.5 39') +
      petal('M50 70 C42 58 41 40 50 22 C59 40 58 58 50 70 Z', 'front', 'M50 68 V25') +
      stamens +
      // Front row.
      petal('M50 72 C40 71 30.5 64 26.5 53.5 C38 52.6 46 60 50 72 Z', 'front', 'M49 71 C42 66 34 60 29 55') +
      petal('M50 72 C60 71 69.5 64 73.5 53.5 C62 52.6 54 60 50 72 Z', 'front', 'M51 71 C58 66 66 60 71 55') +
      petal('M50 73 C43 70 37.5 62 37.5 51.5 C45.5 55 49.4 63 50 73 Z', 'front', 'M49.6 71.6 C46 66 40.6 59 39 53') +
      petal('M50 73 C57 70 62.5 62 62.5 51.5 C54.5 55 50.6 63 50 73 Z', 'front', 'M50.4 71.6 C54 66 59.4 59 61 53') +
      `<path d="M41.5 71.2 C45.5 75 54.5 75 58.5 71.2 C55 73 45 73 41.5 71.2 Z" fill="url(#${p}sepal)"/>`,
  );
}

function vishnu(): string {
  const p = 'vishnu-';
  const defs =
    linear(`${p}flame`, 0, 1, 0, 0, [[0, '#E65100'], [0.45, '#FF9800'], [0.8, '#FFD54F'], [1, '#FFF8E1']]) +
    linear(`${p}tooth`, 0, 1, 0, 0, [[0, '#8A5A12'], [0.5, '#F2C14E'], [1, '#FFF4C8']]) +
    radial(`${p}ring`, 0.42, 0.38, 0.65, [[0, '#FFF2B8'], [0.5, '#E8B33A'], [0.85, '#B07A1A'], [1, '#7A4A0E']]) +
    radial(`${p}disc`, 0.45, 0.4, 0.7, [[0, '#C62828'], [0.65, '#7F1212'], [1, '#3E0707']]) +
    linear(`${p}spoke`, 0, 0, 1, 0, [[0, '#9A6414'], [0.5, '#FFE8A0'], [1, '#9A6414']]) +
    radial(`${p}hub`, 0.38, 0.32, 0.75, GOLD_BALL) +
    radial(`${p}ruby`, 0.35, 0.35, 0.7, RUBY) +
    radial(`${p}spec`, 0.5, 0.5, 0.5, SPEC);
  const at = (deg: number, shape: string) => `<g transform="translate(50 50) rotate(${deg})">${shape}</g>`;
  const flames = range(12)
    .map((i) => at(i * 30 + 15, `<path d="M0 -47.5 C2.6 -43 4.8 -40 3.8 -35.5 C3.2 -33.4 1.6 -32.2 0 -32.2 C-1.6 -32.2 -3.2 -33.4 -3.8 -35.5 C-4.8 -40 -2.6 -43 0 -47.5 Z" fill="url(#${p}flame)"/>`))
    .join('');
  const teeth = range(24)
    .map((i) => at(i * 15, `<path d="M-3 -32.6 L0 -40.6 L3 -32.6 Z" fill="url(#${p}tooth)"/>`))
    .join('');
  const spokes = range(12)
    .map((i) => at(i * 30, `<path d="M-1.5 -8 L0 -25 L1.5 -8 Z" fill="url(#${p}spoke)"/>`))
    .join('');
  return svg(
    defs,
    flames +
      teeth +
      `<circle cx="50" cy="50" r="33.4" fill="url(#${p}ring)"/>` +
      `<circle cx="50" cy="50" r="30" fill="none" stroke="#7A4A0E" stroke-width="1.4" stroke-dasharray="0.1 3.1" stroke-linecap="round"/>` +
      `<circle cx="50" cy="50" r="26.6" fill="url(#${p}disc)" stroke="#5A3608" stroke-width="0.6"/>` +
      spokes +
      `<circle cx="50" cy="50" r="25.6" fill="none" stroke="#F2C14E" stroke-width="0.9"/>` +
      `<circle cx="50" cy="50" r="8.4" fill="url(#${p}hub)"/>` +
      `<circle cx="50" cy="50" r="5.6" fill="none" stroke="#7A4A0E" stroke-width="0.5"/>` +
      gem(`${p}ruby`, 50, 50, 3) +
      spec(`${p}spec`, 36, 28, 8, 3),
  );
}

function saraswati(): string {
  const p = 'saraswati-';
  const defs =
    radial(`${p}kudam`, 0.38, 0.32, 0.8, [[0, '#E9AE6E'], [0.45, '#A0522D'], [1, '#4A200A']]) +
    radial(`${p}gourd`, 0.38, 0.32, 0.8, [[0, '#F7C98A'], [0.5, '#C76A1E'], [1, '#6B300A']]) +
    linear(`${p}neck`, 0, 0, 1, 0, [[0, '#2E150A'], [0.3, '#7B3F1A'], [0.5, '#B5703A'], [0.7, '#6B3415'], [1, '#2E150A']]) +
    linear(`${p}band`, 0, 0, 0, 1, GOLD_BAND) +
    radial(`${p}ball`, 0.38, 0.32, 0.75, GOLD_BALL) +
    radial(`${p}spec`, 0.5, 0.5, 0.5, SPEC);
  const frets = [38, 42, 46, 50, 54, 58, 62]
    .map((y) => `<rect x="45.4" y="${y}" width="9.2" height="0.9" rx="0.3" fill="#F2C14E"/>`)
    .join('');
  const strings = [47.6, 49.2, 50.8, 52.4].map((x) => `<line x1="${x}" y1="14" x2="${x}" y2="86.4" stroke="#FBF6E6" stroke-width="0.35" opacity="0.9"/>`).join('');
  const pegs = [
    [44.2, 18.5],
    [44.2, 23],
    [55.8, 18.5],
    [55.8, 23],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.25" fill="url(#${p}ball)"/>`)
    .join('');
  return svg(
    defs,
    `<g transform="rotate(-30 50 52)">` +
      `<circle cx="50" cy="28" r="9.5" fill="url(#${p}gourd)"/>` +
      `<ellipse cx="50" cy="36.6" rx="4.2" ry="1.4" fill="url(#${p}band)"/>` +
      `<rect x="45.2" y="14" width="9.6" height="57" rx="2" fill="url(#${p}neck)"/>` +
      frets +
      pegs +
      `<circle cx="50" cy="80" r="15.5" fill="url(#${p}kudam)"/>` +
      `<circle cx="50" cy="80" r="12.6" fill="none" stroke="#F2C14E" stroke-width="0.8" opacity="0.9"/>` +
      `<circle cx="50" cy="80" r="11.2" fill="none" stroke="#F2C14E" stroke-width="0.9" stroke-dasharray="0.1 2.2" stroke-linecap="round" opacity="0.9"/>` +
      `<circle cx="50" cy="82.5" r="3.8" fill="none" stroke="#F2C14E" stroke-width="0.7"/>` +
      `<path d="M43.4 66.5 H56.6 L55 71 H45 Z" fill="url(#${p}band)"/>` +
      `<rect x="44.4" y="85.6" width="11.2" height="2.2" rx="0.6" fill="#F5E6C8" stroke="#8A6A3A" stroke-width="0.3"/>` +
      strings +
      spec(`${p}spec`, 44, 73, 5, 2.6, -20) +
      `<rect x="45.4" y="11.6" width="9.2" height="3.4" rx="1" fill="url(#${p}band)"/>` +
      // Carved scroll head.
      `<path d="M48 12 C46.8 6.6 50 2.6 54.6 3.2 C58.6 3.8 59.6 8.4 56.6 10.2 C54.6 11.3 52.4 9.9 53.4 8.1" fill="none" stroke="url(#${p}band)" stroke-width="2.3" stroke-linecap="round"/>` +
      `</g>`,
  );
}

function shani(): string {
  const p = 'shani-';
  const defs =
    radial(`${p}planet`, 0.35, 0.3, 0.8, [[0, '#C5D3F0'], [0.35, '#6F8CC7'], [0.7, '#34508F'], [1, '#142347']]) +
    linear(`${p}ring`, 0, 0, 1, 0, [[0, '#56688A'], [0.3, '#DDE6F5'], [0.5, '#9FB0CF'], [0.72, '#F2F5FB'], [1, '#56688A']]) +
    `<clipPath id="${p}clip"><circle cx="50" cy="50" r="20"/></clipPath>`;
  const sparkle = (x: number, y: number, s: number) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -3 L0.7 -0.7 L3 0 L0.7 0.7 L0 3 L-0.7 0.7 L-3 0 L-0.7 -0.7 Z" fill="#FFF3C4"/>`;
  return svg(
    defs,
    sparkle(16, 18, 1.1) +
      sparkle(84, 82, 0.9) +
      sparkle(82, 20, 0.6) +
      sparkle(22, 84, 0.55) +
      sparkle(90, 44, 0.45) +
      `<g transform="rotate(-18 50 50)">` +
      `<path d="M10 50 A40 11 0 0 1 90 50" fill="none" stroke="url(#${p}ring)" stroke-width="3.4"/>` +
      `<path d="M15.6 50 A34.4 8.4 0 0 1 84.4 50" fill="none" stroke="#8FA3C8" stroke-width="1.6" opacity="0.8"/>` +
      `</g>` +
      `<circle cx="50" cy="50" r="20" fill="url(#${p}planet)"/>` +
      `<g clip-path="url(#${p}clip)"><g transform="rotate(-18 50 50)">` +
      `<ellipse cx="50" cy="42.5" rx="26" ry="1.7" fill="#E3EBFA" opacity="0.28"/>` +
      `<ellipse cx="50" cy="46.5" rx="26" ry="1" fill="#0E1A38" opacity="0.32"/>` +
      `<ellipse cx="50" cy="53" rx="26" ry="2.2" fill="#E3EBFA" opacity="0.18"/>` +
      `<ellipse cx="50" cy="58.5" rx="26" ry="1.2" fill="#0E1A38" opacity="0.32"/>` +
      `</g></g>` +
      `<g transform="rotate(-18 50 50)">` +
      `<path d="M10 50 A40 11 0 0 0 90 50" fill="none" stroke="url(#${p}ring)" stroke-width="3.4"/>` +
      `<path d="M15.6 50 A34.4 8.4 0 0 0 84.4 50" fill="none" stroke="#8FA3C8" stroke-width="1.6" opacity="0.8"/>` +
      `</g>`,
  );
}

function gayatriSavitr(): string {
  const p = 'gayatri_savitr-';
  const defs =
    radial(`${p}glow`, 0.5, 1, 1, [[0, '#FFB74D', 0.6], [0.5, '#FF7043', 0.22], [1, '#FF7043', 0]]) +
    radial(`${p}sun`, 0.5, 0.95, 1, [[0, '#FFFDE7'], [0.35, '#FFE082'], [0.7, '#FFB300'], [1, '#F57C00']]) +
    linear(`${p}ray`, 0, 1, 0, 0, [[0, '#FF8F00'], [1, '#FFE082']]) +
    linear(`${p}water`, 0, 0, 0, 1, [[0, '#1E4A7A'], [1, '#0B1A2E', 0.2]]);
  const rays = range(13)
    .map((i) => {
      const a = -84 + i * 14;
      const d = i % 2 ? 'M-1.8 -23 L0 -31.5 L1.8 -23 Z' : 'M-2.3 -23 L0 -38 L2.3 -23 Z';
      return `<path transform="translate(50 64) rotate(${a})" d="${d}" fill="url(#${p}ray)"/>`;
    })
    .join('');
  const reflections = (
    [
    [68, 36],
    [72.4, 27],
    [76.6, 19],
    [80.6, 12],
    [84.4, 6],
  ] as [number, number][]
  )
    .map(([y, w], i) => `<line x1="${50 - w / 2}" y1="${y}" x2="${50 + w / 2}" y2="${y}" stroke="${i < 2 ? '#FFD54F' : '#FFB300'}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="${r2(w * 0.32)} 1.6" opacity="${r2(0.95 - i * 0.12)}"/>`)
    .join('');
  return svg(
    defs,
    `<path d="M4 64 A46 46 0 0 1 96 64 Z" fill="url(#${p}glow)"/>` +
      rays +
      `<path d="M29 64 A21 21 0 0 1 71 64 Z" fill="url(#${p}sun)"/>` +
      `<path d="M7 64 H93 C89 79 71 89 50 89 C29 89 11 79 7 64 Z" fill="url(#${p}water)"/>` +
      reflections +
      `<line x1="7" y1="64" x2="93" y2="64" stroke="#FFE082" stroke-width="0.8"/>`,
  );
}

function kubera(): string {
  const p = 'kubera-';
  const defs =
    radial(`${p}pot`, 0.36, 0.32, 0.8, [[0, '#FFF0B8'], [0.3, '#F2C14E'], [0.65, '#C98B1A'], [1, '#6B400A']]) +
    linear(`${p}band`, 0, 0, 0, 1, GOLD_BAND) +
    radial(`${p}coin`, 0.38, 0.32, 0.75, [[0, '#FFF7D1'], [0.4, '#F9D25A'], [0.85, '#C98B1A'], [1, '#8A5A12']]) +
    linear(`${p}cloth`, 0, 0, 0, 1, CLOTH_RED) +
    radial(`${p}ruby`, 0.35, 0.35, 0.7, RUBY) +
    radial(`${p}spec`, 0.5, 0.5, 0.5, SPEC);
  const coin = (x: number, y: number, r: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}coin)" stroke="#8A5A12" stroke-width="0.35"/><circle cx="${x}" cy="${y}" r="${r2(r * 0.66)}" fill="none" stroke="#A8741A" stroke-width="0.5"/>`;
  const flat = (x: number, y: number, rx: number) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${r2(rx * 0.36)}" fill="url(#${p}coin)" stroke="#8A5A12" stroke-width="0.35"/>`;
  return svg(
    defs,
    flat(23, 88.4, 5.4) +
      flat(77, 88.4, 5.4) +
      flat(31, 91.4, 4.6) +
      flat(69, 91.6, 4.6) +
      coin(17.5, 83, 4) +
      coin(83, 83.6, 3.6) +
      // Coins heaped at the mouth.
      coin(41, 29, 5) +
      coin(59, 29, 5) +
      coin(50, 25, 5.2) +
      coin(45.5, 32.6, 4.6) +
      coin(54.5, 32.6, 4.6) +
      gem(`${p}ruby`, 50, 25, 1.4) +
      `<path d="M38 82 H62 L59 87.6 H41 Z" fill="url(#${p}band)"/>` +
      `<path d="M41 42 C24 48 22 72 34 82.4 H66 C78 72 76 48 59 42 Z" fill="url(#${p}pot)"/>` +
      `<path d="M27.6 58 C40 63 60 63 72.4 58" fill="none" stroke="#FFF0B0" stroke-width="0.9" opacity="0.75"/>` +
      `<path d="M28.6 66.6 C40 71.4 60 71.4 71.4 66.6" fill="none" stroke="#7A4A0E" stroke-width="0.9" opacity="0.6"/>` +
      `<path d="M30.4 62.2 C40 66.6 60 66.6 69.6 62.2" fill="none" stroke="#B3261E" stroke-width="1.6" stroke-dasharray="0.1 2.6" stroke-linecap="round"/>` +
      spec(`${p}spec`, 37, 53, 4, 8, 25) +
      `<path d="M38 36 H62 L59 42.4 H41 Z" fill="url(#${p}band)"/>` +
      `<ellipse cx="50" cy="36" rx="13" ry="2.8" fill="url(#${p}band)"/>` +
      // Red cloth tied at the neck.
      `<path d="M39.6 42 C44 45 56 45 60.4 42 L60 46.4 C55 49.4 45 49.4 40 46.4 Z" fill="url(#${p}cloth)"/>` +
      `<path d="M57 46.4 C60 50 61 54 59 57.4 L61.6 56.4 C63.2 52.4 62.2 48.4 59.4 45.6 Z" fill="url(#${p}cloth)"/>`,
  );
}

export const emblemArt: Record<string, string> = {
  shiva: shiva(),
  hanuman: hanuman(),
  ganesha: ganesha(),
  durga: durga(),
  lakshmi: lakshmi(),
  vishnu: vishnu(),
  saraswati: saraswati(),
  shani: shani(),
  gayatri_savitr: gayatriSavitr(),
  kubera: kubera(),
};
