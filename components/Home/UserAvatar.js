import React from 'react'
import UserIcon from "../../public/svg/userIcon.svg"
import Image from 'next/image'
import { useSelector } from 'react-redux'
function UserAvatar({avatar}) {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <>
    {avatar?
    <>
     <div aria-details={language}className='nav-question-item nav-img-item' style={{marginLeft:"0px",position:"relative"}}>
      <div aria-details={language}className='inset-shadow'></div>
      <Image width={30} height={30}  src={avatar} quality={100} priority={"true"} placeholder='blur' className='avatar-user-image'/>
     </div>
    </>:
    <div aria-details={language}className='nav-question-item' style={{marginLeft:"0px"}}>
    <UserIcon />
</div>}
    </>
  )
}

export default UserAvatar