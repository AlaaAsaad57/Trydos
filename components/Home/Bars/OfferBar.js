import React from 'react'
import OfferIcon from "../../../public/svg/offerIcon.svg";
import BarDescribtion from "./BarDescribtion";
function OfferBar() {
  return (
    <div className='home-bar'>
    <OfferIcon/>
    <BarDescribtion name={"Offer"} desc={"Products With Great Offers"}/>
  </div>
  )
}

export default OfferBar