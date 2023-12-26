import React,{memo} from 'react'

function PriceLabel({price_formatted,offer_price}) {
  return (
    <div className='price-label'>
       {offer_price>0&& <span className='old-price'>
            {price_formatted?.split(' ')[0]}
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="1" >
            <line id="Line_1" data-name="Line 1" x2="100%" transform="translate(0 0.5)" fill="none" stroke="#3c3c3c" strokeWidth="1"/>
            </svg>
        </span>}
        <span className='new-price'>
            {offer_price>0?offer_price:price_formatted?.split(' ')[0]}
        </span>
        <span className='currency-label'>
        {price_formatted?.split(' ')[1]}
        </span>
    </div>
  )
}

export default memo(PriceLabel)