import React from 'react'
import LogoOffer from "../../../public/svg/offerlogo.svg"
import ManIcon from "../../../public/svg/manIcon.svg"
import WomanIcon from "../../../public/svg/WomanIcon.svg"
import OfferPhotosSlider from "./OfferPhotosSlider"
import KidsIcon from "../../../public/svg/KidsIcon.svg"
import QuickEventBar from "./QuickEventBar"
function QuickOfferWidjet({offer}) {
    return (
        <div className='offer-widget quick-widget'>
        <div className='offer-blured-background'/>
        <div className='offer-blured'/>
        <div className='offer-container'>
        <div className='offer-logo'>
            <LogoOffer/>
        </div>
        <div className='offer-category'>
                <ManIcon/>
                <WomanIcon/>
                <KidsIcon/>
            </div>
        <div className='offer-desc'>
        Mango Famous Turkish Brand Best Offers 
         </div>
         <OfferPhotosSlider  OfferPhotos={offer.photos}/>
        </div>
        <QuickEventBar/>
    </div>
      )
}

export default QuickOfferWidjet