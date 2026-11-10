import { DeityGrid } from '@/components/DeityArt';
import { Notice, Screen } from '@/components/ui';
import { collection, deitiesById, deityIdsWithEntries, loc } from '@/content';
import { useT } from '@/i18n';
import { spacing } from '@/theme';

export default function DeitiesScreen() {
  const { t, lang } = useT();
  // Profiles first (including any without entries yet), then deities that only appear on entries.
  const ids = [...collection.deities.map((d) => d.id), ...deityIdsWithEntries.filter((id) => !deitiesById.has(id))];
  return (
    <Screen>
      <DeityGrid ids={ids} />
      <Notice style={{ marginTop: spacing.xl }}>{loc(collection.content_guidance, lang) ?? t('customsVary')}</Notice>
    </Screen>
  );
}
