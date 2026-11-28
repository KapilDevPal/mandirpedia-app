import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type FlatList,
  type GestureResponderEvent,
  type HostInstance,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deitiesById, deityLabel, entryHref, entryTitle, isRecitationCategory, relatedEntries, type Entry } from '@/content';
import { FLOWERS, mandirDeities, pickL, priceOf, THALIS, todayInfo, type MandirDeity, type PujaMode } from '@/content/mandir';
import { useT } from '@/i18n';
import { useAppUpdates } from '@/services/updates';
import { useMandir, useTodaysFlowers, type MandirCounter } from '@/state/mandir';
import { fonts } from '@/theme';
import { BellHotspot, RoundAction, type BellHandle } from './controls';
import { DeityChitra } from './DeityChitra';
import { CoinPop, FlowerRain, ShankhRipple, type Pop } from './effects';
import { tapHaptic } from './haptic';
import { DiyaIcon, ShankhIcon } from './icons';
import { AartiThali, PujaPicker } from './puja';
import { chitraRect, TEMPLE_BG, templeLayout } from './templeLayout';
import { useMandirSounds } from './useMandirSounds';

/** The chalisa, else the aarti, else the first prayer for a deity (shown in the bottom pill). */
function primaryReading(deityId: string): Entry | undefined {
  const profile = deitiesById.get(deityId);
  if (!profile) return undefined;
  const list = relatedEntries(profile).filter((e) => isRecitationCategory(e.category));
  return list.find((e) => e.category === 'chalisa') ?? list.find((e) => e.category === 'aarti') ?? list[0];
}

/**
 * Virtual temple (Home tab): swipe between deities, do aarti, offer flowers,
 * blow the shankh, ring the bells and make each deity's own offering. Every
 * act earns punya, which unlocks more flowers and aarti plates.
 */
export function MandirScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, lang } = useT();
  const focused = useIsFocused();

  // ── persisted state ─────────────────────────────────────────────────────
  const punya = useMandir((s) => s.punya);
  const muted = useMandir((s) => s.muted);
  const flowerKind = useMandir((s) => s.flowerKind);
  const thaliKind = useMandir((s) => s.thaliKind);
  const unlocked = useMandir((s) => s.unlocked);
  const flowers = useTodaysFlowers();

  // ── temple state ────────────────────────────────────────────────────────
  const deities = mandirDeities;
  const [index, setIndex] = useState(0);
  const [aarti, setAarti] = useState(false);
  const [flowerTrigger, setFlowerTrigger] = useState(0);
  const [shankhTrigger, setShankhTrigger] = useState(0);
  const [stage, setStage] = useState({ w: width, h: 0 });
  const [pops, setPops] = useState<Pop[]>([]);
  const [toast, setToast] = useState('');
  const [picker, setPicker] = useState<PujaMode | null>(null);

  const sound = useMandirSounds(muted);
  const deity: MandirDeity | undefined = deities[index];
  const reading = useMemo(() => (deity ? primaryReading(deity.id) : undefined), [deity]);

  const scrollX = useState(() => new Animated.Value(0))[0];
  const pillAnim = useState(() => new Animated.Value(1))[0];
  const coinBump = useState(() => new Animated.Value(1))[0];
  const wash = useState(() => new Animated.Value(0))[0];
  const toastAnim = useState(() => new Animated.Value(0))[0];

  const listRef = useRef<FlatList<MandirDeity>>(null);
  const chipsRef = useRef<ScrollViewInstance>(null);
  const chipX = useRef<Record<number, number>>({});
  const leftBell = useRef<BellHandle>(null);
  const rightBell = useRef<BellHandle>(null);
  const rootRef = useRef<HostInstance>(null);
  const coinRef = useRef<HostInstance>(null);
  const rootOffset = useRef({ x: 0, y: 0 });
  const [coinTarget, setCoinTarget] = useState({ x: width - 56, y: insets.top + 24 });
  const popId = useRef(0);

  // Temple artwork fitted to the stage; the framed chitra stands on its platform.
  const layout = templeLayout(stage.w, stage.h || 1);
  const box = layout.box;
  const chitra = chitraRect(box);
  const idolCx = box.x + chitra.x + chitra.w / 2;
  const idolCy = box.y + chitra.y + chitra.h * 0.45;
  const orbit = Math.min(150, width * 0.36, Math.max(chitra.w * 0.62, 90));

  const stopAarti = useCallback(() => {
    setAarti(false);
    sound.stopAarti();
  }, [sound]);

  // Stop the aarti when leaving the tab (tabs stay mounted).
  useFocusEffect(useCallback(() => () => stopAarti(), [stopAarti]));

  useEffect(() => {
    Animated.timing(wash, { toValue: aarti ? 1 : 0, duration: 700, useNativeDriver: true }).start();
  }, [aarti, wash]);

  // ── helpers ─────────────────────────────────────────────────────────────
  const measureTargets = () => {
    rootRef.current?.measureInWindow((rx, ry) => {
      rootOffset.current = { x: rx, y: ry };
      coinRef.current?.measureInWindow((x, y, w, h) => {
        if (w) setCoinTarget({ x: x - rx + w / 2 - 30, y: y - ry + h / 2 - 16 });
      });
    });
  };

  /** Award punya for an act and fly a "+N" bubble from where it happened. */
  const earn = (n: number, what: MandirCounter, e?: GestureResponderEvent) => {
    const x = e ? e.nativeEvent.pageX - rootOffset.current.x : width / 2;
    const y = e ? e.nativeEvent.pageY - rootOffset.current.y : insets.top + 100 + idolCy;
    setPops((p) => [...p, { id: ++popId.current, x, y, n }]);
    useMandir.getState().earn(n, what);
  };

  const onPopDone = (id: number) => {
    setPops((p) => p.filter((x) => x.id !== id));
    coinBump.setValue(1.35);
    Animated.spring(coinBump, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    toastAnim.stopAnimation();
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const onIndex = (i: number) => {
    if (i === index) return;
    if (aarti) stopAarti();
    setIndex(i);
    pillAnim.setValue(0);
    Animated.spring(pillAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    const cx = chipX.current[i];
    if (cx !== undefined) chipsRef.current?.scrollTo({ x: Math.max(0, cx - 40), animated: true });
  };

  const goTo = (i: number) => {
    listRef.current?.scrollToOffset({ offset: i * stage.w, animated: true });
    onIndex(i);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / stage.w);
    onIndex(Math.max(0, Math.min(deities.length - 1, i)));
  };

  // ── acts of puja ────────────────────────────────────────────────────────
  const ringBell = (side: 'l' | 'r', e: GestureResponderEvent) => {
    tapHaptic();
    (side === 'l' ? leftBell : rightBell).current?.ring();
    sound.bell();
    earn(1, 'bells', e);
  };

  const toggleAarti = () => {
    if (aarti) return stopAarti();
    setAarti(true);
    sound.aarti();
    leftBell.current?.ring();
    setTimeout(() => rightBell.current?.ring(), 180);
  };

  const onAartiDone = () => {
    setAarti(false);
    earn(5, 'aarti');
  };

  const offerFlowers = (e: GestureResponderEvent) => {
    if (!deity) return;
    const id = deity.id;
    setFlowerTrigger((n) => n + 1);
    setTimeout(() => useMandir.getState().offerFlower(id), 1800);
    earn(1, 'flowers', e);
  };

  const blowShankh = (e: GestureResponderEvent) => {
    setShankhTrigger((n) => n + 1);
    sound.shankh();
    earn(2, 'shankh', e);
  };

  const showToday = () => {
    const { weekday, deityId } = todayInfo(lang);
    showToast(t('mandirDayOf', { day: weekday, deity: deityLabel(deityId, lang) }));
  };

  /** Choose a flower or plate; locked ones are bought with punya. Returns true to close the sheet. */
  const selectItem = (mode: PujaMode, id: string): boolean => {
    const store = useMandir.getState();
    const item = (mode === 'flower' ? FLOWERS : THALIS).find((i) => i.id === id);
    if (!item) return false;
    const name = pickL(item.label, lang);
    const price = priceOf(mode, id);
    if (store.owns(mode, id)) {
      if (mode === 'thali' && aarti) stopAarti();
      store.choose(mode, id);
      return true;
    }
    if (store.punya < price) {
      Alert.alert(t('mandirNeedTitle'), t('mandirNeedMsg', { name, n: price - store.punya }));
      return false;
    }
    Alert.alert(t('mandirUnlockTitle', { name }), t('mandirUnlockMsg', { name, n: price }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('mandirUnlockBtn'),
        onPress: () => {
          if (mode === 'thali' && aarti) stopAarti();
          if (!useMandir.getState().unlock(mode, id)) return;
          setPicker(null);
          tapHaptic(true);
          sound.bell();
          showToast(t('mandirUnlocked', { name }));
        },
      },
    ]);
    return false;
  };

  if (!deity) return null;

  return (
    <View ref={rootRef} style={s.root} onLayout={measureTargets}>
      {focused && <StatusBar style="dark" />}

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <LinearGradient colors={['#FBE1A0', '#E9BE5E', '#D8A94A']} style={[s.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.push('/explore')} hitSlop={10} style={s.exploreBtn} accessibilityRole="button" accessibilityLabel={t('exploreTitle')}>
          <MaterialCommunityIcons name="view-grid-outline" size={18} color="#5A2A08" />
          <Text style={s.exploreText}>{t('mandirExplore')}</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Animated.View
            style={[s.namePill, { opacity: pillAnim, transform: [{ translateY: pillAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}
          >
            <Text style={s.nameText} numberOfLines={1} accessibilityRole="header">
              {deityLabel(deity.id, lang)}
            </Text>
          </Animated.View>
        </View>
        <Pressable
          onPress={() => useMandir.getState().toggleMuted()}
          hitSlop={10}
          style={s.circleBtn}
          accessibilityRole="button"
          accessibilityLabel={muted ? t('mandirUnmute') : t('mandirMute')}
        >
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#5A2A08" />
        </Pressable>
        <Animated.View ref={coinRef} style={[s.coinPill, { transform: [{ scale: coinBump }] }]} onLayout={measureTargets} accessible accessibilityLabel={`${punya} ${t('mandirPunya')}`}>
          <MaterialCommunityIcons name="hand-coin" size={15} color="#FFD27A" />
          <Text style={s.coinText}>{punya}</Text>
          <Text style={s.coinLabel}>{t('mandirPunya')}</Text>
        </Animated.View>
      </LinearGradient>

      {/* ── Chips ─────────────────────────────────────────────────── */}
      <View style={s.chipsBar}>
        <ScrollView ref={chipsRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}>
          {deities.map((d, i) => (
            <Pressable
              key={d.id}
              onLayout={(e) => {
                chipX.current[i] = e.nativeEvent.layout.x;
              }}
              onPress={() => {
                tapHaptic();
                goTo(i);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === index }}
              style={[s.chip, i === index && s.chipActive]}
            >
              <Text style={[s.chipText, i === index && { color: '#FFF' }]}>{pickL(d.short, lang)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <UpdateStrip />

      {/* ── Stage ─────────────────────────────────────────────────── */}
      <View style={{ flex: 1, overflow: 'hidden' }} onLayout={(e: LayoutChangeEvent) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {stage.h > 0 && (
          <>
            {/* garbhagriha artwork */}
            <Image source={TEMPLE_BG} style={{ position: 'absolute', ...layout.bg }} resizeMode="stretch" />
            <Animated.FlatList
              ref={listRef}
              data={deities}
              keyExtractor={(d) => d.id}
              horizontal
              pagingEnabled
              extraData={flowers}
              bounces={false}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={2}
              windowSize={3}
              getItemLayout={(_, i) => ({ length: stage.w, offset: stage.w * i, index: i })}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
              scrollEventThrottle={16}
              onMomentumScrollEnd={onMomentumEnd}
              renderItem={({ item, index: i }) => (
                <DeityChitra
                  deity={item}
                  index={i}
                  width={stage.w}
                  height={stage.h}
                  box={box}
                  scrollX={scrollX}
                  aartiOn={aarti && i === index}
                  flowers={flowers[item.id] ?? []}
                />
              )}
            />

            {/* warm aarti wash */}
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: '#FF9A2E', opacity: wash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) }]}
            />

            <FlowerRain trigger={flowerTrigger} kind={flowerKind} width={stage.w} height={stage.h} />
            <ShankhRipple trigger={shankhTrigger} cx={idolCx} cy={idolCy} />
            <AartiThali running={aarti} kind={thaliKind} cx={idolCx} cy={idolCy} radius={orbit} onDone={onAartiDone} />

            {/* bells painted in the artwork */}
            <BellHotspot ref={leftBell} rect={layout.bells[0]} label={t('mandirBell')} onPress={(e) => ringBell('l', e)} />
            <BellHotspot ref={rightBell} rect={layout.bells[1]} label={t('mandirBell')} onPress={(e) => ringBell('r', e)} />

            {/* left: acts of puja */}
            <View style={[s.column, { left: 0, top: stage.h * 0.2 }]} pointerEvents="box-none">
              <RoundAction
                icon={<DiyaIcon size={30} color="#FFFFFF" flameColor="#FFE08A" />}
                label={t('mandirAarti')}
                active={aarti}
                onPress={toggleAarti}
                onChoose={() => setPicker('thali')}
                chooseLabel={t('mandirPickThali')}
              />
              <RoundAction
                icon={<MaterialCommunityIcons name="flower" size={26} color="#FFFFFF" />}
                label={t('mandirFlowers')}
                onPress={offerFlowers}
                onChoose={() => setPicker('flower')}
                chooseLabel={t('mandirPickFlower')}
              />
              <RoundAction icon={<ShankhIcon size={28} />} label={t('mandirShankh')} onPress={blowShankh} />
              <RoundAction icon={<MaterialCommunityIcons name="calendar-month" size={24} color="#FFFFFF" />} label={t('mandirToday')} onPress={showToday} />
            </View>

            {/* right: this deity's offering, jap and prayers */}
            <View style={[s.column, { right: 0, top: stage.h * 0.2 }]} pointerEvents="box-none">
              <RoundAction
                icon={<MaterialCommunityIcons name={deity.offering.icon} size={26} color="#FFFFFF" />}
                label={pickL(deity.offering.label, lang)}
                strongHaptic
                onPress={(e) => earn(3, 'offerings', e)}
              />
              <RoundAction icon={<MaterialCommunityIcons name="hands-pray" size={26} color="#FFFFFF" />} label={t('mandirJap')} onPress={() => router.navigate('/jap')} />
              <RoundAction
                icon={<MaterialCommunityIcons name="book-open-variant" size={24} color="#FFFFFF" />}
                label={t('mandirPrayers')}
                onPress={() => router.push(`/deity/${deity.id}`)}
              />
            </View>

            {/* read pill: this deity's chalisa or aarti */}
            {reading && (
              <View style={s.bottom} pointerEvents="box-none">
                <Pressable
                  onPress={() => {
                    tapHaptic();
                    router.push(entryHref(reading));
                  }}
                  style={({ pressed }) => [s.readPill, pressed && { transform: [{ scale: 0.97 }] }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('mandirRead')}: ${entryTitle(reading, lang)}`}
                >
                  <View style={s.readIcon}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={17} color="#FFF" />
                  </View>
                  <Text style={s.readText} numberOfLines={1}>
                    {entryTitle(reading, lang)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#A8174A" style={{ marginRight: 8 }} />
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>

      {/* ── flower / thali choosers ───────────────────────────────── */}
      <PujaPicker
        visible={picker !== null}
        mode={picker ?? 'flower'}
        value={picker === 'thali' ? thaliKind : flowerKind}
        unlocked={unlocked}
        balance={punya}
        title={picker === 'thali' ? t('mandirPickThali') : t('mandirPickFlower')}
        balanceLabel={t('mandirPunya')}
        lang={lang}
        onSelect={(id) => selectItem(picker ?? 'flower', id)}
        onClose={() => setPicker(null)}
      />

      {/* ── punya pops + toast ────────────────────────────────────── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {pops.map((p) => (
          <CoinPop key={p.id} pop={p} target={coinTarget} label={t('mandirPunya')} onDone={onPopDone} />
        ))}
      </View>
      {!!toast && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            s.toast,
            { top: insets.top + 110, opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] },
          ]}
        >
          <Text style={s.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

/** Compact notice when an over-the-air update has downloaded. Never reloads on its own. */
function UpdateStrip() {
  const { t } = useT();
  const { status, restart, dismissed, dismiss } = useAppUpdates();
  if (status !== 'ready' || dismissed) return null;
  return (
    <View style={s.updateStrip} accessibilityLiveRegion="polite">
      <Ionicons name="cloud-download-outline" size={18} color="#5A2A08" />
      <Text style={s.updateText} numberOfLines={2}>
        {t('updateReady')}
      </Text>
      <Pressable onPress={restart} hitSlop={6} style={s.updateBtn} accessibilityRole="button">
        <Text style={s.updateBtnText}>{t('restartToUpdate')}</Text>
      </Pressable>
      <Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('later')}>
        <Ionicons name="close" size={18} color="#5A2A08" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  updateStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFE9B8', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#C99331' },
  updateText: { flex: 1, color: '#5A1A0A', fontFamily: fonts.ui.semibold, fontSize: 12, lineHeight: 19 },
  updateBtn: { backgroundColor: '#A8174A', borderRadius: 14, paddingHorizontal: 10 },
  updateBtnText: { color: '#FFF', fontFamily: fonts.ui.bold, fontSize: 12, lineHeight: 24 },
  root: { flex: 1, backgroundColor: '#2B1206' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  exploreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)' },
  exploreText: { color: '#5A2A08', fontFamily: fonts.ui.bold, fontSize: 12, lineHeight: 20 },
  namePill: {
    backgroundColor: '#7A1F2B',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F3D27A',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  nameText: { color: '#FFF4D6', fontFamily: fonts.ui.bold, fontSize: 15, lineHeight: 26 },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#5A2A08', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 16, borderWidth: 1, borderColor: '#F5B53D' },
  coinText: { color: '#FFE08A', fontFamily: fonts.ui.bold, fontSize: 14, lineHeight: 22, fontVariant: ['tabular-nums'] },
  coinLabel: { color: '#FFE08A', fontFamily: fonts.ui.semibold, fontSize: 11, lineHeight: 20, opacity: 0.85 },
  chipsBar: { backgroundColor: '#FFF4DC', paddingVertical: 7, borderBottomWidth: 2, borderBottomColor: '#C99331' },
  chip: { paddingHorizontal: 14, paddingVertical: 2, borderRadius: 16, borderWidth: 1, borderColor: '#E3C08A', backgroundColor: '#FFFFFF' },
  chipActive: { backgroundColor: '#A8174A', borderColor: '#A8174A' },
  chipText: { color: '#7A1F2B', fontFamily: fonts.ui.bold, fontSize: 13, lineHeight: 24 },
  column: { position: 'absolute', gap: 10 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center' },
  readPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,248,236,0.96)',
    borderWidth: 1.5,
    borderColor: '#E9C46A',
    borderRadius: 24,
    padding: 4,
    maxWidth: '78%',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  readIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0532A', alignItems: 'center', justifyContent: 'center' },
  readText: { flexShrink: 1, color: '#5A1A0A', fontFamily: fonts.ui.bold, fontSize: 14, lineHeight: 24 },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '86%',
    backgroundColor: 'rgba(43,18,6,0.92)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F5B53D',
  },
  toastText: { color: '#FFE7B0', fontFamily: fonts.ui.bold, fontSize: 15, lineHeight: 26, textAlign: 'center' },
});
