import { useState, useRef, useEffect, useCallback } from "react";

const SWIPED_EVENT = "chat-message-swiped";
const CLOSE_ALL_EVENT = "chat-message-close-all";
const SNAP_OFFSET = 18; // Slight nudge to right when locked open
const LOCK_THRESHOLD = 20; // Distance swiped to right to trigger lock

interface UseMessageSwipeOptions {
  id: string | number;
  enabled?: boolean;
  isMenuOpen?: boolean;
}

export function useMessageSwipe({
  id,
  enabled = true,
  isMenuOpen = false,
}: UseMessageSwipeOptions) {
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
      const progress = isOpenRef.current ? 1 : Math.min(1, Math.max(0, offset / 15));
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
    if (datesRef.current) {
      datesRef.current.style.opacity = "1";
      datesRef.current.style.pointerEvents = "auto";
    }
    setIsOpen(true);
    window.dispatchEvent(new CustomEvent(SWIPED_EVENT, { detail: { id } }));
  }, [id, applyVisuals]);

  const close = useCallback(() => {
    applyVisuals(0, true);
    if (datesRef.current) {
      datesRef.current.style.opacity = "0";
      datesRef.current.style.pointerEvents = "none";
    }
    setIsOpen(false);
  }, [applyVisuals]);

  // When options menu opens, return message to normal resting state immediately
  useEffect(() => {
    if (isMenuOpen) {
      close();
    }
  }, [isMenuOpen, close]);

  // Lock open until it loses focus (click/tap outside)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("pointerdown", handlePointerDownOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [isOpen, close]);

  // Inter-message closing & chat scroll closing
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
      if (!enabled || isMenuOpen) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      isSwipingRef.current = false;
      isVerticalRef.current = false;
    },
    [enabled, isMenuOpen]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || isMenuOpen) return;
      if (isVerticalRef.current) return;
      if (e.pointerType === "mouse" && e.buttons === 0) return;

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      if (!isSwipingRef.current && !isVerticalRef.current) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Vertical scroll detection
        if (absY > 7 && absY > absX) {
          isVerticalRef.current = true;
          return;
        }

        // Swipe ONLY to the RIGHT when closed (deltaX must be positive)
        if (!isOpenRef.current) {
          if (deltaX > 7 && absX > absY) {
            isSwipingRef.current = true;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch (_) {}
          }
        } else {
          // When open, allow swiping left to close
          if (absX > 7 && absX > absY) {
            isSwipingRef.current = true;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch (_) {}
          }
        }
      }

      if (isSwipingRef.current) {
        if (!isOpenRef.current) {
          // Swipe ONLY to the right: deltaX > 0
          let target = Math.max(0, deltaX);
          if (target > 35) {
            target = 35 + (target - 35) * 0.15;
          }
          applyVisuals(target, false);
        } else {
          // When open: allow dragging left (deltaX < 0) to close
          let target = SNAP_OFFSET + deltaX;
          if (target < 0) target = 0;
          if (target > 35) target = 35;
          applyVisuals(target, false);
        }
      }
    },
    [enabled, isMenuOpen, applyVisuals]
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

      if (!isOpenRef.current) {
        // When closed: lock open if swiped RIGHT past LOCK_THRESHOLD (20px)
        if (deltaX > LOCK_THRESHOLD) {
          open(); // Locks into position until it loses focus!
        } else {
          close();
        }
      } else {
        // When open: close if dragged left past -15px
        if (deltaX < -15) {
          close();
        } else {
          open(); // Stays locked!
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
