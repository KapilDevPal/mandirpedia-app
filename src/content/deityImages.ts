import type { ImageSourcePropType } from 'react-native';

/**
 * Locally bundled deity artwork (works offline once the app is installed).
 *
 * No images ship with the project yet: only artwork you have permission to use
 * in the app should be added. Until an entry exists, the app shows a clean
 * black-and-white placeholder with the deity's name.
 *
 * To add an image:
 *   1. Put a grayscale JPEG in assets/deities/, e.g. assets/deities/shiva.jpg
 *      (portrait, about 1200 x 1600 px; see assets/deities/README.md).
 *   2. Add an entry below with a static require() and the credit/licence.
 *   3. Run `npm run validate:content` to check the ids match deity profiles.
 *
 * Keys are deity ids from devotional_collection.json (`deities[].id`).
 */
export interface DeityArtwork {
  source: ImageSourcePropType;
  /** Shown on the deity page, e.g. "Photograph © Name, used with permission". */
  credit: string;
  /** Short licence or permission note, kept for your records and shown with the credit. */
  licence: string;
  /** Vertical focus for cropping, 0 (top) to 1 (bottom). Faces usually sit around 0.3. */
  focusY?: number;
}

export const deityArtwork: Partial<Record<string, DeityArtwork>> = {
  // shiva: {
  //   source: require('../../assets/deities/shiva.jpg'),
  //   credit: 'Photograph © …, used with permission',
  //   licence: 'Written permission for in-app use, 2026',
  //   focusY: 0.3,
  // },
};

/** Ids of deities whose artwork is bundled. Used by the validator script. */
export const deityArtworkIds = (): string[] => Object.keys(deityArtwork).filter((k) => !!deityArtwork[k]);
