"use client";
import { useEffect } from "react";

import { useTimer as TimerUtil } from "react-timer-hook";
import { useAppStore } from "store";

interface TimerProps {
  onFinish: Function;
  minutes?: number;
  seconds?: number;
  onlySeconds?: boolean;
  isForRedeem?: boolean;
}
function Timer({
  onFinish,
  minutes = 2,
  seconds = 0,
  onlySeconds = false,
  isForRedeem = false,
}: TimerProps) {
  const { selected_product_for_add_to_cart } = useAppStore();
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
  useEffect(() => {
    console.log(selected_product_for_add_to_cart);
    if (isForRedeem) {
      if (
        selected_product_for_add_to_cart &&
        !selected_product_for_add_to_cart?.done
      ) {
        data.pause();
      } else {
        data?.resume();
      }
    }
  }, [selected_product_for_add_to_cart]);
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
