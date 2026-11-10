/**
 * Pure jap-counter logic (no React Native imports, unit-tested in Node).
 * Targets are personal preferences chosen by the user, not religious rules.
 */

export interface JapCounter {
  count: number;
  target: number;
  updatedAt: number;
}

export const PRESET_TARGETS = [11, 21, 108] as const;
export const DEFAULT_TARGET = 108;
export const MAX_TARGET = 100000;

export const newCounter = (target = DEFAULT_TARGET, now = Date.now()): JapCounter => ({ count: 0, target, updatedAt: now });

/** Increment by one. `reachedTarget` is true when this tap completes a round (count is a multiple of target). */
export function incrementCounter(c: JapCounter, now = Date.now()): { counter: JapCounter; reachedTarget: boolean } {
  const count = c.count + 1;
  return { counter: { ...c, count, updatedAt: now }, reachedTarget: c.target > 0 && count % c.target === 0 };
}

export function decrementCounter(c: JapCounter, now = Date.now()): JapCounter {
  return c.count <= 0 ? c : { ...c, count: c.count - 1, updatedAt: now };
}

export function resetCounter(c: JapCounter, now = Date.now()): JapCounter {
  return { ...c, count: 0, updatedAt: now };
}

export function setCounterTarget(c: JapCounter, target: number, now = Date.now()): JapCounter {
  const t = clampTarget(target);
  return t === null ? c : { ...c, target: t, updatedAt: now };
}

export function clampTarget(n: number): number | null {
  if (!Number.isFinite(n)) return null;
  const t = Math.floor(n);
  if (t < 1 || t > MAX_TARGET) return null;
  return t;
}

/** Parse a custom target typed by the user. Accepts Western and Devanagari digits. */
export function parseCustomTarget(input: string): number | null {
  const western = input.trim().replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
  if (!/^\d+$/.test(western)) return null;
  return clampTarget(Number(western));
}

/** Completed rounds and position within the current round, for display. */
export function roundInfo(c: JapCounter): { rounds: number; inRound: number } {
  if (c.target <= 0) return { rounds: 0, inRound: c.count };
  return { rounds: Math.floor(c.count / c.target), inRound: c.count % c.target };
}
