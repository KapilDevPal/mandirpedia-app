import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { deityArtwork } from './deityImages';
import type { Lang } from './types';

/**
 * Virtual Mandir (Home tab): which deities stand in the temple, their offerings,
 * and the flowers and aarti plates a devotee can choose.
 *
 * Every deity needs bundled artwork (src/content/deityImages.ts); deities
 * without artwork are left out of the temple automatically.
 */

export type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type L = { hi: string; en: string };
export const pickL = (l: L, lang: Lang) => l[lang] || l.en;

export interface MandirDeity {
  /** Deity id from devotional_collection.json. */
  id: string;
  /** Chip label. The pill title uses the full name from the collection. */
  short: L;
  /** Halo colour behind the chitra. */
  glow: string;
  /** Right-side offering button (a traditional offering to this deity). */
  offering: { label: L; icon: MCIName };
}

const ALL: MandirDeity[] = [
  { id: 'shiva', short: { hi: 'शिव जी', en: 'Shiva' }, glow: '#CFE8FF', offering: { label: { hi: 'बेलपत्र', en: 'Bel Patra' }, icon: 'leaf' } },
  { id: 'hanuman', short: { hi: 'हनुमान जी', en: 'Hanuman' }, glow: '#FFC48A', offering: { label: { hi: 'सिंदूर', en: 'Sindoor' }, icon: 'bottle-tonic' } },
  { id: 'ganesha', short: { hi: 'गणेश जी', en: 'Ganesha' }, glow: '#FFD27A', offering: { label: { hi: 'मोदक', en: 'Modak' }, icon: 'candy' } },
  { id: 'durga', short: { hi: 'माँ दुर्गा', en: 'Durga' }, glow: '#FFB0A0', offering: { label: { hi: 'चुनरी', en: 'Chunari' }, icon: 'hanger' } },
  { id: 'lakshmi', short: { hi: 'माँ लक्ष्मी', en: 'Lakshmi' }, glow: '#FFC8D8', offering: { label: { hi: 'कमल', en: 'Lotus' }, icon: 'flower-tulip' } },
  { id: 'krishna', short: { hi: 'श्रीकृष्ण', en: 'Krishna' }, glow: '#BFD8FF', offering: { label: { hi: 'माखन मिश्री', en: 'Makhan' }, icon: 'bowl' } },
  { id: 'rama', short: { hi: 'श्रीराम', en: 'Rama' }, glow: '#FFD9A0', offering: { label: { hi: 'भोग', en: 'Bhog' }, icon: 'pot-steam' } },
  { id: 'vishnu', short: { hi: 'विष्णु जी', en: 'Vishnu' }, glow: '#C8E0FF', offering: { label: { hi: 'तुलसी दल', en: 'Tulsi' }, icon: 'leaf' } },
  { id: 'saraswati', short: { hi: 'माँ सरस्वती', en: 'Saraswati' }, glow: '#FFF3B0', offering: { label: { hi: 'पीले पुष्प', en: 'Yellow Flowers' }, icon: 'flower-pollen' } },
  { id: 'kali', short: { hi: 'माँ काली', en: 'Kali' }, glow: '#FF9C8A', offering: { label: { hi: 'गुड़हल', en: 'Hibiscus' }, icon: 'flower-poppy' } },
  { id: 'surya', short: { hi: 'सूर्य देव', en: 'Surya' }, glow: '#FFE08A', offering: { label: { hi: 'अर्घ्य', en: 'Arghya' }, icon: 'water' } },
  { id: 'narasimha', short: { hi: 'नृसिंह', en: 'Narasimha' }, glow: '#FFC48A', offering: { label: { hi: 'पानक', en: 'Panakam' }, icon: 'cup' } },
  { id: 'bhairava', short: { hi: 'भैरव जी', en: 'Bhairava' }, glow: '#FFB070', offering: { label: { hi: 'सरसों तेल', en: 'Mustard Oil' }, icon: 'oil' } },
  { id: 'tulsi', short: { hi: 'तुलसी माता', en: 'Tulsi Mata' }, glow: '#D8F5C0', offering: { label: { hi: 'जल', en: 'Water' }, icon: 'watering-can' } },
  { id: 'shitala', short: { hi: 'शीतला माता', en: 'Shitala Mata' }, glow: '#D0F0FF', offering: { label: { hi: 'शीतल भोग', en: 'Cool Bhog' }, icon: 'bowl-mix' } },
];

/** Swipe pages of the temple, in this order. */
export const mandirDeities: readonly MandirDeity[] = ALL.filter((d) => !!deityArtwork[d.id]);

// ---------------------------------------------------------------- Weekdays

const WEEKDAYS: Record<Lang, string[]> = {
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/** The deity each weekday is traditionally dedicated to (Sunday first). */
const WEEKDAY_DEITY = ['surya', 'shiva', 'hanuman', 'ganesha', 'vishnu', 'lakshmi', 'shani'] as const;

export function todayInfo(lang: Lang, date = new Date()) {
  const day = date.getDay();
  return { weekday: WEEKDAYS[lang][day] ?? '', deityId: WEEKDAY_DEITY[day] ?? 'surya' };
}

// ---------------------------------------------------------------- Puja items

export type FlowerKind = 'genda' | 'gulab' | 'mogra';
export type ThaliKind = 'pooja' | 'brass' | 'silver';
export type PujaMode = 'flower' | 'thali';

/** Punya needed to unlock. The first flower and the first plate are free. */
export const PRICE_2 = 51;
export const PRICE_3 = 108;

export interface FlowerDef {
  id: FlowerKind;
  label: L;
  price: number;
  /** Petal colours, picked per petal. */
  petals: string[];
  /** Darker edge of each petal. */
  edge: string;
  center: string;
}

export const FLOWERS: FlowerDef[] = [
  {
    id: 'genda',
    label: { hi: 'गेंदा', en: 'Marigold' },
    price: 0,
    petals: ['#FF8F00', '#FFB300', '#FF7A00', '#FFC107'],
    edge: '#E65100',
    center: '#BF360C',
  },
  {
    id: 'gulab',
    label: { hi: 'गुलाब', en: 'Rose' },
    price: PRICE_2,
    petals: ['#D81B60', '#E53935', '#C2185B', '#EC407A'],
    edge: '#880E4F',
    center: '#6A0F2E',
  },
  {
    id: 'mogra',
    label: { hi: 'मोगरा', en: 'Jasmine' },
    price: PRICE_3,
    petals: ['#FFFFFF', '#FFF8E7', '#FFFDF5', '#FFF3D6'],
    edge: '#E8D9B0',
    center: '#F9A825',
  },
];

export interface ThaliDef {
  id: ThaliKind;
  label: L;
  image: ImageSourcePropType;
  price: number;
}

export const THALIS: ThaliDef[] = [
  { id: 'pooja', label: { hi: 'पूजा थाली', en: 'Puja Thali' }, image: require('../../assets/mandir/thali_puja.png'), price: 0 },
  { id: 'brass', label: { hi: 'पीतल दीया', en: 'Brass Diya' }, image: require('../../assets/mandir/thali_brass_diya.png'), price: PRICE_2 },
  { id: 'silver', label: { hi: 'पंच दीप थाली', en: 'Five-Diya Plate' }, image: require('../../assets/mandir/thali_five_diya.png'), price: PRICE_3 },
];

export const flowerDef = (k: FlowerKind): FlowerDef => FLOWERS.find((f) => f.id === k) ?? FLOWERS[0]!;
export const thaliDef = (k: ThaliKind): ThaliDef => THALIS.find((t) => t.id === k) ?? THALIS[0]!;

/** Unlock keys, e.g. 'flower:gulab'. Free items are always unlocked. */
export const unlockKey = (mode: PujaMode, id: string) => `${mode}:${id}`;
export const priceOf = (mode: PujaMode, id: string) => (mode === 'flower' ? FLOWERS : THALIS).find((i) => i.id === id)?.price ?? 0;
