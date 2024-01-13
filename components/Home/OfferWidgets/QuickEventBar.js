import React from 'react'
import QuickIcon from "public/svg/quickIcon.svg"
import BarDescribtion from '../Bars/BarDescribtion'
import StopWatch from "./StopWatch"
import { translate } from 'utils/functions'
import { useSelector } from 'react-redux'
function QuickEventBar() {
  const language=useSelector((state)=>state.homepage.language)
  return (
    <div className='quick-event-bar' aria-details={language}>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" >
        <g id="Rectangle_4745" data-name="Rectangle 4745" fill="none" stroke="#19171b" strokeWidth="0.5" strokeDasharray="3 3">
            <rect width="100%" height="100%" rx="15" stroke="none"/>
            <rect x="0.25" y="0.25" width="100%" height="calc(100% - 0.5px)" rx="14.75" fill="none"/>
        </g>
        </svg>
    <QuickIcon/>
    <BarDescribtion name={translate("Quick Offer",language)} desc={translate("This Offer Is For Only",language) +" 4 "+  translate("Hours",language)+" , "+ translate("Remaining",language)+" : "}/>
    <StopWatch stopHour={new Date().setHours(new Date().getHours()+1,new Date().getMinutes()+2,new Date().getSeconds()+59)}/>
    </div>
  )
}

export default QuickEventBar