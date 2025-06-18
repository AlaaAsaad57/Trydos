import React, { useEffect, useState } from "react";
import { translateFunction } from "utils/functions";
import Timer from "./Timer";

function PhoneNumberError({
  wrongNumber,
  onTimerFinish,
  setLoading,
}: {
  wrongNumber: string;
  onTimerFinish: () => void;
  setLoading: (loading: boolean) => void;
}) {
  const [timerValue, setTimerValue] = useState(0);
  const IsTimeError = () => {
    console.log(wrongNumber);
    if (wrongNumber.includes("seconds before trying again")) {
      setLoading(true);
      return true;
    }
    return false;
  };
  useEffect(() => {
    if (IsTimeError()) {
      const waitTime = parseInt(wrongNumber.match(/\d+/)[0]);
      if (waitTime > 0) {
        setTimerValue(waitTime);
        setLoading(true);
      }
    }
  }, []);
  if (IsTimeError()) {
    return (
      <div
        data-cy="WaitForTryAgain"
        className="blue-text"
        style={{ color: "#ff5f61", fontSize: "12px", marginTop: "10px" }}
      >
        {timerValue > 0 && (
          <>
            <span className="mx-[4px]">{translateFunction("Wait")}</span>
            <Timer
              minutes={0}
              seconds={timerValue}
              onFinish={() => {
                setTimerValue(0);
                onTimerFinish();
              }}
            />
            <span className="mx-[4px]">
              {translateFunction("before trying again")}
            </span>
          </>
        )}
      </div>
    );
  }
  return (
    <div
      data-cy="WaitForTryAgain"
      className="blue-text"
      style={{ color: "#ff5f61", fontSize: "12px", marginTop: "10px" }}
    >
      {wrongNumber || translateFunction("Invalid Phone Number")}
    </div>
  );
}

export default PhoneNumberError;
