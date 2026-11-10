import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { categories, categoryLabel, deitiesById, deityIdsWithEntries, deityLabel, entriesById, entryHref, entryTitle } from '@/content';
import { emblems } from '@/content/emblems';
import { useT } from '@/i18n';
import { useAppUpdates } from '@/services/updates';
import { useStore } from '@/state/store';
import { topUsage } from '@/state/usage';
import { spacing, TOUCH, usePalette } from '@/theme';
import { iconForCategory } from './content';
import { Emblem } from './Emblem';
import { AppText, Button, Ionicons, Row, SectionTitle, type IconName } from './ui';

/** Resolves a usage key to something displayable, or null if the content no longer exists. */
function describe(key: string, lang: 'hi' | 'en', t: (k: 'feature_jap' | 'feature_learn') => string) {
  const [kind, id = ''] = key.split(/:(.*)/s);
  if (kind === 'entry') {
    const e = entriesById.get(id);
    return e ? { label: entryTitle(e, lang), sub: categoryLabel(e.category, lang), icon: iconForCategory(e.category) as IconName, emblem: undefined, go: () => router.push(entryHref(e)) } : null;
  }
  if (kind === 'deity') {
    if (!deitiesById.has(id) && !deityIdsWithEntries.includes(id)) return null;
    return { label: deityLabel(id, lang), sub: undefined, icon: 'person-circle-outline' as IconName, emblem: emblems[id], go: () => router.push(`/deity/${id}`) };
  }
  if (kind === 'category') {
    if (!categories.includes(id)) return null;
    return { label: categoryLabel(id, lang), sub: undefined, icon: iconForCategory(id) as IconName, emblem: undefined, go: () => router.navigate({ pathname: '/library', params: { category: id, deity: '' } }) };
  }
  if (kind === 'feature' && (id === 'jap' || id === 'learn')) {
    return {
      label: t(id === 'jap' ? 'feature_jap' : 'feature_learn'),
      sub: undefined,
      icon: (id === 'jap' ? 'radio-button-on-outline' : 'school-outline') as IconName,
      emblem: undefined,
      go: () => router.navigate(id === 'jap' ? '/jap' : '/learn'),
    };
  }
  return null;
}

/** The features and prayers this person opens most, counted on-device only. Hidden until something has been used. */
export function MostUsed() {
  const p = usePalette();
  const { t, lang } = useT();
  const usage = useStore((s) => s.usage);
  const items = topUsage(usage, 4, (k) => describe(k, lang, t) !== null)
    .map((u) => ({ ...u, d: describe(u.key, lang, t)! }));
  if (items.length === 0) return null;

  return (
    <>
      <SectionTitle>{t('mostUsed')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }}>
        {items.map(({ key, count, d }) => (
          <Pressable
            key={key}
            onPress={d.go}
            accessibilityRole="button"
            accessibilityLabel={`${d.label}. ${count === 1 ? t('openedOnce') : t('openedTimes', { n: count })}`}
            style={({ pressed }) => ({
              width: '48.5%',
              minHeight: 112,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: pressed ? p.borderStrong : p.border,
              backgroundColor: pressed ? p.surfaceAlt : p.surface,
              justifyContent: 'space-between',
            })}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {d.emblem ? (
                <View style={{ width: 32, height: 32 }}>
                  <Emblem shapes={d.emblem} fg={p.text} bg={p.surface} strokeWidth={3} />
                </View>
              ) : (
                <Ionicons name={d.icon} size={22} color={p.text} />
              )}
              <Ionicons name="arrow-forward" size={16} color={p.text} />
            </Row>
            <View style={{ marginTop: spacing.sm }}>
              <AppText variant="subheading" weight="bold" numberOfLines={2}>
                {d.label}
              </AppText>
              <AppText variant="caption" tone="muted">
                {[d.sub, count === 1 ? t('openedOnce') : t('openedTimes', { n: count })].filter(Boolean).join(' · ')}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}

/** Quiet banner when an over-the-air update has downloaded. Never reloads on its own. */
export function UpdateBanner() {
  const p = usePalette();
  const { t } = useT();
  const { status, restart, dismissed, dismiss } = useAppUpdates();
  if (status !== 'ready' || dismissed) return null;
  return (
    <View style={{ marginTop: spacing.lg, padding: spacing.md, borderWidth: 1, borderColor: p.borderStrong, gap: spacing.sm }} accessibilityLiveRegion="polite">
      <Row style={{ alignItems: 'flex-start' }}>
        <Ionicons name="cloud-download-outline" size={20} color={p.text} style={{ marginTop: 2 }} />
        <AppText variant="small" style={{ flex: 1 }}>
          {t('updateReady')}
        </AppText>
      </Row>
      <Row wrap>
        <Button label={t('restartToUpdate')} onPress={restart} />
        <Pressable onPress={dismiss} accessibilityRole="button" style={{ minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' }}>
          <AppText variant="label">{t('later')}</AppText>
        </Pressable>
      </Row>
    </View>
  );
}
