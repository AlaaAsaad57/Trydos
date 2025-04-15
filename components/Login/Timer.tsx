import { useEffect } from "react";

import { useTimer as TimerUtil } from "react-timer-hook";

interface TimerProps {
  onFinish: Function;
  onResume: Function;
  minutes?: number;
}
function Timer({ onFinish, minutes }: TimerProps) {
  const data = TimerUtil({
    expiryTimestamp: new Date(Date.now() + (minutes || 1) * 60 * 1000),
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
  const formattedSeconds = String(data.seconds).padStart(2, "0");

  return (
    <>
      {formattedMinutes}:{formattedSeconds}
    </>
  );
}

export default Timer;
