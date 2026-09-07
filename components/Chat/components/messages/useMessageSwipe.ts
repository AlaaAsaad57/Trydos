import { useState, useRef, useEffect, useCallback } from "react";

const SWIPED_EVENT = "chat-message-swiped";
const CLOSE_ALL_EVENT = "chat-message-close-all";
const SNAP_OFFSET = -60;
const DRAG_LIMIT = -85;
const OPEN_DISTANCE_THRESHOLD = -22;
const OPEN_VELOCITY_THRESHOLD = -0.22;
const CLOSE_DISTANCE_THRESHOLD = 18;
const CLOSE_VELOCITY_THRESHOLD = 0.22;

interface UseMessageSwipeOptions {
  id: string | number;
  enabled?: boolean;
}

export function useMessageSwipe({ id, enabled = true }: UseMessageSwipeOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHorizontalRef = useRef<boolean | null>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const rafIdRef = useRef<number | null>(null);
  const didMoveRef = useRef(false);
  const isMouseDownRef = useRef(false);

  const applyTransform = useCallback((offset: number, animate: boolean) => {
    if (contentRef.current) {
      contentRef.current.style.transition = animate
        ? "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)"
        : "none";
      contentRef.current.style.transform = `translateX(${offset}px)`;
    }
    if (datesRef.current) {
      const progress = Math.min(1, Math.max(0, Math.abs(offset) / Math.abs(SNAP_OFFSET)));
      datesRef.current.style.transition = animate
        ? "opacity 0.22s ease-in-out, transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)"
        : "none";
      datesRef.current.style.opacity = `${progress}`;
      datesRef.current.style.pointerEvents = progress > 0.8 ? "auto" : "none";
    }
    currentOffsetRef.current = offset;
  }, []);

  const close = useCallback(() => {
    applyTransform(0, true);
    setIsOpen(false);
    isDraggingRef.current = false;
    isHorizontalRef.current = null;
    isMouseDownRef.current = false;
  }, [applyTransform]);

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

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || e.touches.length !== 1) return;
      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      lastXRef.current = touch.clientX;
      startTimeRef.current = Date.now();
      lastTimeRef.current = Date.now();
      isHorizontalRef.current = null;
      isDraggingRef.current = false;
      didMoveRef.current = false;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      if (isHorizontalRef.current === null) {
        const dist = Math.hypot(deltaX, deltaY);
        if (dist > 6) {
          if (Math.abs(deltaX) >= Math.abs(deltaY) * 0.8) {
            isHorizontalRef.current = true;
            isDraggingRef.current = true;
            didMoveRef.current = true;
          } else {
            isHorizontalRef.current = false;
            return;
          }
        } else {
          return;
        }
      }

      if (!isHorizontalRef.current) return;

      lastXRef.current = touch.clientX;
      lastTimeRef.current = Date.now();

      const baseOffset = isOpenRef.current ? SNAP_OFFSET : 0;
      let targetOffset = baseOffset + deltaX;

      if (targetOffset > 0) {
        targetOffset = targetOffset * 0.15;
      } else if (targetOffset < DRAG_LIMIT) {
        targetOffset = DRAG_LIMIT + (targetOffset - DRAG_LIMIT) * 0.15;
      }

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        applyTransform(targetOffset, false);
      });
    },
    [enabled, applyTransform]
  );

  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) {
      if (isOpenRef.current && !didMoveRef.current) {
        close();
      }
      return;
    }
    isDraggingRef.current = false;
    isHorizontalRef.current = null;

    const now = Date.now();
    const duration = Math.max(1, now - startTimeRef.current);
    const velocityX = (lastXRef.current - startXRef.current) / duration;
    const currentOffset = currentOffsetRef.current;
    let shouldOpen = false;

    if (isOpenRef.current) {
      const moveFromOpen = currentOffset - SNAP_OFFSET;
      shouldOpen = !(moveFromOpen > CLOSE_DISTANCE_THRESHOLD || velocityX > CLOSE_VELOCITY_THRESHOLD);
    } else {
      shouldOpen = currentOffset < OPEN_DISTANCE_THRESHOLD || velocityX < OPEN_VELOCITY_THRESHOLD;
    }

    if (shouldOpen) {
      applyTransform(SNAP_OFFSET, true);
      setIsOpen(true);
      window.dispatchEvent(new CustomEvent(SWIPED_EVENT, { detail: { id } }));
    } else {
      applyTransform(0, true);
      setIsOpen(false);
    }
  }, [id, applyTransform, close]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || e.button !== 0) return;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      lastXRef.current = e.clientX;
      startTimeRef.current = Date.now();
      lastTimeRef.current = Date.now();
      isHorizontalRef.current = null;
      isDraggingRef.current = false;
      didMoveRef.current = false;
      isMouseDownRef.current = true;
    },
    [enabled]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isMouseDownRef.current || !enabled) return;
      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      if (isHorizontalRef.current === null) {
        const dist = Math.hypot(deltaX, deltaY);
        if (dist > 6) {
          if (Math.abs(deltaX) >= Math.abs(deltaY) * 0.8) {
            isHorizontalRef.current = true;
            isDraggingRef.current = true;
            didMoveRef.current = true;
          } else {
            isHorizontalRef.current = false;
            return;
          }
        } else {
          return;
        }
      }

      if (!isHorizontalRef.current) return;

      lastXRef.current = e.clientX;
      lastTimeRef.current = Date.now();

      const baseOffset = isOpenRef.current ? SNAP_OFFSET : 0;
      let targetOffset = baseOffset + deltaX;

      if (targetOffset > 0) {
        targetOffset = targetOffset * 0.15;
      } else if (targetOffset < DRAG_LIMIT) {
        targetOffset = DRAG_LIMIT + (targetOffset - DRAG_LIMIT) * 0.15;
      }

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        applyTransform(targetOffset, false);
      });
    },
    [enabled, applyTransform]
  );

  const onMouseUp = useCallback(() => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;

    if (!isDraggingRef.current) {
      if (isOpenRef.current && !didMoveRef.current) {
        close();
      }
      return;
    }
    isDraggingRef.current = false;
    isHorizontalRef.current = null;

    const now = Date.now();
    const duration = Math.max(1, now - startTimeRef.current);
    const velocityX = (lastXRef.current - startXRef.current) / duration;
    const currentOffset = currentOffsetRef.current;
    let shouldOpen = false;

    if (isOpenRef.current) {
      const moveFromOpen = currentOffset - SNAP_OFFSET;
      shouldOpen = !(moveFromOpen > CLOSE_DISTANCE_THRESHOLD || velocityX > CLOSE_VELOCITY_THRESHOLD);
    } else {
      shouldOpen = currentOffset < OPEN_DISTANCE_THRESHOLD || velocityX < OPEN_VELOCITY_THRESHOLD;
    }

    if (shouldOpen) {
      applyTransform(SNAP_OFFSET, true);
      setIsOpen(true);
      window.dispatchEvent(new CustomEvent(SWIPED_EVENT, { detail: { id } }));
    } else {
      applyTransform(0, true);
      setIsOpen(false);
    }
  }, [id, applyTransform, close]);

  const onMouseLeave = useCallback(() => {
    if (isMouseDownRef.current) {
      onMouseUp();
    }
  }, [onMouseUp]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (didMoveRef.current) {
      e.stopPropagation();
      e.preventDefault();
      didMoveRef.current = false;
    }
  }, []);

  return {
    contentRef,
    datesRef,
    isOpen,
    close,
    onClickCapture,
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
  };
}

export default useMessageSwipe;
