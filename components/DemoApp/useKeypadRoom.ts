"use client";

import { useEffect, useState } from "react";
import {
  FLUSH_KEYPAD_HEIGHT,
  KEYPAD_HEIGHT,
} from "components/Login/Enhanced/ui/NumericKeypad";
import { KEYBOARD_GAP } from "scaling/scale.config";

/** The room over the app's keypad, in design y (see `useKeypadRoom`). */
export type KeypadRoom = { full: number; flush: number };

/**
 * The design y a field may end at while the app's keypad is up: as far over
 * the keypad as AppScaler keeps a field (KEYBOARD_GAP, real px), on a sheet
 * that keeps its design top (`Sheet keep`). The canvas ends at design y
 * 982 - deficit (its top is y 50).
 *
 * `full` is with the usual keypad, `flush` with the keypad that has no gap
 * under its keys (`NumericKeypad flushBottom`). A form keeps the file's
 * spacing when its field ends at or above `full`, and only otherwise gives
 * the keypad's bottom gap away.
 *
 * It is read before the keypad opens, so a field already waits at its place:
 * AppScaler measures the field once, when the keypad opens, and a field still
 * moving then made it lift the page too far. Off a touch device there is no
 * keypad and the room is the whole artboard.
 */
export function useKeypadRoom(touch: boolean): KeypadRoom {
  const [room, setRoom] = useState<KeypadRoom>({ full: 932, flush: 932 });
  useEffect(() => {
    if (!touch) return;
    const read = () => {
      const root = getComputedStyle(document.documentElement);
      const scale =
        Number.parseFloat(root.getPropertyValue("--app-scale")) || 1;
      const deficit =
        Number.parseFloat(root.getPropertyValue("--xd-flex-deficit")) || 0;
      // The keypad's height, from a probe on <body> where the keypad lives.
      const over = (height: string) => {
        const probe = document.createElement("div");
        probe.style.cssText = `position: fixed; visibility: hidden; height: ${height}`;
        document.body.appendChild(probe);
        const keypad = probe.offsetHeight / scale;
        probe.remove();
        return 982 - deficit - keypad - KEYBOARD_GAP / scale;
      };
      setRoom({ full: over(KEYPAD_HEIGHT), flush: over(FLUSH_KEYPAD_HEIGHT) });
    };
    read();
    // AppScaler fits on the same event, a tick later.
    const onResize = () => setTimeout(read, 50);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [touch]);
  return room;
}
