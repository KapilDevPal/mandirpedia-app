import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/state/store';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { EntryRow, iconForCategory } from '@/components/content';
import { AppText, Button, Chip, Column, EmptyState, Ionicons } from '@/components/ui';
import { categories, categoryLabel, deityIdsWithEntries, deityLabel, entries, haystackFor, matchesQuery } from '@/content';
import { useT } from '@/i18n';
import { fonts, MAX_CONTENT_WIDTH, radius, spacing, TOUCH, usePalette } from '@/theme';

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function LibraryScreen() {
  const p = usePalette();
  const { t, lang } = useT();
  const params = useLocalSearchParams<{ category?: string; deity?: string; q?: string }>();
  // A link such as mandirpedia://library?q=hanuman opens with that search filled in.
  const [query, setQuery] = useState(first(params.q) ?? '');
  useEffect(() => {
    const q = first(params.q);
    if (q !== undefined) setQuery(q);
  }, [params.q]);

  // Filters live in the route params so links from Home (e.g. a category tile) always apply,
  // even when this tab is already mounted.
  const rawCategory = first(params.category);
  const rawDeity = first(params.deity);
  const category = rawCategory && categories.includes(rawCategory) ? rawCategory : null;
  const deity = rawDeity && deityIdsWithEntries.includes(rawDeity) ? rawDeity : null;
  const recordUse = useStore((s) => s.recordUse);
  useEffect(() => {
    if (category) recordUse(`category:${category}`);
  }, [category, recordUse]);
  const setCategory = (c: string | null) => router.setParams({ category: c ?? '' });
  const setDeity = (d: string | null) => router.setParams({ deity: d ?? '' });

  const results = useMemo(
    () =>
      entries.filter(
        (e) => (!category || e.category === category) && (!deity || e.deity_id === deity) && matchesQuery(haystackFor(e.id), query),
      ),
    [category, deity, query],
  );

  const filtersActive = !!query || !!category || !!deity;
  const clearAll = () => {
    setQuery('');
    router.setParams({ category: '', deity: '' });
  };

  const header = (
    <Column style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md }}>
      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          minHeight: TOUCH + 4,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: p.border,
          backgroundColor: p.surface,
        }}
      >
        <Ionicons name="search" size={20} color={p.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={p.textMuted}
          accessibilityLabel={t('searchPlaceholder')}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
          style={{ flex: 1, fontFamily: fonts.ui.regular, fontSize: 16, color: p.text, paddingVertical: spacing.sm }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel={t('clearSearch')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={p.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }} accessibilityLabel={t('category')}>
        <Chip label={t('all')} selected={!category} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip key={c} label={categoryLabel(c, lang)} icon={iconForCategory(c)} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </ScrollView>

      {/* Deity filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }} accessibilityLabel={t('deity')}>
        <Chip label={`${t('deity')}: ${t('all')}`} selected={!deity} onPress={() => setDeity(null)} />
        {deityIdsWithEntries.map((d) => (
          <Chip key={d} label={deityLabel(d, lang)} selected={deity === d} onPress={() => setDeity(deity === d ? null : d)} />
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: p.border, paddingBottom: spacing.sm }}>
        <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
          {results.length === 1 ? t('oneResult') : t('resultsCount', { n: results.length })}
        </AppText>
        {filtersActive && (
          <Pressable onPress={clearAll} accessibilityRole="button" hitSlop={10}>
            <AppText variant="caption" weight="semibold" tone="accent">
              {t('clearFilters')}
            </AppText>
          </Pressable>
        )}
      </View>
    </Column>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: p.background }}
      data={results}
      keyExtractor={(e) => e.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      renderItem={({ item }) => (
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
          <EntryRow entry={item} />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="search-outline"
          title={t('noResultsTitle')}
          body={t('noResultsBody')}
          action={filtersActive ? <Button label={t('clearFilters')} kind="secondary" onPress={clearAll} /> : undefined}
        />
      }
    />
  );
}
