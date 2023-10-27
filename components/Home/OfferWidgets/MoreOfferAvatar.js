import Image from 'next/image'
import React from 'react'

function MoreOfferAvatar({images,zIndex,viewed}) {
  return (
    <div className='offer-avatar' style={{zIndex:zIndex,transform:`translateX(-${viewed*5}px)`}}>
        <div className='offer-more-s'/>
        <span>More</span>
    <Image src={images} alt='avatar' width={40} height={40} style={{borderRadius:"50%",height:"40px"}}/>
</div>
  )
}

export default MoreOfferAvatar