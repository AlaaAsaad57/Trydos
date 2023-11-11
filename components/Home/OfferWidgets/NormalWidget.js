import React from 'react'
import LogoOffer from "../../../public/svg/offerlogo.svg"
import ManIcon from "../../../public/svg/manIcon.svg"
import WomanIcon from "../../../public/svg/WomanIcon.svg"
import OfferPhotosSlider from "./OfferPhotosSlider"
import KidsIcon from "../../../public/svg/KidsIcon.svg"
import OfferSlideItem from './OfferSlideItem'
import { useSelector } from 'react-redux'
import { translate } from '../../../utils/functions'
const NormalWidget=({offer,myKey})=> {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <div className='offer-widget' key={myKey} >
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
            {translate("Mango Famous Turkish Brand Best Discounts",language )}
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