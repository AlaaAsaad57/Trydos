import React from 'react'
import UserImg from "../../../public/images/user.png"
import Image from 'next/image'
function Story({onClick,media,Name}) {
  return (
    <div className='story-element-item' onClick={()=>onClick()}>
      <div className='linear-g-image'/>
      <div className='story-text'>
      {Name}
      </div>
         <Image src={media.photo_path} alt="user" width={100} height={150}/>
    </div>
  )
}

export default Story