import React from 'react'
import NormalWidget from "./NormalWidget"
import ExtendedOfferWidget from "./ExtendedOfferWidget"
import QuickOfferWidjet from "./QuickOfferWidjet"
 
import { useRouter } from 'next/navigation'
function OfferList({offers,quick}) {
  const router = useRouter()
  const goToListing=()=>{
    // router.push('/listing')
  }
  return (
    <div className='offers-list'>
        {quick?
        <QuickOfferWidjet onClick={()=>goToListing()} offer={{photos:[1]}}/>
        :offers.map((offer,Index)=>(Index!==2?
            <NormalWidget onClick={()=>goToListing()} myKey={Index} key={Index} offer={{photos:[1,1,1].filter((item,index)=>index<=Index)}}/>:
            <ExtendedOfferWidget onClick={()=>goToListing()} myKey={Index} key={Index} offer={{photos:[1,1,1].filter((item,index)=>index<=Index)}}/>
        ))}
    </div>
  )
}

export default OfferList