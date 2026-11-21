import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Image, View } from 'react-native';
import { LabelledBlock, LocalizedText } from '@/components/content';
import { AppText, Button, Chip, EmptyState, IconButton, Ionicons, Notice, Row, Screen } from '@/components/ui';
import { YantraArt } from '@/components/YantraArt';
import { deitiesById, entriesById, entryDeityName, entryTitle, isRecitationCategory, loc } from '@/content';
import { yantraArt } from '@/content/yantraArt';
import { yantraArtwork, yantraDiagrams } from '@/content/yantraDiagrams';
import { useT } from '@/i18n';
import { useStore } from '@/state/store';
import { spacing, usePalette } from '@/theme';

/**
 * Yantra screen: a licensed bundled image if one exists, else the app's own drawing
 * (src/content/yantraArt.ts), then what the yantra is and why devotees use it.
 */
export default function YantraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = id ? entriesById.get(id) : undefined;
  const p = usePalette();
  const { t, lang } = useT();
  const isFav = useStore((s) => (entry ? s.favourites.includes(entry.id) : false));
  const toggleFavourite = useStore((s) => s.toggleFavourite);
  const recordUse = useStore((s) => s.recordUse);
  const entryId = entry?.id;
  useEffect(() => {
    if (entryId) recordUse(`entry:${entryId}`);
  }, [entryId, recordUse]);

  if (entry && isRecitationCategory(entry.category)) return <Redirect href={`/prayer/${entry.id}`} />;
  if (!entry) {
    return <EmptyState icon="alert-circle-outline" title={t('notFound')} action={<Button label={t('goHome')} onPress={() => router.replace('/')} />} />;
  }

  const title = entryTitle(entry, lang);
  const deityProfile = entry.deity_id ? deitiesById.get(entry.deity_id) : undefined;
  const deityName = entryDeityName(entry, lang);
  const artwork = yantraArtwork[entry.id];
  const art = yantraArt[entry.id];
  const square = yantraDiagrams[entry.id];
  const basis = loc(art?.basis, lang);
  const a11y = square ? `${title}. ${t('yantraDiagramA11y', { sum: square.magicSum })}` : `${title}. ${basis ?? ''}`;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: t('yantraTitle'),
          headerRight: () => (
            <IconButton icon={isFav ? 'heart' : 'heart-outline'} active={isFav} label={isFav ? t('unfavourite') : t('favourite')} onPress={() => toggleFavourite(entry.id)} />
          ),
        }}
      />

      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {title !== entry.title && (
        <AppText variant="heading" tone="muted">
          {entry.title}
        </AppText>
      )}
      {deityName && (
        <Row wrap style={{ marginTop: spacing.sm }}>
          <Chip label={deityName} icon={deityProfile ? 'person-circle-outline' : undefined} onPress={deityProfile ? () => router.push(`/deity/${deityProfile.id}`) : undefined} />
        </Row>
      )}

      <View style={{ marginTop: spacing.xl, width: '100%', maxWidth: 440, alignSelf: 'center' }}>
        {artwork ? (
          <View style={{ gap: spacing.sm }}>
            <View style={{ width: '100%', aspectRatio: 1, borderWidth: 1, borderColor: p.border, backgroundColor: '#FFFFFF' }}>
              <Image source={artwork.source} resizeMode="contain" style={{ width: '100%', height: '100%' }} accessibilityLabel={title} />
            </View>
            <AppText variant="caption" tone="muted">
              {`${artwork.credit}. ${artwork.licence}`}
            </AppText>
          </View>
        ) : art ? (
          <YantraArt id={entry.id} devanagariDigits={lang === 'hi'} accessibilityLabel={a11y} />
        ) : (
          <View style={{ aspectRatio: 1, borderWidth: 1, borderColor: p.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="grid-outline" size={36} color={p.textMuted} />
          </View>
        )}
        {!artwork && basis && (
          <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
            {basis}
          </AppText>
        )}
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
        {entry.summary && (
          <LabelledBlock label={t('aboutThisYantra')}>
            <LocalizedText value={entry.summary} />
          </LabelledBlock>
        )}
        {entry.why_recite_or_use && (
          <LabelledBlock label={t('traditionalSignificance')}>
            <LocalizedText value={entry.why_recite_or_use} />
            <Notice style={{ marginTop: spacing.sm }}>{t('traditionalBeliefNote')}</Notice>
          </LabelledBlock>
        )}
      </View>

      <Button kind="secondary" icon="school-outline" label={t('learnPuja')} onPress={() => router.navigate('/learn')} style={{ marginTop: spacing.xl }} />
    </Screen>
  );
}
