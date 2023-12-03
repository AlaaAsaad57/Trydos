import React,{memo} from 'react'

function PriceLabel() {
  return (
    <div className='price-label'>
        <span className='old-price'>
            100
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="1" >
            <line id="Line_1" data-name="Line 1" x2="100%" transform="translate(0 0.5)" fill="none" stroke="#3c3c3c" strokeWidth="1"/>
            </svg>
        </span>
        <span className='new-price'>
            90
        </span>
        <span className='currency-label'>
            USD
        </span>
    </div>
  )
}

export default memo(PriceLabel)