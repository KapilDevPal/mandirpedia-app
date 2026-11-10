import * as StoreReview from 'expo-store-review';
import { Linking } from 'react-native';
import { useStore } from '@/state/store';
import { shouldRequestReview } from '@/state/usage';

/**
 * Called at calm, positive moments only: after finishing a prayer or completing a
 * jap round. Shows the native App Store / Play Store review sheet if the policy in
 * src/state/usage.ts allows it. The OS may still decide not to show it.
 */
export async function maybeRequestReview(): Promise<void> {
  const { review, usage, markReviewRequested } = useStore.getState();
  if (!shouldRequestReview(review, usage)) return;
  try {
    if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return;
    markReviewRequested();
    // Small delay so the prompt never interrupts the moment itself.
    setTimeout(() => StoreReview.requestReview().catch(() => {}), 1500);
  } catch {
    // Review prompts are best-effort.
  }
}

/** "Rate Mandirpedia" in Settings: opens the store page if known, else the native sheet. */
export async function openStoreReview(): Promise<void> {
  const url = StoreReview.storeUrl();
  try {
    if (url) {
      // Opens the write-review page on iOS; the listing on Android.
      await Linking.openURL(url.includes('apps.apple.com') ? `${url}${url.includes('?') ? '&' : '?'}action=write-review` : url);
      return;
    }
    if (await StoreReview.hasAction()) await StoreReview.requestReview();
  } catch {
    // Ignore; the user can still rate from the store.
  }
}
