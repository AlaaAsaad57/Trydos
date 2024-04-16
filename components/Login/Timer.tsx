import { translate } from "utils/functions";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTimer } from "react-timer-and-stopwatch";
interface TimerProps {
  onFinish: Function;
  onResume: Function;
}
function Timer({ onFinish, onResume }: TimerProps) {
  const language = useSelector((state: any) => state.homepage.language);
  const timer = useTimer({
    create: {
      timerWithDuration: {
        time: {
          // Set a duration of 1 minute and 30 seconds
          minutes: 1,
          seconds: 59,
        },
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
