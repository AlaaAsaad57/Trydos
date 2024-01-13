import React, { useRef } from 'react'
import OfferAvatar from "./OfferAvatar"
import MoreOfferAvatar from "./MoreOfferAvatar"
import user1 from "public/images/r2.jpg"
import user2 from "public/images/r1.jpg"
import user3 from "public/images/bl3.jpg"
import user4 from "public/images/bl2.jpg"
import user5 from "public/images/bl1.jpg"
function OfferAvatars() {
  const ref=useRef()
  const handleMove=(e)=>{
    let elementWidth=ref.current.clientWidth
    let elemnts= Array.from(ref.current.children)
   let clientX=e.clientX || e.touches[0]?.clientX
    let Xmove=Math.abs(((clientX-ref.current.getBoundingClientRect().left)*100)/ref.current.clientWidth+5)
    elemnts.forEach(element => {
      element.classList.remove('active-hover')
    });
    let index= parseInt(Xmove/((100/elemnts.length)))
    if(elemnts[index]){
      elemnts[index].classList.add('active-hover')
    }
  }
  const handleEnd=()=>{
    let elemnts= Array.from(ref.current.children)
    elemnts.forEach(element => {
      element.classList.remove('active-hover')
    });
  }
  return (
    <div ref={ref} className='offer-avatars-container' onTouchStart={(e)=>handleMove(e)} onTouchMove={(e)=>handleMove(e)} onMouseLeave={(e)=>handleEnd(e)} onTouchEnd={(e)=>handleEnd(e)} onMouseMove={(e)=>handleMove(e)}>
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