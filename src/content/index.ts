import raw from '../../devotional_collection.json';
import { isRecitationCategory, validateCollection } from './validate';
import { entryHaystack } from './search';
import type { DeityProfile, EducationalSource, Entry, Lang, Localized } from './types';

export * from './types';
export { getRecitation, recitationString, countVerseLines, type Recitation } from './recitation';
export { isRecitationCategory } from './validate';
export { matchesQuery, searchKey } from './search';

/**
 * The bundled dataset, validated once at start-up. Everything is offline:
 * the JSON is compiled into the app bundle by Metro.
 *
 * To add content, edit devotional_collection.json and run
 * `npm run validate:content`. No code changes are needed for new entries,
 * deities, categories with labels, ritual explanations or sources.
 */
const result = validateCollection(raw as unknown);

export const collection = result.collection;
export const validationIssues = result.issues;

if (__DEV__ && validationIssues.length > 0) {
  const errors = validationIssues.filter((i) => i.severity === 'error');
  console.warn(
    `[content] ${errors.length} error(s), ${validationIssues.length - errors.length} warning(s) in devotional_collection.json`,
    validationIssues,
  );
}

export const entries: readonly Entry[] = collection.entries;
export const entriesById = new Map(entries.map((e) => [e.id, e]));
export const deities: readonly DeityProfile[] = collection.deities;
export const deitiesById = new Map(deities.map((d) => [d.id, d]));
export const sourcesById = new Map<string, EducationalSource>(collection.educational_sources.map((s) => [s.id, s]));

/** Categories in dataset order of category_labels, then any extra categories found in entries. */
export const categories: readonly string[] = (() => {
  const order = Object.keys(collection.category_labels);
  for (const e of entries) if (!order.includes(e.category)) order.push(e.category);
  return order.filter((c) => entries.some((e) => e.category === c));
})();

export const entriesByCategory = (category: string) => entries.filter((e) => e.category === category);

/** Actual counts from the data (not the declared `counts` block). Deity profiles and rituals are never counted as prayers. */
export const contentCounts = (() => {
  const byCategory: Record<string, number> = {};
  for (const e of entries) byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
  const recitations = entries.filter((e) => isRecitationCategory(e.category)).length;
  return { byCategory, recitations, yantraReferences: entries.length - recitations };
})();

const haystacks = new Map(entries.map((e) => [e.id, entryHaystack(e, collection.category_labels[e.category])]));
export const haystackFor = (id: string) => haystacks.get(id) ?? '';

/** Localised text with graceful fallback. `fellBack` is true when the requested language was missing. */
export function pick(l: Localized | undefined, lang: Lang): { text: string | undefined; fellBack: boolean } {
  if (!l) return { text: undefined, fellBack: false };
  const own = l[lang]?.trim() ? l[lang] : undefined;
  if (own) return { text: own, fellBack: false };
  const other = lang === 'hi' ? l.en : l.hi;
  return { text: other?.trim() ? other : undefined, fellBack: !!other };
}

export const loc = (l: Localized | undefined, lang: Lang): string | undefined => pick(l, lang).text;

export const categoryLabel = (category: string, lang: Lang): string =>
  loc(collection.category_labels[category], lang) ?? category;

export const entryTitle = (e: Entry, lang: Lang): string => loc(e.title_localized, lang) ?? e.title;

export function entryDeityName(e: Entry, lang: Lang): string | undefined {
  const profile = e.deity_id ? deitiesById.get(e.deity_id) : undefined;
  return loc(e.deity_name_localized, lang) ?? (profile ? loc(profile.name, lang) : undefined) ?? e.deity;
}

/** Related entries for a deity: explicit related_entry_ids first, then any other entries naming this deity_id. */
export function relatedEntries(deity: DeityProfile): Entry[] {
  const out: Entry[] = [];
  const seen = new Set<string>();
  for (const id of deity.related_entry_ids) {
    const e = entriesById.get(id);
    if (e && !seen.has(id)) {
      out.push(e);
      seen.add(id);
    }
  }
  for (const e of entries) {
    if (e.deity_id === deity.id && !seen.has(e.id)) {
      out.push(e);
      seen.add(e.id);
    }
  }
  return out;
}

export function sourcesFor(ids: readonly string[]): EducationalSource[] {
  return ids.map((id) => sourcesById.get(id)).filter((s): s is EducationalSource => !!s);
}

/** Route for an entry: yantras open the reference screen, everything else the reader. */
export const entryHref = (e: Entry) =>
  isRecitationCategory(e.category) ? (`/prayer/${e.id}` as const) : (`/yantra/${e.id}` as const);

/** Deity ids that have at least one entry, in profile order, then any unprofiled ids. */
export const deityIdsWithEntries: readonly string[] = (() => {
  const ids = deities.map((d) => d.id).filter((id) => entries.some((e) => e.deity_id === id));
  for (const e of entries) if (e.deity_id && !ids.includes(e.deity_id)) ids.push(e.deity_id);
  return ids;
})();

export function deityLabel(deityId: string, lang: Lang): string {
  const profile = deitiesById.get(deityId);
  if (profile) return loc(profile.name, lang) ?? deityId;
  const e = entries.find((x) => x.deity_id === deityId);
  return (e && (loc(e.deity_name_localized, lang) ?? e.deity)) ?? deityId;
}

export const mantraEntries = () => entries.filter((e) => e.category === 'mantra');
