/**
 * Generates the app icon, Android adaptive icon layers, splash marks and favicon
 * from the temple mark in src/content/emblems.ts.
 *
 *   npm run icons      (requires ImageMagick 7: `magick`)
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { shapesToSvgBody, templeMark } from '../src/content/emblems.ts';

const assets = resolve(import.meta.dirname, '..', 'assets');
const work = mkdtempSync(join(tmpdir(), 'mandirpedia-icons-'));

/** Mark scaled to `scale` of the canvas and centred, drawn in `ink` on an opaque `background`. */
function svg({ scale, background = '#000000', ink = '#FFFFFF', dy = 0 }: { scale: number; background?: string; ink?: string; dy?: number }) {
  const offset = (100 - 100 * scale) / 2;
  const body = shapesToSvgBody(templeMark, { fg: ink, bg: background });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100"><rect width="100" height="100" fill="${background}"/><g transform="translate(${offset} ${offset + dy}) scale(${scale})">${body}</g></svg>`;
}

function rasterise(name: string, content: string, size: number): string {
  const src = join(work, `${name}.svg`);
  const png = join(work, `${name}.png`);
  writeFileSync(src, content);
  execFileSync('magick', ['-density', '600', src, '-resize', `${size}x${size}`, '-colorspace', 'Gray', png]);
  return png;
}

/** Opaque image exactly as drawn. */
function render(name: string, content: string, size: number) {
  const out = join(assets, `${name}.png`);
  execFileSync('magick', [rasterise(name, content, size), '-alpha', 'off', out]);
  console.log('wrote', out);
}

/**
 * Transparent mark in a single ink colour: drawn white-on-black, then brightness becomes alpha,
 * so the doorway and grooves are real holes. (ImageMagick ignores SVG masks.)
 */
function renderTransparent(name: string, scale: number, ink: string, size = 1024) {
  const out = join(assets, `${name}.png`);
  const src = rasterise(name, svg({ scale }), size);
  execFileSync('magick', [src, '-alpha', 'copy', '-channel', 'RGB', '-fill', ink, '-colorize', '100', '+channel', out]);
  console.log('wrote', out);
}

// iOS / store icon: opaque black square (App Store rejects transparency), mark at ~64%.
render('icon', svg({ scale: 0.64, dy: -1 }), 1024);
// Android adaptive layers: content must sit inside the central 66% safe zone.
renderTransparent('android-icon-foreground', 0.5, '#FFFFFF');
render('android-icon-background', `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#000000"/></svg>`, 1024);
renderTransparent('android-icon-monochrome', 0.5, '#FFFFFF');
// Splash marks: black on the light (default) splash, white on the dark splash.
renderTransparent('splash-icon', 0.9, '#000000');
renderTransparent('splash-icon-dark', 0.9, '#FFFFFF');
render('favicon', svg({ scale: 0.8 }), 48);
