import React from 'react'
import UserImg from "../../../public/images/user.png"
import Image from 'next/image'
function Story() {
  return (
    <div className='story-element-item'>
      <div className='linear-g-image'/>
      <div className='story-text'>
      Jack Lobe
      </div>
         <Image src={UserImg} alt="user" width={100} height={150}/>
    </div>
  )
}

export default Story