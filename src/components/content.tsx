import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import {
  categoryLabel,
  entryDeityName,
  entryHref,
  entryTitle,
  pick,
  type Entry,
  type Localized,
  type Recitation,
} from '@/content';
import { translate, useT } from '@/i18n';
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
