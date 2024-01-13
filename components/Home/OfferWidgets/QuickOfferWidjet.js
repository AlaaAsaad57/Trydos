import React from 'react'
import LogoOffer from "public/svg/offerlogo.svg"
import ManIcon from "public/svg/manIcon.svg"
import WomanIcon from "public/svg/WomanIcon.svg"
import OfferPhotosSlider from "./OfferPhotosSlider"
import KidsIcon from "public/svg/KidsIcon.svg"
import QuickEventBar from "./QuickEventBar"
import { useSelector } from 'react-redux'
import { translate } from 'utils/functions'
import Link from 'next/link'
function QuickOfferWidjet({offer,onClick}) {
  const language=useSelector((state)=>state.homepage.language)

    return (
        <Link href={'/listing'} className='offer-widget quick-widget' onClick={()=>onClick()}>
        <div className='offer-blured-background'/>
        <div className='offer-blured'/>
        <div className='offer-container' aria-details={language}>
        <div className='offer-logo'>
            <LogoOffer/>
        </div>
        <div className='offer-category'>
                <ManIcon/>
                <WomanIcon/>
                <KidsIcon/>
            </div>
        <div className='offer-desc'>
        {translate("Mango Famous Turkish Brand Best Offers",language )} 
         </div>
         <OfferPhotosSlider  OfferPhotos={offer.photos}/>
        </div>
        <QuickEventBar/>
    </Link>
      )
}

export default QuickOfferWidjet