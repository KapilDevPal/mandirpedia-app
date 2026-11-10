import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { RecitationBody } from '@/components/content';
import { KeepAwake } from '@/components/KeepAwake';
import { AppText, Button, Chip, EmptyState, Ionicons, Notice, Row, Screen, SectionTitle } from '@/components/ui';
import { entryTitle, getRecitation, mantraEntries } from '@/content';
import { useT } from '@/i18n';
import { maybeRequestReview } from '@/services/review';
import { DEFAULT_TARGET, newCounter, parseCustomTarget, PRESET_TARGETS, roundInfo } from '@/state/jap';
import { useStore } from '@/state/store';
import { fonts, radius, spacing, TOUCH, usePalette } from '@/theme';

export default function JapScreen() {
  const p = usePalette();
  const { t, lang } = useT();
  const focused = useIsFocused();
  const { width, height } = useWindowDimensions();

  const mantras = useMemo(() => mantraEntries(), []);
  const settings = useStore((s) => s.settings);
  const selectedId = useStore((s) => s.jap.selectedMantraId);
  const counters = useStore((s) => s.jap.counters);
  const { selectMantra, japIncrement, japDecrement, japReset, japSetTarget, recordUse } = useStore.getState();
  useFocusEffect(useCallback(() => recordUse('feature:jap'), [recordUse]));

  const mantra = mantras.find((m) => m.id === selectedId) ?? mantras[0];
  const counter = (mantra && counters[mantra.id]) || newCounter(DEFAULT_TARGET);
  const { rounds, inRound } = roundInfo(counter);

  const [showText, setShowText] = useState(true);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customError, setCustomError] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!mantra) {
    return <EmptyState icon="radio-button-off-outline" title={t('noMantras')} action={<Button label={t('goHome')} onPress={() => router.navigate('/')} />} />;
  }

  const size = Math.max(180, Math.min(width - spacing.xl * 2, 300, height * 0.38));
  const isPreset = (PRESET_TARGETS as readonly number[]).includes(counter.target);
  const progress = counter.target > 0 ? (counter.count > 0 && inRound === 0 ? 1 : inRound / counter.target) : 0;

  const onTap = () => {
    const reached = japIncrement(mantra.id);
    if (settings.haptics) {
      if (reached) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (reached) {
      setCelebrate(true);
      AccessibilityInfo.announceForAccessibility(t('targetReached'));
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      celebrateTimer.current = setTimeout(() => setCelebrate(false), 2500);
      // Completing a round is a calm moment where a review request is acceptable (rarely; see policy).
      setTimeout(() => maybeRequestReview(), 3000);
    }
  };

  const confirmReset = () =>
    Alert.alert(t('resetTitle'), t('resetBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('reset'), style: 'destructive', onPress: () => japReset(mantra.id) },
    ]);

  const saveCustom = () => {
    const n = parseCustomTarget(customValue);
    if (n === null) {
      setCustomError(true);
      return;
    }
    japSetTarget(mantra.id, n);
    setCustomOpen(false);
    setCustomError(false);
    setCustomValue('');
  };

  // Show the count within the current round; completed rounds are listed separately.
  const shownCount = counter.count > 0 && inRound === 0 ? counter.target : inRound;

  return (
    <Screen>
      {focused && settings.keepAwake && <KeepAwake tag="jap" />}

      <AppText variant="label" tone="muted">
        {t('chooseMantra')}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
        {mantras.map((m) => (
          <Chip key={m.id} label={entryTitle(m, lang)} selected={m.id === mantra.id} onPress={() => selectMantra(m.id)} />
        ))}
      </ScrollView>

      {/* Original mantra text, unchanged */}
      <View style={{ marginTop: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: p.border, backgroundColor: p.recitation, padding: spacing.md }}>
        <Pressable onPress={() => setShowText((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: showText }} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="subheading" style={{ flex: 1 }}>
            {entryTitle(mantra, lang)}
          </AppText>
          <AppText variant="caption" tone="accent">
            {showText ? t('hideMantra') : t('showMantra')}
          </AppText>
        </Pressable>
        {showText && (
          <View style={{ marginTop: spacing.sm }}>
            <RecitationBody recitation={getRecitation(mantra)} fontSize={Math.min(settings.readerFontSize, 24)} />
          </View>
        )}
        <Pressable onPress={() => router.push(`/prayer/${mantra.id}`)} accessibilityRole="link" style={{ alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' }}>
          <AppText variant="caption" weight="semibold" tone="accent">
            {t('aboutThisPrayer')} →
          </AppText>
        </Pressable>
      </View>

      {/* Counter */}
      <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
        <Pressable
          onPress={onTap}
          accessibilityRole="button"
          accessibilityLabel={t('countA11y', { count: counter.count, target: counter.target })}
          accessibilityHint={t('tapToCount')}
          style={({ pressed }) => ({
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pressed ? p.accentSoft : p.surface,
            borderWidth: celebrate ? 4 : 1,
            borderColor: p.borderStrong,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <AppText style={{ fontFamily: fonts.ui.bold, fontSize: Math.round(size * 0.26), lineHeight: Math.round(size * 0.36), color: p.text }}>{shownCount}</AppText>
          <AppText variant="small" tone="muted">
            {t('ofTarget', { target: counter.target })}
          </AppText>
          <AppText variant="caption" tone="accent" style={{ marginTop: spacing.xs }}>
            {celebrate ? t('targetReached') : t('tapToCount')}
          </AppText>
        </Pressable>

        {/* Progress within the current round */}
        <View style={{ width: size, height: 2, backgroundColor: p.border, marginTop: spacing.lg, overflow: 'hidden' }} accessibilityElementsHidden>
          <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: p.text }} />
        </View>
        <AppText variant="small" tone="muted" style={{ marginTop: spacing.sm }} accessibilityLiveRegion="polite">
          {t('roundsDone', { n: rounds })}
        </AppText>

        <Row style={{ marginTop: spacing.md }}>
          <Button kind="ghost" icon="arrow-undo-outline" label={t('undo')} onPress={() => japDecrement(mantra.id)} disabled={counter.count === 0} />
          <Button kind="danger" icon="refresh-outline" label={t('reset')} onPress={confirmReset} disabled={counter.count === 0} />
        </Row>
      </View>

      {/* Target */}
      <SectionTitle>{t('target')}</SectionTitle>
      <Row wrap>
        {PRESET_TARGETS.map((n) => (
          <Chip key={n} label={String(n)} selected={counter.target === n} onPress={() => japSetTarget(mantra.id, n)} />
        ))}
        <Chip
          label={isPreset ? t('custom') : `${t('custom')}: ${counter.target}`}
          icon="create-outline"
          selected={!isPreset}
          onPress={() => {
            setCustomOpen((v) => !v);
            setCustomError(false);
          }}
        />
      </Row>
      {customOpen && (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Row>
            <TextInput
              value={customValue}
              onChangeText={(v) => {
                setCustomValue(v);
                setCustomError(false);
              }}
              keyboardType="number-pad"
              placeholder={t('customTargetPlaceholder')}
              placeholderTextColor={p.textMuted}
              accessibilityLabel={t('customTargetPlaceholder')}
              onSubmitEditing={saveCustom}
              maxLength={6}
              style={{
                flex: 1,
                minHeight: TOUCH,
                borderWidth: 1,
                borderColor: customError ? p.danger : p.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                fontFamily: fonts.ui.regular,
                fontSize: 17,
                color: p.text,
                backgroundColor: p.surface,
              }}
            />
            <Button label={t('save')} onPress={saveCustom} />
          </Row>
          {customError && (
            <Row gap={6}>
              <Ionicons name="alert-circle-outline" size={16} color={p.danger} />
              <AppText variant="caption" tone="danger">
                {t('invalidTarget')}
              </AppText>
            </Row>
          )}
        </View>
      )}
      <Notice style={{ marginTop: spacing.lg }}>{t('targetNote')}</Notice>
    </Screen>
  );
}
