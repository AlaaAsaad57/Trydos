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

function readTimers(): Record<string, LuckTimer> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LUCK_TIMERS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function readTimer(id: string | number): LuckTimer | null {
  return readTimers()[String(id)] ?? null;
}

export function writeTimer(id: string | number, timer: LuckTimer | null): void {
  if (typeof window === "undefined") return;
  const all = readTimers();
  if (timer === null) delete all[String(id)];
  else all[String(id)] = timer;
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
