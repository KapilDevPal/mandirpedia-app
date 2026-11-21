/**
 * Generates the app icon, Android adaptive icon layers, splash marks, favicon and the
 * Google Play store icon from the temple mark in src/content/emblems.ts.
 *
 *   npm run icons      (requires ImageMagick 7: `magick`)
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { shapesToSvgBody, templeBody, templeFlag, templeMark } from '../src/content/emblems.ts';

const root = resolve(import.meta.dirname, '..');
const assets = join(root, 'assets');
const work = mkdtempSync(join(tmpdir(), 'mandirpedia-icons-'));

/** Kesari (saffron) for the temple flag. */
const SAFFRON = '#FF9933';

type Part = 'all' | 'body' | 'flag';

/**
 * Mark scaled to `scale` of the canvas and centred, drawn in `ink` on an opaque `background`.
 * With `flag`, the pennant is drawn in that colour instead of `ink`. `part` draws only the body or only the pennant.
 */
function svg({ scale, background = '#000000', ink = '#FFFFFF', dy = 0, flag, part = 'all' }: { scale: number; background?: string; ink?: string; dy?: number; flag?: string; part?: Part }) {
  const offset = (100 - 100 * scale) / 2;
  const opts = { fg: ink, bg: background };
  let body: string;
  if (part === 'body') body = shapesToSvgBody(templeBody, opts);
  else if (part === 'flag') body = shapesToSvgBody(templeFlag, opts);
  else if (flag) body = shapesToSvgBody(templeBody, opts) + shapesToSvgBody(templeFlag, { fg: flag, bg: background });
  else body = shapesToSvgBody(templeMark, opts);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100"><rect width="100" height="100" fill="${background}"/><g transform="translate(${offset} ${offset + dy}) scale(${scale})">${body}</g></svg>`;
}

function rasterise(name: string, content: string, size: number, gray = true): string {
  const src = join(work, `${name}.svg`);
  const png = join(work, `${name}.png`);
  writeFileSync(src, content);
  execFileSync('magick', ['-density', '600', src, '-resize', `${size}x${size}`, ...(gray ? ['-colorspace', 'Gray'] : []), png]);
  return png;
}

/** Opaque image exactly as drawn. */
function render(out: string, content: string, size: number, gray = true) {
  const name = out.replace(/[\\/]/g, '_');
  execFileSync('magick', [rasterise(name, content, size, gray), '-alpha', 'off', out]);
  console.log('wrote', out);
}

/** Drawn white-on-black, then brightness becomes alpha and the colour becomes `ink`. (ImageMagick ignores SVG masks.) */
function alphaLayer(name: string, scale: number, part: Part, ink: string, size: number): string {
  const src = rasterise(name, svg({ scale, part }), size);
  const out = join(work, `${name}-layer.png`);
  // Solid `ink` canvas whose opacity is the grayscale render.
  execFileSync('magick', ['-size', `${size}x${size}`, `xc:${ink}`, '(', src, '-colorspace', 'Gray', '-alpha', 'off', ')', '-compose', 'CopyOpacity', '-composite', `PNG32:${out}`]);
  return out;
}

/**
 * Transparent mark, so the doorway and grooves are real holes.
 * With `flag`, the pennant is coloured separately and composited over the body.
 */
function renderTransparent(name: string, scale: number, ink: string, { size = 1024, flag }: { size?: number; flag?: string } = {}) {
  const out = join(assets, `${name}.png`);
  if (!flag) {
    execFileSync('magick', [alphaLayer(name, scale, 'all', ink, size), out]);
  } else {
    const base = alphaLayer(`${name}-body`, scale, 'body', ink, size);
    const pennant = alphaLayer(`${name}-flag`, scale, 'flag', flag, size);
    execFileSync('magick', [base, pennant, '-compose', 'over', '-composite', `PNG32:${out}`]);
  }
  console.log('wrote', out);
}

// iOS / store icon: opaque black square (App Store rejects transparency), mark at ~64%, saffron flag.
render(join(assets, 'icon.png'), svg({ scale: 0.64, dy: -1, flag: SAFFRON }), 1024, false);
// Google Play store listing icon: 512 x 512, 32-bit PNG.
render(join(root, 'store', 'google-play', 'icon-512.png'), svg({ scale: 0.64, dy: -1, flag: SAFFRON }), 512, false);
// Android adaptive layers: content must sit inside the central 66% safe zone.
renderTransparent('android-icon-foreground', 0.5, '#FFFFFF', { flag: SAFFRON });
render(join(assets, 'android-icon-background.png'), `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#000000"/></svg>`, 1024);
// Themed (monochrome) icon: Android tints it with one colour, so the flag stays the same ink.
renderTransparent('android-icon-monochrome', 0.5, '#FFFFFF');
// Splash marks: black on the light (default) splash, white on the dark splash; saffron flag on both.
renderTransparent('splash-icon', 0.9, '#000000', { flag: SAFFRON });
renderTransparent('splash-icon-dark', 0.9, '#FFFFFF', { flag: SAFFRON });
render(join(assets, 'favicon.png'), svg({ scale: 0.8, flag: SAFFRON }), 48, false);
