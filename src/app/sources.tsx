import { View } from 'react-native';
import { LabelledBlock, SourceLinkRow } from '@/components/content';
import { AppText, Card, Divider, Ionicons, Notice, Row, Screen, SectionTitle } from '@/components/ui';
import { collection, entries, entryTitle, loc, validationIssues } from '@/content';
import { formatDate, useT } from '@/i18n';
import { spacing, usePalette } from '@/theme';

export default function SourcesScreen() {
  const p = usePalette();
  const { t, tOpt, lang } = useT();
  const policy = collection.editorial_policy ?? {};
  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');
  const coverage = collection.localization_coverage;
  const noTranslations = coverage?.full_prayer_translations === 'not_included' || coverage?.english_transliterations === 'not_included';

  return (
    <Screen>
      {/* Content checks run on the bundled data at start-up. */}
      <Card tone={errors.length ? 'alt' : 'surface'}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Ionicons name={errors.length ? 'warning-outline' : 'shield-checkmark-outline'} size={22} color={errors.length ? p.danger : p.success} />
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{t('contentChecks')}</AppText>
            <AppText variant="small" tone="muted">
              {errors.length === 0 && warnings.length === 0
                ? t('contentChecksOk', { n: entries.length })
                : t('contentChecksIssues', { errors: errors.length, warnings: warnings.length })}
            </AppText>
            {validationIssues.slice(0, 20).map((i, n) => (
              <AppText key={n} variant="caption" tone={i.severity === 'error' ? 'danger' : 'muted'}>
                • {i.path}: {i.message}
              </AppText>
            ))}
            {collection.schema_version && (
              <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
                {t('datasetVersion', { schema: collection.schema_version, date: formatDate(collection.updated_on ?? collection.generated_on, lang) })}
              </AppText>
            )}
          </View>
        </Row>
      </Card>

      {loc(coverage?.note, lang) && <Notice style={{ marginTop: spacing.lg }}>{loc(coverage?.note, lang)!}</Notice>}
      {noTranslations && <Notice icon="language-outline" style={{ marginTop: spacing.sm }}>{t('translationsNotIncluded')}</Notice>}

      <SectionTitle>{t('editorialPolicy')}</SectionTitle>
      {lang === 'hi' && (
        <AppText variant="caption" tone="muted" style={{ marginBottom: spacing.sm }}>
          {t('editorialPolicyEnglishOnly')}
        </AppText>
      )}
      <View style={{ gap: spacing.md }}>
        {Object.entries(policy).map(([key, value]) => (
          <LabelledBlock key={key} label={tOpt(`policy_${key}`) ?? key.replace(/_/g, ' ')}>
            <AppText variant="small">{value}</AppText>
          </LabelledBlock>
        ))}
        {collection.scope && (
          <LabelledBlock label={t('policy_scope')}>
            <AppText variant="small">{collection.scope}</AppText>
          </LabelledBlock>
        )}
      </View>

      <SectionTitle>{t('prayerSources')}</SectionTitle>
      <AppText variant="caption" tone="muted">
        {t('needsInternet')}
      </AppText>
      {entries
        .filter((e) => e.source?.url)
        .map((e) => (
          <SourceLinkRow key={e.id} url={e.source!.url!} title={entryTitle(e, lang)} accessedOn={e.source?.accessed_on} />
        ))}

      <Divider />
      <AppText variant="heading" accessibilityRole="header" style={{ marginBottom: spacing.sm }}>
        {t('educationalSources')}
      </AppText>
      {collection.educational_sources.map((s) => (
        <SourceLinkRow key={s.id} url={s.url} accessedOn={s.accessed_on} />
      ))}
    </Screen>
  );
}
