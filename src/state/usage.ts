/**
 * On-device usage counts for the Home "Most used" section, and the policy for
 * asking for an App Store / Play Store review. Pure logic, unit-tested in Node.
 * Nothing here leaves the device.
 */

/** Keys: `entry:<id>`, `deity:<id>`, `category:<id>`, `feature:jap`, `feature:learn`. */
export type UsageKey = `entry:${string}` | `deity:${string}` | `category:${string}` | `feature:${'jap' | 'learn'}`;

export interface UsageStat {
  count: number;
  lastAt: number;
}

export type Usage = Record<string, UsageStat>;

export function recordUsage(usage: Usage, key: UsageKey, now = Date.now()): Usage {
  const prev = usage[key];
  return { ...usage, [key]: { count: (prev?.count ?? 0) + 1, lastAt: now } };
}

/**
 * Most-used items, highest count first (ties: most recent first).
 * `isValid` drops keys whose content no longer exists in the dataset.
 */
export function topUsage(usage: Usage, limit: number, isValid: (key: string) => boolean = () => true): { key: string; count: number }[] {
  return Object.entries(usage)
    .filter(([k, v]) => v.count > 0 && isValid(k))
    .sort((a, b) => b[1].count - a[1].count || b[1].lastAt - a[1].lastAt)
    .slice(0, limit)
    .map(([key, v]) => ({ key, count: v.count }));
}

export const totalUses = (usage: Usage) => Object.values(usage).reduce((n, v) => n + v.count, 0);

// ---------------------------------------------------------------- review prompt

export interface ReviewState {
  firstUseAt: number | null;
  lastPromptAt: number | null;
  promptCount: number;
}

const DAY = 86_400_000;

export const REVIEW_POLICY = {
  /** Only after the app has been used on at least this many separate occasions. */
  minUses: 10,
  /** Never in the first days after install. */
  minDaysSinceFirstUse: 3,
  /** Leave long gaps between requests (the OS also rate-limits: iOS allows 3 a year). */
  minDaysBetweenPrompts: 120,
  maxPrompts: 3,
};

/**
 * Ask only at a calm, positive moment (after finishing a prayer or completing a jap
 * round), never mid-recitation, and rarely.
 */
export function shouldRequestReview(review: ReviewState, usage: Usage, now = Date.now()): boolean {
  if (review.promptCount >= REVIEW_POLICY.maxPrompts) return false;
  if (review.firstUseAt === null || now - review.firstUseAt < REVIEW_POLICY.minDaysSinceFirstUse * DAY) return false;
  if (review.lastPromptAt !== null && now - review.lastPromptAt < REVIEW_POLICY.minDaysBetweenPrompts * DAY) return false;
  return totalUses(usage) >= REVIEW_POLICY.minUses;
}
