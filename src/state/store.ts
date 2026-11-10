import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Lang } from '@/content/types';
import { normaliseTheme } from './themeSetting';
import {
  decrementCounter,
  incrementCounter,
  newCounter,
  resetCounter,
  setCounterTarget,
  type JapCounter,
} from './jap';
import { recordUsage, type ReviewState, type Usage, type UsageKey } from './usage';

export type { ThemeSetting } from './themeSetting';
import type { ThemeSetting } from './themeSetting';

export interface Settings {
  language: Lang;
  theme: ThemeSetting;
  /** Reader font size for the original text, in points. */
  readerFontSize: number;
  haptics: boolean;
  keepAwake: boolean;
  /** 1 (slowest) to 5 (fastest). */
  autoScrollSpeed: number;
}

export interface ReadingProgress {
  /** Index into the rendered `lines` array (0 when the text is shown as one block). */
  line: number;
  /** 0..1 scroll position, used for "x% read" and as a fallback when lines are unavailable. */
  fraction: number;
  updatedAt: number;
}

export interface Bookmark {
  line: number;
  fraction: number;
  createdAt: number;
}

interface PersistedState {
  settings: Settings;
  favourites: string[];
  progress: Record<string, ReadingProgress>;
  bookmarks: Record<string, Bookmark>;
  jap: { selectedMantraId: string | null; counters: Record<string, JapCounter> };
  /** On-device counts for the Home "Most used" section. */
  usage: Usage;
  review: ReviewState;
}

interface Actions {
  updateSettings: (patch: Partial<Settings>) => void;
  toggleFavourite: (id: string) => void;
  saveProgress: (id: string, p: Omit<ReadingProgress, 'updatedAt'>) => void;
  setBookmark: (id: string, b: Omit<Bookmark, 'createdAt'> | null) => void;
  selectMantra: (id: string) => void;
  japIncrement: (id: string) => boolean;
  japDecrement: (id: string) => void;
  japReset: (id: string) => void;
  japSetTarget: (id: string, target: number) => void;
  clearReadingHistory: () => void;
  clearJap: () => void;
  clearFavourites: () => void;
  recordUse: (key: UsageKey) => void;
  markReviewRequested: () => void;
}

export type AppState = PersistedState & Actions;

const MIN_FONT = 16;
const MAX_FONT = 40;
export const FONT_LIMITS = { min: MIN_FONT, max: MAX_FONT, step: 2 };

const deviceLanguage = (): Lang => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('hi') ? 'hi' : 'en';
  } catch {
    return 'en';
  }
};

export const defaultSettings: Settings = {
  language: deviceLanguage(),
  theme: 'light',
  readerFontSize: 22,
  haptics: true,
  keepAwake: true,
  autoScrollSpeed: 2,
};

const initial: PersistedState = {
  settings: defaultSettings,
  favourites: [],
  progress: {},
  bookmarks: {},
  jap: { selectedMantraId: null, counters: {} },
  usage: {},
  review: { firstUseAt: null, lastPromptAt: null, promptCount: 0 },
};

const counterFor = (s: PersistedState, id: string) => s.jap.counters[id] ?? newCounter();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,

      updateSettings: (patch) => {
        const next = { ...get().settings, ...patch };
        next.readerFontSize = Math.min(MAX_FONT, Math.max(MIN_FONT, Math.round(next.readerFontSize)));
        next.autoScrollSpeed = Math.min(5, Math.max(1, Math.round(next.autoScrollSpeed)));
        set({ settings: next });
      },

      toggleFavourite: (id) =>
        set((s) => ({
          favourites: s.favourites.includes(id) ? s.favourites.filter((f) => f !== id) : [id, ...s.favourites],
        })),

      saveProgress: (id, p) => set((s) => ({ progress: { ...s.progress, [id]: { ...p, updatedAt: Date.now() } } })),

      setBookmark: (id, b) =>
        set((s) => {
          const bookmarks = { ...s.bookmarks };
          if (b) bookmarks[id] = { ...b, createdAt: Date.now() };
          else delete bookmarks[id];
          return { bookmarks };
        }),

      selectMantra: (id) => set((s) => ({ jap: { ...s.jap, selectedMantraId: id } })),

      japIncrement: (id) => {
        const { counter, reachedTarget } = incrementCounter(counterFor(get(), id));
        set((s) => ({ jap: { ...s.jap, counters: { ...s.jap.counters, [id]: counter } } }));
        return reachedTarget;
      },
      japDecrement: (id) =>
        set((s) => ({ jap: { ...s.jap, counters: { ...s.jap.counters, [id]: decrementCounter(counterFor(s, id)) } } })),
      japReset: (id) =>
        set((s) => ({ jap: { ...s.jap, counters: { ...s.jap.counters, [id]: resetCounter(counterFor(s, id)) } } })),
      japSetTarget: (id, target) =>
        set((s) => ({ jap: { ...s.jap, counters: { ...s.jap.counters, [id]: setCounterTarget(counterFor(s, id), target) } } })),

      clearReadingHistory: () => set({ progress: {}, bookmarks: {}, usage: {} }),
      clearJap: () => set((s) => ({ jap: { ...s.jap, counters: {} } })),
      clearFavourites: () => set({ favourites: [] }),

      recordUse: (key) =>
        set((s) => ({
          usage: recordUsage(s.usage, key),
          review: s.review.firstUseAt === null ? { ...s.review, firstUseAt: Date.now() } : s.review,
        })),
      markReviewRequested: () =>
        set((s) => ({ review: { ...s.review, lastPromptAt: Date.now(), promptCount: s.review.promptCount + 1 } })),
    }),
    {
      name: 'bhakti-sangrah/v1',
      version: 2,
      // v1 had a warm-paper theme; it maps to light. Only light/dark/system remain.
      // Favourites, progress, bookmarks and jap counts carry over unchanged.
      migrate: (persisted) => persisted as PersistedState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedState => ({
        settings: s.settings,
        favourites: s.favourites,
        progress: s.progress,
        bookmarks: s.bookmarks,
        jap: s.jap,
        usage: s.usage,
        review: s.review,
      }),
      // Deep-merge so settings added in later versions get their defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...current,
          ...p,
          settings: (() => {
            const merged = { ...current.settings, ...(p.settings ?? {}) };
            return { ...merged, theme: normaliseTheme(merged.theme) };
          })(),
          jap: { ...current.jap, ...(p.jap ?? {}), counters: { ...(p.jap?.counters ?? {}) } },
          usage: { ...(p.usage ?? {}) },
          review: { ...current.review, ...(p.review ?? {}) },
        };
      },
    },
  ),
);

/** True once persisted state has been read from storage. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

export const useSettings = () => useStore((s) => s.settings);
export const useLang = () => useStore((s) => s.settings.language);
