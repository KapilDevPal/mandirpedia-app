import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NumberSquare } from '@/components/YantraDiagram';
import { yantraArtwork, yantraDiagrams } from '@/content/yantraDiagrams';
import { Collapsible, ExternalLinkButton, LabelledBlock, LocalizedText, VerificationList } from '@/components/content';
import { AppText, Button, Chip, EmptyState, IconButton, Ionicons, Notice, Row, Screen } from '@/components/ui';
import { deitiesById, entriesById, entryDeityName, entryTitle, isRecitationCategory, loc } from '@/content';
import { formatDate, useT } from '@/i18n';
import { useStore } from '@/state/store';
import { spacing, usePalette } from '@/theme';

/**
 * Yantra screen. Shows a licensed bundled image if present, else a diagram drawn from
 * src/content/yantraDiagrams.ts (only for forms that are unambiguous and widely published),
 * else a clear statement plus the source link. No diagram is ever guessed.
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
  const notes = entry.notes?.trim();
  const artwork = yantraArtwork[entry.id];
  const diagram = yantraDiagrams[entry.id];

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

      {/* Licensed image, then an accurately drawn diagram, else a clear statement. Nothing is guessed. */}
      <View style={{ marginTop: spacing.xl }}>
        {artwork ? (
          <View style={{ gap: spacing.sm }}>
            <View style={{ width: '100%', maxWidth: 420, aspectRatio: 1, alignSelf: 'center', borderWidth: 1, borderColor: p.border, backgroundColor: '#FFFFFF' }}>
              <Image source={artwork.source} resizeMode="contain" style={{ width: '100%', height: '100%' }} accessibilityLabel={title} />
            </View>
            <AppText variant="caption" tone="muted">
              {`${artwork.credit}. ${artwork.licence}`}
            </AppText>
          </View>
        ) : diagram ? (
          <View style={{ gap: spacing.md }}>
            <View style={{ width: '100%', maxWidth: 420, aspectRatio: 1, alignSelf: 'center' }} accessibilityLabel={`${title}. ${t('yantraDiagramA11y', { sum: diagram.magicSum })}`}>
              <NumberSquare diagram={diagram} fg={p.text} bg={p.background} devanagari={lang === 'hi'} />
            </View>
            <Notice icon="information-circle-outline">{loc(diagram.basis, lang) ?? ''}</Notice>
          </View>
        ) : (
          <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: p.border, padding: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="grid-outline" size={36} color={p.textMuted} />
            <AppText variant="subheading" center>
              {t('diagramUnavailableTitle')}
            </AppText>
            <AppText variant="small" tone="muted" center>
              {t('diagramUnavailableBody')}
            </AppText>
          </View>
        )}
      </View>

      {entry.source?.url && (
        <View style={{ marginTop: spacing.lg }}>
          <ExternalLinkButton url={entry.source.url} primary />
        </View>
      )}

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
        {entry.explanation_note && (
          <AppText variant="caption" tone="muted">
            {loc(entry.explanation_note, lang)}
          </AppText>
        )}
      </View>

      <View style={{ marginTop: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: p.border }}>
        <Collapsible title={t('sourceAndVerification')} icon="document-text-outline">
          {entry.source?.accessed_on && (
            <AppText variant="small" tone="muted">
              {t('accessedOn', { date: formatDate(entry.source.accessed_on, lang) })}
            </AppText>
          )}
          <VerificationList verification={entry.verification} />
          {notes && (
            <LabelledBlock label={lang === 'hi' ? t('editorNoteEnglishOnly') : t('editorNote')}>
              <AppText variant="small">{notes}</AppText>
            </LabelledBlock>
          )}
          <Button kind="ghost" icon="shield-checkmark-outline" label={t('aboutContent')} onPress={() => router.push('/sources')} />
        </Collapsible>
      </View>
    </Screen>
  );
}
