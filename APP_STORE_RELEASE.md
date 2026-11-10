# Releasing Mandirpedia

How to make production builds with EAS, publish to the App Store (and Google Play), ship over-the-air updates, and fill in the store listing.

| | |
|---|---|
| App name | Mandirpedia |
| iOS bundle ID / Android package | `com.mandirpedia` |
| EAS project | `@akcatalysts-team/mandirpedia` (ID `dd3653c9-7ead-4e43-9244-3a49ff248190`) |
| Build profiles (`eas.json`) | `production` (store), `preview` (internal testers), `development` (iOS simulator) |
| Update channels | `production`, `preview`, `development` |
| Version source | Remote: EAS increments the iOS build number and Android version code automatically |

---

## 1. Before you start

- [ ] **Apple Developer Program** membership (paid, yearly) with the Account Holder or Admin role.
- [ ] **EAS login**: `npx eas-cli@latest whoami` should list `akcatalysts-team`. If not, run `npx eas-cli@latest login`.
- [ ] **Checks pass**: `npm install && npm run check && npx expo-doctor`.
- [ ] **Blockers resolved** (see section 9): content rights and proofreading.

> This folder is not a git repository. Either run `git init && git add -A && git commit -m "Release 1.0.0"` (recommended: EAS then uploads exactly what is committed), or prefix every `eas` command with `EAS_NO_VCS=1`, which uploads the folder and respects `.gitignore`.

---

## 2. First iOS production build (one-time interactive step)

EAS must sign in to Apple once to register the bundle ID and create the distribution certificate and provisioning profile. Run this in a terminal (not CI):

```bash
npx eas-cli@latest build --platform ios --profile production
```

Answer the prompts:

1. **Log in to your Apple account?** Yes. Enter your Apple ID and the 2FA code.
2. **Select team.** Choose the team that should own the app.
3. **Register bundle identifier `com.mandirpedia`?** Yes.
4. **Generate a new Apple Distribution Certificate?** Yes (or reuse an existing one).
5. **Generate a new Provisioning Profile?** Yes.

EAS stores these credentials, so later builds (including `--non-interactive` and CI) do not need you to sign in again. The build runs in the cloud (about 15 to 25 minutes) and you get an `.ipa` link at https://expo.dev/accounts/akcatalysts-team/projects/mandirpedia/builds.

---

## 3. Create the app in App Store Connect

1. Go to https://appstoreconnect.apple.com, then **Apps**, then **+ New App**.
2. **Platform:** iOS. **Name:** Mandirpedia (it must be unique on the App Store; if it is taken, try "Mandirpedia: Aarti & Mantra"). **Primary language:** English (Australia) or English (U.S.). **Bundle ID:** `com.mandirpedia`. **SKU:** `mandirpedia-ios`. **User access:** Full access.
3. Open the new app and note the **Apple ID** (a number) under **App Information**. You need it for the rating link (section 7).

---

## 4. Upload to TestFlight

```bash
npx eas-cli@latest submit --platform ios --latest
```

The first time, EAS asks to sign in to Apple or to create an **App Store Connect API key**. Choose the API key so future submissions need no sign-in. After Apple processes the build (5 to 30 minutes), it appears under **TestFlight**. Add yourself as an internal tester and install it with the TestFlight app.

From now on, you can build and upload in one step:

```bash
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

### TestFlight test checklist

- [ ] Cold start with flight mode on: Home, a chalisa, the Jap counter and a deity page all work offline.
- [ ] Devanagari: conjuncts and matras are not clipped at the smallest and largest text sizes.
- [ ] Reader: bookmark, resume prompt, auto-scroll and pause, keep-screen-awake, light/dark toggle.
- [ ] Jap counter: haptics, target reached, reset confirmation, counts survive force-quit.
- [ ] Hindi/English switch: the interface and explanations change; prayers do not.
- [ ] Settings: **Check for updates** says "You have the latest version".
- [ ] iPad: layout uses three-column deity cards, and nothing stretches edge to edge.

---

## 5. Over-the-air updates (automatic updates)

`expo-updates` is configured (`app.json`: `updates.url`, `checkAutomatically: ON_LOAD`, `runtimeVersion.policy: fingerprint`). The installed app checks on launch and whenever it returns to the foreground (at most every 30 minutes). It downloads updates in the background and applies them on the next launch, or immediately if the user taps **Restart now** on the Home banner.

Publish a JavaScript or content change (prayer text, translations, artwork, layout) to everyone on the production channel:

```bash
npm run check
npx eas-cli@latest update --channel production --message "Add Saraswati Chalisa" --platform all
```

- **What can ship over the air:** anything in `src/`, `devotional_collection.json`, and images or fonts in `assets/`.
- **What needs a new store build:** adding or upgrading a native module, changing `app.json` native settings (icon, splash, permissions, bundle ID), or upgrading the Expo SDK. The fingerprint runtime version means an OTA update can never reach a binary it is incompatible with. Run the build command again, which increments the build number automatically.
- **Roll back:** `npx eas-cli@latest update:rollback` or republish the previous update from the expo.dev dashboard.
- **Test first:** publish to `preview` and install a `preview` build (`eas build --profile preview`) on test devices.

---

## 6. Android (Google Play)

```bash
npx eas-cli@latest build --platform android --profile production   # produces an .aab
```

1. In https://play.google.com/console, create the app (name Mandirpedia, default language, App, Free).
2. **The first upload must be manual:** download the `.aab` from the EAS build page and upload it to **Testing > Internal testing**.
3. For later uploads, create a Google Cloud **service account** with Play Console access, download its JSON key, then run `npx eas-cli@latest submit --platform android --latest` (EAS asks for the key path once).
4. Complete **App content** (privacy policy, ads: none, data safety: no data collected, target audience, content rating questionnaire).

Play's in-app review uses the same **Rate Mandirpedia** button and the automatic prompt.

---

## 7. In-app review

- **Automatic prompt:** shown only at a calm moment (after finishing a prayer or completing a jap round). It needs at least 10 uses, waits at least 3 days after first use, leaves 120 days between requests, and asks at most 3 times. The policy is in `src/state/usage.ts`. iOS also limits it to 3 times a year and decides whether to show it.
- **Settings > Rate Mandirpedia:** after the App Store record exists, add the store links to `app.json` so this button opens the review page directly:

```json
"ios": { "appStoreUrl": "https://apps.apple.com/app/id<APPLE_ID_FROM_SECTION_3>" },
"android": { "playStoreUrl": "https://play.google.com/store/apps/details?id=com.mandirpedia" }
```

Until then, the button falls back to the native review sheet.

> In TestFlight the review sheet never appears (Apple's rule). Test it in a development build on a device, where the sheet always shows but submits nothing.

---

## 8. App Store listing

Copy these into **App Store Connect > your app > App Store** (version 1.0) and **App Information**. You can add Hindi as a second localisation under **App Information > Localizable Information**.

### Text

| Field | Limit | English |
|---|---|---|
| Name | 30 | Mandirpedia |
| Subtitle | 30 | Aarti, Chalisa, Mantra & Jap |
| Promotional text | 170 | Read aartis, chalisas and mantras in their original Devanagari, count jap with a calm tap counter, and learn why each deity is worshipped. Works offline. |
| Keywords | 100 | `aarti,chalisa,mantra,jap,japa,hanuman,shiva,ganesh,durga,lakshmi,puja,hindu,prayer,yantra,gayatri` |

**Description (English):**

```
Mandirpedia is a quiet place for daily prayer.

READ THE ORIGINAL TEXT
• Aartis, chalisas and mantras in their original Hindi or Sanskrit, shown exactly as their sources give them
• Clear Devanagari with adjustable text size, light and dark reading modes, and optional auto-scroll
• Bookmarks and "continue reading" remember where you left off

JAP COUNTER
• A large, calm tap counter for mantra japa
• Choose 11, 21, 108 or your own target, with optional gentle vibration
• Your counts are saved on your phone

LEARN
• Who each deity is, why devotees worship them, common occasions and offerings
• Short introductions to aarti, japa, prasad, flower offerings, abhisheka and yantras
• Every explanation lists its sources

DESIGNED FOR DEVOTION
• Works fully offline once installed
• Hindi and English interface
• No account, no ads, no tracking. Everything stays on your device

Explanations describe traditional beliefs; customs vary by family, region and tradition. Mandirpedia does not include translations or transliterations of the prayers.
```

**Description (Hindi), if you add the Hindi localisation:**

```
मन्दिरपीडिया दैनिक प्रार्थना के लिए एक शान्त स्थान है।

• आरती, चालीसा और मन्त्र अपनी मूल हिन्दी या संस्कृत में, स्रोत के अनुसार अपरिवर्तित
• स्पष्ट देवनागरी, अक्षर का आकार बदलने की सुविधा, हल्की और गहरी पठन थीम
• बुकमार्क और "पढ़ना जारी रखें"
• 11, 21, 108 या अपने लक्ष्य के साथ जप गणक
• देवताओं और पूजा-पद्धतियों का स्रोत-सहित परिचय
• पूरी तरह ऑफ़लाइन, कोई खाता या विज्ञापन नहीं; सब कुछ आपके फ़ोन पर ही रहता है

व्याख्याएँ परम्परागत आस्था का वर्णन हैं; रीति-रिवाज़ परिवार, क्षेत्र और परम्परा के अनुसार बदलते हैं।
```

### App information

| Field | Value |
|---|---|
| Primary category | Lifestyle |
| Secondary category | Reference |
| Age rating | 4+ (answer "None" to every questionnaire item) |
| Copyright | `2026 <your legal name or company>` |
| Content rights | Answer only after resolving section 9. The app contains third-party content (prayer transcriptions). |
| Price | Free |
| Support URL | Required: a page or site where users can contact you |
| Privacy policy URL | Required: host the policy below and paste its URL |

### App privacy ("nutrition label")

Choose **Data Not Collected**. The app has no accounts, analytics, ads or tracking. Favourites, progress, usage counts and jap counts are stored only on the device. Update checks contact Expo's update server (expo.dev) to download new app content, and are not linked to the user or used for tracking. Confirm this still holds before each release if you add SDKs.

**Privacy policy text** (host it on any public page and replace the placeholders):

```
Mandirpedia Privacy Policy (effective <date>)

Mandirpedia does not collect, store or share personal information. There are no accounts, ads, analytics or tracking.

Favourites, bookmarks, reading progress, settings, jap counts and the "most used" list are stored only on your device. You can delete them in Settings, or by uninstalling the app.

To keep the app current, it checks Expo's update service (expo.dev) for new versions of the app's content. These requests contain technical information needed to deliver the update (such as the app version and platform) and are not used to identify you.

Links to source websites open in your browser, where those websites' own policies apply.

Contact: <your email>
```

### Screenshots

Because `ios.supportsTablet` is `true`, Apple requires both:

- **iPhone 6.9"**: 1320 × 2868 (or 6.5": 1284 × 2778), 3 to 10 images
- **iPad 13"**: 2064 × 2752, 3 to 10 images

Capture them from the iOS Simulator (`npx eas-cli build --profile development --platform ios`, then install on an "iPhone 16 Pro Max" and an "iPad Pro 13-inch" simulator, then use **File > Save Screen** or press Cmd+S). A good set:

1. Home: hero and "Browse by Deity"
2. Hanuman Chalisa in the reader (light)
3. The same in dark mode, at a larger text size
4. Jap counter mid-count
5. A deity page (who, why, offerings)
6. Learn about puja
7. The Hindi interface

If you would rather not ship the iPad layout yet, set `"supportsTablet": false` in `app.json` before the first build (it cannot easily be removed later without a new build).

### App Review notes

```
Mandirpedia is an offline reader of traditional Hindu prayers with a jap (mantra) counter. No login is required. All content is bundled; links to source websites open in Safari. The app does not include purchases, ads or user accounts.
```

---

## 9. Release blockers to clear first

These come from the dataset's own editorial policy (Settings > Content sources and accuracy) and from App Review guideline 5.2 (intellectual property):

- [ ] **Content rights.** `devotional_collection.json` says the source websites' transcription reuse terms "have not been cleared for a commercial app". The prayers themselves are traditional, but the specific transcriptions come from websites (mainly drikpanchang.com and sanskritdocuments.org). Get permission, use transcriptions you are licensed to use, or prepare your own from public-domain editions, before submitting.
- [ ] **Religious and editorial proofreading.** The dataset says proof review is still required.
- [ ] **Deity artwork.** The app ships original symbol emblems drawn for it, which are safe to publish. Add photographs only with written permission (see `assets/deities/README.md`).
- [ ] **Yantra diagrams.** Only the Kubera number square is drawn, marked as the commonly published form. Have someone from your tradition confirm it, or remove it from `src/content/yantraDiagrams.ts`.
- [ ] **Support URL and privacy policy URL** are live.

---

## 10. Every later release

```bash
npm run check
# Content/JS only:
npx eas-cli@latest update --channel production --message "<what changed>" --platform all
# Native change or a new store version:
#   bump "version" in app.json (e.g. 1.1.0) for user-visible releases
npx eas-cli@latest build --platform all --profile production --auto-submit
```

Then in App Store Connect, add "What's New" text, attach the build, and **Submit for Review**.
