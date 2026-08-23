// A store built from the REAL auth slice, for the sign-in service tests.
//
// Why not tests/mocks/store.ts: that stand-in carries state and two spies, so a
// test can only prove that the service *called* something. The criteria for this
// phase are about the state a shopper ends up in — signed in, marked verified,
// one attempt fewer — so the tests need the real reducer, with its real merges
// and its real branches. store/auth/reducer.tsx imports nothing, so pulling it
// in costs nothing.
//
// Use it like this, at the top of a test file:
//
//   vi.mock("store", async () => {
//     const { makeAuthStoreModule } = await import("../mocks/authStore");
//     return makeAuthStoreModule();
//   });
//
// and then, in `beforeEach`:
//
//   const store = await import("store");
//   store.__resetAuthStore();
//
// THE RESET IS NOT OPTIONAL. The store is created inside the `vi.mock` factory,
// so it outlives a single test: `attempts` starts at 4 and `loginFailed`
// decrements it, `user` and `userProfile` accumulate. Without a reset the suite
// silently becomes order-dependent — a green run that proves nothing.
//
// `__resetAuthStore` is exported from the mocked module, not from this file, so
// a test that calls `vi.resetModules()` gets the reset and the store from the
// SAME generation as the service under test. Importing it here instead would
// hand the test a store the service never writes to.

import { useAuthStore } from "store/auth/reducer";

/** State a test wants the store to start from. */
export type AuthStoreOverrides = Record<string, any>;

/**
 * The three members the sign-in service reads that do NOT belong to the auth
 * slice. Stubbed, because they are another slice's subject:
 *   LoggingOut                              -> store/Cart/reducer.ts
 *   isRegisteringReady, setIsRegisteringReady, language -> store/homepage/reducer.ts
 */
function crossSliceMembers(set: (partial: any) => void) {
  return {
    LoggingOut: false,
    isRegisteringReady: true,
    setIsRegisteringReady: vi.fn((ready: boolean) =>
      set({ isRegisteringReady: ready }),
    ),
    language: "en",
  };
}

/**
 * Build the replacement for the `store` module.
 *
 * Returns the module shape (`useAppStore`) plus `__resetAuthStore`, which
 * rebuilds the state from the real reducer. Anything passed to either call is
 * merged over the fresh state.
 */
export function makeAuthStoreModule(initialOverrides: AuthStoreOverrides = {}) {
  let state: Record<string, any> = {};

  const set = (partial: any) => {
    const next = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;

  const freshState = (overrides: AuthStoreOverrides) => ({
    ...useAuthStore(set, get),
    ...crossSliceMembers(set),
    ...initialOverrides,
    ...overrides,
  });

  state = freshState({});

  const useAppStore: any = (selector?: (s: Record<string, any>) => any) =>
    selector ? selector(state) : state;

  useAppStore.getState = get;
  useAppStore.setState = set;
  useAppStore.subscribe = () => () => {};

  return {
    useAppStore,
    /** Back to a fresh slice. Call this in `beforeEach`. */
    __resetAuthStore: (overrides: AuthStoreOverrides = {}) => {
      state = freshState(overrides);
    },
  };
}
