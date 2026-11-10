import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import {
  categoryLabel,
  entryDeityName,
  entryHref,
  entryTitle,
  pick,
  type EducationalSource,
  type Entry,
  type Localized,
  type Recitation,
  type VerificationValue,
} from '@/content';
import { formatDate, translate, useT } from '@/i18n';
import { useStore } from '@/state/store';
import { fonts, radius, spacing, TOUCH, usePalette } from '@/theme';
import { AppText, Button, Ionicons, Row, type IconName } from './ui';

// ---------------------------------------------------------------- Original text

/**
 * Renders original sacred text exactly as supplied. Each `lines` item becomes
 * one Text node with its characters untouched; blank items become vertical
 * space. No truncation (`numberOfLines` is never set) and no reflow of words.
 */
export function RecitationBody({
  recitation,
  fontSize,
  bookmarkLine,
  onLineLayout,
  align = 'center',
}: {
  recitation: Recitation;
  fontSize: number;
  bookmarkLine?: number | null;
  onLineLayout?: (index: number, y: number) => void;
  align?: 'center' | 'left';
}) {
  const p = usePalette();
  const { lang } = useT();
  const lineHeight = Math.round(fontSize * 1.8);
  const textStyle = {
    fontFamily: fonts.recitation.regular,
    fontSize,
    lineHeight,
    color: p.text,
    textAlign: align,
  } as const;

  if (recitation.kind === 'none') {
    return (
      <AppText tone="muted" center>
        {translate(lang, 'textUnavailable')}
      </AppText>
    );
  }

  if (recitation.kind === 'text') {
    return (
      <Text selectable style={textStyle}>
        {recitation.text}
      </Text>
    );
  }

  return (
    <View>
      {recitation.lines.map((line, i) => {
        const onLayout = onLineLayout ? (e: LayoutChangeEvent) => onLineLayout(i, e.nativeEvent.layout.y) : undefined;
        if (line.length === 0) return <View key={i} onLayout={onLayout} style={{ height: Math.round(lineHeight * 0.45) }} />;
        const marked = bookmarkLine === i;
        return (
          <View key={i} onLayout={onLayout} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 18, paddingTop: lineHeight / 2 - 8 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {marked && <Ionicons name="bookmark" size={14} color={p.accent} />}
            </View>
            <Text selectable style={[textStyle, { flex: 1 }]}>
              {line}
            </Text>
            <View style={{ width: 18 }} />
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------- Explanations

/** Dataset explanation in the interface language, with an honest note if it fell back to the other language. */
export function LocalizedText({ value, variant = 'body' }: { value?: Localized; variant?: 'body' | 'small' }) {
  const { t, lang } = useT();
  const { text, fellBack } = pick(value, lang);
  if (!text) return null;
  return (
    <View style={{ gap: 2 }}>
      <AppText variant={variant}>{text}</AppText>
      {fellBack && (
        <AppText variant="caption" tone="muted">
          {lang === 'en' ? t('explanationLanguageFallback') : t('explanationLanguageFallbackHi')}
        </AppText>
      )}
    </View>
  );
}

export function Collapsible({ title, icon, children, initiallyOpen = false }: { title: string; icon?: IconName; children: ReactNode; initiallyOpen?: boolean }) {
  const p = usePalette();
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: p.border }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => ({ minHeight: TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, opacity: pressed ? 0.7 : 1 })}
      >
        {icon && <Ionicons name={icon} size={20} color={p.accent} />}
        <AppText variant="subheading" style={{ flex: 1 }}>
          {title}
        </AppText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={p.textMuted} />
      </Pressable>
      {open && <View style={{ paddingBottom: spacing.lg, gap: spacing.md }}>{children}</View>}
    </View>
  );
}

export function LabelledBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="accent">
        {label}
      </AppText>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------- Links and sources

export async function openExternal(url: string, lang: 'hi' | 'en') {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(translate(lang, 'couldNotOpenLink'));
  }
}

const hostOf = (url: string) => {
  const m = /^https?:\/\/([^/]+)/.exec(url);
  return m?.[1]?.replace(/^www\./, '') ?? url;
};

/** External link with the required "needs internet" explanation. */
export function ExternalLinkButton({ url, label, primary }: { url: string; label?: string; primary?: boolean }) {
  const { t, lang } = useT();
  const p = usePalette();
  return (
    <View style={{ gap: spacing.xs }}>
      <Button
        label={label ?? t('openSource')}
        icon="open-outline"
        kind={primary ? 'primary' : 'secondary'}
        onPress={() => openExternal(url, lang)}
        accessibilityHint={t('needsInternet')}
      />
      <Row gap={6}>
        <Ionicons name="wifi-outline" size={14} color={p.textMuted} />
        <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
          {t('needsInternet')}
        </AppText>
      </Row>
    </View>
  );
}

export function SourceLinkRow({ url, title, accessedOn }: { url: string; title?: string; accessedOn?: string }) {
  const p = usePalette();
  const { t, lang } = useT();
  return (
    <Pressable
      onPress={() => openExternal(url, lang)}
      accessibilityRole="link"
      accessibilityHint={t('needsInternet')}
      style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, minHeight: TOUCH, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Ionicons name="link-outline" size={18} color={p.accent} />
      <View style={{ flex: 1 }}>
        <AppText variant="small" weight="medium" tone="accent">
          {title ?? hostOf(url)}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} ellipsizeMode="middle">
          {url}
        </AppText>
        {accessedOn && (
          <AppText variant="caption" tone="muted">
            {t('accessedOn', { date: formatDate(accessedOn, lang) })}
          </AppText>
        )}
      </View>
      <Ionicons name="open-outline" size={16} color={p.textMuted} />
    </Pressable>
  );
}

export function SourceList({ sources, extraUrls = [] }: { sources: EducationalSource[]; extraUrls?: string[] }) {
  const { t } = useT();
  if (sources.length === 0 && extraUrls.length === 0) return null;
  return (
    <View>
      {sources.map((s) => (
        <SourceLinkRow key={s.id} url={s.url} accessedOn={s.accessed_on} />
      ))}
      {extraUrls.map((u) => (
        <SourceLinkRow key={u} url={u} />
      ))}
      <AppText variant="caption" tone="muted">
        {t('needsInternet')}
      </AppText>
    </View>
  );
}

export function VerificationList({ verification }: { verification?: Record<string, VerificationValue> }) {
  const p = usePalette();
  const { t, tOpt } = useT();
  if (!verification) return null;
  const items = Object.entries(verification).map(([key, value]) => {
    if (typeof value === 'number') {
      const label = key === 'body_couplet_count' ? t('v_body_couplet_count', { n: value }) : `${key.replace(/_/g, ' ')}: ${value}`;
      return { key, label, ok: null as boolean | null };
    }
    if (typeof value === 'boolean') {
      const label = tOpt(`v_${key}_${value}`) ?? `${key.replace(/_/g, ' ')}: ${value ? t('yes') : t('no')}`;
      // "wording_changed: false" is the good outcome.
      const ok = key === 'wording_changed' ? !value : value;
      return { key, label, ok };
    }
    return { key, label: `${key.replace(/_/g, ' ')}: ${String(value)}`, ok: null };
  });
  return (
    <View style={{ gap: spacing.xs }}>
      {items.map((i) => (
        <Row key={i.key} gap={spacing.sm} style={{ alignItems: 'flex-start' }}>
          <Ionicons
            name={i.ok === null ? 'ellipse-outline' : i.ok ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={16}
            color={i.ok === false ? p.textMuted : p.success}
            style={{ marginTop: 3 }}
          />
          <AppText variant="small" style={{ flex: 1 }}>
            {i.label}
          </AppText>
        </Row>
      ))}
    </View>
  );
}

type ChecksumState = 'checking' | 'ok' | 'mismatch' | 'missing' | 'unavailable';

/** Re-hashes the exact string being displayed and compares it with text_sha256. */
export function ChecksumStatus({ displayed, expected }: { displayed: string | null; expected?: string }) {
  const p = usePalette();
  const { t } = useT();
  const [state, setState] = useState<ChecksumState>(expected && displayed !== null ? 'checking' : 'missing');

  useEffect(() => {
    if (!expected || displayed === null) {
      setState('missing');
      return;
    }
    let cancelled = false;
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, displayed, { encoding: Crypto.CryptoEncoding.HEX })
      .then((hash) => !cancelled && setState(hash.toLowerCase() === expected.toLowerCase() ? 'ok' : 'mismatch'))
      .catch(() => !cancelled && setState('unavailable'));
    return () => {
      cancelled = true;
    };
  }, [displayed, expected]);

  const map: Record<ChecksumState, { icon: IconName; text: string; color: string }> = {
    checking: { icon: 'hourglass-outline', text: t('checksumChecking'), color: p.textMuted },
    ok: { icon: 'shield-checkmark-outline', text: t('checksumOk'), color: p.success },
    mismatch: { icon: 'warning-outline', text: t('checksumMismatch'), color: p.danger },
    missing: { icon: 'help-circle-outline', text: t('checksumMissing'), color: p.textMuted },
    unavailable: { icon: 'help-circle-outline', text: t('checksumUnavailable'), color: p.textMuted },
  };
  const s = map[state];
  return (
    <Row gap={spacing.sm} style={{ alignItems: 'flex-start' }}>
      <Ionicons name={s.icon} size={16} color={s.color} style={{ marginTop: 3 }} />
      <AppText variant="small" style={{ flex: 1, color: s.color }}>
        {s.text}
      </AppText>
    </Row>
  );
}

// ---------------------------------------------------------------- Lists

const categoryIcon: Record<string, IconName> = {
  aarti: 'flame-outline',
  chalisa: 'book-outline',
  mantra: 'musical-notes-outline',
  yantra: 'grid-outline',
};
export const iconForCategory = (c: string): IconName => categoryIcon[c] ?? 'document-text-outline';

export function EntryRow({ entry, subtitle, showCategory = true }: { entry: Entry; subtitle?: string; showCategory?: boolean }) {
  const p = usePalette();
  const { lang } = useT();
  const isFav = useStore((s) => s.favourites.includes(entry.id));
  const title = entryTitle(entry, lang);
  const showOriginal = title !== entry.title;
  const meta = [showCategory ? categoryLabel(entry.category, lang) : null, entryDeityName(entry, lang)].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => router.push(entryHref(entry))}
      accessibilityRole="button"
      accessibilityLabel={`${title}${showOriginal ? `, ${entry.title}` : ''}. ${meta}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        minHeight: 64,
        backgroundColor: pressed ? p.surfaceAlt : p.surface,
        borderWidth: 1,
        borderColor: pressed ? p.borderStrong : p.border,
        marginBottom: spacing.sm,
      })}
    >
      <View style={{ width: 40, height: 40, borderWidth: 1, borderColor: p.border, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={iconForCategory(entry.category)} size={18} color={p.text} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="subheading" weight="bold">
          {title}
        </AppText>
        {showOriginal && (
          <AppText variant="small" tone="muted">
            {entry.title}
          </AppText>
        )}
        <AppText variant="caption" tone="muted">
          {subtitle ?? meta}
        </AppText>
      </View>
      {isFav && <Ionicons name="heart" size={16} color={p.text} accessibilityLabel={translate(lang, 'favourites')} />}
      <Ionicons name="arrow-forward" size={18} color={p.text} />
    </Pressable>
  );
}
