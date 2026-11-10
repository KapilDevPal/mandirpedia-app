import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { RecitationBody } from '@/components/content';
import { AppText, Button, Card, IconButton, Notice, Row, Screen, Segmented, SectionTitle } from '@/components/ui';
import { entries, getRecitation, isRecitationCategory } from '@/content';
import { useT, type StringKey } from '@/i18n';
import { openStoreReview } from '@/services/review';
import { useAppUpdates } from '@/services/updates';
import { FONT_LIMITS, useStore, type ThemeSetting } from '@/state/store';
import { radius, spacing, usePalette } from '@/theme';

/** One genuine, complete line from the dataset for the font preview (verbatim; no text is invented). */
const isVerse = (l: string) => l.trim().length >= 20;
const previewEntry = entries.find((e) => isRecitationCategory(e.category) && e.lines?.some(isVerse));
const previewLine = previewEntry?.lines?.find(isVerse);

export default function SettingsScreen() {
  const p = usePalette();
  const { t, tOpt } = useT();
  const settings = useStore((s) => s.settings);
  const updates = useAppUpdates();
  const busy = updates.status === 'checking' || updates.status === 'downloading';
  const { updateSettings, clearReadingHistory, clearJap, clearFavourites } = useStore.getState();

  const confirm = (label: StringKey, action: () => void) =>
    Alert.alert(t('confirmClearTitle'), `${t(label)}. ${t('confirmClearBody')}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('clear'),
        style: 'destructive',
        onPress: () => {
          action();
          Alert.alert(t('cleared'));
        },
      },
    ]);

  return (
    <Screen>
      <SectionTitle>{t('language')}</SectionTitle>
      <Segmented
        value={settings.language}
        onChange={(language) => updateSettings({ language })}
        options={[
          { value: 'hi', label: 'हिन्दी' },
          { value: 'en', label: 'English' },
        ]}
      />
      <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
        {t('languageNote')}
      </AppText>

      <SectionTitle>{t('theme')}</SectionTitle>
      <Segmented<ThemeSetting>
        value={settings.theme}
        onChange={(theme) => updateSettings({ theme })}
        options={[
          { value: 'light', label: t('themeLight') },
          { value: 'dark', label: t('themeDark') },
          { value: 'system', label: t('themeSystem') },
        ]}
      />

      <SectionTitle>{t('readerFontSize')}</SectionTitle>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconButton icon="remove-circle-outline" label={t('fontSmaller')} disabled={settings.readerFontSize <= FONT_LIMITS.min} onPress={() => updateSettings({ readerFontSize: settings.readerFontSize - FONT_LIMITS.step })} />
          <AppText variant="heading" accessibilityLiveRegion="polite">
            {settings.readerFontSize}
          </AppText>
          <IconButton icon="add-circle-outline" label={t('fontLarger')} disabled={settings.readerFontSize >= FONT_LIMITS.max} onPress={() => updateSettings({ readerFontSize: settings.readerFontSize + FONT_LIMITS.step })} />
        </Row>
        {previewLine && (
          <View style={{ marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: p.recitation, borderWidth: 1, borderColor: p.border }}>
            <AppText variant="caption" tone="muted" center>
              {t('fontPreviewLabel')}
            </AppText>
            <RecitationBody recitation={getRecitation({ lines: [previewLine] })} fontSize={settings.readerFontSize} />
          </View>
        )}
      </Card>

      <SectionTitle>{t('autoScrollDefault')}</SectionTitle>
      <Segmented
        value={String(settings.autoScrollSpeed)}
        onChange={(v) => updateSettings({ autoScrollSpeed: Number(v) })}
        options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}×` }))}
      />

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <ToggleRow label={t('haptics')} note={t('hapticsNote')} value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
        <ToggleRow label={t('keepAwake')} note={t('keepAwakeNote')} value={settings.keepAwake} onChange={(keepAwake) => updateSettings({ keepAwake })} />
      </View>

      <SectionTitle>{t('yourData')}</SectionTitle>
      <Notice icon="phone-portrait-outline">{t('dataNote')}</Notice>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        <Button kind="danger" icon="time-outline" label={t('clearReading')} onPress={() => confirm('clearReading', clearReadingHistory)} />
        <Button kind="danger" icon="radio-button-on-outline" label={t('clearJap')} onPress={() => confirm('clearJap', clearJap)} />
        <Button kind="danger" icon="heart-dislike-outline" label={t('clearFavourites')} onPress={() => confirm('clearFavourites', clearFavourites)} />
      </View>

      <SectionTitle>{t('appUpdates')}</SectionTitle>
      <Card>
        <AppText variant="small" accessibilityLiveRegion="polite">
          {tOpt(`updateStatus_${updates.status}`) ?? ''}
        </AppText>
        <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
          {t('appUpdatesNote')}
        </AppText>
        {updates.status !== 'disabled' && (
          <View style={{ marginTop: spacing.md }}>
            {updates.status === 'ready' ? (
              <Button icon="refresh-outline" label={t('restartToUpdate')} onPress={updates.restart} />
            ) : (
              <Button kind="secondary" icon="cloud-download-outline" label={t('checkForUpdates')} onPress={updates.check} disabled={busy} />
            )}
          </View>
        )}
      </Card>

      <SectionTitle>{t('rateApp')}</SectionTitle>
      <AppText variant="small" tone="muted" style={{ marginBottom: spacing.md }}>
        {t('rateAppNote')}
      </AppText>
      <Button kind="secondary" icon="star-outline" label={t('rateApp')} onPress={openStoreReview} />

      <SectionTitle>{t('aboutContent')}</SectionTitle>
      <Card onPress={() => router.push('/sources')}>
        <Row>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{t('sourcesTitle')}</AppText>
            <AppText variant="small" tone="muted">
              {t('aboutContentNote')}
            </AppText>
          </View>
          <IconButton icon="chevron-forward" label={t('sourcesTitle')} onPress={() => router.push('/sources')} />
        </Row>
      </Card>
      <Button kind="ghost" icon="heart-outline" label={t('favourites')} onPress={() => router.push('/favourites')} style={{ marginTop: spacing.md }} />

      <AppText variant="caption" tone="muted" center style={{ marginTop: spacing.xl }}>
        {t('version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
      </AppText>
    </Screen>
  );
}

function ToggleRow({ label, note, value, onChange }: { label: string; note?: ReactNode; value: boolean; onChange: (v: boolean) => void }) {
  const p = usePalette();
  return (
    <Card>
      <Row gap={spacing.md}>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading">{label}</AppText>
          {note && (
            <AppText variant="caption" tone="muted">
              {note}
            </AppText>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          accessibilityLabel={label}
          trackColor={{ true: p.accent, false: p.border }}
          thumbColor={p.isDark ? p.text : '#FFFFFF'}
        />
      </Row>
    </Card>
  );
}
