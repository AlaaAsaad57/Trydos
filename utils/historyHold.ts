// The first listener on the browser's back and forward.
//
// On `window`, Chromium runs `popstate` listeners in the order they were added,
// and `capture` changes nothing. React then commits a `popstate` navigation at
// once, inside Next's listener. So a listener added by a component comes too
// late: the page has changed, and no picture of the old page can be taken.
// Measured on Next 16.3.8: the new page was shown before the listener ran.
//
// Only an inline script is sure to be first, because it runs while the HTML is
// parsed. It does nothing by itself: it calls the function that
// components/ModalRoute/pageSlide.ts puts on the window.

/** The name of that function on `window`. */
export const HISTORY_HOLD = "__trydosHoldHistoryMove";

/** The inline script. Costs the client bundle nothing: see the layout. */
export const HISTORY_HOLD_SCRIPT = `addEventListener("popstate",function(e){var h=window.${HISTORY_HOLD};if(h)h(e)});`;
