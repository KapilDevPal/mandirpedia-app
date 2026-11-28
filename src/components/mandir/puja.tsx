import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOWERS, flowerDef, pickL, THALIS, thaliDef, unlockKey, type PujaMode, type ThaliKind } from '@/content/mandir';
import type { Lang } from '@/content/types';
import { fonts } from '@/theme';
import { Flame, FlowerHead } from './effects';
import { tapHaptic } from './haptic';

// ---------------------------------------------------------------- Thali art

/** Footprint of each plate at scale 1 (width × height). */
export const THALI_SIZE: Record<ThaliKind, { w: number; h: number }> = {
  pooja: { w: 128, h: 64 },
  brass: { w: 84, h: 77 },
  silver: { w: 150, h: 54 }, // five-diya plate: room above the art for the flames
};

/** Wick positions on assets/mandir/thali_five_diya.png, as fractions of its width. */
const FIVE_WICKS = [0.157, 0.311, 0.496, 0.679, 0.833];
const FIVE_ART_H = 150 * (160 / 720); // art height when 150 wide

/** The three aarti plates, drawn from the bundled artwork. */
export function ThaliArt({ kind, scale = 1 }: { kind: ThaliKind; scale?: number }) {
  const { w, h } = THALI_SIZE[kind];
  const img = thaliDef(kind).image;

  if (kind === 'silver') {
    const top = (h - FIVE_ART_H) * scale;
    return (
      <View style={{ width: w * scale, height: h * scale }}>
        <Image source={img} style={{ position: 'absolute', left: 0, top, width: w * scale, height: FIVE_ART_H * scale }} resizeMode="contain" />
        {FIVE_WICKS.map((fx, i) => (
          <View key={i} style={{ position: 'absolute', left: fx * w * scale - 13, top: top - 22 * scale, transform: [{ scale: 0.62 * scale }] }}>
            <Flame />
          </View>
        ))}
      </View>
    );
  }

  if (kind === 'pooja') {
    return (
      <View style={{ width: w * scale, height: h * scale }}>
        <Image source={img} style={{ width: w * scale, height: h * scale }} resizeMode="contain" />
        <View style={{ position: 'absolute', left: w * scale * 0.66, top: h * scale * 0.42, transform: [{ scale: 0.7 * scale }] }}>
          <Flame />
        </View>
      </View>
    );
  }

  // brass diya: the artwork has its own flame and glow
  return <Image source={img} style={{ width: w * scale, height: h * scale }} resizeMode="contain" />;
}

// ---------------------------------------------------------------- Aarti orbit

export const AARTI_DURATION = 7500; // keep equal to assets/sounds/aarti.wav length
const TURNS = 3;
const SQUASH = 0.62; // ellipse: vertical radius = radius * SQUASH

/** The chosen aarti plate circling the deity (centre cx, cy) three times. */
export function AartiThali({ running, kind, cx, cy, radius, onDone }: { running: boolean; kind: ThaliKind; cx: number; cy: number; radius: number; onDone: () => void }) {
  const p = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!running) {
      p.stopAnimation();
      p.setValue(0);
      return;
    }
    p.setValue(0);
    const anim = Animated.timing(p, { toValue: 1, duration: AARTI_DURATION, easing: Easing.linear, useNativeDriver: true });
    anim.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => anim.stop();
    // onDone is left out on purpose: restarting the orbit on every parent render would be wrong
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, p]);

  if (!running) return null;

  const { w, h } = THALI_SIZE[kind];
  const spin = p.interpolate({ inputRange: [0, 1], outputRange: ['90deg', `${90 + 360 * TURNS}deg`] });
  const counter = p.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', `${-90 - 360 * TURNS}deg`] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        opacity: p.interpolate({ inputRange: [0, 0.04, 0.96, 1], outputRange: [0, 1, 1, 0] }),
        // net effect: pure translation along an ellipse, plate stays upright and unsquashed
        transform: [{ scaleY: SQUASH }, { rotate: spin }, { translateX: radius }, { rotate: counter }, { scaleY: 1 / SQUASH }],
      }}
    >
      <ThaliArt kind={kind} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------- Picker sheet

/**
 * Bottom sheet to choose the flower or the aarti plate. Locked items show their
 * punya price; `onSelect` decides (unlock / not enough punya) and returns true
 * when the sheet should close.
 */
export function PujaPicker({
  visible,
  mode,
  value,
  unlocked,
  balance,
  title,
  balanceLabel,
  lang,
  onSelect,
  onClose,
}: {
  visible: boolean;
  mode: PujaMode;
  value: string;
  unlocked: string[];
  balance: number;
  title: string;
  balanceLabel: string;
  lang: Lang;
  onSelect: (id: string) => boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const items = mode === 'flower' ? FLOWERS : THALIS;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} accessibilityLabel="Close" />
      <View
        style={{
          backgroundColor: '#FFF6E6',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 10,
          paddingBottom: insets.bottom + 18,
          paddingHorizontal: 16,
          borderTopWidth: 2,
          borderColor: '#E9C46A',
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9C39A', marginBottom: 10 }} />
        <Text style={{ fontSize: 18, fontFamily: fonts.ui.bold, color: '#5A1A0A', textAlign: 'center' }}>{title}</Text>
        <View
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginTop: 4,
            marginBottom: 14,
            backgroundColor: '#5A2A08',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 2,
          }}
        >
          <MaterialCommunityIcons name="hand-coin" size={14} color="#FFD27A" />
          <Text style={{ color: '#FFE08A', fontFamily: fonts.ui.bold, fontSize: 13 }}>
            {balanceLabel}: {balance}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {items.map((item) => {
            const selected = item.id === value;
            const locked = item.price > 0 && !unlocked.includes(unlockKey(mode, item.id));
            const affordable = balance >= item.price;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  tapHaptic();
                  if (onSelect(item.id)) onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${pickL(item.label, lang)}${locked ? `, ${item.price} ${balanceLabel}` : ''}`}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: selected ? '#FFE3B3' : '#FFFFFF',
                  borderWidth: 2,
                  borderColor: selected ? '#F0662F' : '#EBD9B4',
                }}
              >
                <View style={{ height: 64, alignItems: 'center', justifyContent: 'center', opacity: locked ? 0.55 : 1 }}>
                  {mode === 'flower' ? (
                    <FlowerHead def={flowerDef(item.id as Parameters<typeof flowerDef>[0])} size={50} />
                  ) : (
                    <ThaliArt kind={item.id as ThaliKind} scale={item.id === 'brass' ? 0.78 : 0.66} />
                  )}
                </View>
                <Text style={{ marginTop: 6, fontSize: 13, fontFamily: fonts.ui.bold, color: '#5A1A0A' }} numberOfLines={1}>
                  {pickL(item.label, lang)}
                </Text>
                {locked ? (
                  <View
                    style={{
                      marginTop: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: affordable ? '#F0662F' : '#C9B99A',
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 1,
                    }}
                  >
                    <Ionicons name="lock-closed" size={11} color="#FFF" />
                    <Text style={{ color: '#FFF', fontFamily: fonts.ui.bold, fontSize: 12 }}>{item.price}</Text>
                    <MaterialCommunityIcons name="hand-coin" size={12} color="#FFF" />
                  </View>
                ) : (
                  <View style={{ height: 24 }} />
                )}
                {selected && (
                  <View style={{ position: 'absolute', top: 6, right: 6 }}>
                    <Ionicons name="checkmark-circle" size={20} color="#F0662F" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
