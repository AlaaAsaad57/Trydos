import React, { useState } from 'react'
import Border from '../global/Border'
import { translate } from '@/utils/functions'
import LoginIcon from '@/assets/svg/login.svg'
import CloseIcon from '@/assets/svg/CloseIcon.svg'
import AccountIcon from '@/assets/svg/AccountIcon.svg'
import { useSelector } from 'react-redux'
import LoginQR from './LoginQR'
import LoginPhone from './LoginPhone'
function LoginWidget({close}) {
    const language=useSelector((state)=>state.homepage.language)
    const [loginMethod,setLoginMethod]=useState(null)
  return (
    <div className='login-widget-container'>
        <div className='login-label-container'>
            <Border height={40}/>
            <div className='login-label'>
            <div className='login-label-title'>
                <LoginIcon/>
                <div className='login-label-text' aria-labelledby={language+'-medium'}>
                    {translate('Login',language)}
                </div>
            </div>
            <div className='login-close-icon' onClick={()=>{close(); setLoginMethod(null)}}>
                <CloseIcon/>
            </div>
            </div>
            
        </div>
        <LoginQR selectedMethod={loginMethod==='qr'} selectMethod={()=>setLoginMethod('qr')}/>
        <LoginPhone selectedMethod={loginMethod==='phone'} selectMethod={()=>setLoginMethod('phone')}/>
        <div className='login-blue-question' aria-labelledby={language+'-light'}>
            {translate('Don’t Have Account?',language)}
        </div>
        <div className='login-label-container create-account-button'>
            <Border height={50}/>
            <div className='login-label'>
            <div className='login-label-title'>
                <AccountIcon/>
                <div className='login-label-text' aria-labelledby={language+'-regular'}>
                    {translate('Create New Account',language)}
                </div>
            </div>
         
            </div>
            
        </div>
    </div>
  )
}

export default LoginWidget