import React from 'react'
import UserIcon from "@/assets/svg/UserIcon.svg"
import Image from 'next/image'
function UserAvatar({avatar}) {
  return (
    <>
    {avatar?
    <>
     <div className='nav-question-item nav-img-item' style={{marginLeft:"0px",position:"relative"}}>
      <div className='inset-shadow'></div>
      <Image width={30} height={30}  src={avatar} quality={100} priority={true} placeholder='blur' className='avatar-user-image'/>
     </div>
    </>:
    <div className='nav-question-item' style={{marginLeft:"0px"}}>
    <UserIcon />
</div>}
    </>
  )
}

export default UserAvatar