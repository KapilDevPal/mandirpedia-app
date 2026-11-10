import type { Entry } from './types';

/**
 * How an entry's original text is displayed. Exactly one form is ever
 * rendered: either the `lines` array or the `text` string, never both.
 *
 * `lines` is preferred because it lets the reader bookmark and resume by line.
 * It is only used when `lines.join('\n')` reproduces `text` exactly (or when
 * `text` is absent). If the two disagree, the canonical, checksummed `text`
 * field is shown instead and the validator reports an error.
 */
export type Recitation =
  | { kind: 'lines'; lines: readonly string[] }
  | { kind: 'text'; text: string }
  | { kind: 'none' };

export function getRecitation(entry: Pick<Entry, 'text' | 'lines'>): Recitation {
  const hasText = typeof entry.text === 'string' && entry.text.length > 0;
  const hasLines =
    Array.isArray(entry.lines) &&
    entry.lines.length > 0 &&
    entry.lines.every((l) => typeof l === 'string');

  if (hasLines && (!hasText || entry.lines!.join('\n') === entry.text)) {
    return { kind: 'lines', lines: entry.lines! };
  }
  if (hasText) return { kind: 'text', text: entry.text! };
  return { kind: 'none' };
}

/** The exact string that is shown on screen, used for checksum verification. */
export function recitationString(r: Recitation): string | null {
  if (r.kind === 'lines') return r.lines.join('\n');
  if (r.kind === 'text') return r.text;
  return null;
}

/** Number of non-blank lines, used for "x% read" style progress. */
export function countVerseLines(r: Recitation): number {
  if (r.kind === 'lines') return r.lines.filter((l) => l.trim().length > 0).length;
  if (r.kind === 'text') return r.text.split('\n').filter((l) => l.trim().length > 0).length;
  return 0;
}
