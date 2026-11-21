import { memo, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { yantraArt } from '@/content/yantraArt';
import { fonts } from '@/theme';

const toDevanagariDigits = (s: string) => s.replace(/\d/g, (d) => String.fromCharCode(0x0966 + Number(d)));

export const hasYantraArt = (id: string) => id in yantraArt;

/**
 * Square yantra artwork (src/content/yantraArt.ts). The geometry is SVG; the bija mantra,
 * syllables and numerals are React Native Text laid over it so Devanagari shapes correctly.
 * Give it a width (or let it fill its parent's width); its height follows.
 */
export const YantraArt = memo(function YantraArt({
  id,
  devanagariDigits = false,
  showLabels = true,
  accessibilityLabel,
  style,
}: {
  id: string;
  devanagariDigits?: boolean;
  /** Thumbnails can skip text that would be too small to read. */
  showLabels?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const art = yantraArt[id];
  const [w, setW] = useState(0);
  if (!art) return null;
  const k = w / 200;
  return (
    <View
      style={[{ width: '100%', aspectRatio: 1 }, style]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible={!!accessibilityLabel}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <SvgXml xml={art.svg} width="100%" height="100%" />
      {showLabels &&
        w > 0 &&
        art.labels.map((l, i) => {
          const size = l.size * k;
          const lineHeight = size * 1.5;
          const boxW = size * 4;
          return (
            <View
              key={i}
              pointerEvents="none"
              style={[styles.label, { left: l.x * k - boxW / 2, top: l.y * k - lineHeight / 2, width: boxW, height: lineHeight }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: l.kind === 'numeral' ? fonts.ui.semibold : fonts.recitation.semibold,
                  fontSize: size,
                  lineHeight,
                  color: l.kind === 'numeral' ? '#F2C14E' : '#FFE9A8',
                  textAlign: 'center',
                  includeFontPadding: false,
                }}
              >
                {l.kind === 'numeral' && devanagariDigits ? toDevanagariDigits(l.text) : l.text}
              </Text>
            </View>
          );
        })}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
