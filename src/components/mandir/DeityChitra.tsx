import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { flowerDef, type FlowerKind, type MandirDeity } from '@/content/mandir';
import { deityArtwork } from '@/content/deityImages';
import { MAX_FLOWERS } from '@/state/mandir';
import { FlowerHead } from './effects';
import { chitraRect, STAND_H, type Rect } from './templeLayout';

/** Flower pile arrangement (row by row, bottom up) for up to MAX_FLOWERS flowers. */
const PILE: [number, number][] = [
  [-60, 0], [-36, 0], [36, 0], [60, 0], [-84, 0], [84, 0],
  [-48, -12], [48, -12], [-72, -12], [72, -12],
  [-60, -24], [60, -24],
];

const GOLD = ['#FFE7A3', '#D9A646', '#9A6A1A', '#E9C46A'] as const;
const RIM = 6;

/**
 * One swipe page: a breathing halo and the deity's artwork in an arched gold
 * frame standing on the garbhagriha platform (the temple artwork is drawn behind
 * the list), with parallax and the day's flower pile at its feet.
 */
export function DeityChitra({
  deity,
  index,
  width,
  height,
  box,
  scrollX,
  aartiOn,
  flowers,
}: {
  deity: MandirDeity;
  index: number;
  width: number;
  height: number;
  box: Rect;
  scrollX: Animated.Value;
  aartiOn: boolean;
  flowers: FlowerKind[];
}) {
  const breathe = useState(() => new Animated.Value(0))[0];
  const boost = useState(() => new Animated.Value(0))[0];
  const art = deityArtwork[deity.id];
  const m = chitraRect(box);
  const cx = box.x + m.x + m.w / 2;
  const cy = box.y + m.y + m.h * 0.45;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  useEffect(() => {
    Animated.timing(boost, { toValue: aartiOn ? 1 : 0, duration: 600, useNativeDriver: true }).start();
  }, [aartiOn, boost]);

  const range = [(index - 1) * width, index * width, (index + 1) * width];
  const x = scrollX.interpolate({ inputRange: range, outputRange: [-width * 0.35, 0, width * 0.35], extrapolate: 'clamp' });
  const scale = scrollX.interpolate({ inputRange: range, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
  const opacity = scrollX.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' });

  const halo = Math.max(m.w, m.h) * 1.05;
  const haloOpacity = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.28] }),
    boost.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
  );
  const arch = m.w / 2;
  const innerW = m.w - RIM * 2;

  return (
    <View style={{ width, height }}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width, height, opacity, transform: [{ translateX: x }, { scale }] }}>
        {/* halo */}
        <Animated.View
          style={{
            position: 'absolute',
            left: cx - halo / 2,
            top: cy - halo / 2,
            width: halo,
            height: halo,
            borderRadius: halo / 2,
            backgroundColor: deity.glow,
            opacity: haloOpacity,
            transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
          }}
        />

        <View style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h }}>
          {/* arched gold frame */}
          <View
            style={{
              position: 'absolute',
              left: m.x,
              top: m.y,
              width: m.w,
              height: m.h,
              borderTopLeftRadius: arch,
              borderTopRightRadius: arch,
              borderBottomLeftRadius: 6,
              borderBottomRightRadius: 6,
              shadowColor: '#3A1800',
              shadowOpacity: 0.55,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 10,
            }}
          >
            <LinearGradient
              colors={GOLD}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, padding: RIM, borderTopLeftRadius: arch, borderTopRightRadius: arch, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}
            >
              <View
                style={{
                  flex: 1,
                  borderTopLeftRadius: innerW / 2,
                  borderTopRightRadius: innerW / 2,
                  borderBottomLeftRadius: 3,
                  borderBottomRightRadius: 3,
                  overflow: 'hidden',
                  backgroundColor: '#5A1A0A',
                  borderWidth: 2,
                  borderColor: '#7A1F2B',
                }}
              >
                {art && <Image source={art.source} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />}
                {/* soft glass sheen */}
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.18)']}
                  locations={[0, 0.35, 1]}
                  style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
                />
              </View>
            </LinearGradient>
          </View>

          {/* little gold stand */}
          <LinearGradient
            colors={['#F3D27A', '#B07A22', '#6E4610']}
            style={{ position: 'absolute', left: m.x - m.w * 0.06, top: m.y + m.h - 1, width: m.w * 1.12, height: STAND_H, borderRadius: 3 }}
          />
        </View>

        {/* flower pile at the deity's feet */}
        {flowers.slice(-MAX_FLOWERS).map((kind, i) => {
          const at = PILE[i];
          if (!at) return null;
          return (
            <View key={i} style={{ position: 'absolute', left: width / 2 + at[0] - 12, top: box.y + box.h - 20 + at[1] }}>
              <FlowerHead def={flowerDef(kind)} size={24} />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}
