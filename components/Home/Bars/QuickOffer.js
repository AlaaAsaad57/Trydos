import React from 'react'
import QuickIcon from "../../../public/svg/quickIcon.svg";
import BarDescribtion from "./BarDescribtion";
function QuickOffer() {
  return (
    <div className='home-bar'>
    <QuickIcon/>
    <BarDescribtion name={"Quick Offer"} desc={"Products With Great Fast And Limited Offers"}/>
  </div>
  )
}

export default QuickOffer