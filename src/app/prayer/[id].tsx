import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChecksumStatus,
  Collapsible,
  ExternalLinkButton,
  LabelledBlock,
  LocalizedText,
  RecitationBody,
  VerificationList,
} from '@/components/content';
import { KeepAwake } from '@/components/KeepAwake';
import { maybeRequestReview } from '@/services/review';
import { AppText, Button, Chip, Column, EmptyState, IconButton, Ionicons, Notice, Row } from '@/components/ui';
import {
  categoryLabel,
  deitiesById,
  entriesById,
  entryDeityName,
  entryTitle,
  getRecitation,
  isRecitationCategory,
  recitationString,
} from '@/content';
import { formatDate, languageName, useT } from '@/i18n';
import { FONT_LIMITS, useStore, type ThemeSetting } from '@/state/store';
import { fonts, radius, spacing, usePalette } from '@/theme';

/** Auto-scroll speeds in points per second at the default font size. */
const SPEEDS = [12, 20, 30, 44, 62];
const THEME_CYCLE: ThemeSetting[] = ['light', 'dark'];

export default function PrayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = id ? entriesById.get(id) : undefined;
  const { t } = useT();

  if (entry && !isRecitationCategory(entry.category)) return <Redirect href={`/yantra/${entry.id}`} />;
  if (!entry) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState icon="alert-circle-outline" title={t('notFound')} action={<Button label={t('goHome')} onPress={() => router.replace('/')} />} />
      </>
    );
  }
  return <Reader entryId={entry.id} />;
}

function Reader({ entryId }: { entryId: string }) {
  const entry = entriesById.get(entryId)!;
  const p = usePalette();
  const { t, tOpt, lang } = useT();
  const insets = useSafeAreaInsets();

  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const isFav = useStore((s) => s.favourites.includes(entryId));
  const toggleFavourite = useStore((s) => s.toggleFavourite);
  const bookmark = useStore((s) => s.bookmarks[entryId]);
  const setBookmark = useStore((s) => s.setBookmark);
  const saveProgress = useStore((s) => s.saveProgress);
  const recordUse = useStore((s) => s.recordUse);

  useEffect(() => {
    recordUse(`entry:${entryId}`);
  }, [entryId, recordUse]);

  const recitation = useMemo(() => getRecitation(entry), [entry]);
  const displayed = useMemo(() => recitationString(recitation), [recitation]);
  const title = entryTitle(entry, lang);
  const deityName = entryDeityName(entry, lang);
  const deityProfile = entry.deity_id ? deitiesById.get(entry.deity_id) : undefined;

  // ---------- scroll geometry ----------
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollY = useRef(0);
  const contentH = useRef(0);
  const viewH = useRef(0);
  const panelY = useRef(0);
  const bodyY = useRef(0);
  const lineYs = useRef<number[]>([]);
  const userMoved = useRef(false);

  const maxScroll = () => Math.max(0, contentH.current - viewH.current);
  const lineAbsY = (i: number) => panelY.current + bodyY.current + (lineYs.current[i] ?? 0);

  const topLine = useCallback((): number => {
    if (recitation.kind !== 'lines') return 0;
    const y = scrollY.current + 12;
    let idx = 0;
    for (let i = 0; i < recitation.lines.length; i++) {
      if (lineAbsY(i) <= y) idx = i;
      else break;
    }
    return idx;
  }, [recitation]);

  const fraction = () => (maxScroll() > 0 ? Math.min(1, Math.max(0, scrollY.current / maxScroll())) : 0);

  const scrollToLine = useCallback(
    (line: number, fallbackFraction: number, animated = true) => {
      const y =
        recitation.kind === 'lines' && lineYs.current[line] !== undefined
          ? Math.max(0, lineAbsY(line) - 12)
          : fallbackFraction * maxScroll();
      scrollRef.current?.scrollTo({ y, animated });
    },
    [recitation],
  );

  // ---------- reading progress ----------
  const [resumeOffer, setResumeOffer] = useState(() => {
    const pr = useStore.getState().progress[entryId];
    return pr && pr.fraction > 0.02 && pr.fraction < 0.98 ? pr : null;
  });

  const reachedEnd = useRef(false);
  const persistProgress = useCallback(() => {
    if (!userMoved.current) return;
    const f = fraction();
    saveProgress(entryId, { line: topLine(), fraction: f });
    // Finishing a prayer is a calm moment where a review request is acceptable (rarely; see policy).
    if (f >= 0.97 && !reachedEnd.current) {
      reachedEnd.current = true;
      maybeRequestReview();
    }
  }, [entryId, saveProgress, topLine]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistProgress, 700);
  };
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      persistProgress();
    },
    [persistProgress],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    if (userMoved.current) scheduleSave();
  };

  // ---------- auto-scroll ----------
  const [playing, setPlaying] = useState(false);
  const speed = (SPEEDS[settings.autoScrollSpeed - 1] ?? SPEEDS[1]!) * (settings.readerFontSize / 22);

  useEffect(() => {
    if (!playing) return;
    userMoved.current = true;
    setResumeOffer(null);
    let raf = 0;
    let last: number | null = null;
    const step = (now: number) => {
      if (last !== null) {
        const dt = Math.min(0.1, (now - last) / 1000);
        const next = Math.min(maxScroll(), scrollY.current + speed * dt);
        scrollY.current = next;
        scrollRef.current?.scrollTo({ y: next, animated: false });
        scheduleSave();
        if (next >= maxScroll() - 0.5) {
          setPlaying(false);
          return;
        }
      }
      last = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  // ---------- toast ----------
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    AccessibilityInfo.announceForAccessibility(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  };

  // ---------- actions ----------
  const changeFont = (delta: number) => {
    const anchor = topLine();
    const anchorFraction = fraction();
    updateSettings({ readerFontSize: settings.readerFontSize + delta });
    // Keep the reader's place after the text reflows.
    setTimeout(() => scrollToLine(anchor, anchorFraction, false), 120);
  };

  const cycleTheme = () => {
    const current = THEME_CYCLE.indexOf(p.name);
    updateSettings({ theme: THEME_CYCLE[(current + 1) % THEME_CYCLE.length]! });
  };

  const onBookmarkPress = () => {
    const here = { line: topLine(), fraction: fraction() };
    if (!bookmark) {
      setBookmark(entryId, here);
      showToast(t('bookmarkSaved'));
      return;
    }
    Alert.alert(t('bookmark'), undefined, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('removeBookmark'),
        style: 'destructive',
        onPress: () => {
          setBookmark(entryId, null);
          showToast(t('bookmarkRemoved'));
        },
      },
      {
        text: t('bookmark'),
        onPress: () => {
          setBookmark(entryId, here);
          showToast(t('bookmarkSaved'));
        },
      },
    ]);
  };

  const goToBookmark = () => {
    if (!bookmark) return;
    userMoved.current = true;
    setResumeOffer(null);
    scrollToLine(bookmark.line, bookmark.fraction);
  };

  const pct = resumeOffer ? Math.round(resumeOffer.fraction * 100) : 0;
  const notes = entry.notes?.trim();
  const barHeight = 64 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Row gap={0}>
              <IconButton icon={bookmark ? 'bookmark' : 'bookmark-outline'} active={!!bookmark} label={bookmark ? t('removeBookmark') : t('bookmark')} onPress={onBookmarkPress} />
              <IconButton icon={isFav ? 'heart' : 'heart-outline'} active={isFav} label={isFav ? t('unfavourite') : t('favourite')} onPress={() => toggleFavourite(entryId)} />
            </Row>
          ),
        }}
      />
      {settings.keepAwake && <KeepAwake tag={`reader-${entryId}`} />}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onScrollBeginDrag={() => {
          userMoved.current = true;
          setPlaying(false);
        }}
        onContentSizeChange={(_, h) => (contentH.current = h)}
        onLayout={(e) => (viewH.current = e.nativeEvent.layout.height)}
        contentContainerStyle={{ paddingBottom: barHeight + spacing.xl }}
      >
        <Column style={{ paddingHorizontal: spacing.lg }}>
          {/* Header: interface-language title, original title, and labels. */}
          <View style={{ paddingTop: spacing.md, gap: spacing.xs }}>
            <AppText variant="title" accessibilityRole="header">
              {title}
            </AppText>
            {title !== entry.title && (
              <AppText style={{ fontFamily: fonts.recitation.semibold, fontSize: 19, lineHeight: 34 }} tone="muted">
                {entry.title}
              </AppText>
            )}
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Chip label={categoryLabel(entry.category, lang)} onPress={() => router.navigate({ pathname: '/library', params: { category: entry.category, deity: '' } })} />
              {deityName && (
                <Chip
                  label={deityName}
                  icon={deityProfile ? 'person-circle-outline' : undefined}
                  onPress={deityProfile ? () => router.push(`/deity/${deityProfile.id}`) : undefined}
                />
              )}
            </Row>
            {entry.language && (
              <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
                {t('originalLanguage', { lang: languageName(entry.language, lang), script: tOpt(`script_${entry.script ?? 'Devanagari'}`) ?? entry.script ?? 'Devanagari' })}
              </AppText>
            )}
          </View>

          {/* Resume / bookmark prompts (interface only, outside the recitation panel). */}
          {resumeOffer && (
            <View style={[styles.banner, { backgroundColor: p.surfaceAlt, borderColor: p.borderStrong }]}>
              <AppText variant="small" style={{ flex: 1, minWidth: 160 }}>
                {t('resumePrompt', { pct })}
              </AppText>
              <Row>
                <Button
                  kind="ghost"
                  label={t('startOver')}
                  onPress={() => {
                    userMoved.current = true;
                    setResumeOffer(null);
                  }}
                />
                <Button
                  label={t('resume')}
                  onPress={() => {
                    userMoved.current = true;
                    scrollToLine(resumeOffer.line, resumeOffer.fraction);
                    setResumeOffer(null);
                  }}
                />
              </Row>
            </View>
          )}
          {bookmark && !resumeOffer && (
            <Pressable onPress={goToBookmark} accessibilityRole="button" style={{ alignSelf: 'flex-start', marginTop: spacing.md }}>
              <Row gap={6}>
                <Ionicons name="bookmark" size={16} color={p.accent} />
                <AppText variant="small" weight="semibold" tone="accent">
                  {t('goToBookmark')}
                </AppText>
              </Row>
            </Pressable>
          )}

          {lang === 'en' && recitation.kind !== 'none' && (
            <Notice icon="language-outline" style={{ marginTop: spacing.md }}>
              {t('noTranslationNote')}
            </Notice>
          )}

          {/* Original recitation: plain panel, no decoration behind the text. */}
          <View
            onLayout={(e: LayoutChangeEvent) => (panelY.current = e.nativeEvent.layout.y)}
            style={{
              marginTop: spacing.lg,
              backgroundColor: p.recitation,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: p.border,
              paddingVertical: spacing.xxl,
              paddingHorizontal: spacing.sm,
            }}
            accessibilityLabel={t('originalText')}
          >
            <AppText variant="label" tone="muted" center style={{ marginBottom: spacing.md }}>
              {t('originalText')}
            </AppText>
            <View onLayout={(e) => (bodyY.current = e.nativeEvent.layout.y)}>
              <RecitationBody
                recitation={recitation}
                fontSize={settings.readerFontSize}
                bookmarkLine={bookmark?.line ?? null}
                onLineLayout={(i, y) => (lineYs.current[i] = y)}
              />
            </View>
            <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
              <View style={{ width: 48, height: 1, backgroundColor: p.border }} />
              <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
                {t('endOfText')}
              </AppText>
            </View>
          </View>

          {/* Explanations: clearly separate from the original text. */}
          <View style={{ marginTop: spacing.xl }}>
            {(entry.summary || entry.explanation_note) && (
              <Collapsible title={t('aboutThisPrayer')} icon="information-circle-outline">
                <LocalizedText value={entry.summary} />
                {entry.explanation_note && (
                  <AppText variant="caption" tone="muted">
                    {entry.explanation_note[lang] ?? entry.explanation_note.en ?? entry.explanation_note.hi}
                  </AppText>
                )}
              </Collapsible>
            )}
            {entry.why_recite_or_use && (
              <Collapsible title={t('traditionalSignificance')} icon="sparkles-outline">
                <LocalizedText value={entry.why_recite_or_use} />
                <Notice>{t('traditionalBeliefNote')}</Notice>
              </Collapsible>
            )}
            <Collapsible title={t('sourceAndVerification')} icon="document-text-outline">
              {entry.source?.url && <ExternalLinkButton url={entry.source.url} label={t('sourceLink')} />}
              <View style={{ gap: 2 }}>
                {entry.source?.accessed_on && (
                  <AppText variant="small" tone="muted">
                    {t('accessedOn', { date: formatDate(entry.source.accessed_on, lang) })}
                  </AppText>
                )}
                {entry.source?.source_line_start !== undefined && entry.source?.source_line_end !== undefined && (
                  <AppText variant="small" tone="muted">
                    {t('sourceLines', { start: entry.source.source_line_start, end: entry.source.source_line_end })}
                  </AppText>
                )}
              </View>
              <VerificationList verification={entry.verification} />
              <ChecksumStatus displayed={displayed} expected={entry.text_sha256} />
              {notes && (
                <LabelledBlock label={lang === 'hi' ? t('editorNoteEnglishOnly') : t('editorNote')}>
                  <AppText variant="small">{notes}</AppText>
                </LabelledBlock>
              )}
              <Button kind="ghost" icon="shield-checkmark-outline" label={t('aboutContent')} onPress={() => router.push('/sources')} />
            </Collapsible>
          </View>
        </Column>
      </ScrollView>

      {toast && (
        <View pointerEvents="none" style={[styles.toast, { bottom: barHeight + spacing.md, backgroundColor: p.text }]}>
          <AppText variant="small" style={{ color: p.background }}>
            {toast}
          </AppText>
        </View>
      )}

      {/* Reading controls */}
      <View style={[styles.bar, { paddingBottom: insets.bottom, height: barHeight, backgroundColor: p.background, borderColor: p.border }]}>
        <Column style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: spacing.sm }}>
          <IconButton icon="remove-circle-outline" label={t('fontSmaller')} disabled={settings.readerFontSize <= FONT_LIMITS.min} onPress={() => changeFont(-FONT_LIMITS.step)} />
          <AppText variant="small" tone="muted" accessibilityElementsHidden importantForAccessibility="no">
            {settings.readerFontSize}
          </AppText>
          <IconButton icon="add-circle-outline" label={t('fontLarger')} disabled={settings.readerFontSize >= FONT_LIMITS.max} onPress={() => changeFont(FONT_LIMITS.step)} />
          <IconButton icon={p.isDark ? 'moon-outline' : 'sunny-outline'} label={`${t('changeTheme')}`} onPress={cycleTheme} />
          <IconButton icon={playing ? 'pause-circle' : 'play-circle-outline'} active={playing} size={30} label={playing ? t('pause') : t('play')} onPress={() => setPlaying((v) => !v)} />
          <Pressable
            onPress={() => updateSettings({ autoScrollSpeed: (settings.autoScrollSpeed % 5) + 1 })}
            accessibilityRole="button"
            accessibilityLabel={`${t('speed')} ${settings.autoScrollSpeed} / 5`}
            style={({ pressed }) => [styles.speed, { borderColor: p.borderStrong, opacity: pressed ? 0.6 : 1 }]}
          >
            <AppText variant="small" weight="semibold" tone="accent">
              {settings.autoScrollSpeed}×
            </AppText>
          </Pressable>
        </Column>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  speed: {
    minWidth: 48,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
