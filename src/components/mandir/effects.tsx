import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { flowerDef, type FlowerDef, type FlowerKind } from '@/content/mandir';
import { fonts } from '@/theme';

// ---------------------------------------------------------------- Flame

/** Small diya with a flickering flame. */
export function Flame({ size = 1 }: { size?: number }) {
  const v = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.35, duration: 180, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 130, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  return (
    <View style={{ alignItems: 'center', transform: [{ scale: size }] }}>
      <Animated.View
        style={{
          width: 12,
          height: 20,
          borderRadius: 6,
          borderTopLeftRadius: 1,
          backgroundColor: '#FFB020',
          transform: [{ rotate: '45deg' }, { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
          marginBottom: -4,
          shadowColor: '#FFA000',
          shadowOpacity: 0.9,
          shadowRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 5, height: 9, borderRadius: 3, backgroundColor: '#FFF3B0' }} />
      </Animated.View>
      <View style={{ width: 26, height: 10, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, backgroundColor: '#B5651D' }} />
    </View>
  );
}

// ---------------------------------------------------------------- Flowers

/** A single drawn petal (teardrop) in the flower's colours. */
export function Petal({ def, size = 16, colorIndex = 0 }: { def: FlowerDef; size?: number; colorIndex?: number }) {
  return (
    <View
      style={{
        width: size * 0.7,
        height: size,
        borderTopLeftRadius: size * 0.35,
        borderTopRightRadius: size * 0.35,
        borderBottomLeftRadius: size * 0.5,
        borderBottomRightRadius: size * 0.05,
        backgroundColor: def.petals[colorIndex % def.petals.length],
        borderWidth: 1,
        borderColor: def.edge,
      }}
    />
  );
}

/** A whole flower head: rings of petals around a centre. */
export function FlowerHead({ def, size = 26 }: { def: FlowerDef; size?: number }) {
  const rings = def.id === 'gulab' ? [8, 5] : def.id === 'mogra' ? [6] : [10, 8];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((n, r) => {
        const radius = size * (r === 0 ? 0.3 : 0.17);
        const pw = size * (r === 0 ? 0.3 : 0.26);
        const ph = size * (r === 0 ? 0.42 : 0.3);
        return Array.from({ length: n }, (_, i) => (
          <View
            key={`${r}_${i}`}
            style={{
              position: 'absolute',
              width: pw,
              height: ph,
              borderRadius: pw / 2,
              backgroundColor: def.petals[(i + r) % def.petals.length],
              borderWidth: 0.75,
              borderColor: def.edge,
              transform: [{ rotate: `${(360 / n) * i + r * 18}deg` }, { translateY: -radius }],
            }}
          />
        ));
      })}
      <View style={{ width: size * 0.26, height: size * 0.26, borderRadius: size, backgroundColor: def.center }} />
    </View>
  );
}

const PETALS = 24;

type Piece = { x: number; size: number; whole: boolean; fall: number; delay: number; spin: number; drift: number; v: Animated.Value };

function Burst({ kind, width, height, onEnd }: { kind: FlowerKind; width: number; height: number; onEnd: () => void }) {
  const def = flowerDef(kind);
  const pieces = useState<Piece[]>(() =>
    Array.from({ length: PETALS }, (_, i) => ({
      x: width * 0.12 + Math.random() * width * 0.76,
      size: 14 + Math.random() * 10,
      whole: i % 4 === 0,
      fall: 2200 + Math.random() * 900,
      delay: i * 65,
      spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
      drift: (Math.random() - 0.5) * 70,
      v: new Animated.Value(0),
    })),
  )[0];

  useEffect(() => {
    const anim = Animated.parallel(
      pieces.map((p) => Animated.timing(p.v, { toValue: 1, duration: p.fall, delay: p.delay, easing: Easing.in(Easing.quad), useNativeDriver: true })),
    );
    anim.start(() => onEnd());
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -40,
            opacity: p.v.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.75] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.drift, p.drift * 0.4] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        >
          {p.whole ? <FlowerHead def={def} size={p.size + 10} /> : <Petal def={def} size={p.size} colorIndex={i} />}
        </Animated.View>
      ))}
    </>
  );
}

/** Flowers falling over the deity. Each new `trigger` value starts a shower of `kind`. */
export function FlowerRain({ trigger, kind, width, height }: { trigger: number; kind: FlowerKind; width: number; height: number }) {
  const [bursts, setBursts] = useState<{ id: number; kind: FlowerKind }[]>([]);
  const [seen, setSeen] = useState(trigger);

  // A new trigger starts a shower (state adjusted during render, not in an effect).
  if (trigger !== seen) {
    setSeen(trigger);
    if (trigger > 0) setBursts((b) => [...b, { id: trigger, kind }]);
  }

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden' }}>
      {bursts.map((b) => (
        <Burst key={b.id} kind={b.kind} width={width} height={height} onEnd={() => setBursts((x) => x.filter((y) => y.id !== b.id))} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Shankh

const RINGS = 3;
const RING_SIZE = 120;

/** Sound-wave rings spreading out from the deity. Increment `trigger` to play. */
export function ShankhRipple({ trigger, cx, cy }: { trigger: number; cx: number; cy: number }) {
  const rings = useState(() => Array.from({ length: RINGS }, () => new Animated.Value(0)))[0];

  useEffect(() => {
    if (trigger === 0) return;
    rings.forEach((r) => r.setValue(0));
    const anim = Animated.stagger(
      380,
      rings.map((r) => Animated.timing(r, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true })),
    );
    anim.start();
    return () => anim.stop();
  }, [trigger, rings]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: cx - RING_SIZE / 2, top: cy - RING_SIZE / 2, width: RING_SIZE, height: RING_SIZE }}>
      {rings.map((r, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: 3,
            borderColor: '#FFE7B0',
            opacity: r.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.75, 0] }),
            transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.6] }) }],
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Punya pop

export type Pop = { id: number; x: number; y: number; n: number };

/** "+N punya" bubble that flies from the tap point to the counter. */
export function CoinPop({ pop, target, label, onDone }: { pop: Pop; target: { x: number; y: number }; label: string; onDone: (id: number) => void }) {
  const v = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true });
    anim.start(() => onDone(pop.id));
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dx = target.x - pop.x;
  const dy = target.y - pop.y;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: pop.x - 30,
        top: pop.y - 16,
        backgroundColor: 'rgba(43,18,6,0.85)',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#F5B53D',
        opacity: v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          // rise a little first, then arc to the counter
          { translateX: v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0, dx] }) },
          { translateY: v.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, -36, dy] }) },
          { scale: v.interpolate({ inputRange: [0, 0.15, 0.25, 1], outputRange: [0.6, 1.15, 1, 0.55] }) },
        ],
      }}
    >
      <Text style={{ color: '#FFE08A', fontFamily: fonts.ui.bold, fontSize: 15 }}>
        +{pop.n} {label}
      </Text>
    </Animated.View>
  );
}
