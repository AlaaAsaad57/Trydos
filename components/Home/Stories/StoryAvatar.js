import React from 'react'
import UserImg from "../../../public/images/user.png"
import Image from 'next/image'
function StoryAvatar() {
  return (
    <div className='story-avatar'>
        <Image src={UserImg} alt="user" width={28} height={28}/>
    </div>
  )
}

export default StoryAvatar