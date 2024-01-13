import React, { useState } from 'react'
import Border from '../global/Border'
import { translate } from 'utils/functions'
import LoginIcon from 'public/svg/login.svg'
import CloseIcon from 'public/svg/CloseIcon.svg'
import AccountIcon from 'public/svg/AccountIcon.svg'
import { useDispatch, useSelector } from 'react-redux'
import LoginQR from './LoginQR'
import LoginPhone from './LoginPhone'
import LoginSuccessWidget from './LoginSuccessWidget'
import { ReInitialise } from 'store/auth/actions'
function LoginWidget({close,loginSuccessVar,setLoginSucces}) {
    const dispatch=useDispatch()
    const wrongNumber=useSelector((state)=>state.auth.wrongNumber)
    const LoginSuccess=()=>{
        
    }
    const language=useSelector((state)=>state.homepage.language)
    const [loginMethod,setLoginMethod]=useState(null)
  return (
  <>
  {loginSuccessVar?
  <LoginSuccessWidget close={()=>close()}/>:
   <div aria-details={language}className='login-widget-container'>
        <div aria-details={language}className='login-label-container'>
            <Border height={40}/>
            <div aria-details={language}className='login-label'>
            <div aria-details={language}className='login-label-title'>
                <LoginIcon/>
                <div aria-details={language}className='login-label-text' aria-labelledby={language+'-medium'}>
                    {translate('Login',language)}
                </div>
            </div>
            <div aria-details={language}className='login-close-icon' onClick={()=>{close(); setLoginMethod(null)}}>
                <CloseIcon/>
            </div>
            </div>
            
        </div>
        <LoginQR setLoginSucces={()=>setLoginSucces(true)} selectedMethod={loginMethod==='qr'} selectMethod={()=>{ if(loginMethod!=="qr") dispatch(ReInitialise()); setLoginMethod('qr');}}/>
        <LoginPhone  LoginSuccess={()=>setLoginSucces(true)} selectedMethod={loginMethod==='phone'} selectMethod={()=>{ if(loginMethod!=="phone") dispatch(ReInitialise()); setLoginMethod('phone');}}/>
        <div aria-details={language}className='login-blue-question' aria-labelledby={language+'-light'}>
            {translate('Don’t Have Account?',language)}
        </div>
        <div aria-details={language}className={`${wrongNumber&&'absolute-create-button'} login-label-container create-account-button`}>
            <Border height={50}/>
            <div aria-details={language}className='login-label'>
            <div aria-details={language}className='login-label-title'>
                <AccountIcon/>
                <div aria-details={language}className='login-label-text' aria-labelledby={language+'-regular'}>
                    {translate('Create New Account',language)}
                </div>
            </div>
         
            </div>
            
        </div>
    </div>}
  </> 
  )
}

export default LoginWidget