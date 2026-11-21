# Releasing Mandirpedia on Google Play

Everything needed to publish Mandirpedia on Google Play: the account, the build, every Play Console form, and the listing text ready to paste. iOS steps are in [APP_STORE_RELEASE.md](APP_STORE_RELEASE.md).

| | |
|---|---|
| App name | Mandirpedia |
| Package name | `com.mandirpedia` (permanent: it can never change after the first upload) |
| Play Store URL | https://play.google.com/store/apps/details?id=com.mandirpedia (already set as `android.playStoreUrl` in `app.json`) |
| Build | `.aab` from the EAS `production` profile; EAS increments `versionCode` automatically |
| Price | Free (a free app can never be made paid later) |
| Store assets | `store/google-play/` (see section 5) |

---

## 1. Developer account (one time)

1. Sign up at https://play.google.com/console with the Google account that should own the app. The fee is **US$25, paid once**.
2. Choose the account type:
   - **Personal**: verify your identity with a government ID and confirm your phone number.
   - **Organisation**: needs a **D-U-N-S number** for your company (free, but it can take a few weeks to get). Organisation accounts skip the 12-tester rule below.
3. **Personal accounts created after 13 November 2023 must run a closed test first:** at least **12 testers** must stay opted in for **14 days in a row** before you can apply for production access (section 8). Line up 12 or more friends or family members with Android phones before you start.
4. Your **developer name** and **contact email** are shown publicly on the listing. Use an email address you are happy to publish, for example a support address.

---

## 2. Before the first build

- [ ] Checks pass: `npm install && npm run check && npx expo-doctor`.
- [ ] Release blockers from APP_STORE_RELEASE.md section 9 are cleared, especially **content rights**. Google's Intellectual Property policy is as strict as Apple's: an app can be removed for using third-party transcriptions without permission.
- [ ] Privacy policy and support pages are live (section 7).
- [ ] Already done in `app.json`: `android.playStoreUrl` is set, so **Settings > Rate Mandirpedia** opens the Play listing, and `blockedPermissions` removes the two storage permissions and the `SYSTEM_ALERT_WINDOW` (draw over other apps) permission, none of which the app uses.

**Permissions in the final app:** `INTERNET` and `ACCESS_NETWORK_STATE` (update checks and source links) and `VIBRATE` (jap counter haptics). None of these are dangerous permissions, so Play needs no permission declaration and users see no permission prompts.

---

## 3. Build the app bundle

```bash
npx eas-cli@latest build --platform android --profile production
```

The first time, EAS asks **"Generate a new Android Keystore?"**. Answer **Yes**. EAS keeps this *upload key* safe on its servers, so do not lose access to the `akcatalysts-team` Expo account. The build takes 10 to 20 minutes. Download the `.aab` from https://expo.dev/accounts/akcatalysts-team/projects/mandirpedia/builds.

Google signs the copy that users install (**Play App Signing**, which is on by default). If you ever lose the upload key, Google can reset it.

### Alternative: build locally with Gradle

The project can also build the `.aab` (for Play) and an `.apk` (to install directly on a phone) on this machine. It needs JDK 17 and the Android SDK (`ANDROID_HOME`).

```bash
npx expo prebuild --platform android --clean   # regenerates android/ (gitignored); restore package.json scripts afterwards if it rewrites them
cd android
./gradlew bundleRelease assembleRelease
```

| Output | Path |
|---|---|
| App bundle for Play | `android/app/build/outputs/bundle/release/app-release.aab` |
| Installable APK | `android/app/build/outputs/apk/release/app-release.apk` (`adb install -r app-release.apk`) |

**Signing.** `plugins/withReleaseSigning.js` (listed in `app.json` plugins) signs release builds with the **upload key** in `~/keystores/mandirpedia/upload.jks`. Gradle reads its path and password from `~/.gradle/gradle.properties` (`MANDIRPEDIA_UPLOAD_*`). The password is also in `~/keystores/mandirpedia/upload-credentials.txt`. **Back up both files** (password manager plus an offline copy). Without them, a release build falls back to the debug key, which Play rejects.

**Use one upload key everywhere.** The first EAS Android build (1.0.0, versionCode 2) was signed with this same `upload.jks`, passed to EAS through a temporary `credentials.json` and `"credentialsSource": "local"`, both removed afterwards. EAS does not store the key yet, so a plain `eas build -p android` would generate a *different* key that Play rejects. Do one of these before the next Android build:

- **Recommended, once:** `npx eas-cli@latest credentials --platform android` → production → **Keystore** → **Set up a new keystore** → **Upload** `~/keystores/mandirpedia/upload.jks` (alias `upload`; the password is in `upload-credentials.txt`). After that, normal `eas build` works.
- **Or each time:** recreate `credentials.json` in the project root (never commit it):
  ```json
  { "android": { "keystore": { "keystorePath": "/home/<you>/keystores/mandirpedia/upload.jks", "keystorePassword": "…", "keyAlias": "upload", "keyPassword": "…" } } }
  ```
  Then add `"android": { "credentialsSource": "local" }` to the `production` build profile, run the build, and remove both again.

**Version code.** Local builds use `versionCode` 1 from the generated project. Play rejects a second upload with the same code, so before each local upload, raise it with `"android": { "versionCode": 2 }` in `app.json` (then run prebuild again). EAS manages the version code remotely; if you switch between the two methods, run `npx eas-cli@latest build:version:set -p android` so they don't collide.

---

## 4. Create the app in Play Console

**Home > Create app**:

| Field | Value |
|---|---|
| App name | `Mandirpedia: Aarti & Chalisa` (28/30). Use plain `Mandirpedia` if you prefer. |
| Default language | English (United States), en-US. Add Hindi as a translation later (section 6). |
| App or game | App |
| Free or paid | Free |
| Declarations | Tick Developer Program Policies, Play App Signing terms, and US export laws |

The **Dashboard** then shows the **Set up your app** tasks. Sections 5 to 7 cover each one.

---

## 5. Store listing (Grow users > Store presence > Main store listing)

### Text

| Field | Limit | Value |
|---|---|---|
| App name | 30 | `Mandirpedia: Aarti & Chalisa` |
| Short description | 80 | `Aarti, chalisa & mantra in original Devanagari, plus a jap counter. Offline.` (76) |
| Full description | 4000 | Below |

Google rejects listings that use words like "best", "#1", "top" or "free" in the name, icon or short description, or that repeat keywords to stuff search. The text below follows those rules.

**Full description:**

```
Mandirpedia is a quiet place for daily prayer.

READ THE ORIGINAL TEXT
• Aartis, chalisas and mantras in their original Hindi or Sanskrit, shown exactly as their sources give them
• Hanuman Chalisa, Shiv Chalisa, Jai Ganesh Deva, Om Jai Jagdish Hare, Gayatri Mantra, Mahamrityunjaya Mantra and more
• Clear Devanagari with adjustable text size, light and dark reading modes, and optional auto-scroll
• The screen stays awake while you read
• Bookmarks and "continue reading" remember where you left off

JAP COUNTER
• A large, calm tap counter for mantra japa
• Choose 11, 21, 108 or your own target, with optional gentle vibration
• Your counts are saved on your phone

LEARN
• Ganesha, Hanuman, Shiva, Durga, Lakshmi, Vishnu, Saraswati, Shani, Kubera and Gayatri: who each deity is, why devotees worship them, common occasions and offerings
• Short introductions to aarti, japa, prasad, flower offerings, abhisheka and yantras

DESIGNED FOR DEVOTION
• Works fully offline once installed
• Hindi and English interface
• No account, no ads, no in-app purchases
• Favourites, bookmarks and counts stay on your device

Explanations describe traditional beliefs; customs vary by family, region and tradition. Mandirpedia does not include translations or transliterations of the prayers.
```

### Graphics (all in `store/google-play/`)

| Asset | Play requirement | File | Status |
|---|---|---|---|
| App icon | 512 × 512 PNG, 32-bit, max 1 MB | `icon-512.png` | Ready (saffron flag) |
| Feature graphic | 1024 × 500 JPG or 24-bit PNG, no transparency | `feature-graphic-1024x500.png` | Ready (saffron flag) |
| Phone screenshots | 2 to 8; each side 320 to 3840 px; long side at most 2× the short side | `phone/01 … 07` (1320 × 2640) | Ready. Upload all 7 in order. |
| 7-inch tablet screenshots | Up to 8, same size rules | `tablet/01 … 08` (2064 × 2752) | Ready. Use the same files for both tablet sizes. |
| 10-inch tablet screenshots | Up to 8, same size rules | `tablet/01 … 08` | Ready |
| Promo video | Optional YouTube URL | — | Skip |

The iPhone screenshots in `store/screenshots/iphone-6.9` are **2.17:1**, so Play would reject them. The copies in `phone/` are the same images cropped at the bottom to exactly 2:1. To be featured in Play's recommendations, an app needs at least 4 phone screenshots of 1080 px or more; this set qualifies.

### Category and contact details (Store settings)

| Field | Value |
|---|---|
| App category | **Lifestyle** (Books & Reference also fits) |
| Tags | Choose up to 5 from Google's list, for example Religion & spirituality, Meditation, Reference |
| Email | Your public support email (required) |
| Website | Your support or policy site (recommended) |
| Phone | Optional; leave blank |

---

## 6. Hindi listing (optional, recommended)

**Main store listing > Manage translations > Add your own translation text > Hindi (hi-IN):**

| Field | Value |
|---|---|
| App name | `मन्दिरपीडिया: आरती व चालीसा` (27/30) |
| Short description | `मूल देवनागरी में आरती, चालीसा और मन्त्र, साथ में जप गणक। पूरी तरह ऑफ़लाइन।` (74/80) |
| Full description | The Hindi text in APP_STORE_RELEASE.md section 8 |

Without your own Hindi screenshots, Play shows the English ones, which is fine.

---

## 7. App content (Policy > App content)

Complete every item. Play blocks publishing while any item is unfinished.

### 7.1 Privacy policy

Play requires a privacy policy for **every** app, even one that collects nothing. It must be on a public web page: not a PDF, not behind a login, and not blocked in any country. Free options include GitHub Pages, Google Sites, or a public Notion page.

Use this text. It replaces the version in APP_STORE_RELEASE.md and adds the update-check identifier explained in 7.6:

```
Mandirpedia Privacy Policy
Effective: <date>

Mandirpedia does not ask for, collect or sell personal information. There are no accounts, ads, analytics SDKs or tracking.

On your device
Favourites, bookmarks, reading progress, settings, jap counts and the "most used" list are stored only on your device. You can clear them in Settings, or by uninstalling the app.

Content updates
To keep its prayers and explanations current, the app checks Expo's update service (expo.dev) for new versions of its content. Each check sends technical information needed to deliver the update: the app version, platform, and a random installation identifier created by the app. The identifier is not linked to your name, account, email or advertising ID, and is used only to deliver updates and count how many installations have received them. It is sent over an encrypted (HTTPS) connection and is removed when you uninstall the app.

Links
Links to source websites open in your browser, where those websites' own privacy policies apply.

Children
Mandirpedia is not directed at children under 13 and collects no personal information from anyone.

Changes
If this policy changes, the new version will be posted at this address with a new effective date.

Contact
<your support email>
```

### 7.2 App access

**All functionality in my app is available without any access restrictions.** (No login.)

### 7.3 Ads

**No, my app does not contain ads.**

### 7.4 Content rating

Start the IARC questionnaire and enter your email address.

- **Category:** *Reference, News, or Educational* (if Play offers it; otherwise *All Other App Types*).
- Answer **No** to every question: violence, fear, sexual content, crude humour, profanity, drugs, alcohol, tobacco, gambling, simulated gambling, user-to-user interaction or chat, sharing of user-generated content, sharing the user's location, and digital purchases.
- Opening source links in the phone's browser does not count as an in-app web browser.
- **Expected result:** Everyone (ESRB), PEGI 3, IARC 3+, USK 0.

### 7.5 Target audience and content

- **Target age groups:** tick **13–15, 16–17 and 18+** only.
  If you include any age under 13, the app falls under Google's **Families policy**, which adds extra declarations and review. The app would likely pass because it has no ads and collects no data, but it is simpler to leave under-13 out for version 1.0.
- **Could your store listing unintentionally appeal to children?** No.

### 7.6 Data safety

The app itself collects nothing. The only data that leaves the phone is the **update check** made by `expo-updates`. Each request carries an `EAS-Client-ID` header: a random UUID created on first launch, which EAS uses for update delivery and install counts. Google counts data sent to a service provider (Expo) as "collected", so declare it:

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** |
| Which ways can users request that their data is deleted? | **I don't provide a way**. It is a random ID that is not linked to a person; uninstalling removes it. |
| Data types | **Device or other IDs** only |
| Device or other IDs: Collected / Shared | **Collected: Yes. Shared: No.** (Expo processes it on your behalf as a service provider, which Play does not count as sharing.) |
| Processed ephemerally? | No |
| Required or optional? | Required (users can't turn it off) |
| Purposes | **App functionality** and **Analytics** |

The listing will show *"No data shared with third parties · This app may collect Device or other IDs · Data is encrypted in transit"*.

> **Keep both stores consistent.** On iOS, the strictly accurate App Privacy label is *Identifiers > Device ID: Not linked to the user, not used for tracking*, for App Functionality and Analytics, instead of "Data Not Collected". Update it when you next edit the App Store listing.
>
> If you add any SDK later (analytics, crash reporting, ads), revisit this form before releasing.

### 7.7 Other declarations

| Item | Answer |
|---|---|
| Advertising ID | **No.** The app has no ads or analytics SDK and no `AD_ID` permission. |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health apps | My app does not have any health features |
| News app | No |
| COVID-19 contact tracing and status | My app is not a publicly available COVID-19 app (shown only to some accounts) |
| Data deletion URL | Not required, because the app has no accounts |

---

## 8. Testing and release tracks

### 8.1 Internal testing (first upload, manual)

1. **Test and release > Testing > Internal testing > Create new release.**
2. Upload the `.aab` from section 3. **The first upload must be done by hand in the browser**; Google's API refuses uploads for an app that has never had a bundle uploaded. Accept **Play App Signing** when asked (Google generates and keeps the app signing key; your file is signed with the upload key).
3. Release name: `1.0.0 (1)`. Release notes:
   ```
   <en-US>
   First release: aartis, chalisas and mantras in original Devanagari, a jap counter, and deity guides. Works offline.
   </en-US>
   ```
4. **Testers** tab: create an email list, add your own Gmail address, open the opt-in link on your phone and install from Play.

### 8.2 Automating later uploads with EAS Submit

1. In Google Cloud Console, create a **service account** for the Play Console project and create a **JSON key** for it. Then in Play Console, **Users and permissions > Invite new user**, enter the service account's email, and grant **Release apps to testing tracks** and **Release to production**. Expo's guide walks through it: https://docs.expo.dev/submit/android/
2. Upload the key to EAS once, so it never needs to be stored in this repo:
   `npx eas-cli@latest credentials --platform android` → **Google Service Account** → upload the JSON key.
3. Then build and submit in one step:
   ```bash
   npx eas-cli@latest build --platform android --profile production --auto-submit
   ```
   `eas.json` sends builds to the **internal** track as a **draft**, which is required while the app is unpublished. Promote releases to other tracks in Play Console. After the first production release, you can change `releaseStatus` to `completed`.

**Never commit the service account JSON key.**

### 8.3 Closed testing: 12 testers for 14 days (personal accounts)

1. **Testing > Closed testing > Create track** (or use the default "Alpha"). Promote the internal release to it, or upload the same `.aab`.
2. Select **Countries/regions** (include India and everywhere your testers live).
3. Add at least **12 testers** by email (a Google Group is easiest). Share the **opt-in link** with them. Each tester must **accept the invite and install the app** from Play.
4. Keep **12 or more opted in for 14 consecutive days**. If anyone drops out, the count can reset, so invite 15 to 20 people for margin.
5. Ask testers to actually use the app (open prayers, use the jap counter, switch to Hindi). Google asks about their feedback in the next step.
6. Test checklist (Android-specific additions to the iOS list):
   - [ ] Adaptive icon: the saffron flag shows on the home screen. With **Themed icons** on (Android 13+), the icon becomes a single colour, which is expected.
   - [ ] Splash screen in light and dark mode.
   - [ ] Android back gesture and back button on every screen.
   - [ ] Devanagari rendering on a Samsung phone and a Pixel, at the smallest and largest text sizes.
   - [ ] Offline cold start with flight mode on.
   - [ ] **Settings > Rate Mandirpedia** opens the Play listing.

### 8.4 Apply for production access

After 14 days, **Dashboard > Apply for production** becomes available. Google asks about your testing (how you recruited testers, what feedback you got and what you changed) and about your readiness. Answer honestly and specifically. A decision usually takes up to 7 days.

### 8.5 Production release

1. **Production > Create new release** and add the bundle from the library, or promote it from closed testing.
2. **Countries/regions:** start with India, or select all countries.
3. Release notes (en-US, plus hi-IN if you added Hindi).
4. **Review release > Start rollout to Production.** A staged rollout (for example 20%) is optional for version 1.0.
5. Review for a new app usually takes a few days, sometimes up to a week or more. Turn on **Managed publishing** (Publishing overview) if you want to choose when the approved release goes live.

---

## 9. After launch

- **Over-the-air updates** work the same way as on iOS (APP_STORE_RELEASE.md section 5). Each platform has its own fingerprint, so Android and iOS builds receive updates independently.
- **In-app review:** the automatic prompt and **Rate Mandirpedia** already work on Android. Play shows the review sheet only to users who installed from Play. Use **internal app sharing** to test it.
- **Target API level:** Google requires each update to target a recent Android API level, and the deadline moves every August. Upgrading the Expo SDK once a year keeps the app compliant. Play Console warns you in advance.
- **Every later release:**
  ```bash
  npm run check
  npx eas-cli@latest build --platform android --profile production --auto-submit
  ```
  Then in Play Console, promote the build from internal testing to production and add release notes.

---

## 10. Quick checklist

- [ ] Play developer account created and verified ($25)
- [ ] 12+ testers lined up (personal account)
- [ ] Content rights and proofreading cleared
- [ ] Privacy policy and support page live
- [ ] `.aab` built with EAS and uploaded to internal testing by hand
- [ ] Store listing: name, short and full description, icon, feature graphic, 7 phone and 8 tablet screenshots
- [ ] Category, tags and contact email set
- [ ] App content: privacy policy, app access, ads, content rating, target audience, data safety, advertising ID, government, financial, health and news declarations
- [ ] Closed test running 14 days with 12+ opted-in testers
- [ ] Production access approved
- [ ] Production release rolled out
