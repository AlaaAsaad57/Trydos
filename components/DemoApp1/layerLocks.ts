/**
 * How many layers (a sheet, a modal) hold the page still right now.
 *
 * `useScrollLock` in ui.tsx counts here. It lives in its own tiny file so a
 * part that runs on every page (AppSignInAsk, which waits while a sheet is
 * open) can ask without loading ui.tsx, which is large.
 */
let locks = 0;

/** True while a layer is open over the page. */
export const anyLayerOpen = () => locks > 0;

/** Counts one more layer. True when it is the first one. */
export const addLayerLock = () => {
  locks += 1;
  return locks === 1;
};

/** Counts one layer less. True when it was the last one. */
export const removeLayerLock = () => {
  locks -= 1;
  return locks === 0;
};
