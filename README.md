# Mandirpedia

An offline-first Hindu devotional app for Android and iOS, built with React Native, Expo SDK 58, Expo Router and TypeScript. It presents aartis, chalisas and mantras exactly as their sources give them, links yantra references, and explains in Hindi and English why deities are worshipped.

All content comes from `devotional_collection.json`, which is bundled into the app. There is no backend, login or subscription. Favourites, bookmarks, reading progress, settings and jap counts are stored only on the device.

## Setup and run

Requirements: Node 20 or later and npm. For devices, install **Expo Go** (all native modules used are included in Expo Go) or make a development build.

```bash
npm install
npm start            # then press a (Android), i (iOS simulator) or scan the QR code in Expo Go
npm run android      # same, opening Android directly
npm run ios          # same, opening the iOS simulator (macOS only)
```

Checks:

```bash
npm run check             # typecheck + content validation + tests
npm run validate:content  # validate devotional_collection.json after editing it
npm test                  # unit tests (Node test runner)
npx expo-doctor           # dependency/config health
```

Release builds, App Store listing and over-the-air updates: see **[APP_STORE_RELEASE.md](APP_STORE_RELEASE.md)**. The EAS project is `@akcatalysts-team/mandirpedia` and the bundle ID is `com.mandirpedia`.

Regenerate the icon, splash and favicon after changing the temple mark: `npm run icons` (needs ImageMagick 7).

## Adding content

Edit `devotional_collection.json` and run `npm run validate:content`. No code changes are needed for new entries, deities, ritual explanations, sources or categories that have a `category_labels` entry. IDs must be unique. `related_entry_ids`, `deity_id` and `source_ids` must point to existing records; the validator reports broken links.

## Content integrity

- Original text is rendered from `lines` (one Text per item; blank items become spacing) only when `lines.join('\n')` equals `text` exactly. Otherwise `text` is shown. The app never shows both, and never sets a line limit.
- The reader re-hashes the exact displayed string on the device and compares it with `text_sha256`. The result is shown under **Source and verification**.
- Tests confirm that every one of the 18 recitations renders byte-for-byte equal to its source text, including `x2` repetition marks and parenthesised alternate lines, and that validation never mutates the data.
- Explanations, significance and sources sit in separate, collapsible sections below the recitation. Benefits are labelled as traditional belief.
- Switching between Hindi and English changes interface labels and explanations only. Prayers stay in their original language. The app states that no translations or transliterations are included.
- Yantras are external references. The app shows "Diagram not available offline" and an **Open source reference** button. It never draws or embeds a diagram.

## Design

The interface is monochrome: pure black and white UI, sharp rectangular cards, thin borders, and bold uppercase Latin labels. Tracking is applied only to Latin text, because letter-spacing breaks the Devanagari headline stroke. Grayscale is allowed only within artwork. Light is the default theme, and a dark theme is available (Settings, or the sun/moon button in the reader). The Home hero and deity artwork are always dark. The old "warm paper" setting migrates to light automatically; favourites, bookmarks and jap counts are kept.

Fonts are bundled for offline use: Noto Sans Devanagari for the interface and Noto Serif Devanagari for prayers. Both shape conjuncts and matras correctly.

### Deity artwork

Home has a full-bleed hero (a featured deity that changes daily) and a two-column "Browse by Deity / देवता चुनें" grid (three columns on tablets). The deity page has an artwork banner. Images are bundled locally, rendered grayscale, and covered with a dark scrim for legibility.

Each deity is shown with an original black-and-white **emblem** of its traditional symbol, drawn for this app (`src/content/emblems.ts`): Shiva's trishula and damaru, Hanuman's gada, Ganesha's modak, Durga's khadga, Lakshmi's lotus, Vishnu's Sudarshana chakra, Saraswati's veena, Shani as Saturn, the rising sun for Savitr, and Kubera's treasure pot. Symbols are used rather than figurative depictions, and because they were drawn here there are no rights to clear. The app icon and splash use the same system (a temple silhouette).

Licensed photographs can replace emblems at any time. See [assets/deities/README.md](assets/deities/README.md); each image needs a credit and permission note in `src/content/deityImages.ts`.

### Yantras

`src/content/yantraDiagrams.ts` supports two kinds of visual: diagrams the app draws, and licensed images. Only the **Kubera yantra** is drawn: its commonly published 3 × 3 number square, in which every line sums to 72 (enforced by a test), with a note that it is not copied from the source page. The other five keep their source links, because their traditional forms vary and their geometry is unverified.

## Engagement and updates

- **Most used** (Home): the four features, prayers or deities this person opens most, counted on the device only. They are cleared with reading history.
- **In-app review:** a rare, policy-limited request after finishing a prayer or completing a jap round (`src/state/usage.ts`), plus **Rate Mandirpedia** in Settings.
- **Automatic updates:** `expo-updates` checks on launch and when the app returns to the foreground, downloads in the background, and offers **Restart now**. Native changes still need a store build.

## Project layout

```
devotional_collection.json   content source (unchanged by the app)
src/app/                     screens (Expo Router): tabs, prayer/[id], yantra/[id], deity/[id], deities, favourites, sources
src/components/              ui.tsx (design primitives), content.tsx (recitation, sources, rows), DeityArt.tsx
src/content/                 types, validator, recitation model, search, artwork registry
src/state/                   zustand store (AsyncStorage), pure jap and theme logic
src/theme/                   monochrome palettes and tokens
src/i18n/                    Hindi and English interface strings
scripts/validate-content.ts  CLI validator with SHA-256 checks
tests/                       Node tests
```

## Unavailable assets and unfinished items

- **Deity photographs:** none bundled; original emblems are shown instead. Add licensed photos if wanted.
- **Audio:** none supplied, so no audio player is shown.
- **Yantra diagrams:** five of six remain source links (only Kubera is drawn). Add licensed images in `yantraArtwork` if you obtain permission.
- **iOS signing:** the first production build must be run interactively once to sign in to Apple (see APP_STORE_RELEASE.md, section 2).
- **Store links:** add `ios.appStoreUrl` and `android.playStoreUrl` to `app.json` once the store records exist, so **Rate Mandirpedia** opens the review page directly.
- **Editorial review:** the dataset states that religious/editorial proofreading is still required, and that source websites' reuse rights have not been cleared for a commercial app. Resolve both before publishing.
- **Dataset wording to review:** the English summary for `gayatri-mantra` reads "worship of Gayatri worship and Savitr". The app displays dataset explanations as supplied.
- **Editorial policy and per-entry notes** exist only in English in the dataset. The Hindi UI labels them as English-only.
- **Testing:** verified with typechecks, unit tests, Android/iOS Metro bundles, `expo-doctor`, and a web build checked in headless Chromium with external networking blocked. It has **not** yet been run on physical Android or iOS devices. Check haptics, keep-awake, auto-scroll smoothness and the iOS grayscale filter on hardware.
