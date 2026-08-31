import { getCookie, setCookie } from "utils/cookies/cookie-manager";

export const DEFAULT_LUCK_SECONDS = 50;
/** Canonical redeemed-products cookie (intentionally matches the existing
 *  misspelled key that every writer + server reader already uses). */
export const REDEEMED_IDS_COOKIE = "redemed_ids";
export const LUCK_TIMERS_STORAGE_KEY = "luck_timers";

const MAX_REDEEMED = () =>
  parseInt(process.env.NEXT_PUBLIC_MAX_ARRAY_LENGTH ?? "") || 5;

export interface LuckTimer {
  /** epoch ms; set while the countdown is running */
  deadlineTs: number | null;
  /** seconds remaining; set while paused */
  pausedRemaining: number | null;
  expired: boolean;
}

export interface RedeemedEntry {
  id: string | number;
  showingDate: string;
}

// ---- redeemed record (cookie; also read server-side to gate is_luck) ----

export function getRedeemedIds(): RedeemedEntry[] {
  return getCookie<RedeemedEntry[]>(REDEEMED_IDS_COOKIE) ?? [];
}

export function isRedeemed(id: string | number): boolean {
  return getRedeemedIds().some((e) => String(e.id) === String(id));
}

export function addRedeemedId(id: string | number): void {
  const ids = getRedeemedIds();
  if (ids.some((e) => String(e.id) === String(id))) return;
  const max = MAX_REDEEMED();
  const entry: RedeemedEntry = { id, showingDate: new Date().toISOString() };
  const next =
    ids.length < max ? [...ids, entry] : [...ids.slice(1, max), entry];
  setCookie(REDEEMED_IDS_COOKIE, next);
}

// ---- per-product timer persistence (localStorage; survives hard nav) ----

interface StoredTimer extends LuckTimer {
  /** last write time; used to evict the oldest entries past the cap */
  _ts: number;
}

function readTimers(): Record<string, StoredTimer> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LUCK_TIMERS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function readTimer(id: string | number): LuckTimer | null {
  const stored = readTimers()[String(id)];
  if (!stored) return null;
  const { _ts, ...timer } = stored;
  return timer;
}

/** Persist a product's timer. The map is capped at the same MAX_REDEEMED count
 *  as the redeemed cookie: when a new product would exceed it, the
 *  least-recently-written entries are evicted (by `_ts`, so it is robust to
 *  numeric-string keys whose object order is not insertion order). */
export function writeTimer(id: string | number, timer: LuckTimer | null): void {
  if (typeof window === "undefined") return;
  const all = readTimers();
  const k = String(id);
  if (timer === null) {
    delete all[k];
  } else {
    all[k] = { ...timer, _ts: Date.now() };
    const max = MAX_REDEEMED();
    const keys = Object.keys(all);
    if (keys.length > max) {
      keys
        .sort((a, b) => all[a]._ts - all[b]._ts)
        .slice(0, keys.length - max)
        .forEach((old) => delete all[old]);
    }
  }
  try {
    localStorage.setItem(LUCK_TIMERS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota / disabled storage — non-fatal */
  }
}

// ---- derivation ----

export function computeSecondsLeft(
  timer: LuckTimer | null | undefined,
  now: number,
): number {
  if (!timer) return DEFAULT_LUCK_SECONDS;
  if (timer.expired) return 0;
  if (timer.deadlineTs != null) {
    return Math.max(0, Math.ceil((timer.deadlineTs - now) / 1000));
  }
  return timer.pausedRemaining ?? 0;
}

/**
 * Is the luck offer still open to this shopper for this product?
 *
 * `is_luck` comes from the product record, so it stays true after the shopper
 * has redeemed the product. Every place that shows a luck price, or reports one
 * to analytics, has to read the redeemed cookie as well — otherwise it claims an
 * offer the shopper can no longer take.
 *
 * This matters more the more the product markup is shared: one cached card is
 * shown to every shopper, including the ones who already redeemed.
 */
export function isLuckActive(
  product: { is_luck?: unknown } | null | undefined,
  id: string | number,
): boolean {
  if (!product?.is_luck) return false;
  return !isRedeemed(id);
}
