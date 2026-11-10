import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { fonts, MAX_CONTENT_WIDTH, spacing, TOUCH, TRACKING, usePalette, type Palette } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------- Text

type Variant = 'hero' | 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'small' | 'caption' | 'label' | 'overline';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Tone = 'text' | 'muted' | 'accent' | 'danger' | 'success' | 'onAccent';

// Devanagari needs generous line height so matras and conjuncts are never clipped.
const variants: Record<Variant, { fontSize: number; lineHeight: number; weight: Weight; upper?: boolean; tracking?: number }> = {
  hero: { fontSize: 40, lineHeight: 60, weight: 'bold', upper: true, tracking: 1 },
  display: { fontSize: 32, lineHeight: 50, weight: 'bold', upper: true, tracking: 0.8 },
  title: { fontSize: 24, lineHeight: 40, weight: 'bold' },
  heading: { fontSize: 19, lineHeight: 31, weight: 'bold' },
  subheading: { fontSize: 16, lineHeight: 27, weight: 'semibold' },
  body: { fontSize: 16, lineHeight: 27, weight: 'regular' },
  small: { fontSize: 14, lineHeight: 23, weight: 'regular' },
  caption: { fontSize: 13, lineHeight: 21, weight: 'regular' },
  label: { fontSize: 12, lineHeight: 20, weight: 'semibold', upper: true, tracking: TRACKING },
  overline: { fontSize: 12, lineHeight: 20, weight: 'bold', upper: true, tracking: TRACKING * 1.5 },
};

const toneColor = (p: Palette, tone: Tone) =>
  ({ text: p.text, muted: p.textMuted, accent: p.accent, danger: p.danger, success: p.success, onAccent: p.onAccent })[tone];

export interface AppTextProps extends TextProps {
  variant?: Variant;
  weight?: Weight;
  tone?: Tone;
  center?: boolean;
  /** Override the palette, e.g. for text over artwork. */
  palette?: Palette;
  style?: StyleProp<TextStyle>;
}

/** Letter-spacing breaks the Devanagari headline (shirorekha), so tracking applies to Latin text only. */
const DEVANAGARI = /[\u0900-\u097F]/;
const hasDevanagari = (children: ReactNode): boolean =>
  typeof children === 'string' ? DEVANAGARI.test(children) : Array.isArray(children) ? children.some(hasDevanagari) : false;

export function AppText({ variant = 'body', weight, tone = 'text', center, palette, style, ...rest }: AppTextProps) {
  const themed = usePalette();
  const p = palette ?? themed;
  const v = variants[variant];
  const tracking = v.tracking !== undefined && !hasDevanagari(rest.children) ? v.tracking : undefined;
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts.ui[weight ?? v.weight], fontSize: v.fontSize, lineHeight: v.lineHeight, color: toneColor(p, tone) },
        v.upper && { textTransform: 'uppercase' },
        tracking !== undefined && { letterSpacing: tracking },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------- Layout

export function Column({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }, style]}>{children}</View>;
}

export interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  padded?: boolean;
  /** Content placed above the centred column, edge to edge (e.g. a hero image). */
  fullBleedHeader?: ReactNode;
}

/** Scrollable page with a centred, width-limited column for tablets. */
export function Screen({ children, padded = true, fullBleedHeader, contentContainerStyle, ...rest }: ScreenProps) {
  const p = usePalette();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.background }}
      contentContainerStyle={[{ paddingBottom: spacing.xxxl * 2 }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {fullBleedHeader}
      <Column style={padded && { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>{children}</Column>
    </ScrollView>
  );
}

export function Row({ children, gap = spacing.sm, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Spacer({ size = spacing.lg }: { size?: number }) {
  return <View style={{ height: size }} />;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: p.border, marginVertical: spacing.xl }, style]} />;
}

// ---------------------------------------------------------------- Surfaces

export interface CardProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'surface' | 'alt' | 'accent';
}

/** Sharp rectangle with a 1px border. */
export function Card({ children, style, onPress, tone = 'surface', ...rest }: CardProps) {
  const p = usePalette();
  const base: ViewStyle = {
    backgroundColor: tone === 'surface' ? p.surface : p.surfaceAlt,
    borderWidth: 1,
    borderColor: tone === 'accent' ? p.borderStrong : p.border,
    padding: spacing.lg,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      {...rest}
      style={({ pressed }) => [base, pressed && { borderColor: p.borderStrong, backgroundColor: p.surfaceAlt }, style]}
    >
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: spacing.xxl, marginBottom: spacing.lg }}>
      <AppText variant="overline" accessibilityRole="header" style={{ flexShrink: 1 }}>
        {children}
      </AppText>
      {action}
    </Row>
  );
}

/** Small uppercase link with an arrow, used for "See all" style actions. */
export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={({ pressed }) => ({ minHeight: TOUCH, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Row gap={6}>
        <AppText variant="label">{label}</AppText>
        <Ionicons name="arrow-forward" size={14} color={p.text} />
      </Row>
    </Pressable>
  );
}

// ---------------------------------------------------------------- Controls

export function Chip({
  label,
  selected,
  onPress,
  icon,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={4}
      style={({ pressed }) => [
        {
          minHeight: 40,
          paddingHorizontal: spacing.md + 2,
          borderWidth: 1,
          borderColor: selected ? p.borderStrong : p.border,
          backgroundColor: selected ? p.accent : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        pressed && { borderColor: p.borderStrong },
      ]}
    >
      {icon && <Ionicons name={icon} size={15} color={selected ? p.onAccent : p.text} />}
      <AppText variant="small" weight="semibold" tone={selected ? 'onAccent' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  icon,
  kind = 'primary',
  disabled,
  accessibilityHint,
  style,
  palette,
  iconAfter,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** Place the icon after the label (e.g. a trailing arrow). */
  iconAfter?: boolean;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  palette?: Palette;
}) {
  const themed = usePalette();
  const p = palette ?? themed;
  const filled = kind === 'primary';
  const color = filled ? p.onAccent : p.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        {
          minHeight: TOUCH + 4,
          paddingHorizontal: spacing.xl,
          backgroundColor: filled ? p.accent : pressed ? p.surfaceAlt : 'transparent',
          borderWidth: kind === 'ghost' ? 0 : 1,
          borderColor: filled || kind === 'secondary' || kind === 'danger' ? p.borderStrong : p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          opacity: disabled ? 0.35 : pressed && filled ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon && !iconAfter && <Ionicons name={icon} size={18} color={color} />}
      <AppText variant="label" weight="bold" style={{ color, flexShrink: 1 }}>
        {label}
      </AppText>
      {icon && iconAfter && <Ionicons name={icon} size={18} color={color} />}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  active,
  disabled,
  size = 24,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  color?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      hitSlop={6}
      style={({ pressed }) => ({
        width: TOUCH,
        height: TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon} size={size} color={color ?? p.text} />
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Row wrap gap={spacing.sm}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </Row>
  );
}

// ---------------------------------------------------------------- Messages

export function Notice({
  children,
  icon = 'information-circle-outline',
  tone = 'info',
  style,
}: {
  children: ReactNode;
  icon?: IconName;
  tone?: 'info' | 'warning';
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: tone === 'warning' ? p.borderStrong : p.border,
        },
        style,
      ]}
    >
      <Ionicons name={tone === 'warning' ? 'warning-outline' : icon} size={18} color={tone === 'warning' ? p.text : p.textMuted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <AppText variant="small" tone="muted">
            {children}
          </AppText>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.lg, gap: spacing.sm, backgroundColor: p.background }}>
      <Ionicons name={icon} size={36} color={p.textMuted} />
      <AppText variant="subheading" center>
        {title}
      </AppText>
      {body && (
        <AppText variant="small" tone="muted" center>
          {body}
        </AppText>
      )}
      {action && <View style={{ marginTop: spacing.md }}>{action}</View>}
    </View>
  );
}

export { Ionicons };
