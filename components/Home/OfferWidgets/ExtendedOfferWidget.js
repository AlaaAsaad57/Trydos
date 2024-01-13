import React from 'react'
import LogoOffer from "public/svg/offerlogo.svg"
import ManIcon from "public/svg/manIcon.svg"
import WomanIcon from "public/svg/WomanIcon.svg"
import OfferPhotosSlider from "./OfferPhotosSlider"
import KidsIcon from "public/svg/KidsIcon.svg"
import SaleIcon from "public/svg/saleIcon.svg"
import DiscountIcon from "public/svg/discountIcon.svg"
import GiftIcon from "public/svg/giftIcon.svg"
import { useSelector } from 'react-redux'
import { translate } from 'utils/functions'
import Link from 'next/link'
function ExtendedOfferWidget({offer,myKey,onClick}) {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <Link href={'/listing'} className='offer-widget extended-widget' key={myKey} onClick={()=>onClick()}>
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
    <div className='offer-desc' >
    {translate("Mango Famous Turkish Brand Best Offers",language )}
     </div>
     <div className='offer-details'>
        <div className='offer-details-item'>
            <div className='offer-details-icon'>
                <SaleIcon/>
            </div>
            <div className='offer-details-text'>
            <span className='bold-text'>50 %</span> <span>{translate("Sale",language)}</span>   
            </div>
        </div>
        <div className='offer-details-item'>
            <div className='offer-details-icon'>
                <DiscountIcon/>
            </div>
            <div className='offer-details-text'>
            <span>{translate("Second",language)} </span> 
            <span className='bold-text'>20 %</span>  
            </div>
        </div>
        <div className='offer-details-item'>
            <div className='offer-details-icon'>
                <GiftIcon/>
            </div>
            <div className='offer-details-text'>
                <span>{translate("Buy 1 gift 1",language)}</span>
            </div>
        </div>
     </div>
     <OfferPhotosSlider extended={true} OfferPhotos={offer.photos}/>
    </div>
</Link>
  )
}

export default ExtendedOfferWidget