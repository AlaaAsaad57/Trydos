import React from 'react'
import UserImg from "public/images/user.png"
import Image from 'next/image'
function StoryAvatar({avatar}) {
  return (
    <div className='story-avatar'>
      {avatar&&  <Image src={avatar} alt="user" width={28} height={28}/>}
    </div>
  )
}

export default StoryAvatar