import { useState, useRef, useEffect, useCallback } from "react";
import { useSwipeable } from "react-swipeable";

const SWIPED_EVENT = "chat-message-swiped";
const CLOSE_ALL_EVENT = "chat-message-close-all";
const SNAP_OFFSET = -50; // pixels to slide left to reveal dates

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
  const isSwipingRef = useRef(false);

  const applyVisuals = useCallback((offset: number, animate: boolean) => {
    if (contentRef.current) {
      contentRef.current.style.transition = animate
        ? "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)"
        : "none";
      contentRef.current.style.transform = `translateX(${offset}px)`;
    }
    if (datesRef.current) {
      const progress = Math.min(1, Math.max(0, Math.abs(offset) / 25));
      datesRef.current.style.transition = animate
        ? "opacity 0.22s ease-in-out"
        : "none";
      datesRef.current.style.opacity = `${progress}`;
      datesRef.current.style.pointerEvents = progress > 0.5 ? "auto" : "none";
    }
  }, []);

  const open = useCallback(() => {
    applyVisuals(SNAP_OFFSET, true);
    setIsOpen(true);
    window.dispatchEvent(new CustomEvent(SWIPED_EVENT, { detail: { id } }));
  }, [id, applyVisuals]);

  const close = useCallback(() => {
    applyVisuals(0, true);
    setIsOpen(false);
    isSwipingRef.current = false;
  }, [applyVisuals]);

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

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      if (!enabled) return;
      if (e.dir === "Left" || e.dir === "Right") {
        isSwipingRef.current = true;
        let offset = 0;
        if (isOpenRef.current) {
          if (e.dir === "Right") {
            // closing
            offset = Math.min(0, SNAP_OFFSET + e.absX);
          } else {
            // pulling further left
            offset = Math.max(-75, SNAP_OFFSET - e.absX * 0.3);
          }
        } else {
          if (e.dir === "Left") {
            // opening by swiping left
            offset = Math.max(-75, -e.absX);
          } else {
            // swiping right from closed
            offset = Math.max(-75, -e.absX);
          }
        }
        applyVisuals(offset, false);
      }
    },
    onSwipedLeft: () => {
      if (!enabled) return;
      open();
    },
    onSwipedRight: () => {
      if (!enabled) return;
      if (isOpenRef.current) {
        close();
      } else {
        open();
      }
    },
    onTouchEndOrOnMouseUp: () => {
      if (isSwipingRef.current) {
        isSwipingRef.current = false;
        if (isOpenRef.current) {
          applyVisuals(SNAP_OFFSET, true);
        } else {
          applyVisuals(0, true);
        }
      }
    },
    onTap: () => {
      if (isOpenRef.current) {
        close();
      }
    },
    delta: 10,
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  const setContentRef = useCallback(
    (el: HTMLDivElement | null) => {
      contentRef.current = el;
      swipeHandlers.ref(el);
    },
    [swipeHandlers]
  );

  return {
    contentRef,
    datesRef,
    setContentRef,
    isOpen,
    open,
    close,
    swipeHandlers,
  };
}

export default useMessageSwipe;
