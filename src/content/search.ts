import type { Entry, Localized } from './types';

/**
 * Search helpers. These build *search keys only*; nothing here is ever
 * displayed, and original text is never altered.
 *
 * Devanagari spellings vary (मन्त्र / मंत्र, चन्द्र / चंद्र, ज़ / ज), and
 * romanisations vary (aarti / arti, ganesh / ganesha). A loose key folds these
 * differences so either spelling finds the entry.
 */
export function searchKey(input: string): string {
  let s = input.normalize('NFC').toLowerCase();
  // Latin: strip accents (combining marks U+0300 to U+036F only).
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
  // Devanagari: nasal consonant + virama -> anusvara; chandrabindu -> anusvara.
  s = s.replace(/[ङञणनम]्/g, 'ं').replace(/ँ/g, 'ं');
  // Remove nukta and remaining virama.
  s = s.replace(/[़्]/g, '');
  // Latin: fold long vowels typed as doubled letters.
  s = s.replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u');
  // Treat punctuation and danda as spaces.
  s = s.replace(/[।॥.,;:!?'"()\-_/]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

const locValues = (l?: Localized): string[] => (l ? [l.hi, l.en].filter((x): x is string => !!x) : []);

export function entryHaystack(entry: Entry, categoryLabel?: Localized): string {
  const parts = [
    entry.title,
    entry.id.replace(/-/g, ' '),
    entry.category,
    entry.deity ?? '',
    entry.deity_id ?? '',
    ...locValues(entry.title_localized),
    ...locValues(entry.deity_name_localized),
    ...locValues(categoryLabel),
  ];
  return searchKey(parts.join(' | '));
}

/** Every query word must appear somewhere in the haystack. */
export function matchesQuery(haystackKey: string, query: string): boolean {
  const q = searchKey(query);
  if (!q) return true;
  return q.split(' ').every((word) => haystackKey.includes(word));
}
