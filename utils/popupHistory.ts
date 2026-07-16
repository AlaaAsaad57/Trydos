// Coordination flags between the popup history-entry owner (SearchParamUpdater)
// and the global popstate handler (CartProvider).
//
// Popups (login, cart, stories, …) push a synthetic `{ isPopup: true }` history
// entry when they open so a browser-back can close them. When a popup instead
// closes via React state (X button, success, backdrop), SearchParamUpdater
// consumes that entry with `history.back()` to keep the back-stack clean. These
// flags let the two pieces tell *self-initiated* back navigation apart from a
// *real* user back-press, so the global handler doesn't close sibling popups
// (e.g. the cart underneath login during checkout) or double-navigate.

// Set right before a popup self-consumes its own entry via history.back().
let selfConsuming = false;
// Set while a real back-press is collapsing popups, so the unmount cleanups it
// triggers don't then try to history.back() again.
let backClosing = false;

/** Mark that the next isPopup popstate is our own entry-consuming back(). */
export function beginSelfConsume(): void {
  selfConsuming = true;
  // Safety net: if the back() lands on a non-popup entry the global handler
  // never runs (so never clears the flag) — auto-reset so a later real back
  // isn't wrongly swallowed.
  setTimeout(() => {
    selfConsuming = false;
  }, 100);
}

/** Consume the self-consume marker; true if this popstate was self-initiated. */
export function takeSelfConsume(): boolean {
  if (selfConsuming) {
    selfConsuming = false;
    return true;
  }
  return false;
}

/** Mark that a real back-press is currently closing popups. */
export function markBackClosing(): void {
  backClosing = true;
  // Cleared after the unmount cleanups it triggers have had a tick to run.
  setTimeout(() => {
    backClosing = false;
  }, 50);
}

export function isBackClosing(): boolean {
  return backClosing;
}
