import { useState, useRef, useEffect, useCallback } from "react";

const SWIPED_EVENT = "chat-message-swiped";
const CLOSE_ALL_EVENT = "chat-message-close-all";
const SNAP_OFFSET = -65;
const DRAG_LIMIT = -85;
const TRIGGER_THRESHOLD = -28;

interface UseMessageSwipeOptions {
  id: string | number;
  enabled?: boolean;
}

export function useMessageSwipe({ id, enabled = true }: UseMessageSwipeOptions) {
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const isTrackingRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const close = useCallback(() => {
    setOffset(0);
    setIsOpen(false);
    setIsDragging(false);
  }, []);

  // Close when another message is swiped or when the chat scrolls
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
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      isHorizontalRef.current = null;
      isTrackingRef.current = true;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isTrackingRef.current || !enabled) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startXRef.current;
      const deltaY = currentY - startYRef.current;

      // Determine gesture direction if not locked yet
      if (isHorizontalRef.current === null) {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical scroll detected - release tracking
          isHorizontalRef.current = false;
          isTrackingRef.current = false;
          return;
        }
        if (Math.abs(deltaX) > 8) {
          isHorizontalRef.current = true;
          setIsDragging(true);
        }
      }

      if (isHorizontalRef.current) {
        // Horizontal swipe
        const baseOffset = isOpenRef.current ? SNAP_OFFSET : 0;
        const rawOffset = baseOffset + deltaX;
        const clampedOffset = Math.max(DRAG_LIMIT, Math.min(0, rawOffset));
        setOffset(clampedOffset);
      }
    },
    [enabled]
  );

  const onTouchEnd = useCallback(() => {
    if (!isTrackingRef.current && !isDragging) return;
    isTrackingRef.current = false;
    setIsDragging(false);

    if (isHorizontalRef.current) {
      if (offset < TRIGGER_THRESHOLD) {
        setOffset(SNAP_OFFSET);
        setIsOpen(true);
        window.dispatchEvent(
          new CustomEvent(SWIPED_EVENT, { detail: { id } })
        );
      } else {
        setOffset(0);
        setIsOpen(false);
      }
    }
    isHorizontalRef.current = null;
  }, [id, offset, isDragging]);

  // Mouse drag support for desktop
  const isMouseDownRef = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || e.button !== 0) return;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      isMouseDownRef.current = true;
      isHorizontalRef.current = null;
    },
    [enabled]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isMouseDownRef.current || !enabled) return;

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      if (isHorizontalRef.current === null) {
        if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > Math.abs(deltaX)) {
          isMouseDownRef.current = false;
          return;
        }
        if (Math.abs(deltaX) > 8) {
          isHorizontalRef.current = true;
          setIsDragging(true);
        }
      }

      if (isHorizontalRef.current) {
        const baseOffset = isOpenRef.current ? SNAP_OFFSET : 0;
        const rawOffset = baseOffset + deltaX;
        const clampedOffset = Math.max(DRAG_LIMIT, Math.min(0, rawOffset));
        setOffset(clampedOffset);
      }
    },
    [enabled]
  );

  const onMouseUp = useCallback(() => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    setIsDragging(false);

    if (isHorizontalRef.current) {
      if (offset < TRIGGER_THRESHOLD) {
        setOffset(SNAP_OFFSET);
        setIsOpen(true);
        window.dispatchEvent(
          new CustomEvent(SWIPED_EVENT, { detail: { id } })
        );
      } else {
        setOffset(0);
        setIsOpen(false);
      }
    }
    isHorizontalRef.current = null;
  }, [id, offset]);

  const onMouseLeave = useCallback(() => {
    if (isMouseDownRef.current) {
      onMouseUp();
    }
  }, [onMouseUp]);

  return {
    offset,
    isOpen,
    isDragging,
    close,
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
