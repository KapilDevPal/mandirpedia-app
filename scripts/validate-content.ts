/**
 * Validates devotional_collection.json the same way the app does, plus
 * byte-level integrity checks that need Node:
 *
 *   npm run validate:content
 *
 * Exits with code 1 if any error is found. Run this after editing the JSON.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getRecitation, recitationString } from '../src/content/recitation.ts';
import { isRecitationCategory, validateCollection } from '../src/content/validate.ts';

const file = resolve(import.meta.dirname, '..', 'devotional_collection.json');
const rawText = readFileSync(file, 'utf8');
const data = JSON.parse(rawText) as unknown;
const snapshot = JSON.stringify(data);

const { collection, issues } = validateCollection(data);
const extra: { severity: 'error' | 'warning'; path: string; message: string }[] = [];

if (JSON.stringify(data) !== snapshot) extra.push({ severity: 'error', path: '$', message: 'Validator mutated the dataset.' });

const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

for (const e of collection.entries) {
  if (!isRecitationCategory(e.category)) continue;
  const r = getRecitation(e);
  const shown = recitationString(r);
  if (shown === null) continue;
  if (typeof e.text === 'string' && shown !== e.text) {
    extra.push({ severity: 'error', path: `entries[${e.id}]`, message: 'Rendered text differs from the original "text" field.' });
  }
  if (e.text_sha256) {
    if (typeof e.text === 'string' && sha256(e.text) !== e.text_sha256) {
      extra.push({ severity: 'error', path: `entries[${e.id}].text_sha256`, message: 'The "text" field does not match its recorded SHA-256.' });
    }
    if (sha256(shown) !== e.text_sha256) {
      extra.push({ severity: 'error', path: `entries[${e.id}]`, message: 'The rendered text does not match the recorded SHA-256.' });
    }
  }
}

const all = [...issues, ...extra];
const errors = all.filter((i) => i.severity === 'error');
const warnings = all.filter((i) => i.severity === 'warning');

const byCategory: Record<string, number> = {};
for (const e of collection.entries) byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;

console.log(`Dataset: ${file}`);
console.log(`Schema ${collection.schema_version ?? '?'}, updated ${collection.updated_on ?? collection.generated_on ?? '?'}`);
console.log(`Entries: ${collection.entries.length} (${Object.entries(byCategory).map(([k, v]) => `${k} ${v}`).join(', ')})`);
console.log(`Deity profiles: ${collection.deities.length} | Ritual explanations: ${collection.ritual_explanations.length} | Sources: ${collection.educational_sources.length}`);
const hashed = collection.entries.filter((e) => e.text_sha256).length;
console.log(`Checksummed recitations verified: ${hashed}`);
for (const i of all) console.log(`${i.severity === 'error' ? 'ERROR  ' : 'warning'} ${i.path}: ${i.message}`);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
