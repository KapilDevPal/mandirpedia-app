import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useStore } from '@/state/store';
import { View } from 'react-native';
import { LabelledBlock, LocalizedText, SourceList } from '@/components/content';
import { AppText, Button, Card, Divider, Ionicons, Notice, Row, Screen, SectionTitle, type IconName } from '@/components/ui';
import { categoryLabel, categories, collection, loc, sourcesFor } from '@/content';
import { useT } from '@/i18n';
import { spacing, usePalette } from '@/theme';

/** Where each ritual explanation can lead inside the app, if anywhere. */
const ritualLinks: Record<string, { icon: IconName; category?: string; jap?: boolean }> = {
  aarti: { icon: 'flame-outline', category: 'aarti' },
  japa: { icon: 'radio-button-on-outline', jap: true },
  path: { icon: 'book-outline', category: 'chalisa' },
  naivedya: { icon: 'nutrition-outline' },
  pushpa: { icon: 'flower-outline' },
  abhisheka: { icon: 'water-outline' },
  yantra: { icon: 'grid-outline', category: 'yantra' },
};

export default function LearnScreen() {
  const p = usePalette();
  const { t, lang } = useT();
  const basics = collection.puja_basics;
  const recordUse = useStore((s) => s.recordUse);
  useFocusEffect(useCallback(() => recordUse('feature:learn'), [recordUse]));

  return (
    <Screen>
      <Notice icon="school-outline">{t('learnIntro')}</Notice>

      {basics && (
        <>
          <SectionTitle>{loc(basics.title, lang) ?? t('whyPuja')}</SectionTitle>
          <View style={{ gap: spacing.lg }}>
            <LocalizedText value={basics.description} />
            {basics.choosing_deity && (
              <LabelledBlock label={t('choosingDeity')}>
                <LocalizedText value={basics.choosing_deity} />
              </LabelledBlock>
            )}
            {basics.timing && (
              <LabelledBlock label={t('timing')}>
                <LocalizedText value={basics.timing} />
              </LabelledBlock>
            )}
            <SourceList sources={sourcesFor(basics.source_ids)} />
          </View>
        </>
      )}

      <SectionTitle>{t('practices')}</SectionTitle>
      <View style={{ gap: spacing.md }}>
        {collection.ritual_explanations.map((r) => {
          const link = ritualLinks[r.id];
          const showCategory = link?.category && categories.includes(link.category);
          return (
            <Card key={r.id}>
              <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
                <Ionicons name={link?.icon ?? 'leaf-outline'} size={22} color={p.accent} style={{ marginTop: 4 }} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <AppText variant="subheading" accessibilityRole="header">
                    {loc(r.name, lang) ?? r.id}
                  </AppText>
                  <LocalizedText value={r.why_it_is_done} variant="small" />
                  <SourceList sources={sourcesFor(r.source_ids)} extraUrls={r.source_urls} />
                  {showCategory && (
                    <Button
                      kind="secondary"
                      icon="arrow-forward"
                      label={t('openLibraryFor', { label: categoryLabel(link.category!, lang) })}
                      onPress={() => router.navigate({ pathname: '/library', params: { category: link.category!, deity: '' } })}
                    />
                  )}
                  {link?.jap && <Button kind="secondary" icon="arrow-forward" label={t('openJap')} onPress={() => router.navigate('/jap')} />}
                </View>
              </Row>
            </Card>
          );
        })}
      </View>

      <Divider />
      <Notice>{[loc(collection.content_guidance, lang), loc(collection.localization_coverage?.note, lang)].filter(Boolean).join(' ')}</Notice>
    </Screen>
  );
}
