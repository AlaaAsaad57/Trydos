// Lazy-loaded Smartlook wrapper — only loads the SDK on first use.
//
// smartlook-client v10 is a pure-ESM package whose entire API lives on the
// module's *default* export. `await import("smartlook-client")` resolves to the
// module namespace ({ default: { init, identify, ... } }), so we MUST unwrap
// `.default` — otherwise `mod.init` is `undefined`, `mod?.init(key)` throws
// "init is not a function", the catch below swallows it, and the recorder never
// starts (i.e. nothing ever shows up in the dashboard).
let _smartlook;

type SmartlookApi = {
  init: (key: string, params?: Record<string, unknown>) => boolean;
  identify: (
    userId: string | number,
    props: Record<string, string | number | boolean>,
  ) => boolean;
  initialized: () => boolean;
};

export const getSmartlook = async (): Promise<SmartlookApi | undefined> => {
  if (_smartlook) return _smartlook;
  const mod = await import("smartlook-client");
  // Unwrap the default export (see note above). Fall back to the namespace in
  // case a future build also exposes named exports.
  _smartlook = (mod as any)?.default ?? mod;
  return _smartlook;
};

export const smartlookIdentify = async (
  userId: string | number,
  props: Record<string, string>,
) => {
  if (process.env.NODE_ENV !== "production") return;
  try {
    const Smartlook = await getSmartlook();
    if (Smartlook?.initialized?.()) {
      Smartlook.identify(userId, props);
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
};

export const smartlookInit = async (key?: string) => {
  if (process.env.NODE_ENV !== "production") return;
  if (!key) return;
  try {
    const Smartlook = await getSmartlook();
    // init() warns + returns false if called twice; guard to keep it idempotent.
    if (Smartlook && !Smartlook.initialized?.()) {
      Smartlook.init(key);
    }
  } catch {
    // Silently fail
  }
};
