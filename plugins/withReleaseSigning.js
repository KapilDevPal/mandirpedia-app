/**
 * Signs local release builds (`./gradlew bundleRelease` / `assembleRelease`) with the
 * Google Play upload key instead of the debug key.
 *
 * The key is read from Gradle properties, normally in ~/.gradle/gradle.properties so that
 * no path or password is ever committed:
 *
 *   MANDIRPEDIA_UPLOAD_STORE_FILE=/home/<you>/keystores/mandirpedia/upload.jks
 *   MANDIRPEDIA_UPLOAD_STORE_PASSWORD=...
 *   MANDIRPEDIA_UPLOAD_KEY_ALIAS=upload
 *   MANDIRPEDIA_UPLOAD_KEY_PASSWORD=...
 *
 * Without these properties, release builds fall back to the debug key (fine for testing an
 * APK on your own phone, rejected by Google Play) and Gradle prints a warning.
 * EAS Build replaces signing with its own credentials, so this plugin does not affect it.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'MANDIRPEDIA_UPLOAD_STORE_FILE';

const releaseSigningConfig = `
        release {
            if (project.hasProperty('${MARKER}')) {
                storeFile file(project.property('${MARKER}'))
                storePassword project.property('MANDIRPEDIA_UPLOAD_STORE_PASSWORD')
                keyAlias project.property('MANDIRPEDIA_UPLOAD_KEY_ALIAS')
                keyPassword project.property('MANDIRPEDIA_UPLOAD_KEY_PASSWORD')
            }
        }`;

const releaseSelection = `if (!project.hasProperty('${MARKER}')) {
                println("WARNING: ${MARKER} is not set; signing the release build with the DEBUG key. Google Play will reject it.")
            }
            signingConfig project.hasProperty('${MARKER}') ? signingConfigs.release : signingConfigs.debug`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (c) => {
    let gradle = c.modResults.contents;
    if (gradle.includes(MARKER)) return c;

    const withConfig = gradle.replace(/signingConfigs \{/, `signingConfigs {${releaseSigningConfig}`);
    // In buildTypes.release (after its template comments), swap the debug signing config.
    const withSelection = withConfig.replace(/(buildTypes \{[\s\S]*?release \{\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/, `$1${releaseSelection}`);
    if (withConfig === gradle || withSelection === withConfig) {
      throw new Error('withReleaseSigning: android/app/build.gradle no longer matches the expected template; update plugins/withReleaseSigning.js.');
    }
    c.modResults.contents = withSelection;
    return c;
  });
};
