'use client';

import { useState, useEffect } from 'react';

/** Returns true on phones/tablets (touch-primary devices or screens below 768px). */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = window.innerWidth <= 768;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouch(isCoarse || isSmallScreen || hasTouch);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return isTouch;
}
