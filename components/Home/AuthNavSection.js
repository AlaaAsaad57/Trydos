import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ChatIcon from "../../public/svg/ChatIcon.svg"
import CartIcon from "../../public/svg/CartIcon.svg"
import { translate } from '../../utils/functions'
import UserAvatar from './UserAvatar'
import {ChatConroller} from "../../redux/chat/actions"
function AuthNavSection() {
    const language=useSelector((state)=>state.homepage.language)
    const user=useSelector((state)=>state.auth.user)
    const dispatch = useDispatch()
  return (
    <>     
     <div aria-details={language} className='nav-question-item'style={{marginRight:"30px",marginLeft:"0px"}} onClick={()=>dispatch(ChatConroller(true))}>
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