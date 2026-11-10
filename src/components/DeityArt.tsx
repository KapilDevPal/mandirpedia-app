import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { deityArtwork } from '@/content/deityImages';
import { emblems } from '@/content/emblems';
import { Emblem } from './Emblem';
import { deitiesById, deityLabel, loc } from '@/content';
import { useT } from '@/i18n';
import { artworkPalette as A, fonts, spacing } from '@/theme';
import { AppText, Ionicons } from './ui';

/** Extra height given to the image so `focusY` can shift the crop vertically. */
const OVERSCAN = 0.25;

/**
 * Full-bleed grayscale deity artwork with a dark scrim. When no licensed photograph is
 * bundled (or it fails to load), shows the deity's original black-and-white emblem
 * (src/content/emblems.ts), or the name in Devanagari for deities without one.
 */
export function DeityArt({
  deityId,
  style,
  children,
  scrim = 'bottom',
  placeholderScale = 1,
  placeholderPosition = 'center',
}: {
  deityId: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** 'bottom': gradient for a caption; 'full': even darkening plus bottom gradient (hero). */
  scrim?: 'bottom' | 'full';
  placeholderScale?: number;
  /** 'upper' keeps the placeholder name clear of overlaid headings at the bottom. */
  placeholderPosition?: 'center' | 'upper';
}) {
  const art = deityArtwork[deityId];
  const [failed, setFailed] = useState(false);
  const showImage = !!art && !failed;
  const hiName = loc(deitiesById.get(deityId)?.name, 'hi') ?? deityLabel(deityId, 'hi');
  const focusY = Math.min(1, Math.max(0, art?.focusY ?? 0.35));

  return (
    <View style={[{ backgroundColor: '#000000', overflow: 'hidden' }, style]}>
      {showImage ? (
        <Image
          source={art.source}
          onError={() => setFailed(true)}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${-OVERSCAN * 100 * focusY}%`,
            height: `${100 + OVERSCAN * 100}%`,
            // Artwork should already be grayscale; the filter is a safety net where supported.
            filter: 'grayscale(1)',
          }}
        />
      ) : (
        <Placeholder deityId={deityId} name={hiName} scale={placeholderScale} position={placeholderPosition} />
      )}
      {scrim === 'full' && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0.35, 0.68, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

function Placeholder({ deityId, name, scale, position }: { deityId: string; name: string; scale: number; position: 'center' | 'upper' }) {
  const upper = position === 'upper';
  const shapes = emblems[deityId];
  return (
    <View
      // Artwork sits in the upper part so captions and headings at the bottom never overlap it.
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-start', paddingTop: upper ? '14%' : '12%' }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Thin inner frame on cards, echoing a mounted print. */}
      {!upper && <View style={[StyleSheet.absoluteFill, { margin: 10 * scale, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)' }]} />}
      {shapes ? (
        <View style={{ width: upper ? '46%' : '62%', maxWidth: 280, aspectRatio: 1 }}>
          <Emblem shapes={shapes} fg="#FFFFFF" bg="#000000" opacity={upper ? 0.75 : 0.9} />
        </View>
      ) : (
        // Deities added to the dataset without an emblem: their name in large Devanagari.
        <AppText
          palette={A}
          numberOfLines={2}
          adjustsFontSizeToFit
          style={{ fontFamily: fonts.recitation.semibold, fontSize: 34 * scale, lineHeight: 58 * scale, color: 'rgba(255,255,255,0.20)', textAlign: 'center', paddingHorizontal: spacing.lg }}
        >
          {name}
        </AppText>
      )}
    </View>
  );
}

/** Grid card: image or placeholder, name in the interface language, small arrow. */
export function DeityCard({ deityId, width, compact }: { deityId: string; width: DimensionValue; compact?: boolean }) {
  const { lang, t } = useT();
  const name = deityLabel(deityId, lang);
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={() => router.push(`/deity/${deityId}`)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={t('openDeityPage')}
      style={{ width }}
    >
      <DeityArt
        deityId={deityId}
        placeholderScale={compact ? 0.75 : 0.9}
        style={{ width: '100%', aspectRatio: 3 / 4, borderWidth: 1, borderColor: pressed ? '#FFFFFF' : '#333333' }}
      >
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
          <AppText palette={A} variant="subheading" weight="bold" numberOfLines={3} style={{ flex: 1, color: '#FFFFFF' }}>
            {name}
          </AppText>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginBottom: 4 }} />
        </View>
      </DeityArt>
    </Pressable>
  );
}

export function artworkCredit(deityId: string): string | undefined {
  const art = deityArtwork[deityId];
  return art ? `${art.credit}. ${art.licence}` : undefined;
}

/**
 * Responsive grid of deity cards: two columns on phones, three from 600pt wide.
 * Card widths are percentages, so layout never depends on a measured width and
 * stays correct through rotation, split view and font-scale changes.
 */
export function DeityGrid({ ids }: { ids: readonly string[] }) {
  const { width } = useWindowDimensions();
  const cols = width >= 600 ? 3 : 2;
  const cardWidth: DimensionValue = cols === 3 ? '32%' : '48.5%';
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md }}>
      {ids.map((id) => (
        <DeityCard key={id} deityId={id} width={cardWidth} compact={width < 360} />
      ))}
      {/* Keep a lone last card left-aligned in three-column layouts. */}
      {cols === 3 && ids.length % 3 === 2 && <View style={{ width: cardWidth }} />}
    </View>
  );
}
