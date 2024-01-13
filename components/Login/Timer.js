import { translate } from 'utils/functions';
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useTimer } from "react-timer-and-stopwatch";
function Timer({onFinish,onResume}) {
    const language=useSelector((state)=>state.homepage.language)
    const timer = useTimer({

        create: {
            timerWithDuration: {
                time: { // Set a duration of 1 minute and 30 seconds
                    minutes: 1,
                    seconds: 59
                },
            }
        }
    });
    useEffect(()=>{
        if(timer.timerIsFinished){
            onFinish()
            
        }
    },[timer])
  return (
  <>
   {
      !timer.timerIsFinished?  timer.timerDisplayStrings.minutes + ":"+timer.timerDisplayStrings.seconds : <span onClick={()=>{timer.resetTimer(); onResume()}}>{translate('Resend Code',language)}</span>
    }
  </>
   
  )
}

export default Timer