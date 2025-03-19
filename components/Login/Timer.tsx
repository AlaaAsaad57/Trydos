import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTimer } from "react-timer-and-stopwatch";
import { EXPIRED_TIME } from "utils/endpointConfig";
interface TimerProps {
  onFinish: Function;
  onResume: Function;
  minutes?: number;
}
function Timer({ onFinish, minutes }: TimerProps) {
  const timer = useTimer({
    create: {
      timerWithDuration: {
        time: minutes
          ? {
              minutes: minutes,
              seconds: 0,
            }
          : EXPIRED_TIME,
      },
    },
  });
  useEffect(() => {
    if (timer.timerIsFinished) {
      onFinish();
    }
  }, [timer]);
  return (
    <>
      {timer.timerDisplayStrings.minutes +
        ":" +
        timer.timerDisplayStrings.seconds}
    </>
  );
}

export default Timer;
