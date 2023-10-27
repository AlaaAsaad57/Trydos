import React, { useEffect } from 'react'
import { useTimer } from 'react-timer-hook';
function StopWatch({stopHour}) {
    const {
        totalSeconds,
        seconds,
        minutes,
        hours,
        days,
        isRunning,
        start,
        pause,
        resume,
        restart,
      } = useTimer({ expiryTimestamp:new Date(stopHour),autoStart:true});
  return (
    <div className='stopwatch-container'>
            <span>-</span>
        <div className='timer-element'>
        <div className='number-holder'>
            {hours<=9?"0"+hours:hours}
        </div>
            <span>:</span>
        <div className='number-holder'>
        {minutes<=9?"0"+minutes:minutes}
        </div>
        <span>:</span>
        <div className='number-holder'>
        {seconds<=9?"0"+seconds:seconds}
        </div>

        </div>
    </div>
  )
}

export default StopWatch