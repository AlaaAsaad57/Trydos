// Stand-in for the product-analytics client (the posthog-js package).
//
// Use it like this, at the top of a test file:
//
//   vi.mock("posthog-js", () => makePosthogMock());
//
// THE FAKE CLIENT SITS ON A `default` KEY.
// posthog-js exposes its singleton on the module's default export, and our
// wrapper (utils/posthog.ts) unwraps `.default` to get it. A flat stand-in
// would hand the wrapper nothing and every call would quietly do nothing.
//
// WHAT "COVERS THE MODULE" MEANS HERE.
// posthog-js exports hundreds of symbols. Copying them all would be code no
// test ever calls. This stand-in covers what this repository actually uses —
// the seven methods utils/posthog.ts calls on the client:
//   init, identify, capture, captureException, reset, isFeatureEnabled,
//   getFeatureFlag
//
// This stands in for the third-party client only. Our own wrapper,
// utils/posthog.ts, is ordinary application code and gets tested in its own
// phase — do not replace it with this.

/** What a test wants the feature-flag calls to answer. */
export type PosthogMockOptions = {
  /** Answer for `isFeatureEnabled(flag)`. Defaults to false. */
  featureEnabled?: boolean;
  /** Answer for `getFeatureFlag(flag)`. Defaults to undefined. */
  featureFlagValue?: boolean | string;
};

/**
 * Build a fresh stand-in for the analytics client.
 *
 * Every method records its calls and does nothing else — no network, no
 * recorder, no timers left running. Each call gives its own client, so two
 * tests can never see each other's events.
 */
export function makePosthogMock(options: PosthogMockOptions = {}) {
  const { featureEnabled = false, featureFlagValue = undefined } = options;

  const client = {
    init: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    captureException: vi.fn(),
    reset: vi.fn(),
    isFeatureEnabled: vi.fn(() => featureEnabled),
    getFeatureFlag: vi.fn(() => featureFlagValue),
  };

  return { default: client };
}
