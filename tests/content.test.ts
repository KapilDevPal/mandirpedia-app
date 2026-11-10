import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { countVerseLines, getRecitation, recitationString } from '../src/content/recitation.ts';
import { isRecitationCategory, validateCollection } from '../src/content/validate.ts';

const rawText = readFileSync(resolve(import.meta.dirname, '..', 'devotional_collection.json'), 'utf8');
const load = () => JSON.parse(rawText) as any;
const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

test('bundled dataset has no validation errors', () => {
  const { issues } = validateCollection(load());
  const errors = issues.filter((i) => i.severity === 'error');
  assert.deepEqual(errors, []);
});

test('validation never mutates the dataset', () => {
  const data = load();
  const before = JSON.stringify(data);
  validateCollection(data);
  assert.equal(JSON.stringify(data), before);
});

test('every recitation renders exactly the original text, complete and in order', () => {
  const { collection } = validateCollection(load());
  const recitations = collection.entries.filter((e) => isRecitationCategory(e.category));
  assert.equal(recitations.length, 18);
  for (const e of recitations) {
    const r = getRecitation(e);
    assert.equal(r.kind, 'lines', `${e.id} should render its lines array`);
    const shown = recitationString(r);
    assert.equal(shown, e.text, `${e.id}: rendered text differs from source`);
    assert.equal(sha256(shown!), e.text_sha256, `${e.id}: checksum mismatch`);
    if (r.kind === 'lines') assert.equal(r.lines.length, e.lines!.length, `${e.id}: lines dropped`);
  }
});

test('long chalisas are present in full (no truncation)', () => {
  const { collection } = validateCollection(load());
  for (const e of collection.entries.filter((x) => x.category === 'chalisa')) {
    const r = getRecitation(e);
    assert.ok(countVerseLines(r) >= 40, `${e.id} has only ${countVerseLines(r)} verse lines`);
    assert.equal(recitationString(r)!.length, e.text!.length);
  }
});

test('repetition marks and parenthesised alternates are preserved', () => {
  const { collection } = validateCollection(load());
  const ganesh = collection.entries.find((e) => e.id === 'ganesha-aarti')!;
  const shown = recitationString(getRecitation(ganesh))!;
  assert.ok(shown.includes('x2'), 'x2 repetition marker missing');
  assert.ok(shown.includes('('), 'parenthesised alternate missing');
});

test('only one of text or lines is ever rendered', () => {
  assert.deepEqual(getRecitation({ text: 'a\nb', lines: ['a', 'b'] }), { kind: 'lines', lines: ['a', 'b'] });
  // If they disagree, the canonical checksummed text wins and lines are not shown.
  assert.deepEqual(getRecitation({ text: 'a\nb', lines: ['a', 'c'] }), { kind: 'text', text: 'a\nb' });
  assert.deepEqual(getRecitation({ text: 'only text' }), { kind: 'text', text: 'only text' });
  assert.deepEqual(getRecitation({ lines: ['x'] }), { kind: 'lines', lines: ['x'] });
  assert.deepEqual(getRecitation({}), { kind: 'none' });
});

test('IDs are unique and all relationships resolve', () => {
  const data = load();
  const ids = data.entries.map((e: any) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  const deityIds = data.deities.map((d: any) => d.id);
  assert.equal(new Set(deityIds).size, deityIds.length);
  const sourceIds = new Set(data.educational_sources.map((s: any) => s.id));
  for (const d of data.deities) {
    for (const r of d.related_entry_ids) assert.ok(ids.includes(r), `${d.id} -> ${r}`);
    for (const s of d.source_ids) assert.ok(sourceIds.has(s), `${d.id} source ${s}`);
  }
  for (const e of data.entries) assert.ok(deityIds.includes(e.deity_id), `${e.id} deity_id ${e.deity_id}`);
});

test('actual counts: deity profiles and ritual explanations are not counted as prayers', () => {
  const { collection } = validateCollection(load());
  const count = (c: string) => collection.entries.filter((e) => e.category === c).length;
  assert.equal(count('aarti'), 6);
  assert.equal(count('chalisa'), 6);
  assert.equal(count('mantra'), 6);
  assert.equal(count('yantra'), 6);
  assert.equal(collection.entries.length, 24);
  assert.equal(collection.deities.length, 10);
  assert.equal(collection.ritual_explanations.length, 7);
});

test('yantras are external references with no bundled diagram', () => {
  const { collection } = validateCollection(load());
  for (const e of collection.entries.filter((x) => x.category === 'yantra')) {
    assert.equal(e.asset?.diagram ?? null, null);
    assert.equal(e.asset?.offline_available, false);
    assert.match(e.source?.url ?? '', /^https:\/\//);
    assert.equal(e.text, undefined);
  }
});

test('validator catches broken data', () => {
  const data = load();
  data.entries.push({ ...data.entries[0] }); // duplicate id
  data.deities[0].related_entry_ids.push('no-such-entry');
  data.deities[0].source_ids.push('no-such-source');
  data.entries[1].lines = [...data.entries[1].lines, 'extra'];
  const { issues, collection } = validateCollection(data);
  const msgs = issues.filter((i) => i.severity === 'error').map((i) => i.message).join('\n');
  assert.match(msgs, /Duplicate entry id/);
  assert.match(msgs, /unknown entry "no-such-entry"/);
  assert.match(msgs, /unknown source "no-such-source"/);
  assert.match(msgs, /does not equal "text"/);
  assert.equal(collection.entries.length, 24, 'duplicate should be skipped');
});

test('validator degrades gracefully on missing optional fields', () => {
  const data = load();
  delete data.entries[0].summary;
  delete data.entries[0].why_recite_or_use;
  delete data.deities[0].practical_reflection;
  delete data.puja_basics;
  data.entries[2].title_localized = { hi: data.entries[2].title_localized.hi };
  const { issues, collection } = validateCollection(data);
  assert.equal(issues.filter((i) => i.severity === 'error').length, 0);
  assert.ok(issues.some((i) => i.path.includes('title_localized.en')));
  assert.equal(collection.puja_basics, undefined);
});

test('validator rejects non-object input without throwing', () => {
  const { issues, collection } = validateCollection(null);
  assert.equal(collection.entries.length, 0);
  assert.equal(issues[0]?.severity, 'error');
});
