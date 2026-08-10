// Stand-in for the shared state store (store/index.ts).
//
// Use it like this, at the top of a test file:
//
//   vi.mock("store", () => makeStoreMock({ language: "ar" }));
//
// It is hand-written on purpose. Importing the real store/index.ts here would
// pull in nine slice reducers, and through them the big translations module,
// the chat service and the analytics helper — once per test file, across every
// test file the later phases add. It would also import its own replacement, the
// same trap the cookie stand-in avoids.
//
// WHY IT WORKS FOR CODE THAT LOADS THE STORE LATE
// Some modules read the store at the top of the file; utils/fetchData.ts loads
// it at the moment it is used, with `await import("../store")`. The test runner
// keys a replacement by the file it resolves to, not by the text of the import,
// so one registration under the name "store" covers both. tests/mocks/mocks.test.ts
// proves that through utils/fetchData.ts itself, not by assuming it.
//
// THE DEFAULT STATE HOLDS NOTHING THE REAL STORE DOES NOT HAVE (AC-9)
// Every key below was read off a real slice:
//   user, userChat, userStories       -> store/auth/reducer.tsx
//   LoggingOut                        -> store/Cart/reducer.ts
//   language, country, currency,
//   isRegisteringReady                -> store/homepage/reducer.ts
//   _hasHydrated, cameraPermissions,
//   sellerOrders, dashboardShopInfo   -> store/index.ts
// The notifications slice is deliberately absent: store/notifications/reducer.ts
// is not combined into store/index.ts, so the real store does not have it.
// Adding it would let tests pass against state that does not exist.

/** The state a test wants the stand-in to start with. */
export type StoreState = Record<string, any>;

/** The default state — only keys the real combined store actually has. */
export const DEFAULT_STORE_STATE: StoreState = {
  user: null,
  userChat: null,
  userStories: null,
  LoggingOut: false,
  language: "en",
  country: "",
  currency: null,
  isRegisteringReady: true,
  _hasHydrated: false,
  cameraPermissions: "asked",
  sellerOrders: [],
  dashboardShopInfo: null,
};

/**
 * Build a fresh stand-in for the shared store.
 *
 * Pass a partial state to start from something other than the default; the
 * keys you name are merged over the default and everything else stays as it
 * is. Each call gives its own state, so two tests can never see each other's
 * changes.
 *
 * The returned `useAppStore` behaves like the real one in the ways test code
 * uses it: call it with a selector inside a component, or read it directly with
 * `getState()` / `setState()` in service code.
 */
export function makeStoreMock(initialState: StoreState = {}) {
  let state: StoreState = { ...DEFAULT_STORE_STATE, ...initialState };
  const listeners = new Set<(next: StoreState, prev: StoreState) => void>();

  const getState = () => state;

  const setState = (
    partial: StoreState | ((prev: StoreState) => StoreState),
    replace = false,
  ) => {
    const prev = state;
    const next = typeof partial === "function" ? partial(prev) : partial;
    state = replace ? { ...next } : { ...prev, ...next };
    listeners.forEach((listener) => listener(state, prev));
  };

  const useAppStore: any = (selector?: (s: StoreState) => any) =>
    selector ? selector(state) : state;

  useAppStore.getState = getState;
  useAppStore.setState = setState;
  useAppStore.getInitialState = () => ({
    ...DEFAULT_STORE_STATE,
    ...initialState,
  });
  useAppStore.subscribe = (
    listener: (next: StoreState, prev: StoreState) => void,
  ) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  useAppStore.destroy = () => listeners.clear();

  return { useAppStore };
}
