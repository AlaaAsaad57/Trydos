import React from 'react'
import OfferImage from "../../../public/images/Kids_BannerInteriorHalloween_2609.jpg"
import OfferAvatars from "./OfferAvatars"
import BorderImage from "./BorderImage"
import Image from 'next/image'
import { getId } from 'utils/functions'
function OfferSlideItem({isSingle}) {
  let id=getId()
  return (
    <div className='offer-slide-item' >

    <div className='image-offer'>
        <div className='image-inner-shadow' style={{height:"100%"}}/>
         <Image id={id} className="OfferImage" src={OfferImage} width={360} height={155} alt="offer"/>
        <BorderImage id={id}/>
    </div>
      
    </div>
  )
}

export default OfferSlideItem