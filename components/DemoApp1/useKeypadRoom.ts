"use client";

import { useEffect, useState } from "react";
import {
  FLUSH_KEYPAD_HEIGHT,
  KEYPAD_HEIGHT,
} from "components/Login/Enhanced/ui/NumericKeypad";
import { KEYBOARD_GAP } from "scaling/scale.config";
import { DESIGN_H, STATUS_BAR } from "./demo1Layout";

/** The room over the app's keypad, in design y (see `useKeypadRoom`). */
export type KeypadRoom = { full: number; flush: number };

/**
 * The design y a field may end at while the app's keypad is up, on /demo.
 *
 * The old scaled demo hook (DemoApp/useKeypadRoom) reads the scaled canvas. Here one
 * design px is one CSS px and the screen is the window, so the screen ends at
 * design y `50 + innerHeight`, and the keypad and the gap above it are taken
 * off that. Off a touch device there is no keypad and the room is the whole
 * artboard.
 */
export function useKeypadRoom(touch: boolean): KeypadRoom {
  const [room, setRoom] = useState<KeypadRoom>({
    full: DESIGN_H,
    flush: DESIGN_H,
  });
  useEffect(() => {
    if (!touch) return;
    const read = () => {
      const end = STATUS_BAR + window.innerHeight;
      // The keypad's height, from a probe on <body> where the keypad lives.
      const over = (height: string) => {
        const probe = document.createElement("div");
        probe.style.cssText = `position: fixed; visibility: hidden; height: ${height}`;
        document.body.appendChild(probe);
        const keypad = probe.offsetHeight;
        probe.remove();
        return end - keypad - KEYBOARD_GAP;
      };
      setRoom({ full: over(KEYPAD_HEIGHT), flush: over(FLUSH_KEYPAD_HEIGHT) });
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [touch]);
  return room;
}
