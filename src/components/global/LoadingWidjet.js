import Image from 'next/image'
import React from 'react'
function LoadingWidjet(props) {
    const loading={props}
  return (
   <>
    <div className='loading-container'>
        <div className='Logo-loading'>
        <object type="image/svg+xml"  data='/assets/svg/AnimatedLogo.svg'>
           <img src='/assets/svg/AnimatedLogo.svg'/>
        </object>
        </div>
    </div>
   </>
  )
}

export default LoadingWidjet