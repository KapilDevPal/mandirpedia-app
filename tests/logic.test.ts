import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { entryHaystack, matchesQuery, searchKey } from '../src/content/search.ts';
import type { Entry } from '../src/content/types.ts';
import { strings } from '../src/i18n/strings.ts';
import {
  decrementCounter,
  incrementCounter,
  newCounter,
  parseCustomTarget,
  resetCounter,
  roundInfo,
  setCounterTarget,
} from '../src/state/jap.ts';

const data = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'devotional_collection.json'), 'utf8'));
const entries: Entry[] = data.entries;
const search = (q: string) =>
  entries.filter((e) => matchesQuery(entryHaystack(e, data.category_labels[e.category]), q)).map((e) => e.id);

// ---------------- search

test('search finds Hindi titles, including common spelling variants', () => {
  assert.ok(search('हनुमान चालीसा').includes('hanuman-chalisa'));
  assert.ok(search('गायत्री मंत्र').includes('gayatri-mantra'), 'anusvara spelling should match मन्त्र');
  assert.ok(search('गायत्री मन्त्र').includes('gayatri-mantra'));
});

test('search finds English titles, deity names and category labels', () => {
  assert.ok(search('hanuman').includes('hanuman-aarti'));
  assert.ok(search('Ganesh').includes('ganesha-chalisa'));
  assert.ok(search('arti').includes('jagdish-aarti'), 'aarti/arti should both match');
  assert.equal(search('yantra').length, 6);
  assert.ok(search('Lord Kubera').includes('kubera-yantra'));
  assert.ok(search('आरती').length >= 6);
});

test('search with no match returns nothing; empty query returns everything', () => {
  assert.deepEqual(search('zzzz-no-such-prayer'), []);
  assert.equal(search('   ').length, entries.length);
});

test('searchKey folds variants without touching displayed text', () => {
  assert.equal(searchKey('मन्त्र'), searchKey('मंत्र'));
  assert.equal(searchKey('Āratī'), searchKey('arati'));
});

// ---------------- jap counter

test('jap counter increments, reports completed rounds and never goes below zero', () => {
  let c = newCounter(11, 0);
  for (let i = 0; i < 10; i++) {
    const r = incrementCounter(c, 1);
    assert.equal(r.reachedTarget, false);
    c = r.counter;
  }
  const r = incrementCounter(c, 2);
  assert.equal(r.reachedTarget, true);
  assert.equal(r.counter.count, 11);
  assert.deepEqual(roundInfo(r.counter), { rounds: 1, inRound: 0 });
  assert.equal(decrementCounter(newCounter()).count, 0);
  assert.equal(resetCounter(r.counter).count, 0);
  assert.equal(resetCounter(r.counter).target, 11, 'reset keeps the target');
});

test('custom targets accept Western and Devanagari digits and reject invalid input', () => {
  assert.equal(parseCustomTarget('54'), 54);
  assert.equal(parseCustomTarget('१०८'), 108);
  assert.equal(parseCustomTarget(' 1008 '), 1008);
  assert.equal(parseCustomTarget('0'), null);
  assert.equal(parseCustomTarget('-5'), null);
  assert.equal(parseCustomTarget('12.5'), null);
  assert.equal(parseCustomTarget('abc'), null);
  assert.equal(parseCustomTarget('100001'), null);
  assert.equal(setCounterTarget(newCounter(108), 0).target, 108, 'invalid target is ignored');
});

// ---------------- i18n

test('Hindi and English interface strings have identical keys and placeholders', () => {
  const en = strings.en as Record<string, string>;
  const hi = strings.hi as Record<string, string>;
  assert.deepEqual(Object.keys(hi).sort(), Object.keys(en).sort());
  const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
  for (const k of Object.keys(en)) {
    assert.ok(en[k]!.trim(), `en.${k} empty`);
    assert.ok(hi[k]!.trim(), `hi.${k} empty`);
    assert.equal(ph(hi[k]!), ph(en[k]!), `placeholder mismatch in ${k}`);
  }
});

test('every verification key in the dataset has an interface label', () => {
  const en = strings.en as Record<string, string>;
  for (const e of entries) {
    for (const [k, v] of Object.entries(e.verification ?? {})) {
      const key = typeof v === 'boolean' ? `v_${k}_${v}` : `v_${k}`;
      assert.ok(key in en, `missing label ${key}`);
    }
  }
});

// ---------------- design migration and artwork registry

test('retired warm-paper theme migrates to light, the default', async () => {
  const { normaliseTheme } = await import('../src/state/themeSetting.ts');
  assert.equal(normaliseTheme('paper'), 'light');
  assert.equal(normaliseTheme('light'), 'light');
  assert.equal(normaliseTheme('system'), 'system');
  assert.equal(normaliseTheme(undefined), 'light');
});

test('deity artwork registry only references known deities and existing local files', async () => {
  const { existsSync } = await import('node:fs');
  const src = readFileSync(resolve(import.meta.dirname, '..', 'src/content/deityImages.ts'), 'utf8');
  // Only active (uncommented) entries count.
  const active = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const deityIds = new Set(data.deities.map((d: { id: string }) => d.id));
  for (const m of active.matchAll(/^\s*(\w+):\s*\{[^}]*?require\('([^']+)'\)/gms)) {
    assert.ok(deityIds.has(m[1]), `unknown deity id in artwork registry: ${m[1]}`);
    const file = resolve(import.meta.dirname, '..', 'src/content', m[2]!);
    assert.ok(existsSync(file), `missing artwork file: ${m[2]}`);
  }
});

// ---------------- usage, review policy and yantra diagrams

test('most-used ranks by count then recency and skips removed content', async () => {
  const { recordUsage, topUsage } = await import('../src/state/usage.ts');
  let u = {};
  u = recordUsage(u, 'entry:hanuman-chalisa', 1);
  u = recordUsage(u, 'entry:hanuman-chalisa', 2);
  u = recordUsage(u, 'feature:jap', 3);
  u = recordUsage(u, 'deity:shiva', 4);
  u = recordUsage(u, 'entry:removed-entry', 5);
  const top = topUsage(u, 3, (k) => k !== 'entry:removed-entry');
  assert.deepEqual(top.map((x) => x.key), ['entry:hanuman-chalisa', 'deity:shiva', 'feature:jap']);
});

test('review is requested rarely and only after real use', async () => {
  const { shouldRequestReview, REVIEW_POLICY } = await import('../src/state/usage.ts');
  const DAY = 86_400_000;
  const now = 1_000 * DAY;
  const used = Object.fromEntries(Array.from({ length: REVIEW_POLICY.minUses }, (_, i) => [`entry:e${i}`, { count: 1, lastAt: now }]));
  const fresh = { firstUseAt: now - 10 * DAY, lastPromptAt: null, promptCount: 0 };
  assert.equal(shouldRequestReview(fresh, used, now), true);
  assert.equal(shouldRequestReview(fresh, {}, now), false, 'needs enough use');
  assert.equal(shouldRequestReview({ ...fresh, firstUseAt: now - DAY }, used, now), false, 'not in the first days');
  assert.equal(shouldRequestReview({ ...fresh, lastPromptAt: now - 30 * DAY, promptCount: 1 }, used, now), false, 'long gap between prompts');
  assert.equal(shouldRequestReview({ ...fresh, promptCount: REVIEW_POLICY.maxPrompts }, used, now), false, 'capped');
});

test('drawn yantra diagrams are internally consistent and reference real yantra entries', async () => {
  const { yantraDiagrams, isValidNumberSquare } = await import('../src/content/yantraDiagrams.ts');
  const yantraIds = new Set(entries.filter((e) => e.category === 'yantra').map((e) => e.id));
  for (const [id, d] of Object.entries(yantraDiagrams)) {
    assert.ok(yantraIds.has(id), `diagram for unknown yantra ${id}`);
    assert.ok(isValidNumberSquare(d!), `${id}: rows, columns and diagonals must each sum to ${d!.magicSum}`);
    assert.ok(d!.basis.en && d!.basis.hi, `${id}: needs a bilingual basis note`);
  }
  assert.equal(isValidNumberSquare({ kind: 'number-square', rows: [[1, 2], [3, 4]], magicSum: 5, basis: {} }), false);
});
