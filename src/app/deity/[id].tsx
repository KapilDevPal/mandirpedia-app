import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { artworkCredit, DeityArt } from '@/components/DeityArt';
import { EntryRow, LabelledBlock, LocalizedText, SourceList } from '@/components/content';
import { AppText, Button, Card, Column, Divider, EmptyState, Notice, Screen, SectionTitle } from '@/components/ui';
import { collection, deitiesById, deityLabel, deityIdsWithEntries, entries, loc, relatedEntries, sourcesFor } from '@/content';
import { useT } from '@/i18n';
import { useStore } from '@/state/store';
import { artworkPalette as A, spacing } from '@/theme';

export default function DeityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tOpt, lang } = useT();
  const { height } = useWindowDimensions();
  const profile = id ? deitiesById.get(id) : undefined;
  const bannerHeight = Math.round(Math.min(420, Math.max(260, height * 0.4)));
  const recordUse = useStore((s) => s.recordUse);
  const known = !!id && (deitiesById.has(id) || deityIdsWithEntries.includes(id));
  useEffect(() => {
    if (known && id) recordUse(`deity:${id}`);
  }, [known, id, recordUse]);

  // A deity referenced by entries but without a profile still gets a page listing its prayers.
  if (!profile) {
    if (!known) {
      return <EmptyState icon="alert-circle-outline" title={t('notFound')} action={<Button label={t('goHome')} onPress={() => router.replace('/')} />} />;
    }
    const list = entries.filter((e) => e.deity_id === id);
    return (
      <Screen>
        <Stack.Screen options={{ title: deityLabel(id, lang) }} />
        <AppText variant="title" accessibilityRole="header">
          {deityLabel(id, lang)}
        </AppText>
        <Notice style={{ marginTop: spacing.md }}>{t('noProfile')}</Notice>
        <SectionTitle>{t('relatedPrayers')}</SectionTitle>
        {list.map((e) => (
          <EntryRow key={e.id} entry={e} />
        ))}
      </Screen>
    );
  }

  const name = loc(profile.name, lang) ?? profile.id;
  const otherName = loc(profile.name, lang === 'hi' ? 'en' : 'hi');
  const related = relatedEntries(profile);
  const sections = [
    { key: 'why_worship', label: t('deityWhy'), value: profile.why_worship },
    { key: 'common_occasions', label: t('deityOccasions'), value: profile.common_occasions },
    { key: 'common_offerings', label: t('deityOfferings'), value: profile.common_offerings },
    { key: 'practical_reflection', label: t('deityReflection'), value: profile.practical_reflection },
  ].filter((s) => s.value);
  const review = profile.review_status ? tOpt(`reviewStatus_${profile.review_status}`) : undefined;

  return (
    <Screen
      fullBleedHeader={
        <DeityArt deityId={profile.id} scrim="full" placeholderScale={1.5} placeholderPosition="upper" style={{ width: '100%', height: bannerHeight }}>
          <Column style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
            <AppText palette={A} variant="display" accessibilityRole="header" style={{ color: '#FFFFFF' }}>
              {name}
            </AppText>
            {otherName && otherName !== name && (
              <AppText palette={A} variant="subheading" style={{ color: '#FFFFFF' }}>
                {otherName}
              </AppText>
            )}
          </Column>
        </DeityArt>
      }
    >
      <Stack.Screen options={{ title: name }} />

      {profile.who && (
        <Card tone="accent" style={{ marginTop: spacing.sm }}>
          <LabelledBlock label={t('deityWho', { name })}>
            <LocalizedText value={profile.who} />
          </LabelledBlock>
        </Card>
      )}

      <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
        {sections.map((s) => (
          <LabelledBlock key={s.key} label={s.label}>
            <LocalizedText value={s.value} />
          </LabelledBlock>
        ))}
      </View>

      <Notice style={{ marginTop: spacing.xl }}>
        {loc(collection.content_guidance, lang) ?? t('customsVary')}
      </Notice>

      <SectionTitle>{t('relatedPrayers')}</SectionTitle>
      {related.length === 0 ? (
        <AppText tone="muted">{t('noRelated')}</AppText>
      ) : (
        related.map((e) => <EntryRow key={e.id} entry={e} />)
      )}
      <Button kind="secondary" icon="school-outline" label={t('learnPuja')} onPress={() => router.navigate('/learn')} style={{ marginTop: spacing.md }} />

      <Divider />
      <AppText variant="subheading" accessibilityRole="header">
        {t('sources')}
      </AppText>
      <SourceList sources={sourcesFor(profile.source_ids)} />
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
        {artworkCredit(profile.id) ? `${t('artworkCredit')}: ${artworkCredit(profile.id)}` : t('artworkPlaceholder')}
      </AppText>
      {review && (
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
          {review}
        </AppText>
      )}
    </Screen>
  );
}
