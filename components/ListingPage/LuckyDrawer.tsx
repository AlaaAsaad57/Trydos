import { useTimer } from "react-timer-hook";
import { useEffect, useRef, useCallback } from "react";
import { translateFunction } from "utils/functions";
import { useAppStore } from "store";

interface UseLuckyDrawProps {
  id: string | number;
  seconds: number;
  language: string;
  onExpire?: () => void;
  enabled?: boolean; // New property to control execution
}

export const useLuckyDrawTimer = ({
  id,
  seconds = 50,
  language,
  onExpire,
  enabled = true,
}: UseLuckyDrawProps) => {
  const isRtl = language === "ar" || language === "ku";
  const wasRunningRef = useRef(false);
  const isVisibleRefs = useRef<Set<Element>>(new Set());

  // Refs for multiple components
  const miniTimerRef = useRef<HTMLDivElement | null>(null);
  const topTimerRef = useRef<HTMLDivElement | null>(null);

  // 1. Timer Logic
  // We provide a fallback timestamp if disabled to prevent useTimer from throwing errors
  const expiryTimestamp = new Date(Date.now() + (enabled ? seconds : 0) * 1000);

  const {
    seconds: secondsLeft,
    isRunning,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp,
    autoStart: enabled,
    onExpire: () => {
      if (!enabled) return;
      const { isNavigating } = useAppStore.getState();
      if (!isNavigating) {
        onExpire?.();
      }
    },
  });

  // Handle manual restart/pause if 'enabled' changes dynamically
  useEffect(() => {
    if (enabled) {
      const newExpiry = new Date(Date.now() + seconds * 1000);
      restart(newExpiry);
    } else {
      pause();
    }
  }, [enabled, restart, seconds, pause]);

  // 2. Visibility / Intersection Logic
  const handleStateChange = useCallback(() => {
    if (!enabled) return;

    const isTabHidden = document.hidden;
    const anyVisible = isVisibleRefs.current.size > 0;

    if (isTabHidden || !anyVisible) {
      if (isRunning) {
        wasRunningRef.current = true;
        pause();
      }
    } else {
      if (wasRunningRef.current) {
        wasRunningRef.current = false;
        resume();
      }
    }
  }, [isRunning, pause, resume, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisibleRefs.current.add(entry.target);
          } else {
            isVisibleRefs.current.delete(entry.target);
          }
        });
        handleStateChange();
      },
      { threshold: 0.1 }
    );

    if (miniTimerRef.current) observer.observe(miniTimerRef.current);
    if (topTimerRef.current) observer.observe(topTimerRef.current);

    document.addEventListener("visibilitychange", handleStateChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleStateChange);
    };
  }, [handleStateChange, enabled]);

  // 3. UI Helpers
  const ClockIcon = () => (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.77,1.235,7.4,1.874l1.28.739.369-.639a.37.37,0,0,0-.136-.505L8.275,1.1A.369.369,0,0,0,7.77,1.235Z"
        fill="#ff6200"
      />
      <path
        d="M5.5,1.664a4.845,4.845,0,0,1,.688.055v-.6l.473,0V.344A.344.344,0,0,0,6.316,0H4.687a.344.344,0,0,0-.344.344v.773l.469,0v.6A4.845,4.845,0,0,1,5.5,1.664Z"
        fill="#ff6200"
      />
      <path
        d="M5.5,2.063A4.469,4.469,0,1,0,9.969,6.531,4.469,4.469,0,0,0,5.5,2.063ZM7.588,8.632l-2.6-1.8V4.284h.751V6.435l2.28,1.579Z"
        fill="#ff6200"
      />
    </svg>
  );

  const MiniTimer = () => {
    if (!enabled) return null;
    return (
      <div
        className="flex flex-row items-center gap-[2px] w-full justify-end redeem_show"
        ref={miniTimerRef}
      >
        <ClockIcon />
        <div className="flex flex-row text-[#ff6200]">
          <span id={`counter-${id}`} className="bold text-[10px]">
            -{secondsLeft}
          </span>
          <span>{translateFunction("s", language)}</span>
        </div>
      </div>
    );
  };

  const TopTimer = () => {
    if (!enabled) return null;
    return (
      <div
        ref={topTimerRef}
        className="redeem_show absolute pr-[5px] pl-[8px] text-nowrap flex-row h-[19px] gap-[2px] items-center top-[-8px] left-0 z-99 rounded-tr-[4px] rounded-tl-[15px] rounded-bl-[4px] rounded-br-[15px] bg-[#FFF3E8] text-[#FF6200] text-[9px] medium min-w-[140px]"
        style={{
          border: "1px solid #FF6200",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        <ClockIcon />
        <span className="whitespace-nowrap bold">
          {translateFunction("Luck!")}{" "}
        </span>
        <span className="whitespace-nowrap ">
          {translateFunction("Add To Bag Within ")}
        </span>
        <span className="whitespace-nowrap bold ">{secondsLeft}</span>
        <span className="whitespace-nowrap ">
          {translateFunction("seconds")}
        </span>
      </div>
    );
  };

  return { MiniTimer, TopTimer, secondsLeft, isRunning };
};
