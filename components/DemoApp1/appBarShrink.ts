"use client";

import { motionValue } from "framer-motion";

/**
 * The real app's tab bar scroll scale, shared with the new screens.
 *
 * On /demo one shell draws the bar and the screens, so it hands the bar's
 * scale to both (useDemoNav().barShrink). The real app draws them in two
 * trees: the bar in AppShell, the screens in ScreenMount. So AppShell copies
 * the bar's scale into this one value on every change, and ScreenMount gives
 * this value to the screens. A motion value's change event runs as the value
 * is set, so a box that rests on the bar (the bag's price panel) still moves
 * in the same frame as the bar.
 *
 * 1 is full size (the bar's state with no scroll).
 */
export const appBarShrink = motionValue(1);
