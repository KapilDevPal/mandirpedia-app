import { useKeepAwake } from 'expo-keep-awake';

/** Keeps the screen on while mounted. Render conditionally to honour the user's setting. */
export function KeepAwake({ tag }: { tag: string }) {
  useKeepAwake(tag);
  return null;
}
