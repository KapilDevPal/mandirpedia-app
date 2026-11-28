import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useStore } from '@/state/store';

/** Light tap haptic (heavy for offerings). Respects the Haptics setting; no-op on web. */
export function tapHaptic(strong = false) {
  if (Platform.OS === 'web' || !useStore.getState().settings.haptics) return;
  Haptics.impactAsync(strong ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
