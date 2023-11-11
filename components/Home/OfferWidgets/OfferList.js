import React from 'react'
import NormalWidget from "./NormalWidget"
import ExtendedOfferWidget from "./ExtendedOfferWidget"
import QuickOfferWidjet from "./QuickOfferWidjet"
function OfferList({offers,quick}) {
  return (
    <div className='offers-list'>
        {quick?
        <QuickOfferWidjet offer={{photos:[1]}}/>
        :offers.map((offer,Index)=>(Index!==2?
            <NormalWidget key={Index} offer={{photos:[1,1,1].filter((item,index)=>index<=Index)}}/>:
            <ExtendedOfferWidget key={Index} offer={{photos:[1,1,1].filter((item,index)=>index<=Index)}}/>
        ))}
    </div>
  )
}

export default OfferList