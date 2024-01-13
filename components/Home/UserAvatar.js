import React from 'react'
import UserIcon from "public/svg/userIcon.svg"
import Image from 'next/image'
import { useSelector } from 'react-redux'
function UserAvatar({avatar}) {
  const language=useSelector((state)=>state.homepage.language)

  return (
    <>
    {avatar?
    <>
     <div aria-details={language}className='nav-question-item nav-img-item' style={{marginLeft:"0px",position:"relative",padding:"0px",width:"46px",height:"46px",alignItems:"center",justifyContent:"center"}}>
      <div aria-details={language}className='inset-shadow'></div>
      <Image alt="user-img" width={30} height={30}  src={avatar} quality={100} priority={"true"}  className='avatar-user-image'/>
     </div>
    </>:
    <div aria-details={language}className='nav-question-item' style={{marginLeft:"0px"}}>
    <UserIcon style={{transform:"scale(1)"}} />
</div>}
    </>
  )
}

export default UserAvatar