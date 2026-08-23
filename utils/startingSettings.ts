// Starting-settings envelope resolver.
//
// The `/web/home/startingSettings` payload nests the settings object under a
// different key depending on which backend served the request: the **core**
// backend (verified traffic) uses "starting-setting", the **gateway** (guest
// traffic) uses "starting_setting". The app has only ever read the gateway
// spelling, so for verified shoppers the lookup resolved to `undefined` and
// every delivery estimate silently lost `shipping_duration_days` — the platform
// half of "product shipping days + platform shipping duration".
//
// The core shape is the accepted contract; the gateway is expected to align to
// it. Until it does, both spellings are accepted so guests — who are correct
// today — do not regress. Once the gateway aligns, the fallback below can be
// deleted.

// Accepted (core) envelope key, checked first.
const ACCEPTED_ENVELOPE_KEY = "starting-setting";
// Gateway envelope key, and the spelling every in-app reader indexes.
const GATEWAY_ENVELOPE_KEY = "starting_setting";

/** The key client code reads the settings object under. */
export const STARTING_SETTING_KEY = GATEWAY_ENVELOPE_KEY;

/**
 * Coerce to a whole, non-negative number of days, treating absent/non-numeric
 * values as 0.
 *
 * Rounded **up** and floored at zero on purpose. This value is added to a
 * product's own shipping days to make a delivery estimate, and the failure this
 * module exists to stop is an estimate that is too short: half a day cannot be
 * shown, and a negative would pull the estimate earlier than the product's own
 * days. Neither shape is sent by a backend today.
 */
const toFiniteDays = (value: unknown): number => {
  const days = Number(value);
  if (!Number.isFinite(days)) return 0;
  return Math.max(0, Math.ceil(days));
};

/**
 * Returns the **complete** settings object from either envelope shape, with
 * `shipping_duration_days` guaranteed to be a finite number so callers can sum
 * it without producing NaN. Never returns a partial object — callers such as the
 * order-status list read other fields off the same result.
 */
export function resolveStartingSetting(payload: any): any {
  const accepted = asSettingsObject(payload?.[ACCEPTED_ENVELOPE_KEY]);
  const setting = accepted ?? asSettingsObject(payload?.[GATEWAY_ENVELOPE_KEY]);
  if (!setting) return setting;
  return {
    ...setting,
    shipping_duration_days: toFiniteDays(setting.shipping_duration_days),
  };
}

/**
 * An envelope entry only counts when it is an object. A `false` or `0` entry
 * used to be neither empty enough to fall through to the other spelling nor an
 * object to repair, so it was handed on as it was and every reader indexed into
 * it and found nothing.
 */
function asSettingsObject(entry: unknown): any {
  return typeof entry === "object" && entry !== null ? entry : undefined;
}

/**
 * Envelope-preserving normalisation for client-side ingest. Keeps the response
 * envelope intact and replaces only the settings entry, under the key existing
 * readers already index — the store must never receive the inner object alone,
 * or every `settings["starting_setting"]` reader resolves `undefined`.
 */
export function normaliseStartingSettings(payload: any): any {
  const setting = resolveStartingSetting(payload);
  if (!setting) return payload;
  // The accepted key is dropped rather than left beside the repaired one, so the
  // envelope carries the settings once. Keeping both meant a core payload held
  // the same object twice and a reader could pick the spelling the app does not
  // index.
  const { [ACCEPTED_ENVELOPE_KEY]: _accepted, ...rest } = payload;
  return { ...rest, [STARTING_SETTING_KEY]: setting };
}
