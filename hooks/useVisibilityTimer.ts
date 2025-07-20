import { useTimer } from "react-timer-hook";
import { useEffect, useRef, useCallback } from "react";

interface UseVisibilityTimerProps {
  expiryTimestamp: Date;
  onExpire?: () => void;
  onResume?: () => void;
  onPause?: () => void;
  autoStart?: boolean;
}

export const useVisibilityTimer = ({
  expiryTimestamp,
  onExpire,
  onResume,
  onPause,
  autoStart = true,
}: UseVisibilityTimerProps) => {
  const {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp,
    onExpire,
    autoStart,
  });

  const wasRunningRef = useRef(false);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      if (isRunning) {
        wasRunningRef.current = true;
        pause();
        onPause?.();
      }
    } else {
      if (wasRunningRef.current) {
        wasRunningRef.current = false;
        resume();
        onResume?.();
      }
    }
  }, [isRunning, pause, resume, onPause, onResume]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Create an intersection observer to detect when timer is out of viewport
  const timerRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (!entry.isIntersecting) {
        if (isRunning) {
          wasRunningRef.current = true;
          pause();
          onPause?.();
        }
      } else {
        if (wasRunningRef.current) {
          wasRunningRef.current = false;
          resume();
          onResume?.();
        }
      }
    },
    [isRunning, pause, resume, onPause, onResume]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0,
    });

    if (timerRef.current) {
      observer.observe(timerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection]);

  return {
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
    timerRef,
  };
};
