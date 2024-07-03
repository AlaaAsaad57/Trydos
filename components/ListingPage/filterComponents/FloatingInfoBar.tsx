import React from 'react'
import FilterInfoBar from '../FilterInfoBar'

function FloatingInfoBar() {
  return (
    <div className='floating-info'>
        <div className='floating-info-details'>The Products Will Be Shown As Below</div>
        <FilterInfoBar/>
    </div>
  )
}

export default FloatingInfoBar