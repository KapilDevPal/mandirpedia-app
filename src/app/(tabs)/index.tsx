import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeityArt, DeityGrid } from '@/components/DeityArt';
import { EntryRow, iconForCategory } from '@/components/content';
import { MostUsed, UpdateBanner } from '@/components/HomeExtras';
import { AppText, Button, Card, Column, Ionicons, Row, Screen, SectionTitle, TextLink, type IconName } from '@/components/ui';
import { categories, categoryLabel, collection, contentCounts, deityIdsWithEntries, deityLabel, entriesById, loc } from '@/content';
import { deityArtwork } from '@/content/deityImages';
import { useT } from '@/i18n';
import { useStore } from '@/state/store';
import { artworkPalette as A, spacing, TOUCH, usePalette } from '@/theme';

/** Featured first, as requested, then every other deity in the collection. */
const PRIORITY = ['shiva', 'hanuman', 'ganesha', 'durga', 'lakshmi'];

function orderedDeityIds(): string[] {
  const all = [...collection.deities.map((d) => d.id), ...deityIdsWithEntries.filter((id) => !collection.deities.some((d) => d.id === id))];
  return [...PRIORITY.filter((id) => all.includes(id)), ...all.filter((id) => !PRIORITY.includes(id))];
}

/** One deity per day, preferring deities that have bundled artwork. */
function featuredDeityId(ids: string[]): string | undefined {
  const withArt = ids.filter((id) => deityArtwork[id]);
  const pool = withArt.length ? withArt : ids;
  const day = Math.floor(Date.now() / 86_400_000);
  return pool[day % pool.length];
}

export default function HomeScreen() {
  const p = usePalette();
  const { t, tOpt, lang } = useT();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const focused = useIsFocused();
  const favourites = useStore((s) => s.favourites);
  const progress = useStore((s) => s.progress);

  const deityIds = useMemo(orderedDeityIds, []);
  const featured = useMemo(() => featuredDeityId(deityIds), [deityIds]);

  const recent = useMemo(
    () =>
      Object.entries(progress)
        .filter(([id, pr]) => entriesById.has(id) && pr.fraction > 0.02 && pr.fraction < 0.98)
        .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
        .slice(0, 3),
    [progress],
  );
  const favEntries = favourites.map((id) => entriesById.get(id)).filter((e): e is NonNullable<typeof e> => !!e);

  const heroHeight = Math.round(Math.min(640, Math.max(420, height * 0.62)));

  const practice: { key: string; label: string; count?: number; icon: IconName; onPress: () => void }[] = [
    ...categories.map((c) => ({
      key: c,
      label: categoryLabel(c, lang),
      count: contentCounts.byCategory[c] ?? 0,
      icon: iconForCategory(c),
      onPress: () => router.navigate({ pathname: '/library', params: { category: c, deity: '' } }),
    })),
    { key: 'jap', label: t('japCounterCard'), icon: 'radio-button-on-outline', onPress: () => router.navigate('/jap') },
  ];

  const hero = featured ? (
    <DeityArt deityId={featured} scrim="full" placeholderScale={1.8} placeholderPosition="upper" style={{ width: '100%', height: heroHeight }}>
      <Column style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxl, justifyContent: 'space-between' }}>
        <AppText palette={A} variant="overline" style={{ color: '#FFFFFF' }}>
          {t('appName')}
        </AppText>
        <View style={{ gap: spacing.sm }}>
          <AppText palette={A} variant="label" style={{ color: '#FFFFFF' }}>
            {t('featuredDeity')}
          </AppText>
          <AppText palette={A} variant="hero" accessibilityRole="header" style={{ color: '#FFFFFF' }} numberOfLines={2} adjustsFontSizeToFit>
            {deityLabel(featured, lang)}
          </AppText>
          <Button
            palette={A}
            kind="secondary"
            label={t('exploreDeity')}
            icon="arrow-forward"
            iconAfter
            onPress={() => router.push(`/deity/${featured}`)}
            style={{ alignSelf: 'flex-start', marginTop: spacing.md, borderColor: '#FFFFFF' }}
          />
        </View>
      </Column>
    </DeityArt>
  ) : (
    <View style={{ height: insets.top }} />
  );

  return (
    <>
      {focused && <StatusBar style="light" />}
      <Screen fullBleedHeader={hero} padded>
        <UpdateBanner />
        {/* What this person uses most (on-device counts only). */}
        <MostUsed />

        {/* Continue reading */}
        {recent.length > 0 && (
          <>
            <SectionTitle>{t('continueReading')}</SectionTitle>
            {recent.map(([id, pr]) => (
              <EntryRow key={id} entry={entriesById.get(id)!} subtitle={t('percentRead', { pct: Math.round(pr.fraction * 100) })} />
            ))}
          </>
        )}

        {/* Prayers and practice: Aarti, Chalisa, Mantra, Yantra and Jap */}
        <SectionTitle>{t('prayersAndPractice')}</SectionTitle>
        <View style={{ borderTopWidth: 1, borderColor: p.border }}>
          {practice.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={item.count !== undefined ? `${item.label}, ${t('itemsCount', { n: item.count })}` : item.label}
              style={({ pressed }) => ({
                minHeight: TOUCH + 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingHorizontal: spacing.xs,
                borderBottomWidth: 1,
                borderColor: p.border,
                backgroundColor: pressed ? p.surfaceAlt : 'transparent',
              })}
            >
              <Ionicons name={item.icon} size={20} color={p.text} />
              <View style={{ flex: 1, paddingVertical: spacing.sm }}>
                <AppText variant="subheading" weight="bold">
                  {item.label}
                </AppText>
                {tOpt(`catDesc_${item.key}`) && (
                  <AppText variant="caption" tone="muted">
                    {tOpt(`catDesc_${item.key}`)}
                  </AppText>
                )}
              </View>
              {item.count !== undefined && (
                <AppText variant="heading" weight="bold">
                  {item.count}
                </AppText>
              )}
              <Ionicons name="arrow-forward" size={18} color={p.text} />
            </Pressable>
          ))}
        </View>
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
          {t('collectionSummary', { recitations: contentCounts.recitations, yantras: contentCounts.yantraReferences })}
        </AppText>

        {/* Browse by deity */}
        <SectionTitle action={<TextLink label={t('seeAll')} onPress={() => router.push('/deities')} />}>{t('browseByDeity')}</SectionTitle>
        <DeityGrid ids={deityIds} />

        {/* Favourites */}
        <SectionTitle action={favEntries.length > 3 ? <TextLink label={t('seeAll')} onPress={() => router.push('/favourites')} /> : undefined}>{t('favourites')}</SectionTitle>
        {favEntries.length === 0 ? (
          <Row style={{ alignItems: 'flex-start', borderWidth: 1, borderColor: p.border, padding: spacing.lg }}>
            <Ionicons name="heart-outline" size={18} color={p.text} style={{ marginTop: 3 }} />
            <AppText variant="small" tone="muted" style={{ flex: 1 }}>
              {t('noFavourites')}
            </AppText>
          </Row>
        ) : (
          favEntries.slice(0, 3).map((e) => <EntryRow key={e.id} entry={e} />)
        )}

        {/* Why do we perform puja? */}
        <SectionTitle>{loc(collection.puja_basics?.title, lang) ?? t('whyPuja')}</SectionTitle>
        <Card onPress={() => router.navigate('/learn')} accessibilityLabel={t('learnPuja')} style={{ padding: spacing.xl }}>
          {collection.puja_basics?.description && (
            <AppText variant="body" style={{ marginBottom: spacing.lg }}>
              {loc(collection.puja_basics.description, lang)}
            </AppText>
          )}
          <Row gap={6}>
            <AppText variant="label" weight="bold">
              {t('learnMore')}
            </AppText>
            <Ionicons name="arrow-forward" size={14} color={p.text} />
          </Row>
        </Card>
        <View style={{ height: StyleSheet.hairlineWidth }} />
      </Screen>
    </>
  );
}
