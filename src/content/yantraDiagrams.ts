import type { ImageSourcePropType } from 'react-native';
import type { Localized } from './types';

/**
 * Yantra visuals, kept separate from devotional_collection.json (which holds
 * external references only and marks diagram geometry as unverified).
 *
 * Two kinds are supported:
 *  1. Drawn diagrams: only for yantras whose form is simple, unambiguous and
 *     widely published, rendered by the app from the data below.
 *  2. Licensed images: artwork you have permission to bundle (see yantraArtwork).
 *
 * Yantras with neither keep the "Open source reference" link. Forms are never
 * guessed: an inaccurate sacred diagram is worse than none.
 */

export interface NumberSquareDiagram {
  kind: 'number-square';
  /** Rows of the square, top to bottom. */
  rows: number[][];
  /** Every row, column and diagonal sums to this. Checked by the test suite. */
  magicSum: number;
  basis: Localized;
}

export type YantraDiagram = NumberSquareDiagram;

export const yantraDiagrams: Partial<Record<string, YantraDiagram>> = {
  'kubera-yantra': {
    kind: 'number-square',
    rows: [
      [27, 20, 25],
      [22, 24, 26],
      [23, 28, 21],
    ],
    magicSum: 72,
    basis: {
      en: 'The commonly published form of the Kubera yantra: a 3 × 3 square in which every row, column and diagonal adds up to 72. It is not copied from the linked source page, and printed forms vary in their borders and surrounding mantra. Follow your own tradition or teacher for worship and consecration.',
      hi: 'कुबेर यन्त्र का सामान्य रूप से प्रकाशित स्वरूप: 3 × 3 का वर्ग, जिसकी हर पंक्ति, स्तम्भ और विकर्ण का योग 72 है। यह लिंक किए गए स्रोत पृष्ठ से नहीं लिया गया है, और मुद्रित रूपों में किनारे तथा मन्त्र भिन्न हो सकते हैं। पूजा और प्रतिष्ठा के लिए अपनी परम्परा या गुरु का अनुसरण करें।',
    },
  },
};

/** Licensed yantra artwork bundled with the app (empty until permission is obtained). */
export interface YantraArtwork {
  source: ImageSourcePropType;
  credit: string;
  licence: string;
}

export const yantraArtwork: Partial<Record<string, YantraArtwork>> = {
  // 'lakshmi-yantra': {
  //   source: require('../../assets/yantras/lakshmi-yantra.png'),
  //   credit: '© …, used with permission',
  //   licence: 'Written permission for in-app use, 2026',
  // },
};

/** True if every row, column and both diagonals sum to `magicSum`. */
export function isValidNumberSquare(d: NumberSquareDiagram): boolean {
  const n = d.rows.length;
  if (n === 0 || d.rows.some((r) => r.length !== n)) return false;
  const sums = [
    ...d.rows.map((r) => r.reduce((a, b) => a + b, 0)),
    ...d.rows[0]!.map((_, c) => d.rows.reduce((a, r) => a + r[c]!, 0)),
    d.rows.reduce((a, r, i) => a + r[i]!, 0),
    d.rows.reduce((a, r, i) => a + r[n - 1 - i]!, 0),
  ];
  return sums.every((s) => s === d.magicSum);
}
