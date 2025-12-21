"use client";
import { useEffect } from "react";

import { useTimer as TimerUtil } from "react-timer-hook";

interface TimerProps {
  onFinish: Function;
  minutes?: number;
  seconds?: number;
  onlySeconds?: boolean;
}
function Timer({
  onFinish,
  minutes = 2,
  seconds = 0,
  onlySeconds = false,
}: TimerProps) {
  const data = TimerUtil({
    expiryTimestamp: new Date(
      Date.now() + minutes * 60 * 1000 + seconds * 1000
    ),
    autoStart: true,
    onExpire() {
      onFinish();
    },
  });
  useEffect(() => {
    data.start();
  }, []);
  // Add leading zero for single digits
  const formattedMinutes = String(data.minutes).padStart(2, "0");
  const formattedHours = String(data.hours).padStart(2, "0");
  const formattedSeconds = String(data.seconds).padStart(2, "0");
  if (onlySeconds) {
    return <>{formattedSeconds}</>;
  }
  return (
    <>
      {formattedHours}:{formattedMinutes}:{formattedSeconds}
    </>
  );
}

export default Timer;
