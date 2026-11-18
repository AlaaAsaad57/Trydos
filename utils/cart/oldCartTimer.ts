// The Out-Of-Bag timer, shared by the old cart (OldCartContainer) and the new
// bag screen (Stage 7d, useBagData).

// An Out-Of-Bag item stays "fresh" for 30 minutes after it was set aside; the
// countdown is derived live from the item's `created_at`, not a static string.
export const OLD_CART_WINDOW_MS = 30 * 60 * 1000;

// `created_at` arrives from the backend as a naive UTC ("+0 GMT") timestamp
// with no timezone marker (e.g. "2026-07-05 10:00:00"), which browsers would
// otherwise parse in the *local* zone — making every item look hours old (so
// the window reads as already elapsed and the counter hides). Interpret a
// timezone-less value as UTC; respect an explicit Z / ±HH:MM offset if present.
export const parseServerDateMs = (value: unknown): number => {
  if (value == null) return NaN;
  if (typeof value !== "string") return new Date(value as any).getTime();
  const s = value.trim();
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
  if (hasTimezone) return new Date(s).getTime();
  return new Date(`${s.replace(" ", "T")}Z`).getTime();
};

export const getOldCartRemainingMs = (createdAt: unknown): number => {
  const createdMs = parseServerDateMs(createdAt);
  if (Number.isNaN(createdMs)) return 0;
  const remaining = OLD_CART_WINDOW_MS - (Date.now() - createdMs);
  // Clamp to the window so a skewed device/server clock (a `created_at` that
  // reads in the future) can't render an absurd countdown like "470:55".
  return Math.min(OLD_CART_WINDOW_MS, Math.max(0, remaining));
};

export const formatOldCartCountdown = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
