/**
 * Types for devotional_collection.json (schema_version 1.x).
 *
 * The dataset is the single source of truth. These types describe the fields
 * the app reads; any extra fields in the JSON are preserved untouched because
 * the app keeps references to the original parsed objects.
 */

export type Lang = 'hi' | 'en';

/** Bilingual editorial text. Either language may be absent. */
export interface Localized {
  hi?: string;
  en?: string;
}

export interface EntrySource {
  url?: string;
  accessed_on?: string;
  source_line_start?: number;
  source_line_end?: number;
}

export interface YantraAsset {
  type?: string;
  /** Always null in the current dataset. The app never draws or invents a diagram. */
  diagram?: unknown;
  offline_available?: boolean;
  commercial_reuse_cleared?: boolean;
}

export type VerificationValue = boolean | number | string;

export interface Entry {
  id: string;
  category: string;
  /** Original title as published, usually Devanagari. */
  title: string;
  /** Legacy English deity label. Prefer deity_id + deity_name_localized. */
  deity?: string;
  deity_id?: string;
  /** Language of the original recitation, e.g. "hi" or "sa". */
  language?: string;
  script?: string;
  /** Canonical original text. Hashed by text_sha256. */
  text?: string;
  /** The same text split on "\n". Rendered instead of `text` when both agree. */
  lines?: string[];
  text_sha256?: string;
  source?: EntrySource;
  verification?: Record<string, VerificationValue>;
  notes?: string;
  title_localized?: Localized;
  deity_name_localized?: Localized;
  why_recite_or_use?: Localized;
  summary?: Localized;
  explanation_note?: Localized;
  asset?: YantraAsset;
}

export interface DeityProfile {
  id: string;
  legacy_deity_value?: string;
  name: Localized;
  who?: Localized;
  why_worship?: Localized;
  common_occasions?: Localized;
  common_offerings?: Localized;
  practical_reflection?: Localized;
  related_entry_ids: string[];
  source_ids: string[];
  content_type?: string;
  review_status?: string;
}

export interface RitualExplanation {
  id: string;
  name: Localized;
  why_it_is_done?: Localized;
  source_ids: string[];
  source_urls: string[];
  content_type?: string;
}

export interface PujaBasics {
  title?: Localized;
  description?: Localized;
  choosing_deity?: Localized;
  timing?: Localized;
  source_ids: string[];
}

export interface EducationalSource {
  id: string;
  url: string;
  accessed_on?: string;
}

export interface LocalizationCoverage {
  deity_profiles?: string;
  ritual_explanations?: string;
  entry_titles_and_summaries?: string;
  original_prayers?: string;
  full_prayer_translations?: string;
  english_transliterations?: string;
  note?: Localized;
}

export interface Collection {
  schema_version?: string;
  generated_on?: string;
  updated_on?: string;
  default_script?: string;
  scope?: string;
  editorial_policy?: Record<string, string>;
  counts?: Record<string, number>;
  entries: Entry[];
  supported_explanation_languages?: string[];
  localization_coverage?: LocalizationCoverage;
  content_guidance?: Localized;
  deities: DeityProfile[];
  puja_basics?: PujaBasics;
  ritual_explanations: RitualExplanation[];
  category_labels: Record<string, Localized>;
  educational_sources: EducationalSource[];
}

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  path: string;
  message: string;
}

export interface ValidationResult {
  collection: Collection;
  issues: ValidationIssue[];
}
