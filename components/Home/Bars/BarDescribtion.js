import React from 'react'

function BarDescribtion({name,desc}) {
  return (
    <div className='bar-desc-column'>
        <div className='bar-name'>
            {name}
        </div>
        <div className='bar-desc'>
            {desc}
        </div>
        
    </div>
  )
}

export default BarDescribtion