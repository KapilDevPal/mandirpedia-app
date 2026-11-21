/**
 * Yantra artwork, drawn for this app.
 *
 * Every yantra is built from the traditional elements printed yantras share: a bhupura
 * (square enclosure with four gates) in three lines, concentric circles, one or two rings of
 * lotus petals, a central figure (triangles, hexagram, eight-pointed star or pentagram), a
 * bindu, and the bija mantra at the centre. Kubera's yantra is its 3 × 3 number square.
 *
 * Output: an SVG document (viewBox 0 0 200 200) for react-native-svg's SvgXml, plus text
 * labels positioned in that viewBox. Labels are rendered as React Native Text over the
 * SVG, because SVG text does not shape Devanagari conjuncts (such as श्रीं) reliably.
 *
 * Pure data: no React Native imports, so Node tests and scripts can use it.
 */
import { yantraDiagrams, type NumberSquareDiagram } from './yantraDiagrams';
import type { Localized } from './types';

export interface YantraLabel {
  text: string;
  /** Centre of the label in the 200 × 200 viewBox. */
  x: number;
  y: number;
  /** Font size in viewBox units. */
  size: number;
  /** Numerals use the UI font; bija mantras use the serif recitation font. */
  kind: 'bija' | 'syllable' | 'numeral';
}

export interface YantraArt {
  svg: string;
  labels: YantraLabel[];
  /** Short bilingual description of what is drawn. */
  basis: Localized;
}

type Core = 'hexagram' | 'triangles' | 'star8' | 'pentagram';

interface GeometricSpec {
  /** 16-petal outer lotus ring. */
  outerPetals: boolean;
  /** 8-petal lotus ring. */
  innerPetals: boolean;
  core: Core;
  bija: string;
  /** Syllables placed at the points of the central figure (Shiva panchakshari). */
  pointSyllables?: string[];
  coreName: Localized;
}

const C = 100;
const r2 = (n: number) => Math.round(n * 100) / 100;
const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (r: number, deg: number): [number, number] => [r2(C + r * Math.sin(rad(deg))), r2(C - r * Math.cos(rad(deg)))];
const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;
/** Regular polygon with a vertex at `startDeg` (0 = straight up). */
const regular = (n: number, r: number, startDeg = 0) => poly(Array.from({ length: n }, (_, i) => polar(r, startDeg + (360 / n) * i)));

/* Palette: maroon plate, gold linework, saffron and lotus-pink petals. */
const GOLD = '#F2C14E';
const GOLD_DEEP = '#C98B1A';

const defs = `<defs>
<radialGradient id="y-plate" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#7A1A1F"/><stop offset="0.6" stop-color="#4A0C10"/><stop offset="1" stop-color="#260507"/></radialGradient>
<linearGradient id="y-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset="0.45" stop-color="#E0A526"/><stop offset="1" stop-color="#8A5A12"/></linearGradient>
<radialGradient id="y-disc" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#8E1B22"/><stop offset="1" stop-color="#4A0C10"/></radialGradient>
<linearGradient id="y-petal-out" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stop-color="#E65100"/><stop offset="0.55" stop-color="#FFA726"/><stop offset="1" stop-color="#FFE082"/></linearGradient>
<linearGradient id="y-petal-in" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stop-color="#AD1457"/><stop offset="0.55" stop-color="#EC407A"/><stop offset="1" stop-color="#F8BBD0"/></linearGradient>
<linearGradient id="y-up" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#FFE082"/><stop offset="1" stop-color="#E0A526"/></linearGradient>
<linearGradient id="y-down" x1="0.5" y1="1" x2="0.5" y2="0"><stop offset="0" stop-color="#FF7043"/><stop offset="1" stop-color="#C62828"/></linearGradient>
<radialGradient id="y-bindu" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFF8E1"/><stop offset="0.5" stop-color="#F2C14E"/><stop offset="1" stop-color="#A86B12"/></radialGradient>
</defs>`;

/** One bhupura line: a square of half-size `h` with a rectangular gate (half-width `g`, depth `d`) on each side. */
function bhupura(h: number, g: number, d: number): string {
  const side: [number, number][] = [
    [-h, -h],
    [-g, -h],
    [-g, -h - d],
    [g, -h - d],
    [g, -h],
  ];
  const pts: [number, number][] = [];
  for (let q = 0; q < 4; q++) {
    const a = rad(90 * q);
    for (const [x, y] of side) pts.push([r2(C + x * Math.cos(a) - y * Math.sin(a)), r2(C + x * Math.sin(a) + y * Math.cos(a))]);
  }
  return poly(pts);
}

function plateAndBhupura(): string {
  return (
    `<rect width="200" height="200" fill="url(#y-plate)"/>` +
    `<rect x="2" y="2" width="196" height="196" fill="none" stroke="url(#y-frame)" stroke-width="3"/>` +
    `<path d="${bhupura(80, 18, 12)}" fill="#3A080B" stroke="${GOLD}" stroke-width="1.8" stroke-linejoin="miter"/>` +
    `<path d="${bhupura(76, 14, 12)}" fill="none" stroke="${GOLD_DEEP}" stroke-width="1"/>` +
    `<path d="${bhupura(72, 10, 12)}" fill="none" stroke="${GOLD}" stroke-width="1"/>`
  );
}

/** Ring of `n` pointed lotus petals between radii r1 (base) and r2 (tip). */
function petals(n: number, r1: number, r2_: number, fill: string, offsetDeg = 0): string {
  const half = (180 / n) * 0.98;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = offsetDeg + (360 / n) * i;
    const [lx, ly] = polar(r1, a - half);
    const [rx, ry] = polar(r1, a + half);
    const [tx, ty] = polar(r2_, a);
    const [lcx, lcy] = polar(r1 + (r2_ - r1) * 0.62, a - half * 1.05);
    const [rcx, rcy] = polar(r1 + (r2_ - r1) * 0.62, a + half * 1.05);
    const [vx, vy] = polar(r1 + (r2_ - r1) * 0.82, a);
    const [bx, by] = polar(r1, a);
    out.push(
      `<path d="M${lx} ${ly} Q${lcx} ${lcy} ${tx} ${ty} Q${rcx} ${rcy} ${rx} ${ry} Z" fill="url(#${fill})" stroke="#7A1010" stroke-width="0.7" stroke-linejoin="round"/>` +
        `<path d="M${bx} ${by} L${vx} ${vy}" stroke="#FFFFFF" stroke-width="0.5" opacity="0.45"/>`,
    );
  }
  return out.join('');
}

const ring = (r: number, fill: string, width = 1.2) => `<circle cx="${C}" cy="${C}" r="${r}" fill="${fill}" stroke="${GOLD}" stroke-width="${width}"/>`;

function coreShapes(core: Core, R: number): string {
  const line = `stroke="${GOLD}" stroke-width="1.1" stroke-linejoin="miter"`;
  switch (core) {
    case 'hexagram':
      return (
        `<path d="${regular(3, R, 0)}" fill="url(#y-up)" opacity="0.92" ${line}/>` +
        `<path d="${regular(3, R, 180)}" fill="url(#y-down)" opacity="0.85" ${line}/>` +
        `<path d="${regular(3, R * 0.5, 180)}" fill="#4A0C10" ${line}/>`
      );
    case 'triangles':
      return (
        `<path d="${regular(3, R, 180)}" fill="url(#y-down)" ${line}/>` +
        `<path d="${regular(3, R * 0.68, 180)}" fill="url(#y-up)" ${line}/>` +
        `<path d="${regular(3, R * 0.4, 180)}" fill="#4A0C10" ${line}/>`
      );
    case 'star8':
      return (
        `<path d="${regular(4, R, 0)}" fill="url(#y-up)" opacity="0.92" ${line}/>` +
        `<path d="${regular(4, R, 45)}" fill="url(#y-up)" opacity="0.92" ${line}/>` +
        `<path d="${regular(3, R * 0.62, 180)}" fill="url(#y-down)" ${line}/>`
      );
    case 'pentagram': {
      const pts = Array.from({ length: 5 }, (_, i) => polar(R, i * 144));
      const inner = R * Math.cos(rad(72)) / Math.cos(rad(36));
      return (
        `<path d="${regular(5, R, 0)}" fill="#3A080B" ${line}/>` +
        `<path d="${poly(pts)}" fill="url(#y-down)" fill-rule="nonzero" ${line}/>` +
        `<path d="${regular(5, inner, 180)}" fill="#4A0C10" ${line}/>`
      );
    }
  }
}

function geometric(spec: GeometricSpec): { svg: string; labels: YantraLabel[] } {
  let body = plateAndBhupura() + ring(66, 'url(#y-disc)', 1.6) + `<circle cx="${C}" cy="${C}" r="63" fill="none" stroke="${GOLD_DEEP}" stroke-width="0.8"/>`;
  const labels: YantraLabel[] = [];
  if (spec.core === 'pentagram') {
    // Panchakshari: eight petals, then a large pentagram carrying the five syllables.
    body += petals(8, 47, 62, 'y-petal-out', 22.5) + ring(47, '#4A0C10') + coreShapes('pentagram', 45);
    (spec.pointSyllables ?? []).forEach((s, i) => {
      const [x, y] = polar(31, i * 72);
      labels.push({ text: s, x, y: y + 1, size: 11, kind: 'syllable' });
    });
    body += `<circle cx="${C}" cy="${C}" r="11" fill="#4A0C10" stroke="${GOLD}" stroke-width="0.9"/>`;
    labels.push({ text: spec.bija, x: C, y: C + 1, size: 13, kind: 'bija' });
  } else {
    if (spec.outerPetals && spec.innerPetals) {
      body += petals(16, 46, 62, 'y-petal-out') + ring(46, 'url(#y-disc)') + petals(8, 30, 45, 'y-petal-in', 22.5) + ring(30, '#3A080B');
    } else {
      body += petals(8, 31, 62, spec.innerPetals ? 'y-petal-in' : 'y-petal-out', 22.5) + ring(31, '#3A080B');
    }
    body += coreShapes(spec.core, 29);
    // Bindu: a dark disc at the centre that carries the bija mantra.
    body += `<circle cx="${C}" cy="${C}" r="12.5" fill="#3A080B" stroke="${GOLD}" stroke-width="1"/>`;
    labels.push({ text: spec.bija, x: C, y: C + 1, size: spec.bija.length > 2 ? 11.5 : 13.5, kind: 'bija' });
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${defs}${body}</svg>`, labels };
}

function numberSquare(d: NumberSquareDiagram): { svg: string; labels: YantraLabel[] } {
  const n = d.rows.length;
  const size = 116;
  const x0 = C - size / 2;
  const cell = size / n;
  let body = plateAndBhupura();
  body += `<rect x="${x0 - 6}" y="${x0 - 6}" width="${size + 12}" height="${size + 12}" fill="none" stroke="${GOLD_DEEP}" stroke-width="1"/>`;
  body += `<rect x="${x0}" y="${x0}" width="${size}" height="${size}" fill="url(#y-disc)" stroke="${GOLD}" stroke-width="2"/>`;
  for (let i = 1; i < n; i++) {
    const p = r2(x0 + cell * i);
    body += `<line x1="${p}" y1="${x0}" x2="${p}" y2="${x0 + size}" stroke="${GOLD}" stroke-width="1.2"/>`;
    body += `<line x1="${x0}" y1="${p}" x2="${x0 + size}" y2="${p}" stroke="${GOLD}" stroke-width="1.2"/>`;
  }
  // Small lotus buds in the corners between the square and the bhupura.
  for (const [cx, cy] of [
    [x0 - 14, x0 - 14],
    [x0 + size + 14, x0 - 14],
    [x0 - 14, x0 + size + 14],
    [x0 + size + 14, x0 + size + 14],
  ] as const) {
    body += `<circle cx="${cx}" cy="${cy}" r="4" fill="url(#y-bindu)" stroke="#7A1010" stroke-width="0.5"/>`;
  }
  const labels: YantraLabel[] = d.rows.flatMap((row, r) =>
    row.map((value, c) => ({ text: String(value), x: r2(x0 + cell * c + cell / 2), y: r2(x0 + cell * r + cell / 2), size: cell * 0.4, kind: 'numeral' as const })),
  );
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${defs}${body}</svg>`, labels };
}

const VARY: Localized = {
  en: 'Printed yantras vary in their details; follow your own tradition or teacher for worship and consecration.',
  hi: 'मुद्रित यन्त्रों के विवरण भिन्न हो सकते हैं; पूजा और प्रतिष्ठा के लिए अपनी परम्परा या गुरु का अनुसरण करें।',
};

const specs: Record<string, GeometricSpec> = {
  'lakshmi-yantra': {
    outerPetals: true,
    innerPetals: true,
    core: 'star8',
    bija: 'श्रीं',
    coreName: { en: 'an eight-pointed star around a downward triangle', hi: 'नीचे की ओर त्रिकोण के चारों ओर अष्टकोण' },
  },
  'ganesha-yantra': {
    outerPetals: false,
    innerPetals: false,
    core: 'hexagram',
    bija: 'गं',
    coreName: { en: 'a six-pointed star (shatkona)', hi: 'षट्कोण' },
  },
  'durga-yantra': {
    outerPetals: false,
    innerPetals: true,
    core: 'triangles',
    bija: 'दुं',
    coreName: { en: 'nested downward triangles, the form associated with Shakti', hi: 'शक्ति से जुड़े, एक के भीतर एक नीचे की ओर त्रिकोण' },
  },
  'saraswati-yantra': {
    outerPetals: true,
    innerPetals: true,
    core: 'hexagram',
    bija: 'ऐं',
    coreName: { en: 'a six-pointed star (shatkona)', hi: 'षट्कोण' },
  },
  'shiva-yantra': {
    outerPetals: false,
    innerPetals: false,
    core: 'pentagram',
    bija: 'ॐ',
    pointSyllables: ['न', 'मः', 'शि', 'वा', 'य'],
    coreName: { en: 'a five-pointed star carrying the five syllables न मः शि वा य', hi: 'पाँच अक्षरों न मः शि वा य वाला पञ्चकोण' },
  },
};

function describe(spec: GeometricSpec): Localized {
  const rings = spec.outerPetals && spec.innerPetals ? { en: 'sixteen- and eight-petal lotus rings', hi: 'सोलह और आठ दलों वाले कमल' } : { en: 'an eight-petal lotus', hi: 'अष्टदल कमल' };
  return {
    en: `Drawn for this app from the elements printed yantras share: a square enclosure with four gates (bhupura), ${rings.en}, ${spec.coreName.en}, and the bija mantra ${spec.bija} at the centre. ${VARY.en}`,
    hi: `इस ऐप के लिए मुद्रित यन्त्रों के साझा तत्वों से बनाया गया: चार द्वारों वाला भूपुर, ${rings.hi}, ${spec.coreName.hi}, और केन्द्र में बीज मन्त्र ${spec.bija}। ${VARY.hi}`,
  };
}

function build(): Record<string, YantraArt> {
  const out: Record<string, YantraArt> = {};
  for (const [id, spec] of Object.entries(specs)) out[id] = { ...geometric(spec), basis: describe(spec) };
  for (const [id, d] of Object.entries(yantraDiagrams)) {
    if (d) out[id] = { ...numberSquare(d), basis: d.basis };
  }
  return out;
}

/** Artwork for every yantra entry, keyed by entry id. */
export const yantraArt: Readonly<Record<string, YantraArt>> = build();
