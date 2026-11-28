import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { priceOf, unlockKey, type FlowerKind, type PujaMode, type ThaliKind } from '@/content/mandir';

/** Flowers on the pedestal, per deity, kept for one day. */
export const MAX_FLOWERS = 12;

export type MandirCounter = 'aarti' | 'flowers' | 'shankh' | 'bells' | 'offerings';

/** Lifetime puja counts (on-device only). */
export interface MandirStats {
  aarti: number;
  flowers: number;
  shankh: number;
  bells: number;
  offerings: number;
  /** All punya ever earned (spending does not lower it). */
  totalEarned: number;
  /** Punya earned per local day, YYYY-MM-DD → n (last 60 days kept). */
  earnedByDay: Record<string, number>;
}

const EMPTY_STATS: MandirStats = { aarti: 0, flowers: 0, shankh: 0, bells: 0, offerings: 0, totalEarned: 0, earnedByDay: {} };

/** Local calendar day, YYYY-MM-DD. */
export const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const trimDays = (m: Record<string, number>, days = 60) =>
  Object.fromEntries(
    Object.entries(m)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, days),
  );

interface MandirPersisted {
  punya: number;
  muted: boolean;
  /** Day the flower pile belongs to; a new day starts with an empty pedestal. */
  flowersDay: string;
  flowers: Record<string, FlowerKind[]>;
  flowerKind: FlowerKind;
  thaliKind: ThaliKind;
  /** Bought with punya, e.g. 'flower:gulab'. */
  unlocked: string[];
  stats: MandirStats;
}

interface MandirActions {
  earn: (n: number, what: MandirCounter) => void;
  offerFlower: (deityId: string) => void;
  toggleMuted: () => void;
  /** Choose an item that is free or already unlocked. */
  choose: (mode: PujaMode, id: string) => void;
  /** Spend punya to unlock and choose an item. Returns false if there is not enough punya. */
  unlock: (mode: PujaMode, id: string) => boolean;
  owns: (mode: PujaMode, id: string) => boolean;
}

export const useMandir = create<MandirPersisted & MandirActions>()(
  persist(
    (set, get) => ({
      punya: 0,
      muted: false,
      flowersDay: localDay(),
      flowers: {},
      flowerKind: 'genda',
      thaliKind: 'pooja',
      unlocked: [],
      stats: EMPTY_STATS,

      earn: (n, what) => {
        const today = localDay();
        set((s) => ({
          punya: s.punya + n,
          stats: {
            ...s.stats,
            [what]: s.stats[what] + 1,
            totalEarned: s.stats.totalEarned + n,
            earnedByDay: trimDays({ ...s.stats.earnedByDay, [today]: (s.stats.earnedByDay[today] ?? 0) + n }),
          },
        }));
      },

      offerFlower: (deityId) => {
        const today = localDay();
        set((s) => {
          const pile = s.flowersDay === today ? s.flowers : {};
          return { flowersDay: today, flowers: { ...pile, [deityId]: [...(pile[deityId] ?? []), s.flowerKind].slice(-MAX_FLOWERS) } };
        });
      },

      toggleMuted: () => set((s) => ({ muted: !s.muted })),

      owns: (mode, id) => priceOf(mode, id) === 0 || get().unlocked.includes(unlockKey(mode, id)),

      choose: (mode, id) => {
        if (!get().owns(mode, id)) return;
        set(mode === 'flower' ? { flowerKind: id as FlowerKind } : { thaliKind: id as ThaliKind });
      },

      unlock: (mode, id) => {
        const price = priceOf(mode, id);
        const key = unlockKey(mode, id);
        const s = get();
        if (s.unlocked.includes(key)) {
          s.choose(mode, id);
          return true;
        }
        if (s.punya < price) return false;
        set({
          punya: s.punya - price,
          unlocked: [...s.unlocked, key],
          ...(mode === 'flower' ? { flowerKind: id as FlowerKind } : { thaliKind: id as ThaliKind }),
        });
        return true;
      },
    }),
    {
      name: 'mandirpedia-mandir/v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ punya, muted, flowersDay, flowers, flowerKind, thaliKind, unlocked, stats }) => ({
        punya,
        muted,
        flowersDay,
        flowers,
        flowerKind,
        thaliKind,
        unlocked,
        stats,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MandirPersisted>;
        return { ...current, ...p, stats: { ...EMPTY_STATS, ...(p.stats ?? {}) } };
      },
    },
  ),
);

const NO_FLOWERS: Record<string, FlowerKind[]> = {};

/** Today's flower pile (yesterday's pile is not shown). */
export const useTodaysFlowers = () => useMandir((s) => (s.flowersDay === localDay() ? s.flowers : NO_FLOWERS));
