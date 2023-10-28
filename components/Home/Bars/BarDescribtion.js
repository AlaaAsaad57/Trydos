import React from 'react'
import { useSelector } from 'react-redux'

function BarDescribtion({name,desc}) {
  const language=useSelector((state)=>state.homepage.language)

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