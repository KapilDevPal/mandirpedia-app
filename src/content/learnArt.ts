/**
 * Full-colour illustrations for the Learn tab, drawn for this app in the same style as
 * the deity emblems (./emblemArt.ts). Each value is an SVG document (viewBox 0 0 100 100)
 * for react-native-svg's SvgXml. Gradient ids are prefixed so several can share a screen.
 */

type Stop = [offset: number, color: string, opacity?: number];

const stops = (s: Stop[]) => s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');
const linear = (id: string, x1: number, y1: number, x2: number, y2: number, s: Stop[]) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
const radial = (id: string, cx: number, cy: number, r: number, s: Stop[]) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`;
const svg = (defs: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs>${body}</svg>`;
const r2 = (n: number) => Math.round(n * 100) / 100;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const BRASS: Stop[] = [[0, '#FFF2B8'], [0.3, '#F2C14E'], [0.7, '#C98B1A'], [1, '#6B400A']];
const BAND: Stop[] = [[0, '#7A4A0E'], [0.3, '#E8B33A'], [0.5, '#FFF0B0'], [0.7, '#C98B1A'], [1, '#6B400A']];
const FLAME: Stop[] = [[0, '#E65100'], [0.4, '#FF9800'], [0.75, '#FFD54F'], [1, '#FFFDE7']];
const GLOW: Stop[] = [[0, '#FFB74D', 0.65], [0.5, '#FF8A65', 0.22], [1, '#FF8A65', 0]];
const SPEC: Stop[] = [[0, '#FFFFFF', 0.8], [1, '#FFFFFF', 0]];

function diya(): string {
  const p = 'l-diya-';
  const defs =
    radial(`${p}glow`, 0.5, 0.5, 0.5, GLOW) +
    linear(`${p}flame`, 0, 1, 0, 0, FLAME) +
    radial(`${p}bowl`, 0.35, 0.3, 0.85, BRASS) +
    linear(`${p}band`, 0, 0, 0, 1, BAND) +
    radial(`${p}spec`, 0.5, 0.5, 0.5, SPEC);
  return svg(
    defs,
    `<circle cx="81" cy="30" r="19" fill="url(#${p}glow)"/>` +
      `<path d="M36 76 H58 L63 85 H31 Z" fill="url(#${p}band)"/>` +
      `<ellipse cx="47" cy="86" rx="19" ry="3.2" fill="url(#${p}band)"/>` +
      `<path d="M14 52 H70 L86 45 C84 53 78 58 71 60 C66 71 52 77 42 76 C28 75 16 66 14 52 Z" fill="url(#${p}bowl)"/>` +
      `<ellipse cx="42" cy="52" rx="28" ry="4.4" fill="url(#${p}band)"/>` +
      `<ellipse cx="42" cy="52" rx="24" ry="2.8" fill="#6B3A0A"/>` +
      `<path d="M20 62 C30 67 52 67 66 61" fill="none" stroke="#FFF0B0" stroke-width="0.9" opacity="0.7"/>` +
      `<ellipse cx="28" cy="60" rx="5" ry="2.4" transform="rotate(20 28 60)" fill="url(#${p}spec)"/>` +
      `<path d="M78 47.5 L80.5 41" stroke="#3E2723" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="M81 16 C87 26 89 33 85 40 C83.6 42.6 81.4 43 79.6 41 C75 35 76 26 81 16 Z" fill="url(#${p}flame)"/>` +
      `<path d="M81.2 28 C83.4 32 83.6 36 81.8 39.4 C79.8 37 79.6 32.6 81.2 28 Z" fill="#FFFDE7"/>`,
  );
}

function mala(): string {
  const p = 'l-mala-';
  const defs =
    radial(`${p}bead`, 0.35, 0.3, 0.75, [[0, '#D7905A'], [0.45, '#8B4A22'], [1, '#3E1E0C']]) +
    radial(`${p}guru`, 0.35, 0.3, 0.75, [[0, '#E9AE6E'], [0.5, '#A0522D'], [1, '#4A200A']]) +
    linear(`${p}tassel`, 0, 0, 0, 1, [[0, '#FFB74D'], [1, '#E65100']]) +
    linear(`${p}band`, 0, 0, 0, 1, BAND);
  const cx = 50;
  const cy = 42;
  const r = 30;
  const beads = range(25)
    .map((i) => {
      const a = ((-150 + (300 / 24) * i) * Math.PI) / 180;
      const x = r2(cx + r * Math.sin(a));
      const y = r2(cy - r * Math.cos(a));
      return `<circle cx="${x}" cy="${y}" r="4.2" fill="url(#${p}bead)"/><circle cx="${r2(x - 1.2)}" cy="${r2(y - 1.3)}" r="0.9" fill="#FFFFFF" opacity="0.45"/>`;
    })
    .join('');
  return svg(
    defs,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#C62828" stroke-width="0.8"/>` +
      beads +
      `<path d="M35 68 L50 76 L65 68" fill="none" stroke="#C62828" stroke-width="0.8"/>` +
      `<circle cx="50" cy="77" r="5.4" fill="url(#${p}guru)"/>` +
      `<rect x="47.2" y="82" width="5.6" height="2.4" rx="0.6" fill="url(#${p}band)"/>` +
      `<path d="M47.6 84.4 L44.6 96 H55.4 L52.4 84.4 Z" fill="url(#${p}tassel)"/>` +
      `<path d="M47 87 L46 95 M50 85 V95.6 M53 87 L54 95" stroke="#B33E00" stroke-width="0.5"/>`,
  );
}

function pothi(): string {
  const p = 'l-book-';
  const defs =
    linear(`${p}cloth`, 0, 0, 0, 1, [[0, '#E53935'], [1, '#7F1212']]) +
    linear(`${p}pageL`, 0, 0, 1, 0, [[0, '#F3E2B8'], [1, '#FFF8E6']]) +
    linear(`${p}pageR`, 0, 0, 1, 0, [[0, '#FFF8E6'], [1, '#EAD5A4']]) +
    linear(`${p}band`, 0, 0, 0, 1, BAND);
  const lines = (x1: number, x2: number, y0: number, slope: number) =>
    range(7)
      .map((i) => `<line x1="${x1}" y1="${r2(y0 + i * 5.2)}" x2="${x2}" y2="${r2(y0 + i * 5.2 + slope)}" stroke="#8A6A3A" stroke-width="0.7" stroke-dasharray="${i % 3 === 2 ? '6 2 9 2' : '11 2 7 2'}" opacity="0.75"/>`)
      .join('');
  return svg(
    defs,
    `<path d="M6 74 L50 88 L94 74 L94 82 L50 96 L6 82 Z" fill="url(#${p}cloth)"/>` +
      `<path d="M6 74 L50 88 L94 74" fill="none" stroke="#F2C14E" stroke-width="0.9"/>` +
      `<path d="M12 34 C28 29 43 31 50 38 V82 C43 75 28 73 12 78 Z" fill="url(#${p}pageL)" stroke="#B08850" stroke-width="0.6"/>` +
      `<path d="M88 34 C72 29 57 31 50 38 V82 C57 75 72 73 88 78 Z" fill="url(#${p}pageR)" stroke="#B08850" stroke-width="0.6"/>` +
      lines(17, 45, 42, 1.2) +
      lines(55, 83, 43.2, -1.2) +
      `<path d="M49.2 38 V84" stroke="#B08850" stroke-width="1"/>` +
      `<path d="M58 31.6 V48 L61 45 L64 48 V31" fill="#C62828"/>`,
  );
}

function naivedya(): string {
  const p = 'l-food-';
  const defs =
    linear(`${p}plate`, 0, 0, 0, 1, [[0, '#FFF0B8'], [0.45, '#E3AE45'], [1, '#8A5A12']]) +
    radial(`${p}inner`, 0.5, 0.35, 0.7, [[0, '#FBE3A0'], [0.6, '#D9A23A'], [1, '#A06A16']]) +
    radial(`${p}laddu`, 0.36, 0.3, 0.75, [[0, '#FFE0B2'], [0.4, '#FFA726'], [0.85, '#E65100'], [1, '#A84300']]) +
    linear(`${p}leaf`, 0, 0, 1, 1, [[0, '#9CCC65'], [1, '#2E6B1F']]);
  const laddu = (x: number, y: number, r: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}laddu)"/>` +
    `<circle cx="${x}" cy="${y}" r="${r2(r * 0.72)}" fill="none" stroke="#FFE0B2" stroke-width="${r2(r * 0.16)}" stroke-dasharray="0.1 ${r2(r * 0.34)}" stroke-linecap="round" opacity="0.7"/>`;
  return svg(
    defs,
    `<ellipse cx="50" cy="76" rx="44" ry="11" fill="url(#${p}plate)"/>` +
      `<ellipse cx="50" cy="74.6" rx="37" ry="7.4" fill="url(#${p}inner)"/>` +
      `<ellipse cx="50" cy="76" rx="43" ry="10.4" fill="none" stroke="#FFF4C8" stroke-width="0.6" opacity="0.6"/>` +
      laddu(31, 66, 9.5) +
      laddu(50, 68, 9.5) +
      laddu(69, 66, 9.5) +
      laddu(40.5, 51, 9.5) +
      laddu(59.5, 51, 9.5) +
      laddu(50, 36, 9.5) +
      `<path d="M50 26.6 C46 20 47 14 53 11 C56 16 55 22 50 26.6 Z" fill="url(#${p}leaf)"/>` +
      `<path d="M50 26 C51 20 52 15.6 53 11.6" stroke="#C5E1A5" stroke-width="0.5" fill="none"/>`,
  );
}

function pushpa(): string {
  const p = 'l-flower-';
  const defs =
    radial(`${p}marigold`, 0.45, 0.4, 0.65, [[0, '#FFE082'], [0.45, '#FFA000'], [1, '#D84315']]) +
    radial(`${p}yellow`, 0.45, 0.4, 0.65, [[0, '#FFF59D'], [0.5, '#FFCA28'], [1, '#F57F17']]) +
    linear(`${p}leaf`, 0, 0, 1, 1, [[0, '#9CCC65'], [1, '#2E6B1F']]) +
    linear(`${p}petal`, 0.5, 1, 0.5, 0, [[0, '#C2185B'], [0.6, '#F06292'], [1, '#FCE4EC']]);
  const marigold = (x: number, y: number, r: number, fill: string) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}${fill})"/>` +
    `<circle cx="${x}" cy="${y}" r="${r2(r * 0.85)}" fill="none" stroke="#FFCA28" stroke-width="${r2(r * 0.22)}" stroke-dasharray="0.1 ${r2(r * 0.36)}" stroke-linecap="round"/>` +
    `<circle cx="${x}" cy="${y}" r="${r2(r * 0.55)}" fill="none" stroke="#FFE082" stroke-width="${r2(r * 0.2)}" stroke-dasharray="0.1 ${r2(r * 0.3)}" stroke-linecap="round" opacity="0.8"/>` +
    `<circle cx="${x}" cy="${y}" r="${r2(r * 0.22)}" fill="#E65100"/>`;
  return svg(
    defs,
    `<path d="M14 64 C20 50 34 46 42 52 C34 60 22 66 14 64 Z" fill="url(#${p}leaf)"/>` +
      `<path d="M86 64 C80 50 66 46 58 52 C66 60 78 66 86 64 Z" fill="url(#${p}leaf)"/>` +
      `<path d="M50 24 C44 34 44 46 50 54 C56 46 56 34 50 24 Z" fill="url(#${p}petal)"/>` +
      `<path d="M50 54 C40 52 32 44 30 34 C40 35 47 43 50 54 Z" fill="url(#${p}petal)"/>` +
      `<path d="M50 54 C60 52 68 44 70 34 C60 35 53 43 50 54 Z" fill="url(#${p}petal)"/>` +
      marigold(30, 70, 14, 'marigold') +
      marigold(70, 70, 14, 'yellow') +
      marigold(50, 74, 15, 'marigold'),
  );
}

function abhisheka(): string {
  const p = 'l-abh-';
  const defs =
    linear(`${p}stone`, 0, 0, 1, 0, [[0, '#263238'], [0.35, '#607D8B'], [0.55, '#90A4AE'], [1, '#1C2327']]) +
    linear(`${p}yoni`, 0, 0, 0, 1, [[0, '#78909C'], [1, '#263238']]) +
    radial(`${p}copper`, 0.35, 0.3, 0.85, [[0, '#FFCCBC'], [0.35, '#E07A4F'], [0.75, '#A0461F'], [1, '#5D2610']]) +
    linear(`${p}water`, 0, 0, 0, 1, [[0, '#B3E5FC', 0.95], [1, '#4FC3F7', 0.7]]);
  return svg(
    defs,
    // Shiva linga on its base.
    `<path d="M14 80 C14 74 30 71 50 71 C66 71 78 73 84 76 L96 74 L96 79 L84 81 C80 86 66 89 50 89 C30 89 14 86 14 80 Z" fill="url(#${p}yoni)"/>` +
      `<ellipse cx="49" cy="76" rx="30" ry="4.6" fill="#90A4AE" opacity="0.6"/>` +
      `<path d="M37 76 V56 C37 44 61 44 61 56 V76 Z" fill="url(#${p}stone)"/>` +
      `<path d="M40.5 58 H57.5 M40 61 H58 M40.5 64 H57.5" stroke="#FFFFFF" stroke-width="0.9" opacity="0.85"/>` +
      `<circle cx="49" cy="61" r="1.5" fill="#E53935"/>` +
      // Water falling from the lota onto the linga.
      `<path d="M33 14 C40 16 47 30 48.5 46" fill="none" stroke="url(#${p}water)" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="44" cy="50" r="1" fill="#B3E5FC"/><circle cx="54" cy="49" r="0.9" fill="#B3E5FC"/><circle cx="58" cy="54" r="0.8" fill="#B3E5FC"/>` +
      // Copper lota, tilted.
      `<g transform="rotate(50 22 22)"><ellipse cx="22" cy="8" rx="7" ry="2" fill="#A0461F"/><path d="M16 9 C16 13 18 14 15 18 C8 24 10 36 22 38 C34 36 36 24 29 18 C26 14 28 13 28 9 Z" fill="url(#${p}copper)"/><path d="M12.5 26 C18 29 26 29 31.5 26" fill="none" stroke="#FFE0B2" stroke-width="0.8" opacity="0.7"/></g>`,
  );
}

export const learnArt: Record<string, string> = {
  aarti: diya(),
  japa: mala(),
  path: pothi(),
  naivedya: naivedya(),
  pushpa: pushpa(),
  abhisheka: abhisheka(),
};
