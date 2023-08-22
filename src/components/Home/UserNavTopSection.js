import { translate } from '@/utils/functions'
import React from 'react'
import { useSelector } from 'react-redux'
import QuestionIcon from '@/assets/svg/questionIcon.svg'
import LoginIcon from '@/assets/svg/login.svg'
import UserIcon from '@/assets/svg/userIcon.svg'
import LoginWidget from '../Login/LoginWidget'
function UserNavTopSection({loginOpen,openLogin}) {
    const language=useSelector((state)=>state.homepage.language)
  return (
    <div className='user-nav-container'>
        {loginOpen&&<div onClick={()=>openLogin(false)} className='backdrop-login'/>}
        {loginOpen&&<LoginWidget close={()=>openLogin(false)}/>}
        <div className='welcome-user' aria-labelledby={language+'-medium'}>
            {translate('Hello',language)}, <span aria-labelledby={language+'-light'}>{translate('Welcome',language)}</span>
        </div>
        <div className='nav-question-item'>
            <QuestionIcon/>
            <span aria-labelledby={language+'-light'} style={{display:"flex",color:"#F85555",fontSize:"14px",marginLeft:"5px",cursor:"pointer",}}>{translate('Can We Know You ?',language)}</span>
        </div>
        <div className='nav-question-item'  onClick={()=>openLogin(true )}>
            <LoginIcon/>
            <span aria-labelledby={language+'-regular'} style={{display:"flex",color:"#707070",fontSize:"14px",marginLeft:"5px",cursor:"pointer",}}>{translate('Login',language)}</span>

        </div>
        <div className='nav-question-item'>
            <UserIcon />
        </div>
    </div>
  )
}

export default UserNavTopSection