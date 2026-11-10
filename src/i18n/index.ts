import { useCallback } from 'react';
import { useLang } from '@/state/store';
import type { Lang } from '@/content/types';
import { strings, type StringKey } from './strings';

export type { StringKey };

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  let s = strings[lang][key] ?? strings.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Look up a key that may not exist (e.g. built from dataset values). */
export function translateOptional(lang: Lang, key: string, vars?: Record<string, string | number>): string | undefined {
  if (!(key in strings.en)) return undefined;
  return translate(lang, key as StringKey, vars);
}

export function useT() {
  const lang = useLang();
  const t = useCallback((key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const tOpt = useCallback((key: string, vars?: Record<string, string | number>) => translateOptional(lang, key, vars), [lang]);
  return { t, tOpt, lang };
}

export function languageName(code: string | undefined, lang: Lang): string {
  if (!code) return '';
  return translateOptional(lang, `lang_${code}`) ?? code;
}

/** Format an ISO date (YYYY-MM-DD) for display without timezone shifts. */
export function formatDate(iso: string | undefined, lang: Lang): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  try {
    return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}
