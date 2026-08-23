// Stand-in for the client fetch helper (utils/fetchData.ts).
//
// Use it like this, at the top of a test file:
//
//   vi.mock("utils/fetchData", () => makeFetchDataMock());
//
// It covers everything the real module makes available at run time:
// `fetchData` and `abortInFlightForLogout`. (`ServerType` is a type only, so it
// disappears at compile time and a stand-in cannot provide it.)
//
// It is hand-written: nothing here imports the real module, which pulls in the
// shared store, the auth service, the cookie manager and the big translations
// module.
//
// This stand-in replaces the whole helper. When a test needs to prove what was
// sent over the network — how many calls, to which address, with which body —
// use tests/mocks/mockFetch.ts instead and let the real helper run.

/** What a test wants `fetchData` to return, and how. */
export type FetchDataMockOptions = {
  /** The value every call resolves to. Ignored when `reply` is given. */
  result?: any;
  /** Decide the reply per call, from the parameters the caller passed. */
  reply?: (params: any, authAttempt: number) => any;
};

/**
 * Build a fresh stand-in for the client fetch helper.
 *
 * By default every call resolves to `{ success: true }`. Each call gives its
 * own functions, so two tests can never see each other's calls.
 */
export function makeFetchDataMock(options: FetchDataMockOptions = {}) {
  const { result = { success: true }, reply } = options;

  return {
    fetchData: vi.fn(async (params: any, authAttempt = 0) =>
      reply ? reply(params, authAttempt) : result,
    ),
    abortInFlightForLogout: vi.fn(),
  };
}
