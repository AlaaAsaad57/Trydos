// Stand-in for the error-reporting client (the @sentry/nextjs package).
//
// Use it like this, at the top of a test file:
//
//   vi.mock("@sentry/nextjs", () => makeSentryMock());
//
// WHAT "COVERS THE MODULE" MEANS HERE.
// @sentry/nextjs exports hundreds of symbols. Copying them all would be code no
// test ever calls. This stand-in covers what this repository actually imports —
// checked file by file, not guessed:
//   captureException   -> utils/errorReported.tsx, app/global-error.tsx
//   setUser            -> utils/errorReported.tsx
//   withScope          -> utils/errorReported.tsx
//   lastEventId        -> app/global-error.tsx
//   captureRequestError-> instrumentation.ts
//   captureRouterTransitionStart -> instrumentation-client.ts
//   init               -> instrumentation-client.ts, sentry.server.config.ts,
//                         sentry.edge.config.ts
//
// If a later phase reaches a symbol that is not here, add it — and add the file
// that needed it to the list above, so the list stays true.
//
// This stands in for the third-party client only. Our own wrapper,
// utils/errorReported.tsx, is ordinary application code and gets tested in its
// own phase — do not replace it with this.

/** What a test wants the last-event lookup to answer. */
export type SentryMockOptions = {
  /** Answer for `lastEventId()`. Defaults to undefined. */
  lastEventId?: string;
};

/**
 * Build a fresh stand-in for the error-reporting client.
 *
 * Nothing is sent anywhere. `withScope` still runs the function it is given, so
 * code that sets tags inside a scope behaves as it does in the app; the scope
 * it hands over records what was set.
 */
export function makeSentryMock(options: SentryMockOptions = {}) {
  const { lastEventId: lastId = undefined } = options;

  const scope = {
    setTag: vi.fn(),
    setTags: vi.fn(),
    setExtra: vi.fn(),
    setExtras: vi.fn(),
    setLevel: vi.fn(),
    setUser: vi.fn(),
    setContext: vi.fn(),
    setFingerprint: vi.fn(),
  };

  return {
    // The scope object, so a test can look at what the code under test set.
    __scope: scope,

    captureException: vi.fn(() => "test-sentry-event-id"),
    setUser: vi.fn(),
    withScope: vi.fn((callback: (s: typeof scope) => void) => callback(scope)),
    lastEventId: vi.fn(() => lastId),
    captureRequestError: vi.fn(),
    captureRouterTransitionStart: vi.fn(),
    init: vi.fn(),
  };
}
