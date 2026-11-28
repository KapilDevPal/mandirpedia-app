import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useImperativeHandle, useState, type ReactNode, type Ref } from 'react';
import { Animated, Easing, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { fonts } from '@/theme';
import { tapHaptic } from './haptic';
import type { Rect } from './templeLayout';

/** Saffron round temple button: gold rim, gradient face, label chip, press spring and active pulse. */
export function RoundAction({
  icon,
  label,
  onPress,
  active,
  strongHaptic,
  size = 54,
  onChoose,
  chooseLabel,
}: {
  icon: ReactNode;
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  active?: boolean;
  strongHaptic?: boolean;
  size?: number;
  /** Shows a small swap badge; tapping it (or long-pressing the button) opens a chooser. */
  onChoose?: () => void;
  chooseLabel?: string;
}) {
  const press = useState(() => new Animated.Value(1))[0];
  const pulse = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const handlePress = (e: GestureResponderEvent) => {
    tapHaptic(strongHaptic);
    press.setValue(0.86);
    Animated.spring(press, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    onPress(e);
  };

  const choose = onChoose
    ? () => {
        tapHaptic();
        onChoose();
      }
    : undefined;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={choose}
      style={{ alignItems: 'center', width: size + 30 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active !== undefined ? { selected: active } : undefined}
    >
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {active && (
          <Animated.View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 2.5,
              borderColor: '#FFD27A',
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
            }}
          />
        )}
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: press }],
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
          }}
        >
          <LinearGradient colors={['#FFE7A3', '#C99331', '#8E6418']} style={{ flex: 1, borderRadius: size / 2, padding: 2.5 }}>
            <LinearGradient
              colors={active ? ['#FFC266', '#FF7A2E', '#D9461C'] : ['#FFA35C', '#F0662F', '#C8401B']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={{ flex: 1, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ position: 'absolute', top: 3, width: size * 0.55, height: size * 0.22, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.22)' }} />
              {icon}
            </LinearGradient>
          </LinearGradient>
        </Animated.View>
        {choose && (
          <Pressable
            onPress={choose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={chooseLabel ?? label}
            style={{
              position: 'absolute',
              right: -6,
              top: -4,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#FFF6E6',
              borderWidth: 1.5,
              borderColor: '#C99331',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="swap-horizontal" size={12} color="#8E4A12" />
          </Pressable>
        )}
      </View>
      <View
        style={{
          marginTop: 5,
          backgroundColor: 'rgba(36,14,4,0.62)',
          borderRadius: 8,
          paddingHorizontal: 7,
          borderWidth: 0.5,
          borderColor: 'rgba(243,210,122,0.45)',
          maxWidth: size + 30,
        }}
      >
        <Text numberOfLines={1} style={{ fontSize: 11.5, lineHeight: 19, fontFamily: fonts.ui.bold, color: '#FFF1D6', textAlign: 'center' }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export type BellHandle = { ring: () => void };

/**
 * Tap area over a bell painted in the temple artwork. Ringing shows a golden
 * glow and sound-wave arcs coming off the bell.
 */
export function BellHotspot({ ref, rect, label, onPress }: { ref?: Ref<BellHandle>; rect: Rect; label: string; onPress: (e: GestureResponderEvent) => void }) {
  const glow = useState(() => new Animated.Value(0))[0];
  const waves = useState(() => [new Animated.Value(0), new Animated.Value(0)])[0];

  const ring = useCallback(() => {
    glow.stopAnimation();
    glow.setValue(0);
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    waves.forEach((w) => w.setValue(0));
    Animated.stagger(
      260,
      waves.map((w) => Animated.timing(w, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true })),
    ).start();
  }, [glow, waves]);

  useImperativeHandle(ref, () => ({ ring }), [ring]);

  const size = Math.max(rect.w, rect.h);
  const cx = rect.w / 2;
  const cy = rect.h * 0.62; // bell body, below the chain

  return (
    <Pressable
      onPress={onPress}
      hitSlop={14}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: rect.w, height: rect.h }}>
        <Animated.View
          style={{
            position: 'absolute',
            left: cx - size * 0.6,
            top: cy - size * 0.6,
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size,
            backgroundColor: '#FFF1B8',
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }) }],
          }}
        />
        {waves.map((w, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: cx - size / 2,
              top: cy - size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 2.5,
              borderColor: '#FFE7A3',
              opacity: w.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.9, 0] }),
              transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.1] }) }],
            }}
          />
        ))}
      </View>
    </Pressable>
  );
}
