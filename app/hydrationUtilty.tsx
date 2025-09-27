"use client";
import { useEffect, useRef } from "react";

export function HydrationProfiler() {
  const startRef = useRef(performance.now());

  useEffect(() => {
    const end = performance.now();
    const duration = end - startRef.current;
    console.log(`[Hydration] Duration: ${duration.toFixed(2)} ms`);
  }, []);

  return null;
}
