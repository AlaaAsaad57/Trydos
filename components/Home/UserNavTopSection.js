import { translate } from 'utils/functions'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import QuestionIcon from 'public/svg/questionIcon.svg'
import LoginIcon from 'public/svg/login.svg'
import UserIcon from 'public/svg/userIcon.svg'
import LoginWidget from '../Login/LoginWidget'
import AuthNavSection from './AuthNavSection'
function UserNavTopSection({loginOpen,openLogin}) {
    const language=useSelector((state)=>state.homepage.language)
    const user = useSelector((state)=>state.auth.user)
    const [loginSuccessVar,setLoginSucces]=useState(false)
  return (
    <div aria-details={language}className='user-nav-container'>
        {loginOpen&&<div aria-details={language}onClick={()=>openLogin(false)} className='backdrop-login'/>}
        {loginOpen&&<LoginWidget loginSuccessVar={loginSuccessVar} setLoginSucces={(e)=>setLoginSucces(e)} close={()=>openLogin(false)}/>}
       {
        (!user)&&<>
             <div aria-details={language}className='welcome-user' aria-labelledby={language+'-medium'}>
           <span aria-labelledby={language+'-medium'}> {translate('Hello',language)} </span><span aria-labelledby={language+'-medium'}>,</span> <span aria-labelledby={language+'-light'}>{translate('Welcome',language)}</span>
        </div>
        <div aria-details={language}className='nav-question-item'>
            <QuestionIcon/>
            <span aria-labelledby={language+'-light'} style={{display:"flex",color:"#F85555",fontSize:"14px",marginLeft:"5px",cursor:"pointer",}}>{translate(`${loginOpen?'Can We Know You ?':'Why We Know You ?'}`,language)}</span>
        </div>
        <div aria-details={language}className='nav-question-item'  onClick={()=>openLogin(true )}>
            <LoginIcon/>
            <span aria-labelledby={language+'-regular'} style={{display:"flex",color:"#707070",fontSize:"14px",marginLeft:"5px",cursor:"pointer",}}>{translate('Login',language)}</span>

        </div>
        <div aria-details={language}className='nav-question-item'>
            <UserIcon />
        </div>
        </>
       }
       {(user)&&<AuthNavSection/>}
    </div>
  )
}

export default UserNavTopSection