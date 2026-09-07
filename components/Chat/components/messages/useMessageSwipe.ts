import { useState, useRef, useEffect, useCallback } from "react";

const SWIPED_EVENT = "chat-message-swiped";
const CLOSE_ALL_EVENT = "chat-message-close-all";
const SNAP_OFFSET = -55; // Pixels to slide left when open

interface UseMessageSwipeOptions {
  id: string | number;
  enabled?: boolean;
}

export function useMessageSwipe({ id, enabled = true }: UseMessageSwipeOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const datesRef = useRef<HTMLDivElement | null>(null);

  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const isSwipingRef = useRef(false);
  const isVerticalRef = useRef(false);

  const applyVisuals = useCallback((offset: number, animate: boolean) => {
    if (contentRef.current) {
      contentRef.current.style.transition = animate
        ? "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)"
        : "none";
      contentRef.current.style.transform = `translateX(${offset}px)`;
    }
    if (datesRef.current) {
      const progress = Math.min(1, Math.max(0, Math.abs(offset) / 30));
      datesRef.current.style.transition = animate
        ? "opacity 0.22s ease-in-out"
        : "none";
      datesRef.current.style.opacity = `${progress}`;
      datesRef.current.style.pointerEvents = progress > 0.8 ? "auto" : "none";
    }
    currentOffsetRef.current = offset;
  }, []);

  const open = useCallback(() => {
    applyVisuals(SNAP_OFFSET, true);
    setIsOpen(true);
    window.dispatchEvent(new CustomEvent(SWIPED_EVENT, { detail: { id } }));
  }, [id, applyVisuals]);

  const close = useCallback(() => {
    applyVisuals(0, true);
    setIsOpen(false);
  }, [applyVisuals]);

  // Close when another message is swiped or when the user scrolls the chat page
  useEffect(() => {
    const handleOtherSwiped = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string | number }>;
      if (customEvent.detail?.id !== id) {
        close();
      }
    };

    const handleCloseAll = () => {
      close();
    };

    window.addEventListener(SWIPED_EVENT, handleOtherSwiped);
    window.addEventListener(CLOSE_ALL_EVENT, handleCloseAll);

    return () => {
      window.removeEventListener(SWIPED_EVENT, handleOtherSwiped);
      window.removeEventListener(CLOSE_ALL_EVENT, handleCloseAll);
    };
  }, [id, close]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      isSwipingRef.current = false;
      isVerticalRef.current = false;
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      if (isVerticalRef.current) return;
      if (e.pointerType === "mouse" && e.buttons === 0) return;

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      if (!isSwipingRef.current && !isVerticalRef.current) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Allow vertical page scroll without interference
        if (absY > 7 && absY > absX) {
          isVerticalRef.current = true;
          return;
        }

        // Horizontal swipe detected
        if (absX > 7 && absX > absY) {
          isSwipingRef.current = true;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch (_) {}
        }
      }

      if (isSwipingRef.current) {
        const base = isOpenRef.current ? SNAP_OFFSET : 0;
        let target = base + deltaX;

        // Clamping with slight rubber-band resistance
        if (target > 10) {
          target = 10 + (target - 10) * 0.15;
        } else if (target < -80) {
          target = -80 + (target + 80) * 0.15;
        }

        applyVisuals(target, false);
      }
    },
    [enabled, applyVisuals]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}

      if (!isSwipingRef.current) {
        return;
      }

      isSwipingRef.current = false;
      isVerticalRef.current = false;

      const deltaX = e.clientX - startXRef.current;

      if (isOpenRef.current) {
        // When open, user swipes RIGHT to close:
        if (deltaX > 20) {
          close();
        } else {
          // Keep it open, save position!
          open();
        }
      } else {
        // When closed, user swipes LEFT to open:
        if (deltaX < -15) {
          open();
        } else {
          close();
        }
      }
    },
    [open, close]
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      isSwipingRef.current = false;
      isVerticalRef.current = false;
      if (isOpenRef.current) {
        open();
      } else {
        close();
      }
    },
    [open, close]
  );

  const swipeHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };

  return {
    contentRef,
    datesRef,
    isOpen,
    open,
    close,
    swipeHandlers,
  };
}

export default useMessageSwipe;
