// Client-side, session-scoped OTP lock store.
//
// Mirrors the server's Redis rules in the UI so the user is stopped *before* a
// request is ever made, and — critically — so the lock SURVIVES step
// navigation. Persisted in sessionStorage (not React state) so the classic
// bypass "enter number → send → go back → re-enter → send → …" stays locked,
// and resets only when the tab is closed (≈ a session).
//
// Two rules, matching the backend:
//   • per-number cooldown  — a number can't be re-sent until its timer expires.
//   • session cap          — at most SESSION_MAX distinct numbers per WINDOW.
//
// All functions are no-ops on the server (no sessionStorage).

const STORAGE_KEY = "otp_guard_v1";
const SESSION_MAX = 2;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface LockState {
  // normalizedPhone -> cooldown expiry epoch ms
  locks: Record<string, number>;
  // normalizedPhone -> first-requested epoch ms (for the distinct-number window)
  numbers: Record<string, number>;
}

const isBrowser = () => typeof window !== "undefined";

export const normalizePhone = (phone: string) =>
  (phone || "").replace(/[^0-9]/g, "");

function read(): LockState {
  if (!isBrowser()) return { locks: {}, numbers: {} };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const state: LockState = {
      locks: parsed?.locks ?? {},
      numbers: parsed?.numbers ?? {},
    };
    return prune(state);
  } catch {
    return { locks: {}, numbers: {} };
  }
}

function write(state: LockState): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full / disabled — locks degrade to in-memory-less, server still enforces */
  }
}

// Drop expired cooldowns and out-of-window numbers.
function prune(state: LockState): LockState {
  const now = Date.now();
  for (const [k, exp] of Object.entries(state.locks)) {
    if (!exp || exp <= now) delete state.locks[k];
  }
  for (const [k, ts] of Object.entries(state.numbers)) {
    if (!ts || now - ts >= WINDOW_MS) delete state.numbers[k];
  }
  return state;
}

/** Remaining cooldown for a number, in whole seconds (0 = not locked). */
export function getNumberLockRemaining(phone: string): number {
  const key = normalizePhone(phone);
  if (!key) return 0;
  const state = read();
  const exp = state.locks[key];
  if (!exp) return 0;
  return Math.max(0, Math.ceil((exp - Date.now()) / 1000));
}

/** Lock a number's send button for `seconds`. */
export function lockNumber(phone: string, seconds: number): void {
  const key = normalizePhone(phone);
  if (!key || !seconds) return;
  const state = read();
  state.locks[key] = Date.now() + seconds * 1000;
  write(state);
}

/** Record that an OTP was requested for a number (for the distinct-number cap). */
export function recordSessionNumber(phone: string): void {
  const key = normalizePhone(phone);
  if (!key) return;
  const state = read();
  if (!state.numbers[key]) {
    state.numbers[key] = Date.now();
    write(state);
  }
}

/**
 * True when sending to `phone` would exceed the per-session distinct-number cap
 * (i.e. the cap is already reached AND this number isn't one of the allowed
 * ones). Re-sending an already-used number is governed by the cooldown instead.
 */
export function isSessionCapReached(phone: string): boolean {
  const key = normalizePhone(phone);
  const state = read();
  const count = Object.keys(state.numbers).length;
  if (count < SESSION_MAX) return false;
  return !state.numbers[key];
}
