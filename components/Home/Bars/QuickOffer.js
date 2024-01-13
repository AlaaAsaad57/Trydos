import React from 'react'
import QuickIcon from "public/svg/quickIcon.svg";
import BarDescribtion from "./BarDescribtion";
import { useSelector } from 'react-redux';
import { translate } from 'utils/functions';
function QuickOffer() {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <div className='home-bar' aria-details={language}>
    <QuickIcon/>
    <BarDescribtion name={translate("Quick Offer",language)} desc={translate("Products With Great Fast And Limited Offers",language)}/>
  </div>
  )
}

export default QuickOffer