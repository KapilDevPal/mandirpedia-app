/**
 * Original black-and-white emblem artwork, drawn for this app.
 *
 * Each deity is represented by a traditional symbol (ayudha, vahana or
 * attribute) rather than a figurative depiction: Shiva's trishula and damaru,
 * Hanuman's gada, Ganesha's modak, Durga's khadga, Lakshmi's lotus, Vishnu's
 * Sudarshana chakra, Saraswati's veena, Shani as the planet Saturn, the rising
 * sun for Savitr, and Kubera's treasure pot. Because these are drawn here,
 * there are no third-party rights to clear.
 *
 * Pure data (no React Native imports): rendered in the app with react-native-svg
 * and in Node (scripts/render-icons.ts) for the app icon and splash.
 * Coordinates use a 100 x 100 viewBox.
 */

export type Fill = 'none' | 'fg' | 'bg';

export type Shape =
  | { k: 'path'; d: string; fill?: Fill; sw?: number; rotate?: number }
  | { k: 'circle'; cx: number; cy: number; r: number; fill?: Fill; sw?: number }
  | { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill?: Fill; sw?: number; rotate?: number }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; sw?: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; fill?: Fill; sw?: number };

const rad = (deg: number) => (deg * Math.PI) / 180;
const round = (n: number) => Math.round(n * 100) / 100;

/** Radial lines between two radii, used for chakra spokes and sun rays. */
function radial(cx: number, cy: number, r1: number, r2: number, fromDeg: number, toDeg: number, count: number, sw?: number): Shape[] {
  const out: Shape[] = [];
  const step = count > 1 ? (toDeg - fromDeg) / (count - 1) : 0;
  for (let i = 0; i < count; i++) {
    const a = rad(fromDeg + step * i);
    out.push({
      k: 'line',
      x1: round(cx + r1 * Math.cos(a)),
      y1: round(cy + r1 * Math.sin(a)),
      x2: round(cx + r2 * Math.cos(a)),
      y2: round(cy + r2 * Math.sin(a)),
      sw,
    });
  }
  return out;
}

const spokes = (n: number, r1: number, r2: number, sw?: number) => radial(50, 50, r1, r2, 0, 360 - 360 / n, n, sw);

export const emblems: Record<string, Shape[]> = {
  shiva: [
    // Trishula with damaru tied to the shaft.
    { k: 'line', x1: 50, y1: 22, x2: 50, y2: 94 },
    { k: 'path', d: 'M50 5 L54.5 16 L50 21 L45.5 16 Z', fill: 'fg' },
    { k: 'path', d: 'M50 37 C37 37 30 31 30 19' },
    { k: 'path', d: 'M30 9 L33.6 19 L26.4 19 Z', fill: 'fg' },
    { k: 'path', d: 'M50 37 C63 37 70 31 70 19' },
    { k: 'path', d: 'M70 9 L73.6 19 L66.4 19 Z', fill: 'fg' },
    { k: 'line', x1: 43, y1: 40, x2: 57, y2: 40 },
    { k: 'line', x1: 44.5, y1: 43.5, x2: 55.5, y2: 43.5 },
    { k: 'path', d: 'M40 52 H60 L50 61 L60 70 H40 L50 61 Z', fill: 'bg' },
    { k: 'path', d: 'M60 55 C66 56 68 60 67 65', sw: 1.4 },
    { k: 'circle', cx: 67, cy: 66.5, r: 1.6, fill: 'fg', sw: 1 },
  ],
  hanuman: [
    // Gada (mace).
    { k: 'path', d: 'M47.5 52 V88 H52.5 V52', fill: 'bg' },
    { k: 'circle', cx: 50, cy: 91.5, r: 3, fill: 'bg' },
    { k: 'line', x1: 47.5, y1: 80, x2: 52.5, y2: 80 },
    { k: 'line', x1: 47.5, y1: 84, x2: 52.5, y2: 84 },
    { k: 'path', d: 'M43 52 H57 L55 48 H45 Z', fill: 'bg' },
    { k: 'circle', cx: 50, cy: 31, r: 18, fill: 'bg' },
    { k: 'path', d: 'M50 13 C41 20 41 42 50 49' },
    { k: 'path', d: 'M50 13 C59 20 59 42 50 49' },
    { k: 'path', d: 'M32.5 27 C40 31 60 31 67.5 27' },
    { k: 'path', d: 'M32.5 35 C40 39 60 39 67.5 35' },
    { k: 'line', x1: 50, y1: 13, x2: 50, y2: 8 },
    { k: 'circle', cx: 50, cy: 6, r: 2.2, fill: 'fg' },
  ],
  ganesha: [
    // Modak on a plate.
    { k: 'path', d: 'M50 14 C56 26 72 40 72 58 C72 72 62 79 50 79 C38 79 28 72 28 58 C28 40 44 26 50 14 Z', fill: 'bg' },
    { k: 'path', d: 'M50 16 C46 34 38 52 35 72', sw: 1.6 },
    { k: 'path', d: 'M50 16 C48.5 36 45.5 56 44.5 78', sw: 1.6 },
    { k: 'path', d: 'M50 16 C51.5 36 54.5 56 55.5 78', sw: 1.6 },
    { k: 'path', d: 'M50 16 C54 34 62 52 65 72', sw: 1.6 },
    { k: 'path', d: 'M20 84 C30 90 70 90 80 84' },
    { k: 'line', x1: 30, y1: 92, x2: 70, y2: 92 },
  ],
  durga: [
    // Khadga (sword) within a halo.
    { k: 'circle', cx: 50, cy: 46, r: 34, sw: 1.2 },
    { k: 'path', d: 'M45.5 64 V22 C45.5 15 50 7 50 7 C50 7 54.5 15 54.5 22 V64 Z', fill: 'bg' },
    { k: 'line', x1: 50, y1: 16, x2: 50, y2: 60, sw: 1.2 },
    { k: 'path', d: 'M34 64 H66', sw: 2.6 },
    { k: 'path', d: 'M34 64 C30 64 29 59 32.5 58.5' },
    { k: 'path', d: 'M66 64 C70 64 71 59 67.5 58.5' },
    { k: 'path', d: 'M47 64 V82 H53 V64', fill: 'bg' },
    { k: 'line', x1: 47, y1: 70, x2: 53, y2: 70, sw: 1.2 },
    { k: 'line', x1: 47, y1: 75, x2: 53, y2: 75, sw: 1.2 },
    { k: 'circle', cx: 50, cy: 86, r: 4, fill: 'bg' },
  ],
  lakshmi: [
    // Lotus on water.
    { k: 'path', d: 'M50 70 C36 72 22 64 15 51 C30 49 42 55 50 70 Z', fill: 'bg' },
    { k: 'path', d: 'M50 70 C64 72 78 64 85 51 C70 49 58 55 50 70 Z', fill: 'bg' },
    { k: 'path', d: 'M50 70 C39 66 31 53 31 38 C42 42 48 53 50 70 Z', fill: 'bg' },
    { k: 'path', d: 'M50 70 C61 66 69 53 69 38 C58 42 52 53 50 70 Z', fill: 'bg' },
    { k: 'path', d: 'M50 26 C59 39 59 57 50 70 C41 57 41 39 50 26 Z', fill: 'bg' },
    { k: 'path', d: 'M22 80 Q36 76 50 80 T78 80' },
    { k: 'path', d: 'M32 87 Q41 84 50 87 T68 87', sw: 1.6 },
  ],
  vishnu: [
    // Sudarshana chakra.
    { k: 'circle', cx: 50, cy: 50, r: 33 },
    { k: 'circle', cx: 50, cy: 50, r: 25 },
    ...spokes(12, 7, 25, 1.6),
    { k: 'circle', cx: 50, cy: 50, r: 7, fill: 'bg' },
    { k: 'circle', cx: 50, cy: 50, r: 2.5, fill: 'fg' },
    ...spokes(24, 33, 41, 2),
  ],
  saraswati: [
    // Veena.
    { k: 'circle', cx: 50, cy: 27, r: 9, fill: 'bg' },
    { k: 'circle', cx: 50, cy: 78, r: 15, fill: 'bg' },
    { k: 'path', d: 'M46.5 12 V72 H53.5 V12', fill: 'bg' },
    { k: 'path', d: 'M50 12 C50 7 55 4 58.5 7 C61 9 59 12 56.5 11' },
    ...[40, 46, 52, 58, 64].map((y): Shape => ({ k: 'line', x1: 45, y1: y, x2: 55, y2: y, sw: 1.4 })),
    { k: 'line', x1: 49, y1: 12, x2: 49, y2: 86, sw: 0.9 },
    { k: 'line', x1: 51, y1: 12, x2: 51, y2: 86, sw: 0.9 },
    { k: 'line', x1: 43, y1: 86, x2: 57, y2: 86, sw: 2.2 },
  ],
  shani: [
    // Shani as the planet Saturn (one of the navagraha).
    { k: 'ellipse', cx: 50, cy: 50, rx: 37, ry: 10, rotate: -18 },
    { k: 'circle', cx: 50, cy: 50, r: 19, fill: 'bg' },
    { k: 'path', d: 'M33 46 C40 44 60 44 67 46', sw: 1.2 },
    { k: 'path', d: 'M32 53 C40 51 60 51 68 53', sw: 1.2 },
    { k: 'path', d: 'M13 50 A37 10 0 0 0 87 50', rotate: -18 },
    { k: 'circle', cx: 20, cy: 22, r: 1.3, fill: 'fg', sw: 0.8 },
    { k: 'circle', cx: 80, cy: 78, r: 1.3, fill: 'fg', sw: 0.8 },
    { k: 'circle', cx: 78, cy: 24, r: 0.9, fill: 'fg', sw: 0.6 },
  ],
  gayatri_savitr: [
    // Rising sun (Savitr) over water.
    { k: 'line', x1: 12, y1: 64, x2: 88, y2: 64 },
    { k: 'path', d: 'M30 64 A20 20 0 0 1 70 64', fill: 'bg' },
    ...radial(50, 64, 25, 36, 180, 360, 9, 2),
    { k: 'line', x1: 28, y1: 72, x2: 72, y2: 72, sw: 1.6 },
    { k: 'line', x1: 36, y1: 79, x2: 64, y2: 79, sw: 1.4 },
    { k: 'line', x1: 44, y1: 86, x2: 56, y2: 86, sw: 1.2 },
  ],
  kubera: [
    // Treasure pot (nidhi kalasha) with coins.
    { k: 'circle', cx: 42, cy: 33, r: 6, fill: 'bg' },
    { k: 'circle', cx: 58, cy: 33, r: 6, fill: 'bg' },
    { k: 'circle', cx: 50, cy: 26, r: 6, fill: 'bg' },
    { k: 'path', d: 'M35 47 C24 56 26 78 40 84 H60 C74 78 76 56 65 47 Z', fill: 'bg' },
    { k: 'rect', x: 39, y: 40, w: 22, h: 7, fill: 'bg' },
    { k: 'line', x1: 35, y1: 40, x2: 65, y2: 40, sw: 2.6 },
    { k: 'path', d: 'M29 62 C39 67 61 67 71 62', sw: 1.6 },
    { k: 'path', d: 'M30.5 69 C40 74 60 74 69.5 69', sw: 1.2 },
    { k: 'path', d: 'M43 84 V89 H57 V84' },
  ],
};

/** App mark: a temple (mandir) with shikhara, amalaka, kalasha and flag. Filled silhouette for icon legibility. */
export const templeMark: Shape[] = [
  { k: 'rect', x: 18, y: 84, w: 64, h: 5, fill: 'fg', sw: 0 },
  { k: 'rect', x: 23, y: 79, w: 54, h: 5, fill: 'fg', sw: 0 },
  { k: 'rect', x: 31, y: 58, w: 38, h: 21, fill: 'fg', sw: 0 },
  { k: 'path', d: 'M44 79 V69 A6 6 0 0 1 56 69 V79 Z', fill: 'bg', sw: 0 },
  { k: 'path', d: 'M33 58 C33 42 42 28 50 24 C58 28 67 42 67 58 Z', fill: 'fg', sw: 0 },
  { k: 'rect', x: 35.5, y: 50.5, w: 29, h: 1.8, fill: 'bg', sw: 0 },
  { k: 'rect', x: 37.5, y: 43.5, w: 25, h: 1.8, fill: 'bg', sw: 0 },
  { k: 'rect', x: 41, y: 36.5, w: 18, h: 1.8, fill: 'bg', sw: 0 },
  { k: 'ellipse', cx: 50, cy: 22.5, rx: 6.5, ry: 2.6, fill: 'fg', sw: 0 },
  { k: 'path', d: 'M46.5 20 C46.5 15.5 53.5 15.5 53.5 20 Z', fill: 'fg', sw: 0 },
  { k: 'line', x1: 50, y1: 16, x2: 50, y2: 5, sw: 1.4 },
  { k: 'path', d: 'M50 5 L61 8.5 L50 12 Z', fill: 'fg', sw: 0 },
];

/** SVG elements only (no <svg> wrapper), for composing into masks or larger documents. */
export function shapesToSvgBody(shapes: Shape[], opts: { fg: string; bg: string; sw?: number }): string {
  return shapesToSvg(shapes, { ...opts, size: 100 }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

/** Stroke colour is used for 'line' shapes and shape outlines; 'bg' fill masks lines behind a shape. */
export function shapesToSvg(shapes: Shape[], opts: { fg: string; bg: string; sw?: number; size?: number; padding?: number; background?: boolean }): string {
  const sw = opts.sw ?? 2.2;
  const pad = opts.padding ?? 0;
  const vb = `${-pad} ${-pad} ${100 + pad * 2} ${100 + pad * 2}`;
  const fillOf = (f?: Fill) => (f === 'fg' ? opts.fg : f === 'bg' ? opts.bg : 'none');
  const common = (s: { sw?: number }) => `stroke="${opts.fg}" stroke-width="${s.sw ?? sw}" stroke-linecap="round" stroke-linejoin="round"`;
  const rot = (r?: number) => (r ? ` transform="rotate(${r} 50 50)"` : '');
  const body = shapes
    .map((s) => {
      switch (s.k) {
        case 'path':
          return `<path d="${s.d}" fill="${fillOf(s.fill)}" ${common(s)}${rot(s.rotate)}/>`;
        case 'circle':
          return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${fillOf(s.fill)}" ${common(s)}/>`;
        case 'ellipse':
          return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${fillOf(s.fill)}" ${common(s)}${rot(s.rotate)}/>`;
        case 'line':
          return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" ${common(s)}/>`;
        case 'rect':
          return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${fillOf(s.fill)}" ${common(s)}/>`;
      }
    })
    .join('');
  const size = opts.size ?? 100;
  const bgRect = opts.background ? `<rect x="${-pad}" y="${-pad}" width="${100 + pad * 2}" height="${100 + pad * 2}" fill="${opts.bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}">${bgRect}${body}</svg>`;
}
