import React from 'react'
import LogoOffer from "../../../public/svg/offerlogo.svg"
import ManIcon from "../../../public/svg/manIcon.svg"
import WomanIcon from "../../../public/svg/WomanIcon.svg"
import OfferPhotosSlider from "./OfferPhotosSlider"
import KidsIcon from "../../../public/svg/KidsIcon.svg"
import OfferSlideItem from './OfferSlideItem'
function NormalWidget({offer}) {
  return (
    <div className='offer-widget'>
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
            Mango Famous Turkish Brand Best Discounts 
         </div>
        {offer.photos.length>1 ?<OfferPhotosSlider OfferPhotos={offer.photos}/>:
        <div className='offer-slider-container'>
             <OfferSlideItem isSingle={true}/>
        </div>
       }
        </div>
    </div>
  )
}

export default NormalWidget