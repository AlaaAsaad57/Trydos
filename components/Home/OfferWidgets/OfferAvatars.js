import React from 'react'
import OfferAvatar from "./OfferAvatar"
import MoreOfferAvatar from "./MoreOfferAvatar"
import user1 from "../../../public/images/PNEL32DL23IY-GIS_front.jpg"
import user2 from "../../../public/images/PNWWCDKY23IY-LB3_view3.jpg"
import user3 from "../../../public/images/PNL7KNBW23IY-MIX_view1.jpg"
import user4 from "../../../public/images/PNEL32DL23IY-GIS_front.jpg"
import user5 from "../../../public/images/PNL7KNBW23IY-MIX_view1.jpg"
function OfferAvatars() {
  return (
    <div className='offer-avatars-container'>
        <OfferAvatar images={user1} zIndex={1}/>
        <OfferAvatar  images={user2} zIndex={2}/>
        <OfferAvatar  images={user3} zIndex={3}/>
        <OfferAvatar  images={user4} zIndex={4}/>
        <OfferAvatar  images={user5} zIndex={5}/>
        <MoreOfferAvatar  images={user2} zIndex={100} viewed={5}/>
    </div>
  )
}

export default OfferAvatars