import React from 'react'
import LogoOffer from "../../../public/svg/offerlogo.svg"
import ManIcon from "../../../public/svg/manIcon.svg"
import WomanIcon from "../../../public/svg/WomanIcon.svg"
import OfferPhotosSlider from "./OfferPhotosSlider"
import KidsIcon from "../../../public/svg/KidsIcon.svg"
import SaleIcon from "../../../public/svg/saleIcon.svg"
import DiscountIcon from "../../../public/svg/discountIcon.svg"
import GiftIcon from "../../../public/svg/giftIcon.svg"
function ExtendedOfferWidget({offer}) {
  return (
    <div className='offer-widget extended-widget'>
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
     <div className='offer-details'>
        <div className='offer-details-item'>
            <div className='offer-details-icon'>
                <SaleIcon/>
            </div>
            <div className='offer-details-text'>
            <span className='bold-text'>50 %</span> <span>Sale</span>   
            </div>
        </div>
        <div className='offer-details-item'>
            <div className='offer-details-icon'>
                <DiscountIcon/>
            </div>
            <div className='offer-details-text'>
            <span>Second </span> 
            <span className='bold-text'>20 %</span>  
            </div>
        </div>
        <div className='offer-details-item'>
            <div className='offer-details-icon'>
                <GiftIcon/>
            </div>
            <div className='offer-details-text'>
                <span>Buy 1 gift 1</span>
            </div>
        </div>
     </div>
     <OfferPhotosSlider extended={true} OfferPhotos={offer.photos}/>
    </div>
</div>
  )
}

export default ExtendedOfferWidget