import { memo } from 'react';
import { SvgXml } from 'react-native-svg';
import { emblemArt } from '@/content/emblemArt';

/** Whether a full-colour illustration exists for this deity. */
export const hasEmblemArt = (deityId: string) => deityId in emblemArt;

/**
 * Full-colour deity emblem (src/content/emblemArt.ts). Fills its parent unless `size` is given,
 * so give the parent a size or aspectRatio. Renders nothing for deities without art.
 */
export const EmblemArt = memo(function EmblemArt({ deityId, size }: { deityId: string; size?: number }) {
  const xml = emblemArt[deityId];
  if (!xml) return null;
  return <SvgXml xml={xml} width={size ?? '100%'} height={size ?? '100%'} />;
});
