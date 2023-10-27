import Image from 'next/image'
import React from 'react'

function OfferAvatar({images,zIndex}) {
  return (
    <div className='offer-avatar' style={{zIndex:zIndex,transform:`translateX(-${(zIndex-1)*5}px)`}}>
      <div className='offer-avatr-inner-s'/>
        <Image src={images} alt='avatar' width={40} height={40} style={{borderRadius:"50%",height:"40px"}}/>
    </div>
  )
}

export default OfferAvatar