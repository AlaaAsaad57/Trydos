import React from 'react'
import { useSelector } from 'react-redux'
import ChatIcon from "assets/svg/ChatIcon.svg"
import CartIcon from "assets/svg/CartIcon.svg"
import { translate } from '@/utils/functions'
import UserAvatar from './UserAvatar'
function AuthNavSection() {
    const language=useSelector((state)=>state.homepage.language)
    const user=useSelector((state)=>state.auth.user)
  return (
    <>
     <div aria-details={language} className='nav-question-item'style={{marginRight:"30px",marginLeft:"0px"}}>
            <ChatIcon/>
     </div>
     <div aria-details={language}className='nav-question-item' style={{marginRight:"20px",marginLeft:"0px"}}>
            <CartIcon/>
     </div>
     <div aria-details={language}className='welcome-user'  aria-labelledby={language+'-medium'} style={{marginRight:"12px",marginLeft:"0px"}}>
            {translate('Hello',language)} <span>,</span> <span aria-labelledby={language+'-light'}>{user?.name}</span>
        </div>
        <UserAvatar avatar={user?.avatar}/>
    </>
  )
}

export default AuthNavSection