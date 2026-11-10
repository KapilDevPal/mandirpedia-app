import type {
  Collection,
  DeityProfile,
  EducationalSource,
  Entry,
  Localized,
  RitualExplanation,
  ValidationIssue,
  ValidationResult,
} from './types';

/**
 * Structural validation of the bundled dataset.
 *
 * Pure TypeScript with no React Native imports, so the same code runs in the
 * app (at start-up) and in Node (scripts/validate-content.ts and tests).
 *
 * The validator never modifies content. Valid objects are passed through by
 * reference, so all original fields (including ones the app does not read)
 * are preserved. Records missing the minimum fields needed to render safely
 * are dropped and reported as errors.
 */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter(isStr) : []);

export const RECITATION_CATEGORIES_EXCLUDED = new Set(['yantra']);

/** True for categories whose entries carry an original text to recite. */
export function isRecitationCategory(category: string): boolean {
  return !RECITATION_CATEGORIES_EXCLUDED.has(category);
}

export function validateCollection(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const err = (path: string, message: string) => issues.push({ severity: 'error', path, message });
  const warn = (path: string, message: string) => issues.push({ severity: 'warning', path, message });

  const empty: Collection = {
    entries: [],
    deities: [],
    ritual_explanations: [],
    category_labels: {},
    educational_sources: [],
  };

  if (!isObj(input)) {
    err('$', 'Dataset root must be an object.');
    return { collection: empty, issues };
  }

  const checkLocalized = (v: unknown, path: string, required = false): v is Localized => {
    if (v === undefined) {
      if (required) warn(path, 'Missing bilingual field.');
      return false;
    }
    if (!isObj(v)) {
      err(path, 'Expected an object with "hi" and/or "en".');
      return false;
    }
    for (const lang of ['hi', 'en'] as const) {
      if (v[lang] !== undefined && !isStr(v[lang])) err(`${path}.${lang}`, 'Expected a string.');
      if (!isNonEmptyStr(v[lang])) warn(`${path}.${lang}`, `No ${lang === 'hi' ? 'Hindi' : 'English'} text; the app will fall back to the other language.`);
    }
    return true;
  };

  // ---------- educational sources ----------
  const sources: EducationalSource[] = [];
  const sourceIds = new Set<string>();
  (Array.isArray(input.educational_sources) ? input.educational_sources : []).forEach((s, i) => {
    const path = `educational_sources[${i}]`;
    if (!isObj(s) || !isNonEmptyStr(s.id) || !isNonEmptyStr(s.url)) {
      err(path, 'Source needs a non-empty "id" and "url"; skipped.');
      return;
    }
    if (sourceIds.has(s.id)) err(path, `Duplicate source id "${s.id}".`);
    if (!/^https?:\/\//.test(s.url)) warn(`${path}.url`, 'URL is not http(s).');
    sourceIds.add(s.id);
    sources.push(s as unknown as EducationalSource);
  });

  // ---------- category labels ----------
  const categoryLabels: Record<string, Localized> = {};
  if (isObj(input.category_labels)) {
    for (const [k, v] of Object.entries(input.category_labels)) {
      if (checkLocalized(v, `category_labels.${k}`)) categoryLabels[k] = v as Localized;
    }
  } else {
    warn('category_labels', 'Missing; category ids will be shown instead of labels.');
  }

  // ---------- entries ----------
  const entries: Entry[] = [];
  const entryIds = new Set<string>();
  const rawEntries = Array.isArray(input.entries) ? input.entries : [];
  if (!Array.isArray(input.entries)) err('entries', 'Expected an array of entries.');

  rawEntries.forEach((e, i) => {
    const path = `entries[${i}]`;
    if (!isObj(e) || !isNonEmptyStr(e.id) || !isNonEmptyStr(e.category) || !isNonEmptyStr(e.title)) {
      err(path, 'Entry needs non-empty "id", "category" and "title"; skipped.');
      return;
    }
    const p = `entries[${e.id}]`;
    if (entryIds.has(e.id)) {
      err(p, `Duplicate entry id "${e.id}"; later copy skipped.`);
      return;
    }
    if (!categoryLabels[e.category]) warn(`${p}.category`, `Category "${e.category}" has no label in category_labels.`);

    const hasText = e.text !== undefined;
    const hasLines = e.lines !== undefined;
    if (hasText && !isStr(e.text)) err(`${p}.text`, 'Expected a string.');
    if (hasLines && (!Array.isArray(e.lines) || !e.lines.every(isStr))) err(`${p}.lines`, 'Expected an array of strings.');

    if (isRecitationCategory(e.category)) {
      if (!isNonEmptyStr(e.text) && !(Array.isArray(e.lines) && e.lines.length > 0)) {
        err(p, 'Recitation entry has neither "text" nor "lines"; it will be listed without a readable text.');
      }
      if (isStr(e.text) && Array.isArray(e.lines) && e.lines.every(isStr) && e.lines.join('\n') !== e.text) {
        err(p, '"lines" joined with newlines does not equal "text"; the app will show "text" only.');
      }
      if (isStr(e.text) && !isNonEmptyStr(e.text_sha256)) warn(`${p}.text_sha256`, 'No checksum recorded for the original text.');
      if (!isObj(e.source) || !isNonEmptyStr(e.source.url)) warn(`${p}.source`, 'No source URL.');
    } else {
      // Yantra references: the app never renders a diagram.
      if (!isObj(e.source) || !isNonEmptyStr(e.source.url)) err(`${p}.source.url`, 'Yantra reference has no source URL to open.');
      if (isObj(e.asset) && e.asset.offline_available === true) {
        warn(`${p}.asset`, 'offline_available is true, but this app version does not bundle or draw yantra diagrams.');
      }
    }

    checkLocalized(e.title_localized, `${p}.title_localized`, true);
    if (e.deity_name_localized !== undefined) checkLocalized(e.deity_name_localized, `${p}.deity_name_localized`);
    if (e.summary !== undefined) checkLocalized(e.summary, `${p}.summary`);
    if (e.why_recite_or_use !== undefined) checkLocalized(e.why_recite_or_use, `${p}.why_recite_or_use`);
    if (e.explanation_note !== undefined) checkLocalized(e.explanation_note, `${p}.explanation_note`);

    entryIds.add(e.id);
    entries.push(e as unknown as Entry);
  });

  // ---------- deities ----------
  const deities: DeityProfile[] = [];
  const deityIds = new Set<string>();
  (Array.isArray(input.deities) ? input.deities : []).forEach((d, i) => {
    const path = `deities[${i}]`;
    if (!isObj(d) || !isNonEmptyStr(d.id) || !isObj(d.name)) {
      err(path, 'Deity profile needs "id" and "name"; skipped.');
      return;
    }
    const p = `deities[${d.id}]`;
    if (deityIds.has(d.id)) {
      err(p, `Duplicate deity id "${d.id}"; later copy skipped.`);
      return;
    }
    checkLocalized(d.name, `${p}.name`, true);
    for (const f of ['who', 'why_worship', 'common_occasions', 'common_offerings', 'practical_reflection']) {
      if (d[f] !== undefined) checkLocalized(d[f], `${p}.${f}`);
    }
    const related = strArray(d.related_entry_ids);
    related.forEach((rid) => {
      if (!entryIds.has(rid)) err(`${p}.related_entry_ids`, `Links to unknown entry "${rid}".`);
    });
    const srcs = strArray(d.source_ids);
    srcs.forEach((sid) => {
      if (!sourceIds.has(sid)) err(`${p}.source_ids`, `Links to unknown source "${sid}".`);
    });
    deityIds.add(d.id);
    // Normalise missing arrays without mutating the original object.
    deities.push({ ...(d as unknown as DeityProfile), related_entry_ids: related, source_ids: srcs });
  });

  // Entry -> deity links and reverse-link consistency
  for (const e of entries) {
    if (!e.deity_id) {
      warn(`entries[${e.id}].deity_id`, 'No deity_id; entry cannot be linked to a deity profile.');
      continue;
    }
    const profile = deities.find((d) => d.id === e.deity_id);
    if (!profile) {
      warn(`entries[${e.id}].deity_id`, `No deity profile with id "${e.deity_id}".`);
    } else if (!profile.related_entry_ids.includes(e.id)) {
      warn(`deities[${profile.id}].related_entry_ids`, `Does not list "${e.id}", although that entry names this deity. It will still be shown as related.`);
    }
  }

  // ---------- ritual explanations ----------
  const rituals: RitualExplanation[] = [];
  const ritualIds = new Set<string>();
  (Array.isArray(input.ritual_explanations) ? input.ritual_explanations : []).forEach((r, i) => {
    const path = `ritual_explanations[${i}]`;
    if (!isObj(r) || !isNonEmptyStr(r.id) || !isObj(r.name)) {
      err(path, 'Ritual explanation needs "id" and "name"; skipped.');
      return;
    }
    if (ritualIds.has(r.id)) {
      err(path, `Duplicate ritual id "${r.id}"; later copy skipped.`);
      return;
    }
    checkLocalized(r.name, `ritual_explanations[${r.id}].name`, true);
    checkLocalized(r.why_it_is_done, `ritual_explanations[${r.id}].why_it_is_done`, true);
    const srcs = strArray(r.source_ids);
    srcs.forEach((sid) => {
      if (!sourceIds.has(sid)) err(`ritual_explanations[${r.id}].source_ids`, `Links to unknown source "${sid}".`);
    });
    ritualIds.add(r.id);
    rituals.push({ ...(r as unknown as RitualExplanation), source_ids: srcs, source_urls: strArray(r.source_urls) });
  });

  // ---------- puja basics ----------
  let pujaBasics: Collection['puja_basics'];
  if (isObj(input.puja_basics)) {
    const pb = input.puja_basics;
    for (const f of ['title', 'description', 'choosing_deity', 'timing']) {
      if (pb[f] !== undefined) checkLocalized(pb[f], `puja_basics.${f}`);
    }
    const srcs = strArray(pb.source_ids);
    srcs.forEach((sid) => {
      if (!sourceIds.has(sid)) err('puja_basics.source_ids', `Links to unknown source "${sid}".`);
    });
    pujaBasics = { ...(pb as unknown as NonNullable<Collection['puja_basics']>), source_ids: srcs };
  }

  // ---------- declared counts ----------
  if (isObj(input.counts)) {
    const actual: Record<string, number> = {};
    entries.forEach((e) => (actual[e.category] = (actual[e.category] ?? 0) + 1));
    for (const [cat, n] of Object.entries(actual)) {
      if (typeof input.counts[cat] === 'number' && input.counts[cat] !== n) {
        warn(`counts.${cat}`, `Declares ${String(input.counts[cat])} but the dataset contains ${n}. The app shows the actual number.`);
      }
    }
    if (typeof input.counts.total === 'number' && input.counts.total !== entries.length) {
      warn('counts.total', `Declares ${input.counts.total} but ${entries.length} valid entries were found.`);
    }
  }

  const collection: Collection = {
    ...(input as unknown as Collection),
    entries,
    deities,
    ritual_explanations: rituals,
    category_labels: categoryLabels,
    educational_sources: sources,
    puja_basics: pujaBasics,
  };

  return { collection, issues };
}
