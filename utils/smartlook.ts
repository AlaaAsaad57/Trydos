// Lazy-loaded Smartlook wrapper — only loads the SDK on first use
let _smartlook;

export const getSmartlook = async () => {
  if (_smartlook) return _smartlook;
  _smartlook = await import("smartlook-client");
  return _smartlook;
};

export const smartlookIdentify = async (
  userId: string | number,
  props: Record<string, string>,
) => {
  if (process.env.NODE_ENV !== "production") return;
  try {
    const Smartlook = await getSmartlook();
    if (Smartlook?.initialized()) {
      Smartlook?.identify(userId, props);
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
};

export const smartlookInit = async (key: string) => {
  if (process.env.NODE_ENV !== "production") return;
  try {
    const Smartlook = await getSmartlook();
    Smartlook?.init(key);
  } catch {
    // Silently fail
  }
};
