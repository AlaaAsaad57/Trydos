// Lazy-loaded PostHog wrapper — only loads the SDK on first use.
//
// Replaces the previous Smartlook integration: PostHog provides session replay
// (the Smartlook equivalent) plus product analytics. We keep the same guard
// rails the Smartlook wrapper had — initialise only in production, load the SDK
// lazily, and never let analytics throw into the app (all failures swallowed).
//
// posthog-js exposes its singleton on the module's *default* export, so we MUST
// unwrap `.default` (same gotcha the Smartlook wrapper documented) — otherwise
// `mod.init` is `undefined` and the recorder never starts.
//
// What this wrapper enables, and where it comes from:
//   - Session replay, autocapture (→ heatmaps), SPA pageviews, exception
//     capture: all switched on by the `defaults: "2025-05-24"` preset in init().
//   - Funnels / paths / custom events: every `GAevent()` call is fanned out to
//     `posthogCapture()` (see utils/gtag.ts), so the existing GA event taxonomy
//     populates PostHog with zero new call sites.
//   - Error tracking: `LogError` routes through `posthogCaptureException`.
//   - Feature flags / experiments: `posthogIsFeatureEnabled` / `posthogGetFeatureFlag`.
//   - Ad-blocker resilience: ingestion is reverse-proxied through our own
//     `/ingest` path (rewrites in next.config.ts), so `api_host` is "/ingest".
import type { PostHog } from "posthog-js";

let _posthog: PostHog | undefined;
let _inited = false;

const isProd = () => process.env.NODE_ENV === "production";

const load = async (): Promise<PostHog | undefined> => {
  if (_posthog) return _posthog;
  const mod = await import("posthog-js");
  // Unwrap the default export; fall back to the namespace just in case.
  _posthog = ((mod as unknown as { default?: PostHog }).default ??
    (mod as unknown as PostHog)) as PostHog;
  return _posthog;
};

// Only act once init() has actually run; returns the live instance or undefined.
const ready = async (): Promise<PostHog | undefined> => {
  if (!isProd() || !_inited) return undefined;
  try {
    return await load();
  } catch {
    return undefined;
  }
};

export const posthogInit = async (key?: string) => {
  if (!isProd()) return;
  if (!key || _inited) return;
  try {
    const posthog = await load();
    // init() is not idempotent (it warns on re-entry); guard with our own flag.
    if (posthog && !_inited) {
      posthog.init(key, {
        // Reverse-proxy ingestion through our own domain so ad-blockers don't
        // drop events/replays (rewrites: /ingest/* → eu.i.posthog.com).
        api_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        // Only materialise person profiles for identified users (cost control).
        // (Session replay is currently paused below — see disable_session_recording.)
        person_profiles: "identified_only",
        // Opt into PostHog's current sensible defaults (autocapture, pageviews,
        // pageleave, exception capture, session-replay config). Autocapture is
        // also what powers heatmaps in the PostHog toolbar.
        defaults: "2025-05-24",
        // PAUSED to cut Vercel cost: session replay funnels a continuous stream
        // of chunks through the /ingest edge proxy (one edge invocation + data
        // transfer per chunk), which dominated the bill. Autocapture, pageviews
        // and custom events still flow. Set back to `false` (or delete this
        // line) to re-enable replay later.
        disable_session_recording: true,
      });
      _inited = true;
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
};

export const posthogIdentify = async (
  userId: string | number,
  props: Record<string, string>,
) => {
  const posthog = await ready();
  try {
    posthog?.identify(String(userId), props);
  } catch {
    // Silently fail
  }
};

// Fan-out target for GAevent(): every product event reaches PostHog so funnels,
// paths, and retention work off the same taxonomy GA already uses. No-op until
// init() has run, so it's safe to call from anywhere.
export const posthogCapture = async (
  event: string,
  props?: Record<string, unknown>,
) => {
  const posthog = await ready();
  try {
    posthog?.capture(event, props);
  } catch {
    // Silently fail
  }
};

// Dedicated error tracking. Routed from LogError so client exceptions land in
// PostHog's error-tracking product alongside the matching session replay.
export const posthogCaptureException = async (
  error: unknown,
  props?: Record<string, unknown>,
) => {
  const posthog = await ready();
  try {
    // captureException accepts `unknown`; pass the raw value so a real Error
    // keeps its stack instead of being flattened to a string.
    posthog?.captureException(error, props);
  } catch {
    // Silently fail
  }
};

// Clear the identity graph on logout so the next (guest) session isn't stitched
// onto the previous user. Starts a fresh anonymous distinct_id + session.
export const posthogReset = async () => {
  const posthog = await ready();
  try {
    posthog?.reset();
  } catch {
    // Silently fail
  }
};

// Feature flags / experiments. Returns the fallback when PostHog isn't ready
// (dev, pre-init, blocked) so callers always get a deterministic boolean/value.
export const posthogIsFeatureEnabled = async (
  flag: string,
  fallback = false,
): Promise<boolean> => {
  const posthog = await ready();
  try {
    return posthog?.isFeatureEnabled(flag) ?? fallback;
  } catch {
    return fallback;
  }
};

export const posthogGetFeatureFlag = async (
  flag: string,
): Promise<boolean | string | undefined> => {
  const posthog = await ready();
  try {
    return posthog?.getFeatureFlag(flag);
  } catch {
    return undefined;
  }
};
