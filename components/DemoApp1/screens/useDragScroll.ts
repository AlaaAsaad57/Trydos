"use client";

import { useEffect, useState } from "react";

/**
 * Lets a mouse drag a sideways row of cards, as a finger does on a phone.
 *
 * A phone already scrolls the row with a finger, and a trackpad with two
 * fingers. A mouse cannot: the row has no scroll bar (the design has none),
 * and the wheel scrolls the page. So on a PC the cards could not be reached.
 *
 *  - Only a mouse (pointerType "mouse"), with the main button. Touch and pen
 *    keep the browser's own scroll.
 *  - The drag starts after DRAG_SLOP px, so a click on a card (a like) still
 *    works. A click right after a drag is dropped, so a drag never likes.
 *  - On release the row slides (smooth scroll) to the card nearest to where
 *    it would stop. A fast flick goes on by FLING_MS of its speed, so a flick
 *    moves to the next card, as on a phone.
 *  - While the mouse drags, the row's CSS snap is off (it would pull the row
 *    back on each move). It comes back when the slide ends.
 *
 * The row must be `position: relative`, so each card's offsetLeft is measured
 * from the row (offsetLeft also leaves out the slider hint's translate).
 * The hook runs only in effects, so the server HTML is the same.
 */
const DRAG_SLOP = 4;
const FLING_MS = 120;
/** If the browser has no `scrollend` event, the snap comes back after this. */
const SNAP_BACK_MS = 700;

export function useDragScroll<E extends HTMLElement>() {
  const [row, setRow] = useState<E | null>(null);
  useEffect(() => {
    if (!row) return;
    let start: { x: number; left: number; id: number } | null = null;
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let speed = 0;
    let snapBack: ReturnType<typeof setTimeout> | undefined;
    /** The row's own snap (React writes it inline) while a drag has it off; null when it is on. */
    let savedSnap: string | null = null;

    const restoreSnap = () => {
      clearTimeout(snapBack);
      row.removeEventListener("scrollend", restoreSnap);
      if (savedSnap === null) return;
      row.style.scrollSnapType = savedSnap;
      savedSnap = null;
    };

    /** The scroll position of the card nearest to `left`. */
    const nearestCard = (left: number) => {
      const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
      const max = row.scrollWidth - row.clientWidth;
      let best = 0;
      for (const card of Array.from(row.children) as HTMLElement[]) {
        const at = Math.min(max, Math.max(0, card.offsetLeft - pad));
        if (Math.abs(at - left) < Math.abs(best - left)) best = at;
      }
      return best;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      start = { x: e.clientX, left: row.scrollLeft, id: e.pointerId };
      dragging = false;
      speed = 0;
      lastX = e.clientX;
      lastT = e.timeStamp;
    };

    const onMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_SLOP) return;
        dragging = true;
        restoreSnap();
        savedSnap = row.style.scrollSnapType;
        row.style.scrollSnapType = "none";
        row.style.cursor = "grabbing";
        row.style.userSelect = "none";
        window.getSelection()?.removeAllRanges();
        row.setPointerCapture(e.pointerId);
      }
      const dt = e.timeStamp - lastT;
      if (dt > 0) speed = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastT = e.timeStamp;
      row.scrollLeft = start.left - dx;
    };

    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const was = dragging;
      start = null;
      dragging = false;
      if (!was) return;
      if (row.hasPointerCapture(e.pointerId)) row.releasePointerCapture(e.pointerId);
      row.style.removeProperty("cursor");
      row.style.removeProperty("user-select");
      // The click the browser sends after this release is not a tap on a card.
      const drop = (c: MouseEvent) => {
        c.preventDefault();
        c.stopPropagation();
      };
      row.addEventListener("click", drop, { capture: true, once: true });
      setTimeout(() => row.removeEventListener("click", drop, { capture: true }), 0);
      // A mouse that rested before the release has no speed left.
      const flick = e.timeStamp - lastT > 80 ? 0 : speed;
      row.scrollTo({ left: nearestCard(row.scrollLeft - flick * FLING_MS), behavior: "smooth" });
      row.addEventListener("scrollend", restoreSnap, { once: true });
      snapBack = setTimeout(restoreSnap, SNAP_BACK_MS);
    };

    row.addEventListener("pointerdown", onDown);
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", onUp);
    row.addEventListener("pointercancel", onUp);
    return () => {
      row.removeEventListener("pointerdown", onDown);
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerup", onUp);
      row.removeEventListener("pointercancel", onUp);
      restoreSnap();
    };
  }, [row]);
  return setRow;
}
