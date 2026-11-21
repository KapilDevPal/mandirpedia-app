import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LocalizedText } from '@/components/content';
import { AppText, Card, Column, Ionicons, Notice, Row, Screen, SectionTitle, type IconName } from '@/components/ui';
import { YantraArt } from '@/components/YantraArt';
import { categoryLabel, categories, collection, loc, type RitualExplanation } from '@/content';
import { learnArt } from '@/content/learnArt';
import { useT } from '@/i18n';
import { useStore } from '@/state/store';
import { artworkPalette as A, spacing, usePalette } from '@/theme';

/** Where each ritual explanation can lead inside the app, if anywhere. */
const ritualLinks: Record<string, { category?: string; jap?: boolean }> = {
  aarti: { category: 'aarti' },
  japa: { jap: true },
  path: { category: 'chalisa' },
  yantra: { category: 'yantra' },
};

export default function LearnScreen() {
  const p = usePalette();
  const { t, lang } = useT();
  const { width } = useWindowDimensions();
  const wide = width >= 600;
  const basics = collection.puja_basics;
  const recordUse = useStore((s) => s.recordUse);
  useFocusEffect(
    useCallback(() => {
      recordUse('feature:learn');
    }, [recordUse]),
  );

  const basicsCards = (
    basics
      ? [
          { key: 'choosing', icon: 'people-outline' as IconName, label: t('choosingDeity'), value: basics.choosing_deity },
          { key: 'timing', icon: 'time-outline' as IconName, label: t('timing'), value: basics.timing },
        ]
      : []
  ).filter((c) => c.value);

  return (
    <Screen
      fullBleedHeader={
        <View style={{ backgroundColor: A.background, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}>
          <Column>
            <Row gap={spacing.lg} style={{ alignItems: 'center' }}>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <AppText palette={A} variant="overline" style={{ color: '#FFFFFF' }}>
                  {t('learnKicker')}
                </AppText>
                <AppText palette={A} variant="title" accessibilityRole="header" style={{ color: '#FFFFFF' }}>
                  {t('learnHeroTitle')}
                </AppText>
                <AppText palette={A} variant="small" style={{ color: '#D9D9D9' }}>
                  {t('learnHeroBody')}
                </AppText>
              </View>
              <View style={{ width: wide ? 160 : 108, height: wide ? 160 : 108 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <SvgXml xml={learnArt.aarti!} width="100%" height="100%" />
              </View>
            </Row>
          </Column>
        </View>
      }
    >
      {basics && (
        <>
          <SectionTitle>{loc(basics.title, lang) ?? t('whyPuja')}</SectionTitle>
          <LocalizedText value={basics.description} />
          <View style={{ flexDirection: wide ? 'row' : 'column', gap: spacing.md, marginTop: spacing.lg }}>
            {basicsCards.map((c) => (
              <Card key={c.key} tone="alt" style={{ flex: wide ? 1 : undefined }}>
                <Row gap={spacing.sm} style={{ marginBottom: spacing.xs }}>
                  <Ionicons name={c.icon} size={20} color={p.text} />
                  <AppText variant="label">{c.label}</AppText>
                </Row>
                <LocalizedText value={c.value} variant="small" />
              </Card>
            ))}
          </View>
        </>
      )}

      <SectionTitle>{t('practices')}</SectionTitle>
      <AppText variant="small" tone="muted" style={{ marginTop: -spacing.sm, marginBottom: spacing.md }}>
        {t('practicesIntro')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }}>
        {collection.ritual_explanations.map((r) => (
          <PracticeCard key={r.id} ritual={r} width={wide ? '48.8%' : '100%'} />
        ))}
      </View>

      {loc(collection.content_guidance, lang) && <Notice style={{ marginTop: spacing.xl }}>{loc(collection.content_guidance, lang)!}</Notice>}
    </Screen>
  );
}

function PracticeCard({ ritual, width }: { ritual: RitualExplanation; width: `${number}%` }) {
  const p = usePalette();
  const { t, lang } = useT();
  const link = ritualLinks[ritual.id];
  const category = link?.category && categories.includes(link.category) ? link.category : undefined;
  const go = category
    ? () => router.navigate({ pathname: '/library', params: { category, deity: '' } })
    : link?.jap
      ? () => router.navigate('/jap')
      : undefined;
  const action = category ? t('openLibraryFor', { label: categoryLabel(category, lang) }) : link?.jap ? t('openJap') : undefined;
  const name = loc(ritual.name, lang) ?? ritual.id;
  const otherName = loc(ritual.name, lang === 'hi' ? 'en' : 'hi');
  const art = learnArt[ritual.id];

  return (
    <Pressable
      onPress={go}
      disabled={!go}
      accessibilityRole={go ? 'button' : undefined}
      accessibilityLabel={go ? `${name}. ${action}` : undefined}
      style={({ pressed }) => ({
        width,
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: pressed ? p.borderStrong : p.border,
        backgroundColor: pressed ? p.surfaceAlt : p.surface,
      })}
    >
      <View
        style={{ width: 76, height: 76, backgroundColor: A.background, alignItems: 'center', justifyContent: 'center', padding: ritual.id === 'yantra' ? 0 : 6 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {art ? (
          <SvgXml xml={art} width="100%" height="100%" />
        ) : ritual.id === 'yantra' ? (
          <YantraArt id="lakshmi-yantra" showLabels={false} />
        ) : (
          <Ionicons name="leaf-outline" size={28} color="#FFFFFF" />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subheading" weight="bold" accessibilityRole="header">
          {name}
        </AppText>
        {otherName && otherName !== name && (
          <AppText variant="caption" tone="muted">
            {otherName}
          </AppText>
        )}
        <View style={{ marginTop: spacing.xs }}>
          <LocalizedText value={ritual.why_it_is_done} variant="small" />
        </View>
        {action && (
          <Row gap={6} style={{ marginTop: spacing.sm }}>
            <AppText variant="small" weight="semibold">
              {action}
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={p.text} />
          </Row>
        )}
      </View>
    </Pressable>
  );
}
